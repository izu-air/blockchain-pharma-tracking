package com.diploma.pharma.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Converts raw Ethereum wallet addresses into deterministic pseudonyms used
 * inside audit logs, so a database dump cannot directly reveal participant
 * identities.  The same input always produces the same output (HMAC-SHA256
 * with a server-side pepper), which keeps audit traces correlatable but
 * detached from on-chain wallets unless the pepper is also compromised.
 *
 * <p>Format: {@code wallet:<24-char-base64url>} — collision-resistant within
 * the wallet population while remaining searchable.</p>
 */
@Component
public class WalletPseudonymizer {
    private final byte[] pepper;

    public WalletPseudonymizer(@Value("${app.audit.pepper:}") String pepper) {
        // If no pepper is configured we still pseudonymize, but with an
        // empty key (still better than plaintext).  Production deployments
        // should set AUDIT_PEPPER to a 32+ char random string.
        this.pepper = (pepper == null ? "" : pepper).getBytes(StandardCharsets.UTF_8);
    }

    /** Returns a deterministic pseudonym; pass-through for non-wallet inputs. */
    public String pseudonymize(String actor) {
        if (actor == null || actor.isBlank()) {
            return actor;
        }
        if (!looksLikeWallet(actor)) {
            return actor;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(pepper.length == 0 ? new byte[]{0} : pepper, "HmacSHA256"));
            byte[] digest = mac.doFinal(actor.toLowerCase().getBytes(StandardCharsets.UTF_8));
            // Truncate to 18 bytes → 24 base64url chars.  18 bytes = 144 bits,
            // well within collision-resistant range for any realistic user pool.
            byte[] truncated = new byte[18];
            System.arraycopy(digest, 0, truncated, 0, truncated.length);
            return "wallet:" + java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(truncated);
        } catch (Exception exception) {
            // Defensive fallback — should never happen because HmacSHA256 is mandatory.
            try {
                MessageDigest sha = MessageDigest.getInstance("SHA-256");
                byte[] digest = sha.digest(actor.toLowerCase().getBytes(StandardCharsets.UTF_8));
                return "wallet:" + java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(digest).substring(0, 24);
            } catch (Exception ignored) {
                return "wallet:unknown";
            }
        }
    }

    private static boolean looksLikeWallet(String value) {
        if (value.length() != 42) return false;
        if (!value.startsWith("0x") && !value.startsWith("0X")) return false;
        for (int i = 2; i < value.length(); i++) {
            char c = value.charAt(i);
            boolean hex = (c >= '0' && c <= '9')
                    || (c >= 'a' && c <= 'f')
                    || (c >= 'A' && c <= 'F');
            if (!hex) return false;
        }
        return true;
    }
}
