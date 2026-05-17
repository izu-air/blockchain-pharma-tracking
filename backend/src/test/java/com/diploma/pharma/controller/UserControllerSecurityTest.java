package com.diploma.pharma.controller;

import com.diploma.pharma.entity.User;
import com.diploma.pharma.entity.UserRole;
import com.diploma.pharma.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.oneOf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerSecurityTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;

    private static final String WALLET = "0x1111111111111111111111111111111111111111";

    // ── GET /api/users (list everyone) ────────────────────────────────────
    /**
     * Anonymous request is rejected.  Either 401 (Spring Security entry-point)
     * or 403 (method-level @PreAuthorize) is acceptable per the spec — what
     * matters is that the call is denied without leaking data.
     */
    @Test
    @WithAnonymousUser
    void findAllRejectsAnonymous() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().is(oneOf(401, 403)));
    }

    @Test
    @WithMockUser(authorities = "ROLE_CONSUMER")
    void findAllRejectsConsumer() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_MANUFACTURER")
    void findAllRejectsManufacturer() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void findAllAllowsAdmin() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk());
    }

    // ── POST /api/users (self-registration) ───────────────────────────────
    @Test
    @WithAnonymousUser
    void anonymousCanSelfRegisterAsConsumer() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Alice", "CONSUMER", WALLET)))
                .andExpect(status().isOk());
    }

    @Test
    @WithAnonymousUser
    void anonymousCannotSelfRegisterAsManufacturer() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Pharma Corp", "MANUFACTURER",
                                "0x2222222222222222222222222222222222222222")))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithAnonymousUser
    void anonymousCannotSelfRegisterAsRegulator() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Fake Inspector", "REGULATOR",
                                "0x3333333333333333333333333333333333333333")))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithAnonymousUser
    void anonymousCannotSelfRegisterAsAdmin() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Sneaky", "ADMIN",
                                "0x4444444444444444444444444444444444444444")))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminCanCreatePrivilegedUser() throws Exception {
        User cleanup = userRepository.findByWalletAddressIgnoreCase(
                "0x5555555555555555555555555555555555555555").orElse(null);
        if (cleanup != null) userRepository.delete(cleanup);

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Pharma Corp", "MANUFACTURER",
                                "0x5555555555555555555555555555555555555555")))
                .andExpect(status().isOk());
    }

    private static String body(String name, String role, String wallet) {
        return "{\"name\":\"" + name + "\","
             + "\"role\":\"" + role + "\","
             + "\"walletAddress\":\"" + wallet + "\"}";
    }
}
