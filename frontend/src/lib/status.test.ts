import { describe, expect, it } from "vitest";
import { formatAddress, statusLabels, toUnixDate } from "./status";

describe("status helpers", () => {
  it("maps recalled status", () => {
    expect(statusLabels[4]).toBe("Отозван");
  });

  it("formats wallet address", () => {
    expect(formatAddress("0x1234567890123456789012345678901234567890")).toBe("0x1234...7890");
  });

  it("converts date to unix seconds", () => {
    expect(toUnixDate("1970-01-02")).toBe(86400);
  });
});
