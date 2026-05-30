package com.diploma.pharma.service;

import com.diploma.pharma.entity.AuthNonce;
import com.diploma.pharma.exception.ResourceNotFoundException;
import com.diploma.pharma.repository.AuthNonceRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Issues and consumes one-time signing challenges for the SIWE-like login flow.
 *
 * <p>Workflow:</p>
 * <pre>
 *   issue(wallet)   -> returns IssuedNonce{ message, expiresAt }
 *                      stores SHA-256(nonce) + the verbatim message in DB
 *   consume(message)-> looks up by hash, verifies not used / not expired,
 *                      atomically marks used and returns the canonical wallet
 *   purgeStale()    -> daily cron
 * </pre>
 */
@Service
public class AuthNonceService {
    private static final Logger LOG = LoggerFactory.getLogger(AuthNonceService.class);

    /** Time window between /nonce and /login. Long enough for a slow user, short enough to limit replay. */
    public static final Duration NONCE_TTL = Duration.ofMinutes(5);
    /** Used nonces are kept this long after consumption for audit, then purged. */
    public static final Duration USED_RETENTION = Duration.ofDays(1);

    private static final int NONCE_BYTES = 32;       // 256 bits of entropy
    private static final String PURPOSE = "PharmaChain Trace login";

    private final AuthNonceRepository repository;
    private final SecureRandom random = new SecureRandom();

    public AuthNonceService(AuthNonceRepository repository) {
        this.repository = repository;
    }

    public record IssuedNonce(String message, Instant expiresAt) { }

    /**
     * Builds the message the wallet must sign and stores its hash for later
     * verification.  The message is human-readable so the user sees something
     * meaningful in the MetaMask sign popup.
     */
    @Transactional
    public IssuedNonce issue(String walletAddress) {
        String wallet = walletAddress.toLowerCase();
        String nonce = generateNonceBase64Url();
        Instant now = Instant.now();
        Instant expires = now.plus(NONCE_TTL);
        String message = renderMessage(wallet, nonce, now, expires);

        AuthNonce row = new AuthNonce();
        row.setWalletAddress(wallet);
        row.setNonceHash(sha256Base64Url(message));
        row.setMessage(message);
        row.setExpiresAt(expires);
        row.setUsed(false);
        repository.save(row);

        return new IssuedNonce(message, expires);
    }

    /**
     * Atomically marks the challenge as used and returns the canonical
     * (lower-case) wallet address.
     *
     * <p>Race-safe: relies on a single SQL
     * {@code UPDATE … WHERE used = false AND expires_at > now}.  Two
     * concurrent {@code /api/auth/login} requests that present the same
     * signed message both reach this method, but the DB engine guarantees
     * exactly one of them receives {@code affected = 1}; the loser is
     * rejected with {@link IllegalStateException}.  No pre-check / write
     * gap means there is no window for a replay.</p>
     *
     * <p>Wallet-mismatch is still validated separately so the error message
     * remains specific, but only after the atomic claim — a wallet-mismatch
     * attacker cannot "burn" the nonce for the legitimate user.</p>
     */
    @Transactional
    public String consume(String message, String expectedWallet) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Сообщение для подписи не передано.");
        }
        String hash = sha256Base64Url(message);
        Instant now = Instant.now();

        int affected = repository.markUsedIfActive(hash, now);
        if (affected != 1) {
            // Either the row never existed, was already used, or had expired.
            // Use the read-only lookup to differentiate for a precise error
            // message, but do NOT mutate state — the atomic update above is
            // the only writer.
            AuthNonce existing = repository.findByNonceHash(hash).orElse(null);
            if (existing == null) {
                throw new ResourceNotFoundException("Сообщение не найдено или уже использовано.");
            }
            if (existing.isUsed()) {
                throw new IllegalStateException("Этот challenge уже был использован.");
            }
            if (now.isAfter(existing.getExpiresAt())) {
                throw new IllegalStateException("Срок жизни challenge истёк, запросите новый.");
            }
            // Should be unreachable — fail closed.
            throw new IllegalStateException("Не удалось зафиксировать challenge как использованный.");
        }

        AuthNonce row = repository.findByNonceHash(hash)
                .orElseThrow(() -> new ResourceNotFoundException("Сообщение не найдено или уже использовано."));
        if (expectedWallet != null && !row.getWalletAddress().equalsIgnoreCase(expectedWallet)) {
            // Atomic claim already burned the nonce; reject the login but
            // do NOT undo — a fresh challenge is required either way.
            throw new IllegalStateException("Сообщение выпущено для другого кошелька.");
        }
        return row.getWalletAddress();
    }

    @Scheduled(cron = "${app.auth.nonce-cleanup-cron:0 15 3 * * *}")
    @Transactional
    public void purgeStale() {
        Instant cutoff = Instant.now().minus(USED_RETENTION);
        int removed = repository.purgeStale(cutoff);
        if (removed > 0) {
            LOG.info("Purged {} stale auth nonces (cutoff {})", removed, cutoff);
        }
    }

    private String generateNonceBase64Url() {
        byte[] bytes = new byte[NONCE_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String renderMessage(String wallet, String nonce, Instant issuedAt, Instant expiresAt) {
        DateTimeFormatter fmt = DateTimeFormatter.ISO_INSTANT;
        return PURPOSE + "\n"
             + "Wallet: " + wallet + "\n"
             + "Nonce: " + nonce + "\n"
             + "Issued At: " + fmt.format(issuedAt) + "\n"
             + "Expires At: " + fmt.format(expiresAt);
    }

    private static String sha256Base64Url(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot hash auth nonce", exception);
        }
    }
}
