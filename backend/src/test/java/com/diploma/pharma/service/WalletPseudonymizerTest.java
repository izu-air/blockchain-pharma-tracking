package com.diploma.pharma.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class WalletPseudonymizerTest {

    private final WalletPseudonymizer pseudonymizer =
            new WalletPseudonymizer("unit-pepper-with-enough-bytes-to-test-mac");

    @Test
    void hashesWalletAddressesDeterministically() {
        String wallet = "0xAbCdEf0123456789abcdef0123456789abcdef01";
        String first = pseudonymizer.pseudonymize(wallet);
        String second = pseudonymizer.pseudonymize(wallet.toLowerCase());

        assertThat(first).startsWith("wallet:");
        assertThat(first).isNotEqualTo(wallet);
        assertThat(first).isEqualTo(second); // case-insensitive determinism
    }

    @Test
    void leavesNonWalletStringsUntouched() {
        assertThat(pseudonymizer.pseudonymize("frontend")).isEqualTo("frontend");
        assertThat(pseudonymizer.pseudonymize("LOGIN")).isEqualTo("LOGIN");
    }

    @Test
    void rejectsMalformedWalletButReturnsInput() {
        // 41 chars (missing one) — treated as a plain string, not wallet.
        String malformed = "0xAbCdEf0123456789abcdef0123456789abcdef0";
        assertThat(pseudonymizer.pseudonymize(malformed)).isEqualTo(malformed);
    }

    @Test
    void differentWalletsProduceDifferentPseudonyms() {
        String a = pseudonymizer.pseudonymize("0x0000000000000000000000000000000000000001");
        String b = pseudonymizer.pseudonymize("0x0000000000000000000000000000000000000002");
        assertThat(a).isNotEqualTo(b);
    }

    @Test
    void pepperChangesOutput() {
        WalletPseudonymizer other = new WalletPseudonymizer("totally-different-pepper-1234567890abcd");
        String w = "0xAbCdEf0123456789abcdef0123456789abcdef01";
        assertThat(pseudonymizer.pseudonymize(w)).isNotEqualTo(other.pseudonymize(w));
    }
}
