# API

All port APIs use `Authorization: Bearer <PORT_TOKEN>`. The port token is returned once when created.

## Create port (dashboard session)
`POST /api/ports` with `{ "name": "ERP", "webhookUrl": "https://hooks.example.com/scans" }`. The response includes the port token and webhook HMAC secret. Store both securely; they are shown only once.

## Create request
`POST /api/ports/{portId}/requests`
```json
{"requestId":"ORDER-1001","client":{"nome":"João Silva","email":"joao@example.com","senhaApp":"secret","numeroSerie":"","equipamento":"Starlink","valorEquipamentos":2500,"local":"Irecê","formaPagamento":"PIX","status":"Pendente","desconto":100,"valorInstalacao":200}}
```
Returns a request-scoped `scannerUrl` and `scannerToken`. The URL stores the token in its fragment; share it only with the intended operator.

## Scanner request details
`GET /api/ports/{portId}/requests/{requestId}` with the scanner token or port token. Returns decrypted client data to populate the scanner screen.

## Submit a scan
`POST /api/ports/{portId}/scans` with `{"requestId":"ORDER-1001","barcode":"7891234567890"}`. The scanner token is scoped to that request. Every read creates a new event; repeated values are accepted.

## Outbound webhook
Payload: `{event,eventId,requestId,barcode,scannedAt}`.
Headers: `X-Scan-Event`, `X-Scan-Signature: sha256=<hex>`. Verify HMAC-SHA256 with the one-time webhook secret from port creation. The app does not include client passwords in barcode events.
