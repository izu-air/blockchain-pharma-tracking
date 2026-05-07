package com.diploma.pharma.dto;

import com.diploma.pharma.entity.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record UserRequest(
        @NotBlank String name,
        @NotNull UserRole role,
        @NotBlank
        @Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "Wallet address must be an Ethereum address")
        String walletAddress
) {
}
