# API Documentation

Swagger UI is available at:

```text
http://localhost:8080/swagger-ui/index.html
```

Base URL:

```text
http://localhost:8080/api
```

## Users

### Create user

`POST /api/users`

```json
{
  "name": "Demo Manufacturer",
  "role": "MANUFACTURER",
  "walletAddress": "0x0000000000000000000000000000000000000001"
}
```

Roles:

- `MANUFACTURER`
- `DISTRIBUTOR`
- `PHARMACY`
- `CONSUMER`

### List users

`GET /api/users`

### Find user by wallet

`GET /api/users/wallet/{walletAddress}`

## Organizations

### Create organization

`POST /api/organizations`

```json
{
  "name": "Demo Distributor LLC",
  "role": "DISTRIBUTOR",
  "country": "Kazakhstan"
}
```

### List organizations

`GET /api/organizations`

## Product Metadata

### Create metadata

`POST /api/product-metadata`

```json
{
  "blockchainProductId": 1,
  "batchNumber": "BATCH-2026-001",
  "expirationDate": "2027-12-31",
  "description": "Demo medicine batch"
}
```

### List metadata

`GET /api/product-metadata`

### Get metadata by blockchain product id

`GET /api/product-metadata/{blockchainProductId}`

### Search metadata

`GET /api/product-metadata/search?query=BATCH`

## Batch Metadata

### Create batch metadata

`POST /api/batch-metadata`

```json
{
  "blockchainBatchId": 1,
  "batchNumber": "BATCH-2026-001",
  "manufacturerName": "Demo Manufacturer",
  "productionDate": "2026-05-07",
  "expirationDate": "2027-12-31",
  "metadataHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "temperatureHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```

### List batch metadata

`GET /api/batch-metadata`

### Get batch metadata

`GET /api/batch-metadata/{blockchainBatchId}`

## Product Events

### Save transaction event

`POST /api/product-events`

```json
{
  "blockchainProductId": 1,
  "eventType": "PRODUCT_CREATED",
  "transactionHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```

### Get events by product id

`GET /api/product-events/{blockchainProductId}`

## Authentication

### Login by registered wallet

`POST /api/auth/login`

```json
{
  "walletAddress": "0x0000000000000000000000000000000000000001"
}
```

Returns a simple HMAC JWT for diploma demonstration.

## Analytics

`GET /api/analytics/summary`

Returns metadata count and cached blockchain event counters.

## Audit Logs

`GET /api/audit-logs`

Returns the latest backend audit actions.

## Important Note

The backend API stores supplementary data. The product owner, status and history must be read from the smart contract.
