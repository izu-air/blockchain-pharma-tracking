import { describe, expect, it } from "vitest";
import { isJwtExpired, parseJwtPayload } from "./jwt";

/**
 * Builds an unsigned JWT-shaped string for tests.  Signature segment is
 * irrelevant — the frontend parser never verifies it.
 */
function makeToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.sig`;
}

describe("parseJwtPayload", () => {
  it("returns null for missing or malformed input", () => {
    expect(parseJwtPayload(null)).toBeNull();
    expect(parseJwtPayload("")).toBeNull();
    expect(parseJwtPayload("a.b")).toBeNull();
    expect(parseJwtPayload("not.a.token")).toBeNull();
  });

  it("returns sub/role/exp for a well-formed token", () => {
    const token = makeToken({
      sub: "0xABCDEF0123456789ABCDEF0123456789ABCDEF01",
      role: "MANUFACTURER",
      exp: 1_900_000_000
    });
    expect(parseJwtPayload(token)).toEqual({
      walletAddress: "0xabcdef0123456789abcdef0123456789abcdef01",
      role: "MANUFACTURER",
      exp: 1_900_000_000
    });
  });

  it("returns null when required claims are missing", () => {
    expect(parseJwtPayload(makeToken({ sub: "0x..." }))).toBeNull();
    expect(parseJwtPayload(makeToken({ role: "ADMIN", exp: 1 }))).toBeNull();
  });
});

describe("isJwtExpired", () => {
  it("returns true for missing token", () => {
    expect(isJwtExpired(null)).toBe(true);
  });

  it("returns false for token whose exp is in the future", () => {
    const token = makeToken({ sub: "0x" + "1".repeat(40), role: "ADMIN", exp: 9_000_000_000 });
    expect(isJwtExpired(token)).toBe(false);
  });

  it("returns true when exp is in the past", () => {
    const token = makeToken({ sub: "0x" + "1".repeat(40), role: "ADMIN", exp: 1 });
    expect(isJwtExpired(token, 100)).toBe(true);
  });
});
