package com.diploma.pharma.service;

import com.diploma.pharma.entity.UserRole;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final String secret;

    public JwtService(@Value("${app.jwt.secret:change-this-demo-secret}") String secret) {
        this.secret = secret;
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
     */
    public boolean isValid(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return false;
        }
        return sign(parts[0] + "." + parts[1]).equals(parts[2]);
    }

    public Optional<ParsedJwt> parseValidToken(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3 || !sign(parts[0] + "." + parts[1]).equals(parts[2])) {
            return Optional.empty();
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode node = OBJECT_MAPPER.readTree(new String(decoded, StandardCharsets.UTF_8));
            long exp = node.get("exp").asLong();
            if (Instant.now().getEpochSecond() >= exp) {
                return Optional.empty();
            }
            String sub = node.get("sub").asText();
            UserRole role = UserRole.valueOf(node.get("role").asText());
            return Optional.of(new ParsedJwt(sub, role));
        } catch (Exception exception) {
            return Optional.empty();
        }
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
