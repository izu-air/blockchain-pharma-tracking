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

    struct Product {
        uint256 id;
        uint256 batchId;
        string name;
        address manufacturer;
        address currentOwner;
        uint256 createdAt;
        Status status;
        bool blocked;
        bool exists;
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
    event ProductCreated(uint256 indexed productId, uint256 indexed batchId, string name, address indexed manufacturer);
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
        require(metadataHash != bytes32(0), "Metadata hash is required");

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

    function createProduct(uint256 batchId, string calldata name)
        external
        onlyRole(MANUFACTURER_ROLE)
        batchExists(batchId)
        returns (uint256)
    {
        require(bytes(name).length > 0, "Product name is required");
        require(batches[batchId].manufacturer == msg.sender, "Only batch manufacturer can add products");
        require(!batches[batchId].recalled, "Batch is recalled");

        uint256 productId = nextProductId;
        nextProductId++;

        products[productId] = Product({
            id: productId,
            batchId: batchId,
            name: name,
            manufacturer: msg.sender,
            currentOwner: msg.sender,
            createdAt: block.timestamp,
            status: Status.Manufactured,
            blocked: false,
            exists: true
        });
        batchProducts[batchId].push(productId);

        _appendHistory(productId, msg.sender, address(0), msg.sender, Status.Manufactured, "Product created", bytes32(0));

        emit ProductCreated(productId, batchId, name, msg.sender);
        return productId;
    }

    function transferProduct(uint256 productId, address newOwner, bytes32 operationId)
        external
        productExists(productId)
        onlyCurrentOwner(productId)
        notBlocked(productId)
        uniqueOperation(operationId)
    {
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
        require(products[productId].status != Status.Sold, "Sold product status is final");

        if (newStatus == Status.Sold) {
            require(hasRole(PHARMACY_ROLE, msg.sender), "Only pharmacy can mark sold");
            require(products[productId].status == Status.Delivered, "Product must be delivered before sold");
        } else {
            require(_isAuthorizedSupplyActor(msg.sender), "Actor is not authorized");
        }

        products[productId].status = newStatus;

        _appendHistory(productId, msg.sender, msg.sender, msg.sender, newStatus, "Status updated", operationId);
        emit ProductStatusUpdated(productId, newStatus, msg.sender, operationId);
    }

    function recallBatch(uint256 batchId, string calldata reason, bytes32 operationId)
        external
        onlyRole(REGULATOR_ROLE)
        batchExists(batchId)
        uniqueOperation(operationId)
    {
        require(!batches[batchId].recalled, "Batch already recalled");
        require(bytes(reason).length > 0, "Recall reason is required");

        batches[batchId].recalled = true;

        uint256[] memory ids = batchProducts[batchId];
        for (uint256 i = 0; i < ids.length; i++) {
            Product storage product = products[ids[i]];
            if (product.exists && product.status != Status.Sold) {
                product.blocked = true;
                product.status = Status.Recalled;
                _appendHistory(ids[i], msg.sender, product.currentOwner, product.currentOwner, Status.Recalled, reason, operationId);
                emit ProductStatusUpdated(ids[i], Status.Recalled, msg.sender, operationId);
            }
        }

        emit BatchRecalled(batchId, msg.sender, reason);
    }

    function getProduct(uint256 productId)
        external
        view
        productExists(productId)
        returns (Product memory)
    {
        return products[productId];
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
        bool expired = block.timestamp > batch.expirationDate;

        return VerificationResult({
            authentic: product.exists && batch.exists,
            recalled: batch.recalled || product.status == Status.Recalled,
            expired: expired,
            blocked: product.blocked,
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
