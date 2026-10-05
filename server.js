
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { z } from 'zod';

const app = express();
const PORT = Number(process.env.PORT || 8080);
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION';

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('combined'));

const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);

function sign(user) {
  return jwt.sign({ sub:user.id, role:user.role }, JWT_SECRET, { expiresIn:'15m' });
}

function auth(req,res,next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({error:'UNAUTHORIZED'});
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next(); }
  catch { return res.status(401).json({error:'INVALID_TOKEN'}); }
}

function requireRole(...roles) {
  return (req,res,next) => roles.includes(req.user?.role) ? next() : res.status(403).json({error:'FORBIDDEN'});
}

const memory = {
  offers: [
    {id:'off-1001', owner:'seller-demo', side:'SELL', asset:'USDT', fiat:'ETB', price:158.20, min:500, max:50000, available:1200, paymentMethod:'Telebirr', active:true},
    {id:'off-1002', owner:'seller-demo-2', side:'SELL', asset:'USDT', fiat:'ETB', price:159.10, min:1000, max:100000, available:2500, paymentMethod:'Bank Transfer', active:true},
    {id:'off-1003', owner:'buyer-demo', side:'BUY', asset:'USDT', fiat:'ETB', price:157.80, min:500, max:30000, available:900, paymentMethod:'CBE Birr', active:true}
  ],
  trades: [],
  disputes: [],
  audit: []
};

app.get('/api/health', (req,res) => res.json({ok:true, service:'WexatP2P API', time:new Date().toISOString()}));

app.post('/api/auth/signup', asyncRoute(async (req,res) => {
  const schema = z.object({email:z.string().email(), password:z.string().min(8), fullName:z.string().min(2)});
  const body = schema.parse(req.body);
  if (!pool) {
    const demoUser = {id:`u-${Date.now()}`, email:body.email, fullName:body.fullName, role:'USER'};
    return res.status(201).json({user:demoUser, token:sign(demoUser), mode:'memory'});
  }
  const hash = await bcrypt.hash(body.password, 12);
  const q = await pool.query(
    `INSERT INTO users(email,password_hash,full_name,status) VALUES($1,$2,$3,'PENDING') RETURNING id,email,full_name,role`,
    [body.email,hash,body.fullName]
  );
  const user=q.rows[0];
  res.status(201).json({user,token:sign(user)});
}));

app.post('/api/auth/login', asyncRoute(async (req,res) => {
  const body = z.object({email:z.string().email(),password:z.string().min(1)}).parse(req.body);
  if (!pool) return res.status(401).json({error:'DEMO_LOGIN_NOT_CONFIGURED'});
  const q=await pool.query(`SELECT id,email,password_hash,full_name,role,status FROM users WHERE email=$1`,[body.email]);
  const u=q.rows[0];
  if (!u || !(await bcrypt.compare(body.password,u.password_hash))) return res.status(401).json({error:'INVALID_CREDENTIALS'});
  if (u.status !== 'ACTIVE' && u.role !== 'ADMIN') return res.status(403).json({error:'ACCOUNT_NOT_ACTIVE'});
  const safe={id:u.id,email:u.email,fullName:u.full_name,role:u.role};
  res.json({user:safe,token:sign(safe)});
}));

app.get('/api/offers',(req,res)=> {
  const {side,asset,fiat,paymentMethod}=req.query;
  let data=memory.offers.filter(o=>o.active);
  if(side) data=data.filter(o=>o.side===side);
  if(asset) data=data.filter(o=>o.asset===asset);
  if(fiat) data=data.filter(o=>o.fiat===fiat);
  if(paymentMethod) data=data.filter(o=>o.paymentMethod===paymentMethod);
  res.json({offers:data});
});

app.post('/api/offers',auth,asyncRoute(async(req,res)=>{
  const b=z.object({
    side:z.enum(['BUY','SELL']),asset:z.string().min(2),fiat:z.string().min(2),
    price:z.number().positive(),min:z.number().positive(),max:z.number().positive(),
    available:z.number().positive(),paymentMethod:z.string().min(2),terms:z.string().optional()
  }).parse(req.body);
  if(b.min>b.max) return res.status(400).json({error:'MIN_GREATER_THAN_MAX'});
  const offer={id:`off-${Date.now()}`,owner:req.user.sub,...b,active:true};
  memory.offers.push(offer);
  res.status(201).json({offer});
}));

