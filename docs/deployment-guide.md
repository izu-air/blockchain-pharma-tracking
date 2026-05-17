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

For deployment, pass settings through environment variables.  Anything that
docker-compose declares with `${VAR:?error}` syntax MUST be set or the
stack refuses to start (this is intentional — no insecure production
defaults).

```env
# Database — choose a strong password, never reuse the local-dev one.
POSTGRES_DB=pharma_chain
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-random>
DB_URL=jdbc:postgresql://host:5432/pharma_chain
DB_USER=postgres
DB_PASSWORD=<same-as-POSTGRES_PASSWORD>

# Frontend origin used for CORS allowlist (no wildcard with credentials).
FRONTEND_ORIGIN=https://your-frontend-domain

# JWT signing secret (HS256). MUST be ≥ 32 random chars.
#   openssl rand -base64 48
JWT_SECRET=<32+-random-chars>

# Pepper used to pseudonymize wallet addresses in audit_logs.
#   openssl rand -base64 32
AUDIT_PEPPER=<32+-random-chars>

# Bootstrap admin (optional but recommended for fresh deployments).
APP_ADMIN_WALLET=0xYourAdminWallet
APP_ADMIN_NAME=System administrator

# Blockchain indexer (optional in MVP; recommended in production).
BLOCKCHAIN_INDEXER_ENABLED=true
BLOCKCHAIN_RPC_URL=https://rpc-host:port
BLOCKCHAIN_CONTRACT_ADDRESS=0xDeployedContractAddress

# Production schema policy: Flyway owns migrations, Hibernate validates.
HIBERNATE_DDL_AUTO=validate
FLYWAY_ENABLED=true
```

After first deploy, complete the SIWE login as the admin wallet to obtain
a JWT, then use `POST /api/users` (with `Authorization: Bearer <jwt>`) to
create the operational supply-chain accounts.
