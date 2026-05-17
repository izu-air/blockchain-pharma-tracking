package com.diploma.pharma.service;

import com.diploma.pharma.dto.UserRequest;
import com.diploma.pharma.dto.UserResponse;
import com.diploma.pharma.entity.User;
import com.diploma.pharma.entity.UserRole;
import com.diploma.pharma.exception.DuplicateResourceException;
import com.diploma.pharma.exception.ResourceNotFoundException;
import com.diploma.pharma.repository.UserRepository;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    /**
     * Roles that an anonymous (no JWT) caller may self-assign at registration.
     * Privileged supply-chain and regulator roles MUST be created by an
     * authenticated ADMIN — otherwise anyone could mint themselves a
     * regulator account and start issuing recalls.
     */
    private static final Set<UserRole> SELF_REGISTRATION_ALLOWED =
            EnumSet.of(UserRole.CONSUMER);

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public UserService(UserRepository userRepository, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Creates a new user.  Caller authority is checked at the service layer:
     * <ul>
     *   <li>anonymous → only {@link #SELF_REGISTRATION_ALLOWED} roles permitted</li>
     *   <li>authenticated ADMIN → any role</li>
     *   <li>other authenticated callers → 403</li>
     * </ul>
     */
    @Transactional
    public UserResponse create(UserRequest request) {
        UserRole requestedRole = request.role();
        boolean callerIsAdmin = currentAuthorityIs("ROLE_ADMIN");

        if (!callerIsAdmin && !SELF_REGISTRATION_ALLOWED.contains(requestedRole)) {
            auditLogService.record(request.walletAddress(), "USER_CREATE_REJECTED", "USER", "-",
                    "self-assign of privileged role: " + requestedRole);
            throw new AccessDeniedException(
                    "Самостоятельная регистрация разрешена только с ролью " + SELF_REGISTRATION_ALLOWED
                            + ". Для роли " + requestedRole + " обратитесь к администратору.");
        }

        userRepository.findByWalletAddressIgnoreCase(request.walletAddress()).ifPresent(user -> {
            throw new DuplicateResourceException("User with this wallet already exists");
        });

        User user = new User();
        user.setName(request.name());
        user.setRole(requestedRole);
        user.setWalletAddress(request.walletAddress());
        UserResponse response = toResponse(userRepository.save(user));
        auditLogService.record(request.walletAddress(),
                callerIsAdmin ? "USER_CREATED_BY_ADMIN" : "USER_SELF_REGISTERED",
                "USER", response.id().toString(),
                "role=" + requestedRole);
        return response;
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

    private static boolean currentAuthorityIs(String authority) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        return auth.getAuthorities().stream().anyMatch(a -> authority.equals(a.getAuthority()));
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