app.get('/api/trades',auth,(req,res)=>res.json({trades:memory.trades.filter(t=>t.buyerId===req.user.sub||t.sellerId===req.user.sub)}));

const transitions = {
  fund:['CREATED','FUNDED'],
  paymentSent:['FUNDED','PAYMENT_SENT'],
  confirm:['PAYMENT_SENT','PAYMENT_CONFIRMED'],
  release:['PAYMENT_CONFIRMED','RELEASED'],
  cancel:['CREATED','CANCELLED'],
  dispute:['FUNDED','DISPUTED','PAYMENT_SENT','DISPUTED','PAYMENT_CONFIRMED','DISPUTED']
};

app.post('/api/trades/:id/:action',auth,(req,res)=>{
  const t=memory.trades.find(x=>x.id===req.params.id);
  if(!t) return res.status(404).json({error:'TRADE_NOT_FOUND'});
  if(t.buyerId!==req.user.sub && t.sellerId!==req.user.sub && req.user.role!=='ADMIN') return res.status(403).json({error:'FORBIDDEN'});
  const action=req.params.action;
  const rule=transitions[action];
  if(!rule) return res.status(400).json({error:'INVALID_ACTION'});
  const idx=rule.indexOf(t.status);
  if(idx<0) return res.status(409).json({error:'INVALID_STATE_TRANSITION',status:t.status});
  t.status=rule[idx+1];
  t.updatedAt=new Date().toISOString();
  memory.audit.push({actor:req.user.sub,action:`TRADE_${action.toUpperCase()}`,resourceId:t.id,time:t.updatedAt});
  res.json({trade:t});
});

app.post('/api/kyc/submit',auth,(req,res)=>{
  const b=z.object({nationalIdLast4:z.string().regex(/^\d{4}$/),fullName:z.string().min(2)}).parse(req.body);
  res.status(202).json({
    status:'PROVIDER_PENDING',
    message:'KYC submission accepted for provider/manual review. No verification is claimed here.',
    nationalIdLast4:b.nationalIdLast4
  });
});

app.post('/api/kyc/:id/verify',auth,requireRole('ADMIN','COMPLIANCE'),asyncRoute(async(req,res)=>{
  if(!process.env.KYC_PROVIDER_URL || !process.env.KYC_PROVIDER_API_KEY)
    return res.status(503).json({error:'KYC_PROVIDER_NOT_CONFIGURED'});
  return res.status(501).json({error:'KYC_PROVIDER_ADAPTER_REQUIRED'});
}));

app.post('/api/disputes',auth,(req,res)=>{
  const b=z.object({tradeId:z.string(),reason:z.string().min(5)}).parse(req.body);
  const d={id:`disp-${Date.now()}`,tradeId:b.tradeId,openedBy:req.user.sub,reason:b.reason,status:'OPEN',createdAt:new Date().toISOString()};
  memory.disputes.push(d);
  res.status(201).json({dispute:d});
});

app.get('/api/admin/overview',auth,requireRole('ADMIN','COMPLIANCE'),(req,res)=>res.json({
  users:'DB_REQUIRED', kyc:'DB_REQUIRED', offers:memory.offers.length, trades:memory.trades.length,
  disputes:memory.disputes.length, payments:'DB_REQUIRED', revenue:'DB_REQUIRED'
}));

app.get('/api/admin/audit',auth,requireRole('ADMIN','COMPLIANCE'),(req,res)=>res.json({audit:memory.audit}));

app.use((err,req,res,next)=>{
  console.error(err);
  if(err?.name==='ZodError') return res.status(400).json({error:'VALIDATION_ERROR',details:err.issues});
  res.status(500).json({error:'INTERNAL_SERVER_ERROR'});
});

app.listen(PORT,()=>console.log(`WexatP2P API listening on ${PORT}`));
