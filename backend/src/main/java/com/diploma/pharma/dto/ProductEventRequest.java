package com.diploma.pharma.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record ProductEventRequest(
        @NotNull @Positive Long blockchainProductId,
        @NotBlank String eventType,
        @NotBlank
        @Pattern(regexp = "^0x[a-fA-F0-9]{64}$", message = "Transaction hash must be a 32 byte hex string")
        String transactionHash
) {
}
