# Scan-app

Secure barcode intake and webhook relay platform.

## Stack
- Next.js 15 App Router on Vercel
- Neon PostgreSQL (server-side access through the pooled connection string)
- Better Auth email/password authentication stored in Neon
- Per-port 256-bit bearer tokens stored only as SHA-256 hashes
- Request-scoped scanner tokens
- AES-256-GCM encryption for client payloads and webhook secrets
- Camera barcode scanning with ZXing
- Immediate HMAC-SHA256 signed webhook delivery

## Neon setup
1. Create a Neon project and database.
2. Run `neon/migrations/0001_initial.sql` in the Neon SQL Editor.
3. Copy the pooled connection string from Neon (the hostname containing `-pooler`) into `DATABASE_URL`.
4. Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`.
5. Generate `DATA_ENCRYPTION_KEY` with `openssl rand -base64 32`.
6. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the app origin.
7. Set `WEBHOOK_ALLOWED_HOSTS` to exact comma-separated hostnames permitted as webhook destinations. Empty means deny-all.

## Local development
1. Copy `.env.example` to `.env.local` and fill in the values above.
2. Run `npm install`.
3. Run `npm run dev`.

## Vercel deployment
Import the GitHub repository into Vercel and configure all environment variables for the required environments. Never prefix `DATABASE_URL`, `BETTER_AUTH_SECRET`, or `DATA_ENCRYPTION_KEY` with `NEXT_PUBLIC_`.

## Existing Supabase deployments
This migration replaces the authentication provider and database adapter. Existing Supabase users and rows are not copied automatically. Export/import data only after a backup and a deliberate user-ID mapping; never point this Neon schema at the old Supabase database.

See `docs/API.md` and `docs/SECURITY.md`.
