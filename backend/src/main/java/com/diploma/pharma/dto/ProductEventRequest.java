package com.diploma.pharma.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record ProductEventRequest(
        @NotNull @Min(0) Long blockchainProductId,
        @NotBlank String eventType,
        @NotBlank
        @Pattern(regexp = "^0x[a-fA-F0-9]{64}$", message = "Transaction hash must be a 32 byte hex string")
        String transactionHash
) {
}
