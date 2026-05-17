import { describe, expect, it } from "vitest";
import { extractSerialFromScan } from "./qr";

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
