package com.diploma.pharma.service;

import com.diploma.pharma.dto.AuthRequest;
import com.diploma.pharma.dto.AuthResponse;
import com.diploma.pharma.entity.User;
import com.diploma.pharma.exception.ResourceNotFoundException;
import com.diploma.pharma.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;

    public AuthService(UserRepository userRepository, JwtService jwtService, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByWalletAddressIgnoreCase(request.walletAddress())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet is not registered"));
        String token = jwtService.createToken(user.getWalletAddress(), user.getRole());
        auditLogService.record(user.getWalletAddress(), "LOGIN", "USER", user.getId().toString(), "JWT token issued");
        return new AuthResponse(token, user.getWalletAddress(), user.getRole());
    }
}
