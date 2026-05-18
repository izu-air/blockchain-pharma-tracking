package com.diploma.pharma.service;

import com.diploma.pharma.entity.User;
import com.diploma.pharma.entity.UserRole;
import com.diploma.pharma.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * On application start, ensures an {@code ADMIN} user exists for the wallet
 * configured via {@code APP_ADMIN_WALLET}.  Without this bootstrap a fresh
 * database would have no user that can create other privileged accounts,
 * effectively locking the system out of admin operations.
 *
 * <p>Behavior:</p>
 * <ul>
 *   <li>If {@code app.admin.wallet} is empty/missing → nothing happens
 *       (typical for local dev where developer registers themselves manually).</li>
 *   <li>If the wallet is already registered as ADMIN → nothing changes.</li>
 *   <li>If the wallet is registered with a different role → role is upgraded
 *       to ADMIN and a warning is logged (covers re-using a wallet that was
 *       previously registered through {@code POST /api/users} as CONSUMER).</li>
 *   <li>Otherwise a new ADMIN row is created.</li>
 * </ul>
 *
 * <p>The wallet's on-chain roles are independent of this — operational
 * blockchain authority still requires {@code grantRole} on the smart
 * contract.  This bootstrap only enables off-chain admin operations
 * (managing backend users / metadata / system config).</p>
 */
@Component
public class AdminBootstrapService {
    private static final Logger LOG = LoggerFactory.getLogger(AdminBootstrapService.class);

    private final UserRepository userRepository;
    private final String adminWallet;
    private final String adminName;

    public AdminBootstrapService(
            UserRepository userRepository,
            @Value("${app.admin.wallet:}") String adminWallet,
            @Value("${app.admin.name:System administrator}") String adminName
    ) {
        this.userRepository = userRepository;
        this.adminWallet = adminWallet == null ? "" : adminWallet.trim();
        this.adminName = adminName == null ? "System administrator" : adminName.trim();
    }

    @PostConstruct
    @Transactional
    public void ensureAdmin() {
        if (adminWallet.isBlank()) {
            LOG.debug("app.admin.wallet not configured — skipping ADMIN bootstrap");
            return;
        }
        if (!adminWallet.matches("^0x[a-fA-F0-9]{40}$")) {
            LOG.warn("app.admin.wallet is not a valid Ethereum address: '{}' — skipping bootstrap", adminWallet);
            return;
        }

        userRepository.findByWalletAddressIgnoreCase(adminWallet).ifPresentOrElse(
                existing -> {
                    if (existing.getRole() != UserRole.ADMIN) {
                        LOG.warn("Upgrading wallet {} from {} to ADMIN (per APP_ADMIN_WALLET)",
                                existing.getWalletAddress(), existing.getRole());
                        existing.setRole(UserRole.ADMIN);
                        userRepository.save(existing);
                    } else {
                        LOG.info("ADMIN user already exists for wallet {}", existing.getWalletAddress());
                    }
                },
                () -> {
                    User admin = new User();
                    admin.setName(adminName.isBlank() ? "System administrator" : adminName);
                    admin.setRole(UserRole.ADMIN);
                    admin.setWalletAddress(adminWallet.toLowerCase());
                    userRepository.save(admin);
                    LOG.info("Bootstrapped ADMIN user for wallet {}", admin.getWalletAddress());
                }
        );
    }
}
