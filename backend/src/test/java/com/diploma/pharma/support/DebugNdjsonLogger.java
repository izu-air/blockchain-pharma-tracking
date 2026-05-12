package com.diploma.pharma.support;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;

public final class DebugNdjsonLogger {
    private static final Path LOG_PATH = Path.of("debug-58f7d2.log");

    private DebugNdjsonLogger() {
    }

    public static void log(String runId, String hypothesisId, String location, String message, String dataJsonObject) {
        String payload = "{"
                + "\"sessionId\":\"58f7d2\","
                + "\"runId\":\"" + escape(runId) + "\","
                + "\"hypothesisId\":\"" + escape(hypothesisId) + "\","
                + "\"location\":\"" + escape(location) + "\","
                + "\"message\":\"" + escape(message) + "\","
                + "\"data\":" + dataJsonObject + ","
                + "\"timestamp\":" + Instant.now().toEpochMilli()
                + "}";
        try {
            Files.writeString(
                    LOG_PATH,
                    payload + System.lineSeparator(),
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.APPEND
            );
        } catch (Exception ignored) {
            // Best-effort debug logging only.
        }
    }

    private static String escape(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
