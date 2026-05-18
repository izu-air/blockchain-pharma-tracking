package com.diploma.pharma.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Off-chain mirror of a single on-chain event log emitted by SupplyChain.sol.
 *
 * <p>For batch-level events ({@code BATCH_CREATED}, {@code BATCH_RECALLED},
 * {@code BATCH_UNRECALLED}) the {@code blockchainProductId} field is 0
 * (sentinel) and the {@code blockchainBatchId} carries the real on-chain ID.
 * For product-level events ({@code PRODUCT_CREATED} / {@code _TRANSFERRED} /
 * {@code STATUS_UPDATED} / {@code PRODUCT_BLOCKED} / {@code _UNBLOCKED}) it
 * is the other way around.</p>
 *
 * <p>{@code blockNumber} + {@code logIndex} together identify the exact log
 * within the chain history, enabling reorg detection and idempotent backfill.</p>
 */
@Entity
@Table(name = "product_events")
public class ProductEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 0 for batch-level events; otherwise the on-chain product id. */
    @Column(nullable = false, name = "blockchain_product_id")
    private Long blockchainProductId;

    /** Nullable; populated for batch-level events. */
    @Column(name = "blockchain_batch_id")
    private Long blockchainBatchId;

    @Column(nullable = false, length = 40, name = "event_type")
    private String eventType;

    @Column(nullable = false, length = 66, name = "transaction_hash")
    private String transactionHash;

    /** Null for events created from the frontend best-effort path. */
    @Column(name = "block_number")
    private Long blockNumber;

    /** Null for events not sourced from chain logs. */
    @Column(name = "log_index")
    private Long logIndex;

    @Column(nullable = false, name = "created_at")
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getBlockchainProductId() { return blockchainProductId; }
    public void setBlockchainProductId(Long blockchainProductId) { this.blockchainProductId = blockchainProductId; }
    public Long getBlockchainBatchId() { return blockchainBatchId; }
    public void setBlockchainBatchId(Long blockchainBatchId) { this.blockchainBatchId = blockchainBatchId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getTransactionHash() { return transactionHash; }
    public void setTransactionHash(String transactionHash) { this.transactionHash = transactionHash; }
    public Long getBlockNumber() { return blockNumber; }
    public void setBlockNumber(Long blockNumber) { this.blockNumber = blockNumber; }
    public Long getLogIndex() { return logIndex; }
    public void setLogIndex(Long logIndex) { this.logIndex = logIndex; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
