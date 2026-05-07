# Local Setup Guide

## Prerequisites

- Node.js 20+
- npm
- Java 17+
- Maven 3.9+
- PostgreSQL 14+
- MetaMask browser extension

## 1. Run Local Blockchain

```bash
cd contracts
npm install
npm run node
```

Hardhat prints local accounts and private keys. Import one private key into MetaMask for local testing.

## 2. Deploy Contract Locally

Open another terminal:

```bash
cd contracts
npm run deploy:local
```

Copy the contract address.

## 3. Configure Frontend

Create `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=PASTE_CONTRACT_ADDRESS
VITE_API_BASE_URL=http://localhost:8080/api
```

## 4. Start PostgreSQL

Create database:

```sql
CREATE DATABASE pharma_chain;
```

Default backend credentials are:

```text
user: postgres
password: postgres
```

They can be changed with `DB_USER` and `DB_PASSWORD`.

## 5. Run Backend

```bash
cd backend
mvn spring-boot:run
```

API docs:

```text
http://localhost:8080/swagger-ui/index.html
```

## 6. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Demo Scenario

1. Connect MetaMask.
2. Register product.
3. Copy created product ID.
4. Transfer product to another wallet.
5. Update status to delivered.
6. Transfer to pharmacy wallet.
7. Mark product as sold.
8. Open Verify Product and check authenticity.
