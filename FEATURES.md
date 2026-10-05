# WexatP2P Feature Map

## Public/User

1. Home
2. Buy Crypto
3. Sell Crypto
4. Offers
5. Offer details
6. Create offer
7. My offers
8. My trades
9. Trade details
10. Wallet
11. Deposit
12. Withdraw
13. Transaction history
14. KYC
15. National ID verification
16. Security
17. Notifications
18. Profile
19. Settings
20. Help/FAQ
21. Support tickets
22. Disputes
23. Terms/Privacy/Risk pages

## Trade workflow

CREATED
 -> FUNDED
 -> PAYMENT_SENT
 -> PAYMENT_CONFIRMED
 -> RELEASED

Cancellation and dispute paths are controlled by permissions and trade state. A release must never occur merely because a browser button was clicked.

## Admin

- Overview
- Users
- KYC
- Offers
- Trades
- Disputes
- Payments
- Wallet ledger
- Fees
- Risk / AML
- Support
- Notifications
- Settings
- Audit logs
- System health

## Security

- Role-based access control
- Permission checks
- Server-side authorization
- Audit trail
- Rate limiting
- Input validation
- Secure password hashing
- HTTPS
- Secrets outside source code
- KYC evidence access control
- Idempotent payment operations
- Database transactions for balance/escrow changes
