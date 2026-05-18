import { describe, expect, it } from "vitest";
import {
  isPositiveIntegerString,
  isValidSerial,
  nextValidStatuses,
  normalizeSerial,
  parsePositiveBlockchainId,
  validateEthereumAddress,
  validateStatusTransition
} from "./validation";

describe("isPositiveIntegerString", () => {
  it("accepts digits-only positive strings", () => {
    expect(isPositiveIntegerString("1")).toBe(true);
    expect(isPositiveIntegerString("17")).toBe(true);
    expect(isPositiveIntegerString("00001")).toBe(true);
  });
  it("rejects everything else", () => {
    expect(isPositiveIntegerString("0")).toBe(false);
    expect(isPositiveIntegerString("-1")).toBe(false);
    expect(isPositiveIntegerString("BATCH-2026-001")).toBe(false);
    expect(isPositiveIntegerString("")).toBe(false);
    expect(isPositiveIntegerString(" 1 ")).toBe(false);
    expect(isPositiveIntegerString(null as unknown)).toBe(false);
  });
});

describe("parsePositiveBlockchainId", () => {
  it("returns BigInt for valid input", () => {
    expect(parsePositiveBlockchainId("17", "Blockchain product ID")).toBe(17n);
  });
  it("throws targeted error for business-batch-number-like input", () => {
    expect(() => parsePositiveBlockchainId("BATCH-2026-001", "Blockchain batch ID"))
        .toThrow(/BATCH-2026-001/);
  });
  it("rejects zero and negatives", () => {
    expect(() => parsePositiveBlockchainId("0", "x")).toThrow();
    expect(() => parsePositiveBlockchainId("-3", "x")).toThrow();
  });
});

describe("validateEthereumAddress", () => {
  it("accepts 0x + 40 hex", () => {
    expect(validateEthereumAddress("0x" + "a".repeat(40))).toBe(true);
    expect(validateEthereumAddress("0X" + "F".repeat(40))).toBe(true);
  });
  it("rejects wrong length / wrong prefix / non-hex", () => {
    expect(validateEthereumAddress("0x" + "a".repeat(39))).toBe(false);
    expect(validateEthereumAddress("1x" + "a".repeat(40))).toBe(false);
    expect(validateEthereumAddress("0x" + "z".repeat(40))).toBe(false);
    expect(validateEthereumAddress(undefined as unknown)).toBe(false);
  });
});

describe("normalizeSerial + isValidSerial", () => {
  it("trims surrounding whitespace only", () => {
    expect(normalizeSerial("  SN-001  ")).toBe("SN-001");
  });
  it("accepts only the documented character class", () => {
    expect(isValidSerial("SN-DEMO-001")).toBe(true);
    expect(isValidSerial("RU.AS:001")).toBe(true);
    expect(isValidSerial("AB")).toBe(false);          // too short
    expect(isValidSerial("привет!")).toBe(false);     // cyrillic / punctuation
  });
});

describe("validateStatusTransition", () => {
  it("blocks no-op transitions", () => {
    const result = validateStatusTransition(2, 2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/уже установлен/);
  });
  it("blocks Sold → anything", () => {
    expect(validateStatusTransition(3, 1).ok).toBe(false);
  });
  it("blocks Recalled → anything via normal flow", () => {
    expect(validateStatusTransition(4, 1).ok).toBe(false);
  });
  it("blocks invalid jumps", () => {
    expect(validateStatusTransition(0, 2).ok).toBe(false);     // Manufactured → Delivered
    expect(validateStatusTransition(1, 3).ok).toBe(false);     // InTransit → Sold
  });
  it("allows the canonical chain", () => {
    expect(validateStatusTransition(0, 1).ok).toBe(true);
    expect(validateStatusTransition(1, 2).ok).toBe(true);
    expect(validateStatusTransition(2, 3).ok).toBe(true);
  });
});

describe("nextValidStatuses", () => {
  it("returns only allowed forward transitions", () => {
    expect(nextValidStatuses(0)).toEqual([1]);
    expect(nextValidStatuses(1)).toEqual([2]);
    expect(nextValidStatuses(2)).toEqual([3]);
    expect(nextValidStatuses(3)).toEqual([]);
    expect(nextValidStatuses(4)).toEqual([]);
  });
});
