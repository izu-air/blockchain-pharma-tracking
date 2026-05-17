package com.diploma.pharma.controller;

import com.diploma.pharma.entity.User;
import com.diploma.pharma.entity.UserRole;
import com.diploma.pharma.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.web3j.crypto.ECKeyPair;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.utils.Numeric;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;

    @Test
    void issuesJwtAfterSuccessfulSignatureFlow() throws Exception {
        ECKeyPair keys = Keys.createEcKeyPair();
        String wallet = "0x" + Keys.getAddress(keys.getPublicKey());

        User user = new User();
        user.setName("Manufacturer");
        user.setRole(UserRole.MANUFACTURER);
        user.setWalletAddress(wallet);
        userRepository.save(user);

        // Step 1: get challenge
        String message = requestNonce(wallet);

        // Step 2: sign locally as the wallet would in MetaMask
        String signature = signPersonalMessage(message, keys);

        // Step 3: login with signature
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(wallet, message, signature)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("MANUFACTURER"));
    }

    @Test
    void rejectsLoginWithoutSignature() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"walletAddress\":\"0x0000000000000000000000000000000000000001\"}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void rejectsForgedSignatureFromDifferentKey() throws Exception {
        ECKeyPair owner = Keys.createEcKeyPair();
        ECKeyPair attacker = Keys.createEcKeyPair();
        String wallet = "0x" + Keys.getAddress(owner.getPublicKey());

        User user = new User();
        user.setName("Owner");
        user.setRole(UserRole.MANUFACTURER);
        user.setWalletAddress(wallet);
        userRepository.save(user);

        String message = requestNonce(wallet);
        // attacker signs the same message with a different key
        String signature = signPersonalMessage(message, attacker);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(wallet, message, signature)))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsReusedNonce() throws Exception {
        ECKeyPair keys = Keys.createEcKeyPair();
        String wallet = "0x" + Keys.getAddress(keys.getPublicKey());

        User user = new User();
        user.setName("ReuserBob");
        user.setRole(UserRole.MANUFACTURER);
        user.setWalletAddress(wallet);
        userRepository.save(user);

        String message = requestNonce(wallet);
        String signature = signPersonalMessage(message, keys);

        // first use OK
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(wallet, message, signature)))
                .andExpect(status().isOk());

        // second use must fail
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(wallet, message, signature)))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsLoginForUnregisteredWallet() throws Exception {
        ECKeyPair keys = Keys.createEcKeyPair();
        String wallet = "0x" + Keys.getAddress(keys.getPublicKey());
        // intentionally NOT inserting user

        String message = requestNonce(wallet);
        String signature = signPersonalMessage(message, keys);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(wallet, message, signature)))
                .andExpect(status().isNotFound());
    }

    // ── helpers ────────────────────────────────────────────────────────────
    private String requestNonce(String wallet) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/nonce")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"walletAddress\":\"" + wallet + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = MAPPER.readTree(result.getResponse().getContentAsString());
        return body.get("message").asText();
    }

    private static String signPersonalMessage(String message, ECKeyPair keys) {
        Sign.SignatureData sig = Sign.signPrefixedMessage(
                message.getBytes(StandardCharsets.UTF_8), keys);
        byte[] r = sig.getR();
        byte[] s = sig.getS();
        byte v = sig.getV()[0];
        byte[] out = new byte[65];
        System.arraycopy(r, 0, out, 0, 32);
        System.arraycopy(s, 0, out, 32, 32);
        out[64] = v;
        return Numeric.toHexString(out);
    }

    private static String loginBody(String wallet, String message, String signature) {
        return "{"
                + "\"walletAddress\":\"" + wallet + "\","
                + "\"message\":" + MAPPER.valueToTree(message).toString() + ","
                + "\"signature\":\"" + signature + "\""
                + "}";
    }
}
