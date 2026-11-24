# API

All port APIs use `Authorization: Bearer <PORT_TOKEN>`. The port token is returned once when created.

## Create port (dashboard session)
`POST /api/ports` with `{ "name": "ERP", "webhookUrl": "https://hooks.example.com/scans" }`.

## Create request
`POST /api/ports/{portId}/requests`
```json
{"requestId":"ORDER-1001","client":{"nome":"João Silva","email":"joao@example.com","senhaApp":"secret","numeroSerie":"","equipamento":"Starlink","valorEquipamentos":2500,"local":"Irecê","formaPagamento":"PIX","status":"Pendente","desconto":100,"valorInstalacao":200}}
```
Returns `scannerUrl` and `scannerToken`. The URL uses a fragment so the secret is not sent in HTTP requests or referrer headers. Treat both as private capabilities.

## Scanner request details
`GET /api/ports/{portId}/requests/{requestId}` with the one-time scanner token (or port token). Returns decrypted client data to populate the scanner screen.

## Submit a scan
`POST /api/ports/{portId}/scans` with `{"requestId":"ORDER-1001","barcode":"7891234567890"}`. The scanner token is scoped to that request. Every read creates a new event; repeated values are accepted.

## Outbound webhook
Payload: `{event,eventId,requestId,barcode,scannedAt}`.
Headers: `X-Scan-Event`, `X-Scan-Signature: sha256=<hex>`. Verify HMAC-SHA256 with the webhook secret. The app does not include client passwords in barcode events.
