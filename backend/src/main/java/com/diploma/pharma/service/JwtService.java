package com.diploma.pharma.service;

import com.diploma.pharma.entity.UserRole;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final String secret;

    public JwtService(@Value("${app.jwt.secret:change-this-demo-secret}") String secret) {
        this.secret = secret;
    }

    public String createToken(String walletAddress, UserRole role) {
        String header = base64("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
        long expiresAt = Instant.now().plusSeconds(24 * 60 * 60).getEpochSecond();
        String payload = base64(String.format(
                "{\"sub\":\"%s\",\"role\":\"%s\",\"exp\":%d}",
                walletAddress.toLowerCase(),
                role.name(),
                expiresAt
        ));
        return header + "." + payload + "." + sign(header + "." + payload);
    }

    public boolean isValid(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return false;
        }
        return sign(parts[0] + "." + parts[1]).equals(parts[2]);
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
