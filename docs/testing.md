# Testing Instructions

## Smart Contract

Preferred command:

```bash
cd contracts
npm test
```

If Hardhat cannot download the Solidity compiler in the local environment, use the local `solc-js` compile check:

```bash
cd contracts
npm run compile:solc
```

Covered test scenarios:

- role permission checks;
- manufacturer-only batch and product creation;
- duplicate serial prevention;
- authorized transfers;
- replay prevention with `operationId`;
- pharmacy-only sale;
- recall blocking;
- unrecall flow;
- immutable history retrieval.

## Frontend

```bash
cd frontend
npm run build
```

This validates TypeScript and creates a production build.

## Backend

```bash
cd backend
mvn test
```

Requires Maven and Java 17.
