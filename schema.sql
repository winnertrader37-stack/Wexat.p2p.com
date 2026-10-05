
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_status AS ENUM ('ACTIVE','SUSPENDED','LOCKED','PENDING');
CREATE TYPE kyc_status AS ENUM ('NOT_STARTED','SUBMITTED','PROVIDER_PENDING','MANUAL_REVIEW','VERIFIED','REJECTED');
CREATE TYPE trade_status AS ENUM ('CREATED','FUNDED','PAYMENT_SENT','PAYMENT_CONFIRMED','RELEASED','CANCELLED','DISPUTED');
CREATE TYPE dispute_status AS ENUM ('OPEN','UNDER_REVIEW','RESOLVED_BUYER','RESOLVED_SELLER','CLOSED');
CREATE TYPE offer_side AS ENUM ('BUY','SELL');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER',
  status user_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kyc_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status kyc_status NOT NULL DEFAULT 'NOT_STARTED',
  national_id_last4 TEXT,
  provider_reference TEXT,
  risk_score NUMERIC(8,2) DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  review_note TEXT
);

CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  side offer_side NOT NULL,
  asset TEXT NOT NULL,
  fiat TEXT NOT NULL,
  price NUMERIC(30,10) NOT NULL,
  min_limit NUMERIC(30,10) NOT NULL,
  max_limit NUMERIC(30,10) NOT NULL,
  available_amount NUMERIC(30,10) NOT NULL,
  payment_method TEXT NOT NULL,
  terms TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  asset_amount NUMERIC(30,10) NOT NULL,
  unit_price NUMERIC(30,10) NOT NULL,
  trade_value NUMERIC(30,10) NOT NULL,
  buyer_fee NUMERIC(30,10) NOT NULL DEFAULT 0,
  seller_fee NUMERIC(30,10) NOT NULL DEFAULT 0,
  status trade_status NOT NULL DEFAULT 'CREATED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  asset TEXT NOT NULL,
  amount NUMERIC(30,10) NOT NULL,
  entry_type TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id),
  opened_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'OPEN',
  resolution_note TEXT,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  result TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_offers_active ON offers(active);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
