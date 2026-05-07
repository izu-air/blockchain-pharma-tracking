# Architecture Description

## Goal

This project is a diploma MVP, not an enterprise pharmaceutical platform. The main goal is to demonstrate how blockchain can provide transparency, authenticity verification and immutable product history in a pharmaceutical supply chain.

## Components

### Smart contract

`contracts/contracts/SupplyChain.sol` is the source of truth.

It stores:

- product id;
- product name;
- manufacturer address;
- current owner address;
- creation timestamp;
- current status;
- product history.

The contract is intentionally small. It uses mappings for product lookup and arrays for product history.

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
- batch number;
- expiration date;
- optional description;
- transaction hashes recorded after frontend operations.

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

1. Manufacturer creates a product.
2. Distributor receives the product through transfer.
3. Distributor marks product as delivered or transfers it further.
4. Pharmacy receives product and marks it as sold.
5. Consumer checks product ID and views blockchain history.

## Why Not Hyperledger or Microservices

The project is a diploma MVP. Ethereum-compatible testnet, MetaMask and a single smart contract are enough to demonstrate the idea. Hyperledger Fabric, microservices and Kubernetes would add infrastructure complexity without improving the educational goal.
