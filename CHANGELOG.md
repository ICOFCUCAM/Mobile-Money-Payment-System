# Changelog

All user-visible changes to this project.

## [Unreleased]

### Added

**Backend**
- `POST /api/payments/:id/reverse` — reverse a successful transaction (admin only). Debits the student's balance and marks the transaction `reversed`. Idempotent.
- `POST /api/payments/reconcile` — re-polls the provider for every pending transaction and promotes them to `success` or `failed`. Intended for a cron every few minutes.
- `GET /api/payments/export.csv` — CSV export, respects `?status=` and `?provider=` filters. Up to 10,000 rows per call.
- `DELETE /api/schools/me` — delete the tenant. Cascades to students, users, payment configs, transactions, subscriptions, audit logs.
- `POST /api/auth/password-reset/request` + `POST /api/auth/password-reset/confirm` — token-based password reset (1h expiry, single-use, prior-token invalidation, no email enumeration). Set `PASSWORD_RESET_EXPOSE_TOKEN=1` in dev to bypass email.
- `POST /api/auth/change-password` — change your own password while logged in.
- `GET /api/_status` — liveness + DB readiness probe.
- `password_resets` table with an FK + cascade from `users`.

**Frontend**
- Toast system (success / error / warn / info) replacing inline alerts and `window.alert` across every flow.
- Modal confirmation dialogs on destructive actions (rotate key, delete school, reverse transaction).
- **Settings** page: profile, school info, webhook URL hint, change password form, rotate API key (with one-time display), danger-zone delete school.
- **Refund / reverse** button on every successful transaction (admins only) with a detailed confirm dialog.
- **Export CSV** button on Payments; respects current filters.
- **Forgot password** + **Reset password** screens (`#/forgot`, `#/reset?token=…`). In dev mode the forgot-password response returns a one-click reset link.
- Status + provider filters on Payments, persisted in the URL hash.
- **Reconcile pending** button (admin + bursar) with per-run summary toast.
- Pagination (50/page) and a search box on Students; pagination on Payments; filters compose with pagination and CSV export.
- Dark-mode-aware stylesheet, responsive tweaks for small viewports.

**Tests + CI**
- Node-native test suite (`npm test`) with 25 unit tests covering encryption, schools, auth, and payments invariants.
- CI runs unit tests + the smoke test against a Postgres 16 service container.

### Changed
- `/api/_diag` removed. `DEBUG_ERRORS` reverted to opt-in (`=1`); off by default so stack traces don't leak to API consumers.
- `errorHandler` now exposes `name / code / message / truncated stack` in responses when `DEBUG_ERRORS=1` — useful for debugging hosted deploys.
- `database.js` parses the DB URL manually and passes host/user/password/ssl as explicit fields. Fixes a pg bug where `sslmode=require` in the connection string re-applies strict TLS validation at connect time, which broke Supabase / Neon poolers using self-signed cert chains.

### Fixed
- Register / any DB-backed endpoint returning `500 Internal server error` on Vercel + Supabase when the pooler URL contained `sslmode=require`. Resolved by the explicit connection config + `rejectUnauthorized: false`.
- `better-sqlite3` dependency fully removed; the app is Postgres-only now.

### Migration notes
- Run `npm run migrate` once after pulling — it adds the `password_resets` table. The migration is idempotent (`CREATE TABLE IF NOT EXISTS`).
- Drop `DEBUG_ERRORS` from production env vars once your deploy is stable. The UI no longer depends on it.
