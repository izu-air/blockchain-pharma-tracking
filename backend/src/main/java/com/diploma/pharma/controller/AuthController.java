package com.diploma.pharma.controller;

import com.diploma.pharma.dto.AuthRequest;
import com.diploma.pharma.dto.AuthResponse;
import com.diploma.pharma.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${FRONTEND_ORIGIN:http://localhost:5173}")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        return authService.login(request);
    }
}
