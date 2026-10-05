# WexatP2P Business Formulas

## Trade

tradeValue = unitPrice * assetAmount

buyerFee = tradeValue * buyerFeeRate

sellerFee = tradeValue * sellerFeeRate

buyerTotal = tradeValue + buyerFee

sellerNet = tradeValue - sellerFee

## Offer limits

validTrade = tradeValue >= minLimit AND tradeValue <= maxLimit

## Wallet

availableBalance =
walletBalance - lockedBalance - pendingWithdrawalAmount

## Escrow

When a seller creates/funds a trade:

sellerAvailable -= escrowAmount
sellerLocked += escrowAmount

When a valid release occurs:

sellerLocked -= escrowAmount
buyerAssetBalance += escrowAmount

Every movement must be represented by immutable ledger entries.

## Platform revenue

platformRevenue =
buyerFees
+ sellerFees
+ withdrawalFees
+ serviceFees

## Risk score

riskScore =
identityRisk * 0.25
+ transactionVelocityRisk * 0.15
+ deviceRisk * 0.10
+ paymentRisk * 0.20
+ sanctionsRisk * 0.20
+ accountHistoryRisk * 0.10

The exact weights must be approved by the compliance owner and tested before production.

## KYC states

SUBMITTED
-> PROVIDER_PENDING
-> PROVIDER_VERIFIED

or

SUBMITTED
-> MANUAL_REVIEW
-> VERIFIED / REJECTED

Do not set VERIFIED from frontend JavaScript.

## Admin authorization

allow =
authenticated
AND activeAccount
AND roleAllowed
AND permissionAllowed
AND resourceAllowed

## Audit

Every privileged action should create an audit event with:
actor, action, resource, resourceId, timestamp, IP/device context where legally appropriate, result, and correlationId.
