package com.diploma.pharma.dto;

import java.time.Instant;

/**
 * Response of POST /api/auth/nonce.  Frontend signs {@code message} with the
 * connected wallet and posts that signature back to /api/auth/login together
 * with the unchanged message string.
 */
public record AuthNonceResponse(
        String walletAddress,
        String message,
        Instant expiresAt
) {
}
