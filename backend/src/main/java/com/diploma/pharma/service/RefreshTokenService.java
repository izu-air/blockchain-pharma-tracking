package com.diploma.pharma.service;

import com.diploma.pharma.entity.RefreshToken;
import com.diploma.pharma.exception.ResourceNotFoundException;
import com.diploma.pharma.repository.RefreshTokenRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefreshTokenService {
    private final RefreshTokenRepository repository;
    private final Duration refreshTtl;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
            RefreshTokenRepository repository,
            @Value("${app.jwt.refresh-ttl-days:7}") long refreshTtlDays
    ) {
        this.repository = repository;
        this.refreshTtl = Duration.ofDays(refreshTtlDays);
    }

    @Transactional
    public String issue(String walletAddress) {
        String raw = generateRawToken();
        RefreshToken token = new RefreshToken();
        token.setTokenHash(hash(raw));
        token.setWalletAddress(walletAddress.toLowerCase());
        token.setExpiresAt(Instant.now().plus(refreshTtl));
        token.setRevoked(false);
        repository.save(token);
        return raw;
    }

    @Transactional(readOnly = true)
    public String resolveWallet(String rawToken) {
        RefreshToken token = repository.findByTokenHashAndRevokedFalse(hash(rawToken))
                .orElseThrow(() -> new ResourceNotFoundException("Refresh token is invalid"));
        if (Instant.now().isAfter(token.getExpiresAt())) {
            throw new ResourceNotFoundException("Refresh token expired");
        }
        return token.getWalletAddress();
    }

    @Transactional
    public void revoke(String rawToken) {
        repository.findByTokenHashAndRevokedFalse(hash(rawToken)).ifPresent(token -> {
            token.setRevoked(true);
            repository.save(token);
        });
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hashed);
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot hash refresh token", exception);
        }
    }
}
