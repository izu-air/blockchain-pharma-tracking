package com.diploma.pharma.service;

import com.diploma.pharma.exception.ResourceNotFoundException;
import com.diploma.pharma.repository.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@ActiveProfiles("test")
@Import(RefreshTokenService.class)
@TestPropertySource(properties = "app.jwt.refresh-ttl-days=7")
class RefreshTokenServiceTest {

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Test
    void issuesTokenWithDeterministicWalletLowercase() {
        String raw = refreshTokenService.issue("0xAbCdEf0123456789abcdef0123456789abcdef01");

        assertThat(raw).isNotBlank();
        assertThat(refreshTokenRepository.count()).isEqualTo(1L);
        assertThat(refreshTokenRepository.findAll().get(0).getWalletAddress())
                .isEqualTo("0xabcdef0123456789abcdef0123456789abcdef01");
    }

    @Test
    void rotateInvalidatesOldTokenAndIssuesNewOne() {
        String raw = refreshTokenService.issue("0x0000000000000000000000000000000000000001");

        var rotation = refreshTokenService.rotate(raw);

        assertThat(rotation.rawToken()).isNotEqualTo(raw);
        assertThat(rotation.walletAddress()).isEqualTo("0x0000000000000000000000000000000000000001");
        // Old token is revoked, new token is active
        assertThat(refreshTokenRepository.count()).isEqualTo(2L);
        long active = refreshTokenRepository.findAll().stream().filter(t -> !t.isRevoked()).count();
        assertThat(active).isEqualTo(1L);
    }

    @Test
    void rotatingTheSameTokenTwiceRevokesEntireFamily() {
        String raw = refreshTokenService.issue("0x0000000000000000000000000000000000000002");
        refreshTokenService.rotate(raw); // first use OK

        assertThatThrownBy(() -> refreshTokenService.rotate(raw))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("already used");

        // Reuse should revoke every token of this wallet
        long active = refreshTokenRepository.findAllByWalletAddressAndRevokedFalse(
                "0x0000000000000000000000000000000000000002").size();
        assertThat(active).isZero();
    }

    @Test
    void unknownTokenIsRejected() {
        assertThatThrownBy(() -> refreshTokenService.rotate("totally-fake-token"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
