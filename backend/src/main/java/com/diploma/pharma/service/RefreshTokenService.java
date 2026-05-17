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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Refresh-token store with one-time-use rotation and reuse detection.
 *
 * <p>Each successful refresh consumes the presented token (marks it revoked)
 * and issues a brand-new token linked via {@code parentId}.  Presenting a
 * token that is already revoked but exists in the table indicates that
 * either an attacker or a buggy client replayed it — in that case the entire
 * token family for the wallet is revoked as a defensive measure.</p>
 */
@Service
public class RefreshTokenService {
    private static final Logger LOG = LoggerFactory.getLogger(RefreshTokenService.class);

    private final RefreshTokenRepository repository;
    private final Duration refreshTtl;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(
            RefreshTokenRepository repository,
            @Value("${app.jwt.refresh-ttl-days:7}") long refreshTtlDays
    ) {
        if (refreshTtlDays <= 0 || refreshTtlDays > 30) {
            throw new IllegalStateException(
                    "app.jwt.refresh-ttl-days must be between 1 and 30 (was " + refreshTtlDays + ")");
        }
        this.repository = repository;
        this.refreshTtl = Duration.ofDays(refreshTtlDays);
    }

    /** Issue a fresh, root (no parent) token. */
    @Transactional
    public String issue(String walletAddress) {
        return persistNew(walletAddress.toLowerCase(), null);
    }

    /**
     * Validates the presented raw token, rotates it, and returns a new raw
     * token.  Throws {@link ResourceNotFoundException} for invalid or
     * already-consumed tokens (reuse triggers family-wide revocation).
     */
    @Transactional
    public Rotation rotate(String rawToken) {
        String hashed = hash(rawToken);
        RefreshToken stored = repository.findByTokenHash(hashed)
                .orElseThrow(() -> new ResourceNotFoundException("Refresh token is invalid"));

        if (stored.isRevoked()) {
            // Reuse of a consumed token: revoke the whole family for safety.
            int affected = repository.revokeAllForWallet(stored.getWalletAddress());
            LOG.warn("Refresh-token reuse detected for wallet {}; revoked {} tokens",
                    stored.getWalletAddress(), affected);
            throw new ResourceNotFoundException("Refresh token already used");
        }
        if (Instant.now().isAfter(stored.getExpiresAt())) {
            throw new ResourceNotFoundException("Refresh token expired");
        }
        // One-time use: revoke before issuing replacement.
        stored.setRevoked(true);
        repository.save(stored);
        String fresh = persistNew(stored.getWalletAddress(), stored.getId());
        return new Rotation(stored.getWalletAddress(), fresh);
    }

    /**
     * Read-only resolution used by the auth flow that does NOT rotate the
     * token (e.g., session check).  Prefer {@link #rotate(String)} for
     * production refresh flows.
     */
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

    @Transactional
    public int revokeAllForWallet(String walletAddress) {
        return repository.revokeAllForWallet(walletAddress.toLowerCase());
    }

    /** Daily job: drop tokens that are expired or revoked older than the TTL window. */
    @Scheduled(cron = "${app.jwt.refresh-cleanup-cron:0 0 3 * * *}")
    @Transactional
    public void purgeStale() {
        Instant cutoff = Instant.now().minus(refreshTtl);
        int removed = repository.purgeExpiredOrRevoked(cutoff);
        if (removed > 0) {
            LOG.info("Purged {} expired/revoked refresh tokens older than {}", removed, cutoff);
        }
    }

    private String persistNew(String walletAddress, Long parentId) {
        String raw = generateRawToken();
        RefreshToken token = new RefreshToken();
        token.setTokenHash(hash(raw));
        token.setWalletAddress(walletAddress);
        token.setExpiresAt(Instant.now().plus(refreshTtl));
        token.setRevoked(false);
        token.setParentId(parentId);
        repository.save(token);
        return raw;
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

    /** Result of {@link #rotate(String)} — wallet for which the new token is valid + the raw value. */
    public record Rotation(String walletAddress, String rawToken) { }
}
