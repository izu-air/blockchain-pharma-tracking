package com.diploma.pharma.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * POST /api/auth/login payload (SIWE-like).
 *
 * <p>Caller MUST first call {@code POST /api/auth/nonce} to obtain {@code message},
 * sign it with the wallet via {@code personal_sign}, and submit the resulting
 * {@code signature} alongside the unchanged message string here.</p>
 */
public record AuthRequest(
        @NotBlank
        @Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "Wallet address must be an Ethereum address")
        String walletAddress,

        @NotBlank(message = "Подпись сообщения обязательна (получите challenge через /api/auth/nonce)")
        String message,

        @NotBlank(message = "Подпись MetaMask обязательна")
        @Pattern(regexp = "^0x[a-fA-F0-9]{130}$",
                 message = "Signature must be a 65-byte hex value (0x + 130 hex chars)")
        String signature
) {
}
