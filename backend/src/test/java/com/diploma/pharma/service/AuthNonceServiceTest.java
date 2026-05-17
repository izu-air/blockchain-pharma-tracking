package com.diploma.pharma.service;

import com.diploma.pharma.entity.AuthNonce;
import com.diploma.pharma.exception.ResourceNotFoundException;
import com.diploma.pharma.repository.AuthNonceRepository;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@ActiveProfiles("test")
@Import(AuthNonceService.class)
class AuthNonceServiceTest {

    @Autowired private AuthNonceService service;
    @Autowired private AuthNonceRepository repository;

    private static final String WALLET = "0xAbCdEf0123456789abcdef0123456789abcdef01";

    @Test
    void issuesUniqueChallengeWithReadableMessage() {
        var first = service.issue(WALLET);
        var second = service.issue(WALLET);

        assertThat(first.message()).isNotEqualTo(second.message());
        assertThat(first.message()).contains(WALLET.toLowerCase());
        assertThat(first.message()).contains("PharmaChain Trace login");
        assertThat(first.expiresAt()).isAfter(Instant.now());
    }

    @Test
    void consumeMarksNonceUsedAndReturnsWallet() {
        var issued = service.issue(WALLET);

        String wallet = service.consume(issued.message(), WALLET);

        assertThat(wallet).isEqualTo(WALLET.toLowerCase());
        AuthNonce row = repository.findAll().get(0);
        assertThat(row.isUsed()).isTrue();
        assertThat(row.getUsedAt()).isNotNull();
    }

    @Test
    void rejectsReusedNonce() {
        var issued = service.issue(WALLET);
        service.consume(issued.message(), WALLET);

        assertThatThrownBy(() -> service.consume(issued.message(), WALLET))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("уже был использован");
    }

    @Test
    void rejectsUnknownMessage() {
        assertThatThrownBy(() -> service.consume("totally-bogus-message", WALLET))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void rejectsMessageIssuedForDifferentWallet() {
        var issued = service.issue(WALLET);
        String otherWallet = "0x0000000000000000000000000000000000000002";

        assertThatThrownBy(() -> service.consume(issued.message(), otherWallet))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("другого кошелька");
    }
}
