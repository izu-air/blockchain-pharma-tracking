package com.diploma.pharma.dto;

import java.time.Instant;

public record ProductEventResponse(
        Long id,
        Long blockchainProductId,
        String eventType,
        String transactionHash,
        Instant createdAt
) {
}
