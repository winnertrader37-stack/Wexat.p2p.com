# Deployment

## Frontend

Push the repository to GitHub and enable:

Settings -> Pages -> Source -> GitHub Actions.

The included workflow publishes `frontend/`.

## Backend

Do NOT deploy backend/server.js to GitHub Pages. GitHub Pages does not execute server-side Node.js code.

Deploy the backend to a Node-compatible host and set:
- DATABASE_URL
- JWT_SECRET
- CORS_ORIGIN
- KYC_PROVIDER_URL
- KYC_PROVIDER_API_KEY
- PAYMENT_PROVIDER_URL
- PAYMENT_PROVIDER_SECRET

Then set frontend/API_BASE_URL in frontend/app.js or build configuration.

## Database

Use PostgreSQL in production. Apply database/schema.sql and create proper migrations.

## Domain

Use:
www.wexatp2p.example -> frontend
api.wexatp2p.example -> backend

The exact domain is your choice.
