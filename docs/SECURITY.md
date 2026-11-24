# Security model

- Dashboard APIs validate Better Auth sessions server-side and scope every port query to the authenticated user's ID.
- Neon is accessed only from server-side Node.js routes. No browser database key or public Data API is used.
- Each port has a 256-bit random bearer token; only its SHA-256 hash is stored and the token is displayed once.
- Each scan request has a separate random scanner token scoped to that request. The token is returned once and placed in the URL fragment, not the query string.
- Client JSON and webhook signing secrets are encrypted using AES-256-GCM before database storage. Keep DATA_ENCRYPTION_KEY server-only and back it up securely.
- Passwords are hashed and sessions/cookies are managed by Better Auth. Set a unique high-entropy BETTER_AUTH_SECRET and correct BETTER_AUTH_URL.
- WEBHOOK_ALLOWED_HOSTS is mandatory and must contain exact hostnames. This prevents arbitrary destination selection. Use an egress proxy with DNS/IP pinning for stronger SSRF protection.
- Webhook requests require HTTPS, reject embedded credentials, do not follow redirects, and time out after 8 seconds.
- Only webhook HTTP status and a short transport error are retained; webhook response bodies are not stored.
- Webhook signatures use HMAC-SHA256. Do not log tokens, client payloads, encryption keys, or webhook secrets.
- Repeated barcode values are not deduplicated. Every accepted scan is a separate event.
