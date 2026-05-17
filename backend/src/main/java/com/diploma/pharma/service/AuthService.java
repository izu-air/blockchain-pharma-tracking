package com.diploma.pharma.service;

import com.diploma.pharma.dto.AuthNonceResponse;
import com.diploma.pharma.dto.AuthRequest;
import com.diploma.pharma.dto.AuthResponse;
import com.diploma.pharma.entity.User;
import com.diploma.pharma.exception.ResourceNotFoundException;
import com.diploma.pharma.repository.UserRepository;
import java.time.Duration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SIWE-like authentication.
 *
 * <p>There is intentionally no method that issues a JWT from a wallet address
 * alone.  Two steps required:</p>
 * <ol>
 *   <li>{@link #requestNonce(String)} — issue a unique challenge</li>
 *   <li>{@link #login(AuthRequest)} — verify the signature, mark the challenge
 *       consumed, issue a JWT</li>
 * </ol>
 */
@Service
public class AuthService {
    private static final Duration ACCESS_TOKEN_TTL = Duration.ofHours(24);

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;
    private final AuthNonceService nonceService;
    private final WalletSignatureVerifier signatureVerifier;

    public AuthService(
            UserRepository userRepository,
            JwtService jwtService,
            AuditLogService auditLogService,
            AuthNonceService nonceService,
            WalletSignatureVerifier signatureVerifier
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.auditLogService = auditLogService;
        this.nonceService = nonceService;
        this.signatureVerifier = signatureVerifier;
    }

    /** Issues a fresh challenge for the wallet to sign. */
    @Transactional
    public AuthNonceResponse requestNonce(String walletAddress) {
        if (walletAddress == null || !walletAddress.matches("^0x[a-fA-F0-9]{40}$")) {
            throw new IllegalArgumentException("Адрес кошелька должен начинаться с 0x и содержать 40 hex-символов.");
        }
        AuthNonceService.IssuedNonce issued = nonceService.issue(walletAddress);
        return new AuthNonceResponse(walletAddress.toLowerCase(), issued.message(), issued.expiresAt());
    }

    /**
     * Verifies the wallet signature against the previously issued message,
     * marks the nonce consumed, and returns a JWT.  All failures are surfaced
     * as {@link AccessDeniedException} so the {@code GlobalExceptionHandler}
     * maps them to {@code HTTP 403} without leaking which step failed
     * (signature vs. wallet-not-registered).
     */
    @Transactional
    public AuthResponse login(AuthRequest request) {
        // 1. Verify the wallet signed exactly this message
        if (!signatureVerifier.verify(request.message(), request.signature(), request.walletAddress())) {
            auditLogService.record(request.walletAddress(), "LOGIN_FAILED", "USER", "-", "invalid signature");
            throw new AccessDeniedException("Подпись MetaMask не соответствует адресу кошелька.");
        }

        // 2. Consume the challenge — fails if used / expired / wrong wallet
        try {
            nonceService.consume(request.message(), request.walletAddress());
        } catch (RuntimeException exception) {
            auditLogService.record(request.walletAddress(), "LOGIN_FAILED", "USER", "-",
                    "nonce rejected: " + exception.getMessage());
            throw new AccessDeniedException(exception.getMessage());
        }

        // 3. Wallet must be a registered user
        User user = userRepository.findByWalletAddressIgnoreCase(request.walletAddress())
                .orElseThrow(() -> {
                    auditLogService.record(request.walletAddress(), "LOGIN_FAILED", "USER", "-",
                            "wallet not registered");
                    return new ResourceNotFoundException("Кошелёк не зарегистрирован. Создайте пользователя через /api/users.");
                });

        // 4. Issue JWT
        String token = jwtService.createToken(user.getWalletAddress(), user.getRole(), ACCESS_TOKEN_TTL);
        auditLogService.record(user.getWalletAddress(), "LOGIN", "USER", user.getId().toString(),
                "JWT issued (signature verified)");
        return new AuthResponse(token, user.getWalletAddress(), user.getRole());
    }
}
