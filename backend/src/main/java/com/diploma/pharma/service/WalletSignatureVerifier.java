package com.diploma.pharma.service;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Component;
import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.utils.Numeric;

/**
 * Recovers the signer address of an Ethereum {@code personal_sign} signature
 * (the same scheme MetaMask uses for {@code signer.signMessage}) and compares
 * it to an expected address case-insensitively.
 *
 * <p>Implementation uses {@code org.web3j.crypto} which is already on the
 * classpath via {@code org.web3j:core} — no new dependency required.</p>
 *
 * <p>EIP-191 prefix: {@code "\x19Ethereum Signed Message:\n" + len + message}.</p>
 */
@Component
public class WalletSignatureVerifier {

    /**
     * @return {@code true} when {@code signature} is a valid personal_sign of
     *         {@code message} produced by the private key of {@code expectedAddress}.
     */
    public boolean verify(String message, String signatureHex, String expectedAddress) {
        if (message == null || signatureHex == null || expectedAddress == null) return false;
        try {
            String recovered = recoverAddress(message, signatureHex);
            return normalize(recovered).equals(normalize(expectedAddress));
        } catch (Exception exception) {
            return false;
        }
    }

    /**
     * Normalises an Ethereum address to lower-case 0x... form for comparison.
     * Accepts inputs with mixed-case 0x / 0X prefixes (MetaMask, EIP-55
     * checksum, raw lower-case).
     */
    private static String normalize(String address) {
        String trimmed = address.trim();
        if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
            trimmed = trimmed.substring(2);
        }
        return "0x" + trimmed.toLowerCase();
    }

    /**
     * @return the lower-case 0x-prefixed Ethereum address of the signer.
     * @throws IllegalArgumentException if the signature is not a 65-byte hex string.
     */
    public String recoverAddress(String message, String signatureHex) {
        byte[] signatureBytes = Numeric.hexStringToByteArray(signatureHex);
        if (signatureBytes.length != 65) {
            throw new IllegalArgumentException(
                    "Подпись должна быть 65 байт (r||s||v), получено: " + signatureBytes.length);
        }
        byte[] r = new byte[32];
        byte[] s = new byte[32];
        System.arraycopy(signatureBytes, 0, r, 0, 32);
        System.arraycopy(signatureBytes, 32, s, 0, 32);
        byte v = signatureBytes[64];
        if (v < 27) {
            // MetaMask sometimes returns v in {0,1}; normalize to {27,28}.
            v = (byte) (v + 27);
        }
        Sign.SignatureData sigData = new Sign.SignatureData(v, r, s);

        byte[] messageBytes = message.getBytes(StandardCharsets.UTF_8);
        BigInteger publicKey;
        try {
            publicKey = Sign.signedPrefixedMessageToKey(messageBytes, sigData);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Не удалось восстановить адрес из подписи.", exception);
        }
        return "0x" + Keys.getAddress(publicKey).toLowerCase();
    }
}
