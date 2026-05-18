// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract SupplyChain is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    enum Status {
        Manufactured,
        InTransit,
        Delivered,
        Sold,
        Recalled
    }

    // Storage layout note: bools are placed together near an address so the
    // EVM packs them into the same slot as the address (address=20 bytes +
    // bool 1 byte each fit into 32 bytes).  This saves one SSTORE per batch
    // and per product over the naive layout.
    struct ProductBatch {
        uint256 batchId;
        uint256 productionDate;
        uint256 expirationDate;
        bytes32 temperatureHash;
        bytes32 metadataHash;
        address manufacturer; // 20 bytes
        bool recalled;        // 1 byte   ─ packed with manufacturer
        bool exists;          // 1 byte   ─ packed with manufacturer
    }

    struct Product {
        uint256 id;
        uint256 batchId;
        uint256 createdAt;
        address manufacturer; // 20 bytes
        Status status;        // 1 byte   ─ packed
        bool blocked;         // 1 byte   ─ packed
        bool exists;          // 1 byte   ─ packed
        address currentOwner; // 20 bytes ─ new slot (still cheaper than scattered)
        string name;
        string serialNumber;
    }

    struct ProductHistory {
        uint256 timestamp;
        address actor;
        address previousOwner;
        address newOwner;
        Status status;
        string action;
        bytes32 operationId;
    }

    struct VerificationResult {
        bool authentic;
        bool recalled;
        bool expired;
        bool blocked;
        Status status;
        address currentOwner;
        uint256 batchId;
        uint256 expirationDate;
    }

    uint256 private nextProductId = 1;
    uint256 private nextBatchId = 1;

    mapping(uint256 => ProductBatch) private batches;
    mapping(uint256 => Product) private products;
    mapping(string => uint256) private productIdBySerial;
    mapping(uint256 => uint256[]) private batchProducts;
    mapping(uint256 => ProductHistory[]) private productHistories;
    mapping(bytes32 => bool) private usedOperationIds;

    event BatchCreated(
        uint256 indexed batchId,
        address indexed manufacturer,
        uint256 productionDate,
        uint256 expirationDate,
        bytes32 temperatureHash,
        bytes32 metadataHash
    );
    event BatchRecalled(uint256 indexed batchId, address indexed regulator, string reason);
    event BatchUnrecalled(uint256 indexed batchId, address indexed regulator, string reason);
    event ProductBlocked(uint256 indexed productId, address indexed regulator, string reason, bytes32 operationId);
    event ProductUnblocked(uint256 indexed productId, address indexed regulator, string reason, bytes32 operationId);
    event ProductCreated(uint256 indexed productId, uint256 indexed batchId, string serialNumber, string name, address indexed manufacturer);
    event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to, bytes32 operationId);
    event ProductStatusUpdated(uint256 indexed productId, Status status, address indexed actor, bytes32 operationId);

    modifier batchExists(uint256 batchId) {
        require(batches[batchId].exists, "Batch does not exist");
        _;
    }

    modifier productExists(uint256 productId) {
        require(products[productId].exists, "Product does not exist");
        _;
    }

    modifier onlyCurrentOwner(uint256 productId) {
        require(products[productId].currentOwner == msg.sender, "Only current owner can perform this action");
        _;
    }

    modifier notBlocked(uint256 productId) {
        require(!products[productId].blocked, "Product is blocked");
        require(!batches[products[productId].batchId].recalled, "Product batch is recalled");
        _;
    }

    modifier uniqueOperation(bytes32 operationId) {
        require(operationId != bytes32(0), "Operation id is required");
        require(!usedOperationIds[operationId], "Operation id already used");
        usedOperationIds[operationId] = true;
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MANUFACTURER_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
        _grantRole(PHARMACY_ROLE, msg.sender);
        _grantRole(REGULATOR_ROLE, msg.sender);

        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(MANUFACTURER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(DISTRIBUTOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PHARMACY_ROLE, ADMIN_ROLE);
        _setRoleAdmin(REGULATOR_ROLE, ADMIN_ROLE);
    }

    function createBatch(
        uint256 productionDate,
        uint256 expirationDate,
        bytes32 temperatureHash,
        bytes32 metadataHash
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        require(productionDate > 0, "Production date is required");
        require(expirationDate > productionDate, "Expiration date must be after production date");
        require(expirationDate > block.timestamp, "Expiration date must be in the future");
        require(metadataHash != bytes32(0), "Metadata hash is required");
        require(temperatureHash != bytes32(0), "Temperature hash is required");

        uint256 batchId = nextBatchId;
        nextBatchId++;

        batches[batchId] = ProductBatch({
            batchId: batchId,
            manufacturer: msg.sender,
            productionDate: productionDate,
            expirationDate: expirationDate,
            recalled: false,
            temperatureHash: temperatureHash,
            metadataHash: metadataHash,
            exists: true
        });

        emit BatchCreated(batchId, msg.sender, productionDate, expirationDate, temperatureHash, metadataHash);
        return batchId;
    }

    function createProduct(uint256 batchId, string calldata name, string calldata serialNumber)
        external
        onlyRole(MANUFACTURER_ROLE)
        batchExists(batchId)
        returns (uint256)
    {
        require(bytes(name).length > 0, "Product name is required");
        require(bytes(serialNumber).length > 0, "Serial number is required");
        require(productIdBySerial[serialNumber] == 0, "Serial number already exists");
        require(batches[batchId].manufacturer == msg.sender, "Only batch manufacturer can add products");
        require(!batches[batchId].recalled, "Batch is recalled");

        uint256 productId = nextProductId;
        nextProductId++;

        products[productId] = Product({
            id: productId,
            batchId: batchId,
            name: name,
            serialNumber: serialNumber,
            manufacturer: msg.sender,
            currentOwner: msg.sender,
            createdAt: block.timestamp,
            status: Status.Manufactured,
            blocked: false,
            exists: true
        });
        productIdBySerial[serialNumber] = productId;
        batchProducts[batchId].push(productId);

        _appendHistory(productId, msg.sender, address(0), msg.sender, Status.Manufactured, "Product created", bytes32(0));

        emit ProductCreated(productId, batchId, serialNumber, name, msg.sender);
        return productId;
    }

    function transferProduct(uint256 productId, address newOwner, bytes32 operationId)
        external
        productExists(productId)
        onlyCurrentOwner(productId)
        notBlocked(productId)
        uniqueOperation(operationId)
    {
        require(newOwner != address(0), "New owner cannot be zero address");
        require(_isAuthorizedSupplyActor(msg.sender), "Sender is not an authorized supply actor");
        require(_isAuthorizedSupplyActor(newOwner), "New owner is not an authorized supply actor");
        require(newOwner != msg.sender, "New owner must be different");
        require(products[productId].status != Status.Sold, "Sold product cannot be transferred");

        address previousOwner = products[productId].currentOwner;
        products[productId].currentOwner = newOwner;
        products[productId].status = Status.InTransit;

        _appendHistory(productId, msg.sender, previousOwner, newOwner, Status.InTransit, "Product transferred", operationId);

        emit ProductTransferred(productId, previousOwner, newOwner, operationId);
        emit ProductStatusUpdated(productId, Status.InTransit, msg.sender, operationId);
    }

    function updateStatus(uint256 productId, Status newStatus, bytes32 operationId)
        external
        productExists(productId)
        onlyCurrentOwner(productId)
        notBlocked(productId)
        uniqueOperation(operationId)
    {
        require(newStatus != Status.Recalled, "Use recallBatch for recalls");
        Status currentStatus = products[productId].status;
        require(currentStatus != Status.Sold, "Sold product status is final");
        require(newStatus != currentStatus, "Status is already set");

        // Role check first — clearer error messages take precedence over the
        // generic transition-validation revert.
        if (newStatus == Status.Sold) {
            require(hasRole(PHARMACY_ROLE, msg.sender), "Only pharmacy can mark sold");
            require(currentStatus == Status.Delivered, "Product must be delivered before sold");
        } else {
            require(_isAuthorizedSupplyActor(msg.sender), "Actor is not authorized");
            require(_isValidTransition(currentStatus, newStatus), "Invalid status transition");
        }

        products[productId].status = newStatus;

        _appendHistory(productId, msg.sender, msg.sender, msg.sender, newStatus, "Status updated", operationId);
        emit ProductStatusUpdated(productId, newStatus, msg.sender, operationId);
    }

    /**
     * Allowed forward transitions:
     *   Manufactured -> InTransit
     *   InTransit    -> Delivered
     *   Delivered    -> Sold
     * Backward transitions and skips are rejected to keep the audit trail
     * monotonic.  Status.Recalled is set only by recallBatch().
     */
    function _isValidTransition(Status from, Status to) private pure returns (bool) {
        if (from == Status.Manufactured && to == Status.InTransit) return true;
        if (from == Status.InTransit    && to == Status.Delivered) return true;
        if (from == Status.Delivered    && to == Status.Sold)      return true;
        return false;
    }

    /// @notice O(1) batch recall. Sets batches[id].recalled = true and emits
    /// BatchRecalled. verifyProduct treats every product whose batch is
    /// recalled as recalled+blocked, without mutating per-product state.
    /// Avoids the previous gas-DoS risk of looping over batchProducts, and
    /// preserves per-product lifecycle so an unrecall does not need to
    /// remember each product's prior status.
    function recallBatch(uint256 batchId, string calldata reason, bytes32 operationId)
        external
        onlyRole(REGULATOR_ROLE)
        batchExists(batchId)
        uniqueOperation(operationId)
    {
        require(!batches[batchId].recalled, "Batch already recalled");
        require(bytes(reason).length > 0, "Recall reason is required");

        batches[batchId].recalled = true;
        emit BatchRecalled(batchId, msg.sender, reason);
    }

    /// @notice O(1) batch unrecall. Per-product status is preserved
    /// (Sold stays Sold, InTransit stays InTransit). Pair with
    /// blockProduct / unblockProduct for product-level intervention that
    /// needs to survive an unrecall.
    function unrecallBatch(uint256 batchId, string calldata reason, bytes32 operationId)
        external
        onlyRole(REGULATOR_ROLE)
        batchExists(batchId)
        uniqueOperation(operationId)
    {
        require(batches[batchId].recalled, "Batch is not recalled");
        require(bytes(reason).length > 0, "Unrecall reason is required");

        batches[batchId].recalled = false;
        emit BatchUnrecalled(batchId, msg.sender, reason);
    }

    /**
     * Per-product block (independent of batch-level recall).  Use this when
     * regulator needs to surgically pull a single unit off the market without
     * recalling the whole batch.  Idempotent: blocking an already-blocked
     * product is a no-op revert.
     */
    function blockProduct(uint256 productId, string calldata reason, bytes32 operationId)
        external
        onlyRole(REGULATOR_ROLE)
        productExists(productId)
        uniqueOperation(operationId)
    {
        require(!products[productId].blocked, "Product already blocked");
        require(bytes(reason).length > 0, "Block reason is required");
        products[productId].blocked = true;
        _appendHistory(
            productId, msg.sender,
            products[productId].currentOwner, products[productId].currentOwner,
            products[productId].status, reason, operationId
        );
        emit ProductBlocked(productId, msg.sender, reason, operationId);
    }

    function unblockProduct(uint256 productId, string calldata reason, bytes32 operationId)
        external
        onlyRole(REGULATOR_ROLE)
        productExists(productId)
        uniqueOperation(operationId)
    {
        require(products[productId].blocked, "Product is not blocked");
        require(bytes(reason).length > 0, "Unblock reason is required");
        products[productId].blocked = false;
        _appendHistory(
            productId, msg.sender,
            products[productId].currentOwner, products[productId].currentOwner,
            products[productId].status, reason, operationId
        );
        emit ProductUnblocked(productId, msg.sender, reason, operationId);
    }

    function getProduct(uint256 productId)
        external
        view
        productExists(productId)
        returns (Product memory)
    {
        return products[productId];
    }

    function getProductBySerial(string calldata serialNumber)
        external
        view
        returns (Product memory)
    {
        uint256 productId = productIdBySerial[serialNumber];
        require(productId != 0, "Product does not exist");
        return products[productId];
    }

    function getProductIdBySerial(string calldata serialNumber)
        external
        view
        returns (uint256)
    {
        uint256 productId = productIdBySerial[serialNumber];
        require(productId != 0, "Product does not exist");
        return productId;
    }

    function getBatch(uint256 batchId)
        external
        view
        batchExists(batchId)
        returns (ProductBatch memory)
    {
        return batches[batchId];
    }

    function getBatchProducts(uint256 batchId)
        external
        view
        batchExists(batchId)
        returns (uint256[] memory)
    {
        return batchProducts[batchId];
    }

    function getProductHistory(uint256 productId)
        external
        view
        productExists(productId)
        returns (ProductHistory[] memory)
    {
        return productHistories[productId];
    }

    function verifyProduct(uint256 productId)
        external
        view
        productExists(productId)
        returns (VerificationResult memory)
    {
        Product memory product = products[productId];
        ProductBatch memory batch = batches[product.batchId];
        // Expiration is exclusive: the product is considered expired starting
        // from the second its expirationDate timestamp matches. Industry-standard
        // "valid through DAY X" can be encoded by setting expirationDate to the
        // 23:59:59 timestamp of day X.
        bool expired = block.timestamp >= batch.expirationDate;

        return VerificationResult({
            authentic: product.exists && batch.exists,
            recalled: batch.recalled || product.status == Status.Recalled,
            expired: expired,
            blocked: product.blocked || batch.recalled,
            status: product.status,
            currentOwner: product.currentOwner,
            batchId: product.batchId,
            expirationDate: batch.expirationDate
        });
    }

    function verifyProductBySerial(string calldata serialNumber)
        external
        view
        returns (VerificationResult memory)
    {
        uint256 productId = productIdBySerial[serialNumber];
        require(productId != 0, "Product does not exist");

        Product memory product = products[productId];
        ProductBatch memory batch = batches[product.batchId];
        // Expiration is exclusive: the product is considered expired starting
        // from the second its expirationDate timestamp matches. Industry-standard
        // "valid through DAY X" can be encoded by setting expirationDate to the
        // 23:59:59 timestamp of day X.
        bool expired = block.timestamp >= batch.expirationDate;

        return VerificationResult({
            authentic: product.exists && batch.exists,
            recalled: batch.recalled || product.status == Status.Recalled,
            expired: expired,
            blocked: product.blocked || batch.recalled,
            status: product.status,
            currentOwner: product.currentOwner,
            batchId: product.batchId,
            expirationDate: batch.expirationDate
        });
    }

    function _appendHistory(
        uint256 productId,
        address actor,
        address previousOwner,
        address newOwner,
        Status status,
        string memory action,
        bytes32 operationId
    ) private {
        productHistories[productId].push(ProductHistory({
            timestamp: block.timestamp,
            actor: actor,
            previousOwner: previousOwner,
            newOwner: newOwner,
            status: status,
            action: action,
            operationId: operationId
        }));
    }

    function _isAuthorizedSupplyActor(address actor) private view returns (bool) {
        return hasRole(MANUFACTURER_ROLE, actor)
            || hasRole(DISTRIBUTOR_ROLE, actor)
            || hasRole(PHARMACY_ROLE, actor);
    }
}
