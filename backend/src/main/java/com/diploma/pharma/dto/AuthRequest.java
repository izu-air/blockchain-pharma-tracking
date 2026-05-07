package com.diploma.pharma.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AuthRequest(
        @NotBlank
        @Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "Wallet address must be an Ethereum address")
        String walletAddress
) {
}
