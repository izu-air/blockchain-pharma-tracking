package com.diploma.pharma.repository;

import com.diploma.pharma.entity.AuthNonce;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuthNonceRepository extends JpaRepository<AuthNonce, Long> {

    /** Look up a challenge by its hash for verification.  Returns even used/expired rows. */
    Optional<AuthNonce> findByNonceHash(String nonceHash);

    /**
     * Daily cleanup: remove every nonce that is either expired or already used
     * older than the {@code cutoff} (used nonces are kept briefly for audit).
     */
    @Modifying
    @Query("delete from AuthNonce n "
         + "where n.expiresAt < :cutoff or (n.used = true and n.usedAt < :cutoff)")
    int purgeStale(@Param("cutoff") Instant cutoff);
}
