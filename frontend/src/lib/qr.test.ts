import { describe, expect, it } from "vitest";
import { buildVerifyUrl, extractSerialFromScan, isQrTimestampStale, parseScan } from "./qr";

describe("extractSerialFromScan", () => {
  it("extracts serial from /verify?serial=…", () => {
    expect(extractSerialFromScan("https://example.com/verify?serial=SN-DEMO-001"))
        .toBe("SN-DEMO-001");
  });

  it("decodes urlencoded serial", () => {
    expect(extractSerialFromScan("https://example.com/verify?serial=SN%2FDEMO%2D001"))
        .toBe("SN/DEMO-001");
  });

  it("falls back to /verify/<serial> path", () => {
    expect(extractSerialFromScan("https://example.com/verify/SN-001"))
        .toBe("SN-001");
  });

  it("accepts plain serial text", () => {
    expect(extractSerialFromScan("SN-ABC-123")).toBe("SN-ABC-123");
  });

  it("rejects gibberish", () => {
    expect(extractSerialFromScan("привет мир!")).toBeNull();
    expect(extractSerialFromScan("")).toBeNull();
    expect(extractSerialFromScan("  ")).toBeNull();
  });
});

describe("parseScan", () => {
  it("extracts nonce and timestamp when present", () => {
    const parsed = parseScan("https://app/verify?serial=SN-1&nonce=abc&ts=1700000000&v=1");
    expect(parsed).toEqual({
      serial: "SN-1", nonce: "abc", timestamp: 1700000000, version: 1
    });
  });

  it("works with legacy QRs without nonce/ts", () => {
    expect(parseScan("https://app/verify?serial=SN-2")).toEqual({ serial: "SN-2" });
  });
});

describe("buildVerifyUrl", () => {
  it("includes serial, nonce, ts and schema version", () => {
    const url = new URL(buildVerifyUrl("https://app", "SN-DEMO-001"));
    expect(url.pathname).toBe("/verify");
    expect(url.searchParams.get("serial")).toBe("SN-DEMO-001");
    expect(url.searchParams.get("nonce")).toMatch(/.+/);
    expect(url.searchParams.get("ts")).toMatch(/^\d+$/);
    expect(url.searchParams.get("v")).toBe("1");
  });

  it("urlencodes serials with special chars", () => {
    const url = new URL(buildVerifyUrl("https://app", "SN/DEMO 001"));
    expect(url.searchParams.get("serial")).toBe("SN/DEMO 001");
  });
});

describe("isQrTimestampStale", () => {
  it("returns false for fresh QR", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isQrTimestampStale({ serial: "X", timestamp: now }, 365)).toBe(false);
  });

  it("returns true for QR older than maxAgeDays", () => {
    const longAgo = Math.floor(Date.now() / 1000) - 365 * 86400 - 10;
    expect(isQrTimestampStale({ serial: "X", timestamp: longAgo }, 365)).toBe(true);
  });

  it("returns false when QR has no timestamp", () => {
    expect(isQrTimestampStale({ serial: "X" }, 365)).toBe(false);
  });
});
