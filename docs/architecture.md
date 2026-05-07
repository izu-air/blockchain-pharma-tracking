# Architecture Description

## Goal

This project is a diploma-level demonstrational system, not an enterprise pharmaceutical platform. The main goal is to demonstrate how blockchain can provide transparency, authenticity verification, recall handling and immutable product history in a pharmaceutical supply chain.

## Components

### Smart contract

`contracts/contracts/SupplyChain.sol` is the source of truth.

It stores:

- product id;
- batch id;
- product name;
- manufacturer address;
- current owner address;
- creation timestamp;
- current status;
- blocked/recalled state;
- product history.

The contract also stores product batches. Batch data includes production date, expiration date, recall state, temperature hash and metadata hash.

The contract uses OpenZeppelin `AccessControl`:

- `ADMIN_ROLE`
- `MANUFACTURER_ROLE`
- `DISTRIBUTOR_ROLE`
- `PHARMACY_ROLE`
- `REGULATOR_ROLE`

This gives the diploma project a realistic security model without adding enterprise infrastructure.

### Frontend

`frontend/` is a React + Vite + TypeScript application. It provides a Russian-language interface for:

- connecting MetaMask;
- creating products;
- transferring products;
- updating status;
- viewing history;
- verifying authenticity.

Frontend calls the smart contract directly through `ethers.js`.

### Backend

`backend/` is a Spring Boot REST API with PostgreSQL.

It stores supplementary metadata only:

- users and wallet addresses;
- batch metadata;
- batch number;
- expiration date;
- optional description;
- transaction hashes recorded after frontend operations.
- audit logs;
- analytics counters.

Backend does not decide who owns a product and does not replace the smart contract.

## Data Ownership Decision

Blockchain is used for the data that must be transparent and tamper-resistant:

- ownership;
- status;
- chronological history.

PostgreSQL is used for ordinary application data:

- readable descriptions;
- batch information;
- REST API demonstration data.

This keeps the project simple and realistic for one developer.

## Participant Flow

1. Manufacturer creates a batch.
2. Manufacturer creates products inside the batch.
3. Distributor receives products through blockchain transfer.
4. Pharmacy receives products and can mark delivered products as sold.
5. Regulator can recall a batch if safety problems are found.
6. Consumer checks product ID and views authenticity, timeline, current owner, recall status and expiration status.

## Anti-Counterfeit Value

The product is authentic only if it exists in the smart contract and belongs to a valid batch. A fake package can print any QR code, but it cannot create a valid blockchain history signed by authorized manufacturer, distributor and pharmacy wallets.

## Why Immutable History Matters

Every product action is appended to `ProductHistory`. Existing history entries are not edited or deleted. This makes the system useful for audit: during a dispute, the timeline shows who moved the product, when it happened and which operation id was used.

## Why Not Hyperledger or Microservices

The project is a diploma MVP. Ethereum-compatible testnet, MetaMask and a single smart contract are enough to demonstrate the idea. Hyperledger Fabric, microservices and Kubernetes would add infrastructure complexity without improving the educational goal.
