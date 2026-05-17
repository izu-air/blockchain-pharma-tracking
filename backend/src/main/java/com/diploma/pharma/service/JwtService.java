package com.diploma.pharma.service;

import com.diploma.pharma.entity.UserRole;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private static final Logger LOG = LoggerFactory.getLogger(JwtService.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    /** Minimum secret length per OWASP recommendation for HS256. */
    private static final int MIN_SECRET_LENGTH = 32;

    private final String secret;

    public JwtService(@Value("${app.jwt.secret:}") String configuredSecret) {
        if (configuredSecret == null || configuredSecret.isBlank()) {
            // Local-dev convenience: generate a strong ephemeral secret so the
            // application boots without environment configuration.  Tokens
            // signed by this secret do NOT survive a restart, which is exactly
            // what we want — production deployments must set JWT_SECRET.
            byte[] random = new byte[48];
            new SecureRandom().nextBytes(random);
            this.secret = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
            LOG.warn("=========================================================================");
            LOG.warn(" app.jwt.secret is not configured.  Using an EPHEMERAL random secret.");
            LOG.warn(" All JWTs issued during this run will be invalidated when the JVM exits.");
            LOG.warn(" Set the JWT_SECRET environment variable (>= {} chars) for production.",
                    MIN_SECRET_LENGTH);
            LOG.warn("=========================================================================");
            return;
        }
        if (configuredSecret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                    "app.jwt.secret is too short: " + configuredSecret.length()
                            + " characters. HS256 requires at least " + MIN_SECRET_LENGTH + ".");
        }
        this.secret = configuredSecret;
    }

    public record ParsedJwt(String walletAddress, UserRole role) {
    }

    public String createToken(String walletAddress, UserRole role) {
        return createToken(walletAddress, role, Duration.ofHours(24));
    }

    public String createToken(String walletAddress, UserRole role, Duration validFor) {
        String header = base64("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
        long expiresAt = Instant.now().plus(validFor).getEpochSecond();
        String payload = base64(String.format(
                "{\"sub\":\"%s\",\"role\":\"%s\",\"exp\":%d}",
                walletAddress.toLowerCase(),
                role.name(),
                expiresAt
        ));
        return header + "." + payload + "." + sign(header + "." + payload);
    }

    /**
     * Verifies HMAC signature only (no expiry check). Prefer {@link #parseValidToken(String)} for authorization.
     * Uses constant-time comparison to prevent timing attacks.
     */
    public boolean isValid(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return false;
        }
        return constantTimeEquals(sign(parts[0] + "." + parts[1]), parts[2]);
    }

    public Optional<ParsedJwt> parseValidToken(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3 || !constantTimeEquals(sign(parts[0] + "." + parts[1]), parts[2])) {
            return Optional.empty();
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode node = OBJECT_MAPPER.readTree(new String(decoded, StandardCharsets.UTF_8));
            JsonNode expNode = node.get("exp");
            JsonNode subNode = node.get("sub");
            JsonNode roleNode = node.get("role");
            if (expNode == null || subNode == null || roleNode == null) {
                return Optional.empty();
            }
            long exp = expNode.asLong();
            if (Instant.now().getEpochSecond() >= exp) {
                return Optional.empty();
            }
            return Optional.of(new ParsedJwt(subNode.asText(), UserRole.valueOf(roleNode.asText())));
        } catch (Exception exception) {
            return Optional.empty();
        }
    }

    /** Constant-time string comparison to mitigate timing side-channel attacks on the signature. */
    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        byte[] ab = a.getBytes(StandardCharsets.UTF_8);
        byte[] bb = b.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(ab, bb);
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot sign JWT", exception);
        }
    }

    private String base64(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }
}
