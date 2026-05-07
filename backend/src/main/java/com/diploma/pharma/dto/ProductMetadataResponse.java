package com.diploma.pharma.dto;

import java.time.Instant;
import java.time.LocalDate;

public record ProductMetadataResponse(
        Long id,
        Long blockchainProductId,
        String batchNumber,
        LocalDate expirationDate,
        String description,
        Instant createdAt
) {
}
