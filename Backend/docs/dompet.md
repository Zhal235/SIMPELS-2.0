# Dompet Digital (Wallet) — API spec

This document describes the backend API endpoints added for the Dompet Digital feature (ePOS integration) in SIMPELS.

Base prefix: `/api/v1/wallets`

Authentication: existing Sanctum bearer tokens for admin / internal users. For ePOS integration we can add an API key / token mechanism later.

Endpoints:

- GET `/v1/wallets` — list all wallets
- GET `/v1/wallets/{santriId}` — get wallet for a santri (by id)
- POST `/v1/wallets/{santriId}/topup` — admin top-up wallet (body: amount, description)
- POST `/v1/wallets/{santriId}/debit` — admin debit (manual adjustment)
- GET `/v1/wallets/{santriId}/transactions` — get transactions for one santri

RFID management:
- GET `/v1/wallets/rfid` — list RFID tags
- POST `/v1/wallets/rfid` — bind RFID (body: uid, santri_id, label)
- PUT `/v1/wallets/rfid/{id}` — update tag mapping
- DELETE `/v1/wallets/rfid/{id}` — unbind tag

ePOS integration:
- POST `/v1/wallets/epos/transaction` — ePOS calls this when a purchase occurs
  - payload: { uid (optional), santri_id (optional), amount, epos_txn_id, meta }
  - server behavior: map uid -> santri_id if provided, debit wallet, create a wallet_transaction, and add amount to epos pool (epos_main)
  - response: { success: true, wallet_balance, pool_balance, transaction }
- GET `/v1/wallets/epos/pool` — get ePOS pool balance
- POST `/v1/wallets/withdrawals` — create withdrawal request from ePOS pool (pending admin processing)
- GET  `/v1/wallets/withdrawals` — list withdrawals / history

Notes & next steps:
- ePOS authentication/keys: we should add a secure API-key HMAC scheme (recommended) so that the ePOS terminal app can call the transaction endpoint without using admin user tokens.
- Reporting: filters + CSV/PDF export planned in the frontend 
- Admin approval flow for withdrawals can be added to move from 'pending' -> 'approved' and then deduct the pool balance.

One-time backfill migration and automation
- A migration named `2025_11_21_040000_backfill_existing_santri_wallets.php` was added to create wallets for all existing santri with balance = 0. Run `php artisan migrate` to create those wallets.
- We also registered a model observer so any newly created `Santri` will automatically get a `Wallet` (created by `App\Observers\SantriObserver`).
- After you run the backfill migration and confirm all wallets were created, you can safely remove/cleanup the backfill migration file if you prefer. The migration system will not re-run an already applied migration.
