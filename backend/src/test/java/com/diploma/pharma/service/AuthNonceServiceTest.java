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

    /**
     * Verifies the atomic-claim primitive at the repository layer.  Two
     * concurrent {@code /api/auth/login} requests both reach
     * {@code consume()} and both call {@code markUsedIfActive(hash, now)};
     * the DB engine guarantees exactly one of those returns 1 (the writer
     * that wins the row-level lock) and the other returns 0 (no row matched
     * the {@code used = false} predicate any more).  Service-layer then
     * translates the zero-rows-affected into an explicit "already used"
     * error.
     *
     * <p>We assert the primitive sequentially rather than with a real
     * thread pool because {@code @DataJpaTest} wraps the test in a
     * not-yet-committed transaction — parallel threads would see no rows
     * at all.  The DB UPDATE semantics are deterministic, so the
     * sequential proof is sufficient.</p>
     */
    @Autowired
    private com.diploma.pharma.repository.AuthNonceRepository nonceRepository;

    @Test
    void atomicMarkUsedAllowsExactlyOneWinner() {
        var issued = service.issue(WALLET);
        String hash = hashOfMessage(issued.message());
        java.time.Instant now = java.time.Instant.now();

        int first = nonceRepository.markUsedIfActive(hash, now);
        int second = nonceRepository.markUsedIfActive(hash, now);
        int third = nonceRepository.markUsedIfActive(hash, now);

        assertThat(first).isEqualTo(1);
        assertThat(second).isEqualTo(0);
        assertThat(third).isEqualTo(0);
    }

    private static String hashOfMessage(String message) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(message.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
