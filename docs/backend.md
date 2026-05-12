# Backend Explanation

The backend is a Spring Boot application that supports the blockchain system without becoming the source of truth.

## Responsibilities

- Store organizations and registered users.
- Store readable product and batch metadata.
- Cache blockchain transaction events.
- Provide audit logs.
- Provide analytics for the frontend dashboard.
- Expose Swagger/OpenAPI documentation.
- Provide simple JWT demo authentication by registered wallet.

## Important Boundary

The backend does not decide product authenticity, current owner, recall state or sale status. Those values come from `SupplyChain.sol`.

## Main Layers

- `controller`: REST endpoints.
- `service`: application logic and transactions.
- `repository`: Spring Data JPA access.
- `entity`: PostgreSQL tables.
- `dto`: request/response contracts with validation.
- `exception`: centralized error handling.

## Event Indexing

`BlockchainEventIndexerService` is a scheduled extension point. For local diploma runs, frontend stores transaction hashes after successful MetaMask transactions. For a testnet deployment, the indexer can be enabled with:

```env
BLOCKCHAIN_INDEXER_ENABLED=true
BLOCKCHAIN_RPC_URL=https://...
BLOCKCHAIN_CONTRACT_ADDRESS=0x...
```

The current implementation records indexer heartbeat/audit entries and keeps the integration lightweight.
