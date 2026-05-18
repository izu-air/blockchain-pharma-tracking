package com.diploma.pharma.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * For PRODUCT_* events {@code blockchainProductId} carries the on-chain ID
 * and {@code blockchainBatchId} is null.  For BATCH_* events
 * {@code blockchainProductId == 0} and {@code blockchainBatchId} is set.
 *
 * <p>{@code blockNumber} / {@code logIndex} are optional — populated by the
 * indexer for reorg-safe canonical events, omitted by the frontend
 * best-effort cache write.</p>
 */
public record ProductEventRequest(
        @NotNull @Min(0) Long blockchainProductId,
        Long blockchainBatchId,
        @NotBlank String eventType,
        @NotBlank
        @Pattern(regexp = "^0x[a-fA-F0-9]{64}$", message = "Transaction hash must be a 32 byte hex string")
        String transactionHash,
        Long blockNumber,
        Long logIndex
) {
}
