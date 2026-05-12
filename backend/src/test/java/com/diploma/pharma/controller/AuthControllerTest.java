package com.diploma.pharma.controller;

import com.diploma.pharma.entity.User;
import com.diploma.pharma.entity.UserRole;
import com.diploma.pharma.repository.UserRepository;
import com.diploma.pharma.support.DebugNdjsonLogger;
import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private DataSource dataSource;

    @Test
    void returnsJwtForRegisteredWallet() throws Exception {
        String datasourceMeta = "unavailable";
        try (var connection = dataSource.getConnection()) {
            var md = connection.getMetaData();
            datasourceMeta = "{\"url\":\"" + md.getURL() + "\",\"db\":\"" + md.getDatabaseProductName() + "\"}";
        } catch (Exception exception) {
            datasourceMeta = "{\"error\":\"" + exception.getClass().getSimpleName() + ":" + exception.getMessage() + "\"}";
        }
        // #region agent log
        DebugNdjsonLogger.log(
                "run-auth",
                "H1",
                "AuthControllerTest:returnsJwtForRegisteredWallet:pre-save",
                "Pre-save JDBC and Hibernate dialect snapshot",
                "{\"hibernateDialect\":\"" + entityManagerFactory.getProperties().get("hibernate.dialect") + "\",\"datasource\":" + datasourceMeta + "}"
        );
        // #endregion

        User user = new User();
        user.setName("Manufacturer");
        user.setRole(UserRole.MANUFACTURER);
        user.setWalletAddress("0x0000000000000000000000000000000000000001");
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"walletAddress\":\"0x0000000000000000000000000000000000000001\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("MANUFACTURER"));
    }
}
