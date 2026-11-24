# Scan-app

Secure barcode intake and webhook relay platform.

## Stack
- Next.js App Router on Vercel
- Supabase Auth + Postgres
- Per-port 256-bit bearer tokens stored only as SHA-256 hashes
- Request-scoped scanner tokens
- AES-256-GCM encryption for client payloads and webhook secrets
- Camera barcode scanning with ZXing
- Immediate HMAC-SHA256 signed webhook delivery

## Setup
1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial.sql` in the Supabase SQL Editor.
3. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key, and server-only service role key.
4. Generate `DATA_ENCRYPTION_KEY` with `openssl rand -base64 32`.
5. Set `WEBHOOK_ALLOWED_HOSTS` to the exact comma-separated hostnames permitted as webhook destinations. The default is deny-all.
6. Set `NEXT_PUBLIC_APP_URL` to the deployed origin.
7. Run `npm install` and `npm run dev`.

## Deploy
Import this repository into Vercel and configure the same environment variables for Production, Preview, and Development as appropriate. Never prefix service-role or encryption keys with `NEXT_PUBLIC_`.

## Security and API
See `docs/SECURITY.md` and `docs/API.md`.
