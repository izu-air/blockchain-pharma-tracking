package com.diploma.pharma.service;

import com.diploma.pharma.entity.UserRole;
import java.time.Duration;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {
    @Test
    void createsVerifiableToken() {
        JwtService jwtService = new JwtService("unit-test-secret-with-at-least-32-chars-of-entropy");

        String token = jwtService.createToken("0x0000000000000000000000000000000000000001", UserRole.MANUFACTURER);

        assertThat(token).contains(".");
        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.isValid(token + "tampered")).isFalse();
        assertThat(jwtService.parseValidToken(token)).isPresent();
    }

    @Test
    void rejectsExpiredToken() {
        JwtService jwtService = new JwtService("unit-test-secret-with-at-least-32-chars-of-entropy");
        String token = jwtService.createToken(
                "0x0000000000000000000000000000000000000001",
                UserRole.MANUFACTURER,
                Duration.ofSeconds(-10)
        );
        assertThat(jwtService.parseValidToken(token)).isEmpty();
    }
}
