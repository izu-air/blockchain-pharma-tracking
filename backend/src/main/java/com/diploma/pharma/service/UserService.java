package com.diploma.pharma.service;

import com.diploma.pharma.dto.UserRequest;
import com.diploma.pharma.dto.UserResponse;
import com.diploma.pharma.entity.User;
import com.diploma.pharma.exception.DuplicateResourceException;
import com.diploma.pharma.exception.ResourceNotFoundException;
import com.diploma.pharma.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserResponse create(UserRequest request) {
        userRepository.findByWalletAddressIgnoreCase(request.walletAddress()).ifPresent(user -> {
            throw new DuplicateResourceException("User with this wallet already exists");
        });

        User user = new User();
        user.setName(request.name());
        user.setRole(request.role());
        user.setWalletAddress(request.walletAddress());
        return toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse findByWallet(String walletAddress) {
        return userRepository.findByWalletAddressIgnoreCase(walletAddress)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getRole(),
                user.getWalletAddress(),
                user.getCreatedAt()
        );
    }
}
