package com.diploma.pharma.controller;

import com.diploma.pharma.dto.AuthNonceRequest;
import com.diploma.pharma.dto.AuthNonceResponse;
import com.diploma.pharma.dto.AuthRequest;
import com.diploma.pharma.dto.AuthResponse;
import com.diploma.pharma.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * Wallet-signature login (SIWE-like).
 *
 * <pre>
 *   POST /api/auth/nonce  { walletAddress }
 *     -> { walletAddress, message, expiresAt }
 *
 *   client signs `message` with MetaMask personal_sign
 *
 *   POST /api/auth/login  { walletAddress, message, signature }
 *     -> { token, walletAddress, role }
 * </pre>
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${FRONTEND_ORIGIN:http://localhost:5173}")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/nonce")
    public AuthNonceResponse nonce(@Valid @RequestBody AuthNonceRequest request) {
        return authService.requestNonce(request.walletAddress());
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        return authService.login(request);
    }
}
