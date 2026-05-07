# Gas Usage and Transaction Flow

## Gas-Relevant Operations

The most important blockchain transactions are:

- `createBatch`: stores batch dates and two hashes;
- `createProduct`: stores product and first history record;
- `transferProduct`: changes owner and appends history;
- `updateStatus`: changes status and appends history;
- `recallBatch`: marks the batch recalled and blocks unsold products in that batch.

`recallBatch` is the most expensive operation because it loops over products in the batch. For a diploma MVP this is acceptable. In a production system, recall could be represented as batch-level state only, and products would read that state dynamically.

## Why Store Hashes

Temperature logs and detailed metadata can be large. Storing them fully on-chain is expensive and may expose sensitive data. The MVP stores `bytes32` hashes:

- blockchain proves the document/log existed in that form;
- backend or documents can store readable content;
- any change to the original document changes the hash.

## Transaction Flow

1. User connects MetaMask.
2. Frontend calls smart contract function through `ethers.js`.
3. MetaMask asks the user to sign the transaction.
4. Transaction is mined on local Hardhat network or testnet.
5. Smart contract emits events.
6. Frontend sends transaction hash to backend cache.
7. Consumer reads product state and history from blockchain.

## Replay Prevention

Ethereum accounts already use transaction nonces. The contract additionally stores `operationId` for transfer, status update and recall operations. This prevents repeating the same business operation id even if a frontend or integration retries incorrectly.
