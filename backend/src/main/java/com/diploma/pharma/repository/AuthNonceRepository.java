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
     * Atomic one-shot consumption.  Marks the row used iff it is currently
     * active (not consumed AND not expired) — and reports how many rows were
     * affected.  Two concurrent {@code /api/auth/login} requests carrying the
     * same signed message can both reach the service layer, but the database
     * guarantees only one of them gets {@code affected = 1}; the other gets 0
     * and must reject the login.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update AuthNonce n "
         + "   set n.used = true, n.usedAt = :now "
         + " where n.nonceHash = :hash "
         + "   and n.used = false "
         + "   and n.expiresAt > :now")
    int markUsedIfActive(@Param("hash") String hash, @Param("now") Instant now);

    /**
     * Daily cleanup: remove every nonce that is either expired or already used
     * older than the {@code cutoff} (used nonces are kept briefly for audit).
     */
    @Modifying
    @Query("delete from AuthNonce n "
         + "where n.expiresAt < :cutoff or (n.used = true and n.usedAt < :cutoff)")
    int purgeStale(@Param("cutoff") Instant cutoff);
}
