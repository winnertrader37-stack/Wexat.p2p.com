# Security Checklist

- Never store passwords in plaintext.
- Use Argon2id or bcrypt with a suitable cost.
- Keep JWT signing keys and provider API keys in server-side secrets.
- Do not commit .env.
- Do not upload National ID images to GitHub.
- KYC evidence must be private object storage.
- Use HTTPS everywhere.
- Add CSRF protection when cookie authentication is used.
- Rate limit login, signup, withdrawal, KYC and trade endpoints.
- Validate every API input server-side.
- Authorize every privileged action server-side.
- Use DB transactions for wallet/escrow updates.
- Make payment webhooks idempotent.
- Verify webhook signatures.
- Log security events without logging secrets.
- Encrypt sensitive data at rest where required.
- Implement account lock/risk escalation.
- Use backups and tested restore procedures.
