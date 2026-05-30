package com.diploma.pharma.controller;

import com.diploma.pharma.dto.UserRequest;
import com.diploma.pharma.dto.UserResponse;
import com.diploma.pharma.dto.UserRoleUpdate;
import com.diploma.pharma.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "${FRONTEND_ORIGIN:http://localhost:5173}")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public UserResponse create(@Valid @RequestBody UserRequest request) {
        return userService.create(request);
    }

    /**
     * Listing all users exposes PII (wallet addresses) and the role topology
     * of the network — restricted to administrators.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    /**
     * Public so that the login flow can resolve a wallet → user role without
     * an existing JWT, and so MetaMask-only consumers can discover whether a
     * given wallet is registered.  Only returns the same data POST /api/users
     * accepted from the caller — no extra PII is leaked.
     */
    @GetMapping("/wallet/{walletAddress}")
    public UserResponse findByWallet(
            @PathVariable
            @Pattern(regexp = "^0x[a-fA-F0-9]{40}$") String walletAddress
    ) {
        return userService.findByWallet(walletAddress);
    }

    /** Смена роли пользователя (admin-only). */
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UserRoleUpdate update
    ) {
        return userService.updateRole(id, update.role(), update.reason());
    }

    /** Удаление пользователя (admin-only). */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
