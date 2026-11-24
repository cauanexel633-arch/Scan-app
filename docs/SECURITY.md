# Security model

- Dashboard routes verify Supabase sessions and scope operations to the authenticated user's UUID.
- Each port has a 256-bit random bearer token; only its SHA-256 hash is stored and the token is displayed once.
- Each scan request has a separate random scanner token scoped to that single request. It is returned once; the scanner URL stores it in the URL fragment, never in query parameters.
- Client JSON is encrypted using AES-256-GCM before database storage. Keep DATA_ENCRYPTION_KEY server-only and back it up securely.
- Supabase RLS is enabled on every table. Direct anon/authenticated grants are revoked; server APIs perform explicit ownership/token checks before service-role access.
- WEBHOOK_ALLOWED_HOSTS is mandatory and must contain exact hostnames. This prevents arbitrary destination selection. Use an egress proxy with DNS/IP pinning for stronger SSRF protection.
- Webhook requests require HTTPS, reject embedded credentials, do not follow redirects, and time out after 8 seconds.
- Webhook signatures use HMAC-SHA256. Do not log tokens, client payloads, encryption keys, or webhook secrets.
- Repeated barcode values are not deduplicated. Every accepted scan is a separate event.
