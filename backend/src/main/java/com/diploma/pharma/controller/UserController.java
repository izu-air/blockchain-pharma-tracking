package com.diploma.pharma.controller;

import com.diploma.pharma.dto.UserRequest;
import com.diploma.pharma.dto.UserResponse;
import com.diploma.pharma.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.util.List;
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

    @GetMapping
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    @GetMapping("/wallet/{walletAddress}")
    public UserResponse findByWallet(
            @PathVariable
            @Pattern(regexp = "^0x[a-fA-F0-9]{40}$") String walletAddress
    ) {
        return userService.findByWallet(walletAddress);
    }
}
