package com.diploma.pharma.service;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.web3j.crypto.ECKeyPair;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.utils.Numeric;

import static org.assertj.core.api.Assertions.assertThat;

class WalletSignatureVerifierTest {
    private final WalletSignatureVerifier verifier = new WalletSignatureVerifier();

    @Test
    void verifiesValidPersonalSignSignature() throws Exception {
        ECKeyPair keys = Keys.createEcKeyPair();
        String wallet = "0x" + Keys.getAddress(keys.getPublicKey());
        String message = "PharmaChain Trace login\nNonce: abc";
        String signature = signPersonalMessage(message, keys);

        assertThat(verifier.verify(message, signature, wallet)).isTrue();
        // capitalisation must not matter
        assertThat(verifier.verify(message, signature, wallet.toUpperCase())).isTrue();
    }

    @Test
    void rejectsSignatureFromDifferentKey() throws Exception {
        ECKeyPair owner = Keys.createEcKeyPair();
        ECKeyPair attacker = Keys.createEcKeyPair();
        String wallet = "0x" + Keys.getAddress(owner.getPublicKey());
        String message = "PharmaChain Trace login\nNonce: abc";
        String signature = signPersonalMessage(message, attacker);

        assertThat(verifier.verify(message, signature, wallet)).isFalse();
    }

    @Test
    void rejectsTamperedMessage() throws Exception {
        ECKeyPair keys = Keys.createEcKeyPair();
        String wallet = "0x" + Keys.getAddress(keys.getPublicKey());
        String signed = "PharmaChain Trace login\nNonce: abc";
        String tampered = "PharmaChain Trace login\nNonce: zzz";
        String signature = signPersonalMessage(signed, keys);

        assertThat(verifier.verify(tampered, signature, wallet)).isFalse();
    }

    @Test
    void rejectsMalformedSignature() {
        assertThat(verifier.verify("any", "0xdeadbeef", "0x0000000000000000000000000000000000000001"))
                .isFalse();
        assertThat(verifier.verify("any", null, "0x0000000000000000000000000000000000000001"))
                .isFalse();
        assertThat(verifier.verify(null, "0x" + "11".repeat(65),
                "0x0000000000000000000000000000000000000001"))
                .isFalse();
    }

    @Test
    void normalisesVZeroOneVariants() throws Exception {
        // MetaMask sometimes returns v in {0,1}; verifier must auto-shift to {27,28}.
        ECKeyPair keys = Keys.createEcKeyPair();
        String wallet = "0x" + Keys.getAddress(keys.getPublicKey());
        String message = "alt-v test";
        Sign.SignatureData sig = Sign.signPrefixedMessage(
                message.getBytes(StandardCharsets.UTF_8), keys);

        byte[] out = new byte[65];
        System.arraycopy(sig.getR(), 0, out, 0, 32);
        System.arraycopy(sig.getS(), 0, out, 32, 32);
        // force v into {0,1} encoding
        byte normalised = (byte) (sig.getV()[0] - 27);
        out[64] = normalised;

        assertThat(verifier.verify(message, Numeric.toHexString(out), wallet)).isTrue();
    }

    private static String signPersonalMessage(String message, ECKeyPair keys) {
        Sign.SignatureData sig = Sign.signPrefixedMessage(
                message.getBytes(StandardCharsets.UTF_8), keys);
        byte[] out = new byte[65];
        System.arraycopy(sig.getR(), 0, out, 0, 32);
        System.arraycopy(sig.getS(), 0, out, 32, 32);
        out[64] = sig.getV()[0];
        return Numeric.toHexString(out);
    }
}
