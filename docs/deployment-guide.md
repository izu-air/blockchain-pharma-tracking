# Deployment Guide

## Testnet Choice

Use Ethereum Sepolia or Polygon Amoy. Both are public EVM testnets and work with MetaMask.

## Deploy Contract

Install dependencies:

```bash
cd contracts
npm install
```

Create `.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
POLYGON_AMOY_RPC_URL=https://polygon-amoy.infura.io/v3/YOUR_KEY
PRIVATE_KEY=YOUR_TEST_WALLET_PRIVATE_KEY
```

Deploy to Sepolia:

```bash
npm run deploy:sepolia
```

Deploy to Polygon Amoy:

```bash
npm run deploy:amoy
```

Save the printed contract address.

## Configure Frontend

Create `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_API_BASE_URL=http://localhost:8080/api
```

Build:

```bash
cd frontend
npm install
npm run build
```

## Configure Backend

Create PostgreSQL database:

```sql
CREATE DATABASE pharma_chain;
```

Run backend:

```bash
cd backend
mvn spring-boot:run
```

For deployment, pass database settings through environment variables:

```env
DB_URL=jdbc:postgresql://host:5432/pharma_chain
DB_USER=postgres
DB_PASSWORD=postgres
FRONTEND_ORIGIN=https://your-frontend-domain
```
