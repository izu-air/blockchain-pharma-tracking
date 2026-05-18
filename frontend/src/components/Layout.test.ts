import { describe, expect, it } from "vitest";
import { filterNavLinks, NAV } from "./Layout";

/**
 * filterNavLinks is the pure function that hides nav items the current
 * user cannot use.  Run it against representative user profiles to make
 * sure the nav drawer doesn't leak privileged routes.
 */
describe("filterNavLinks", () => {
  function paths(items: typeof NAV) {
    return items.map((i) => i.to).sort();
  }

  it("guest (no wallet, no JWT) sees only public links", () => {
    const visible = filterNavLinks(NAV, null, [], false);
    expect(paths(visible)).toEqual(["/", "/login", "/verify"].sort());
  });

  it("connected wallet with MANUFACTURER role sees register/transfer/history/analytics", () => {
    const visible = filterNavLinks(NAV, null, ["MANUFACTURER"], true);
    expect(visible.some((i) => i.to === "/register")).toBe(true);
    expect(visible.some((i) => i.to === "/transfer")).toBe(true);
    expect(visible.some((i) => i.to === "/history")).toBe(true);
    expect(visible.some((i) => i.to === "/analytics")).toBe(true);
    // and never the regulator-only Recall page
    expect(visible.some((i) => i.to === "/recall")).toBe(false);
    expect(visible.some((i) => i.to === "/pharmacy")).toBe(false);
  });

  it("connected wallet with REGULATOR role sees Recall, not Register", () => {
    const visible = filterNavLinks(NAV, null, ["REGULATOR"], true);
    expect(visible.some((i) => i.to === "/recall")).toBe(true);
    expect(visible.some((i) => i.to === "/register")).toBe(false);
  });

  it("authenticated CONSUMER (backend role) does NOT see any privileged section", () => {
    const visible = filterNavLinks(NAV, "CONSUMER", [], false);
    expect(paths(visible)).toEqual(["/", "/login", "/verify"].sort());
  });

  it("authenticated ADMIN sees every link", () => {
    const visible = filterNavLinks(NAV, "ADMIN", [], false);
    // ADMIN is in the role list of every privileged route; should see ≥ all
    // public + all privileged
    expect(visible.length).toBeGreaterThanOrEqual(NAV.length);
  });

  it("backend role takes precedence even when wallet is disconnected", () => {
    const visible = filterNavLinks(NAV, "PHARMACY", [], /*hasWallet*/ false);
    expect(visible.some((i) => i.to === "/pharmacy")).toBe(true);
  });

  it("wallet role only is honoured when wallet is connected", () => {
    const withWallet = filterNavLinks(NAV, null, ["PHARMACY"], true);
    const withoutWallet = filterNavLinks(NAV, null, ["PHARMACY"], false);
    expect(withWallet.some((i) => i.to === "/pharmacy")).toBe(true);
    expect(withoutWallet.some((i) => i.to === "/pharmacy")).toBe(false);
  });
});
