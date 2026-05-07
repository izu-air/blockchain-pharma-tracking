package com.diploma.pharma.repository;

import com.diploma.pharma.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByWalletAddressIgnoreCase(String walletAddress);
}
