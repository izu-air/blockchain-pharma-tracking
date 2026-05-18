package com.diploma.pharma.dto;

import java.time.Instant;

public record ProductEventResponse(
        Long id,
        Long blockchainProductId,
        Long blockchainBatchId,
        String eventType,
        String transactionHash,
        Long blockNumber,
        Long logIndex,
        Instant createdAt
) {
}
