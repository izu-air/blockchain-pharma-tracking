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

## Important Note

The backend API stores supplementary data. The product owner, status and history must be read from the smart contract.
