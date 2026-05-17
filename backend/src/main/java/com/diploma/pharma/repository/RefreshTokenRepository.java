package com.diploma.pharma.repository;

import com.diploma.pharma.entity.RefreshToken;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHashAndRevokedFalse(String tokenHash);

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findAllByWalletAddressAndRevokedFalse(String walletAddress);

    @Modifying
    @Query("update RefreshToken t set t.revoked = true where t.walletAddress = :wallet and t.revoked = false")
    int revokeAllForWallet(@Param("wallet") String walletAddress);

    @Modifying
    @Query("delete from RefreshToken t where t.expiresAt < :cutoff or t.revoked = true")
    int purgeExpiredOrRevoked(@Param("cutoff") Instant cutoff);
}
