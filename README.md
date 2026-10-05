# WexatP2P — Full P2P Trading Platform

WexatP2P is a production-oriented P2P trading platform foundation with:
- User account/profile flow
- Buy/Sell marketplace
- Offer creation and management
- Trade state machine
- Wallet/balance and escrow ledger model
- Fees
- KYC/National ID verification boundary
- Disputes and evidence
- Notifications
- Risk/AML controls
- Admin dashboard
- Audit logs
- Settings
- GitHub Pages deployment for the frontend
- Separate Node.js API for real authentication, database, payments and KYC

## Important production note

This repository does NOT fake National ID verification. A browser cannot truthfully verify an Ethiopian National ID by itself. The backend exposes a KYC provider boundary where an approved identity provider or authoritative verification service must be connected. Never put provider secrets in the frontend or GitHub Pages.

GitHub Pages is static hosting. The frontend can be deployed there, but the API, database, authentication, KYC and payment/escrow services must run on a server/cloud platform.

## Structure

frontend/          Static WexatP2P web application
backend/           Express API foundation
database/          PostgreSQL schema and seed notes
docs/              Architecture, formulas, security and deployment
.github/workflows/ GitHub Pages deployment

## Local frontend

Open frontend/index.html directly or serve it with a static server.

## Local API

1. cd backend
2. npm install
3. copy .env.example to .env
4. Configure DATABASE_URL and JWT_SECRET
5. npm run dev

## Production

Use PostgreSQL, HTTPS, secure cookies or short-lived access tokens, refresh-token rotation, rate limiting, object storage for KYC evidence, a real KYC provider, a real payment/escrow integration, monitoring, backups and a secrets manager.

## GitHub Pages

The workflow publishes frontend/ on every push to main. In GitHub:
Settings -> Pages -> Source -> GitHub Actions.

GitHub's current documentation recommends GitHub Actions for custom workflows and static deployments.
