import { describe, expect, it } from "vitest";
import { humanizeError, httpErrorMessage } from "./errors";

describe("humanizeError", () => {
  it("returns generic fallback for null/undefined", () => {
    expect(humanizeError(null)).toContain("Не удалось");
    expect(humanizeError(undefined)).toContain("Не удалось");
  });

  it("recognises MetaMask user rejection", () => {
    expect(humanizeError({ code: "ACTION_REJECTED" }))
        .toBe("Транзакция отклонена в кошельке.");
    expect(humanizeError({ code: "X", info: { code: 4001 } }))
        .toBe("Транзакция отклонена в кошельке.");
  });

  it("recognises network errors", () => {
    expect(humanizeError({ code: "NETWORK_ERROR" }))
        .toContain("блокчейн-нодой");
    expect(humanizeError({ code: "TIMEOUT" }))
        .toContain("блокчейн-нодой");
  });

  it("recognises insufficient funds", () => {
    expect(humanizeError({ code: "INSUFFICIENT_FUNDS" }))
        .toContain("недостаточно ETH");
    expect(humanizeError({ message: "insufficient funds for intrinsic transaction cost" }))
        .toContain("недостаточно ETH");
  });

  it("decodes AccessControl revert with manufacturer role", () => {
    // 0xe2517d3f + 32-byte account + 32-byte role
    const data = "0xe2517d3f"
      + "000000000000000000000000" + "8626f6940e2eb28930efb4cef49b2d1f2c9c1199"
      + "eefb95e842a3287179d933b4460be539a1d5af11aa8b325bb45c5c8dc92de4ed";
    expect(humanizeError({ data })).toContain("производителя");
  });

  it("falls back generic for AccessControl with unknown role", () => {
    const data = "0xe2517d3f"
      + "000000000000000000000000" + "8626f6940e2eb28930efb4cef49b2d1f2c9c1199"
      + "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    expect(humanizeError({ data })).toContain("нет роли");
  });

  it("translates revert string from reason field", () => {
    expect(humanizeError({ reason: "Operation id already used" }))
        .toContain("уже была выполнена");
    expect(humanizeError({ reason: "Serial number already exists" }))
        .toContain("уже зарегистрирован");
    expect(humanizeError({ reason: "Only pharmacy can mark sold" }))
        .toContain("аптека");
  });

  it("translates revert string buried in message", () => {
    expect(humanizeError({
      message: 'execution reverted: "Sold product cannot be transferred"'
    })).toContain("Проданный продукт");
  });

  it("returns plain ru message as-is when short", () => {
    expect(humanizeError({ message: "Backend недоступен." }))
        .toBe("Backend недоступен.");
  });

  it("hides long technical message", () => {
    const long = "execution reverted (unknown custom error) ".repeat(20);
    expect(humanizeError({ message: long }))
        .toBe("Не удалось выполнить операцию");
  });

  it("passes plain string through revert lookup", () => {
    expect(humanizeError("Batch already recalled"))
        .toContain("уже отозвана");
    expect(humanizeError("just text")).toBe("just text");
  });
});

describe("httpErrorMessage", () => {
  it("maps known codes", () => {
    expect(httpErrorMessage(401)).toContain("авторизация");
    expect(httpErrorMessage(404)).toContain("не найдена");
    expect(httpErrorMessage(409)).toContain("уже существует");
  });

  it("uses fallback for unknown code", () => {
    expect(httpErrorMessage(418, "Что-то странное")).toBe("Что-то странное");
    expect(httpErrorMessage(418)).toContain("418");
  });
});
