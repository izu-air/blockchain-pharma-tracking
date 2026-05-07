# Smart Contract Explanation

Contract path:

```text
contracts/contracts/SupplyChain.sol
```

## Roles

The contract uses OpenZeppelin `AccessControl`.

```solidity
ADMIN_ROLE
MANUFACTURER_ROLE
DISTRIBUTOR_ROLE
PHARMACY_ROLE
REGULATOR_ROLE
```

Role restrictions:

- only manufacturers create batches and products;
- only authorized supply actors transfer products;
- only pharmacies mark products as sold;
- only regulators recall batches.

## Main Types

### ProductBatch

```solidity
struct ProductBatch {
    uint256 batchId;
    address manufacturer;
    uint256 productionDate;
    uint256 expirationDate;
    bool recalled;
    bytes32 temperatureHash;
    bytes32 metadataHash;
    bool exists;
}
```

Hashes allow the project to demonstrate anti-counterfeit and audit logic without storing large files or private commercial data on-chain.

### Product

```solidity
struct Product {
    uint256 id;
    uint256 batchId;
    string name;
    string serialNumber;
    address manufacturer;
    address currentOwner;
    uint256 createdAt;
    Status status;
    bool blocked;
    bool exists;
}
```

`exists` is used because default Solidity mapping values do not tell whether a product was actually created.

### Status

```solidity
enum Status {
    Manufactured,
    InTransit,
    Delivered,
    Sold,
    Recalled
}
```

Statuses model a simplified supply chain lifecycle.

## Functions

### createBatch(productionDate, expirationDate, temperatureHash, metadataHash)

Creates a product batch. Only `MANUFACTURER_ROLE` can call it.

### createProduct(batchId, name, serialNumber)

Creates a new product inside an existing batch. The sender becomes manufacturer and current owner. Duplicate serial numbers are rejected.

### transferProduct(productId, newOwner, operationId)

Transfers product ownership. Only the current owner can call it. The product status becomes `InTransit`.

`operationId` prevents accidental or malicious replay of the same logical operation.

### updateStatus(productId, newStatus, operationId)

Updates product status. Only the current owner can call it. Sold products are final. Only pharmacy can set `Sold`.

### recallBatch(batchId, reason, operationId)

Regulator recalls a batch. Unsold products from the batch become blocked and receive `Recalled` status.

### unrecalledBatch(batchId, reason, operationId)

Regulator can remove a recall after investigation. Products that were blocked by recall become movable again.

### getProduct(productId)

Returns product data.

### getProductHistory(productId)

Returns the chronological product history.

### verifyProduct(productId)

Returns consumer verification data:

- authentic;
- recalled;
- expired;
- blocked;
- status;
- current owner;
- batch id;
- expiration date.

### verifyProductBySerial(serialNumber)

Consumer-facing verification function used by the QR code flow.

## Events

- `ProductCreated`
- `ProductTransferred`
- `ProductStatusUpdated`
- `BatchCreated`
- `BatchRecalled`
- `BatchUnrecalled`

Events make it easier to show transaction activity in frontend and blockchain explorers.

## Validation

The contract uses `require` checks to keep business rules simple:

- product must exist;
- product name cannot be empty;
- only current owner can transfer or update;
- new owner cannot be zero address;
- sold product cannot be transferred;
- product must be delivered before it is sold.
- recalled products cannot be sold;
- operation id cannot be reused.
- serial numbers cannot be duplicated.
