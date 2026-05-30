package com.diploma.pharma.entity;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * One-time challenge issued for wallet-signature login.
 *
 * <p>The actual nonce string is never stored — only its SHA-256 hash, so a DB
 * leak doesn't expose still-active challenges.  Lifecycle:</p>
 * <ol>
 *   <li>row inserted by {@code AuthNonceService.issue}</li>
 *   <li>marked {@code used=true} when the signed login is verified</li>
 *   <li>scheduled job purges expired / used rows daily</li>
 * </ol>
 */
@Entity
@Table(name = "auth_nonces")
public class AuthNonce {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "wallet_address", nullable = false, length = 42)
    private String walletAddress;

    @Column(name = "nonce_hash", nullable = false, unique = true, length = 128)
    private String nonceHash;

    // V3 migration creates `message TEXT`.  Using @Lob makes Hibernate
    // pick the `oid` (large-object) SQL type on PostgreSQL, which mismatches
    // the actual column and breaks schema validation on startup.  A bare
    // String mapping with no length cap maps to TEXT and matches the column.
    @Column(name = "message", nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used", nullable = false)
    private boolean used;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getWalletAddress() { return walletAddress; }
    public void setWalletAddress(String walletAddress) { this.walletAddress = walletAddress; }
    public String getNonceHash() { return nonceHash; }
    public void setNonceHash(String nonceHash) { this.nonceHash = nonceHash; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
    public Instant getUsedAt() { return usedAt; }
    public void setUsedAt(Instant usedAt) { this.usedAt = usedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
