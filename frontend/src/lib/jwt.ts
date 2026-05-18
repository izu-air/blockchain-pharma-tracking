/**
 * Pure-function helpers for parsing a JWT payload on the client.
 *
 * The signature is NOT verified — that's the backend's job.  Frontend only
 * needs the {@code sub}, {@code role}, {@code exp} fields to render UI and
 * skip unnecessary requests when the token is obviously expired.
 */

import type { Role } from "./roles";

export interface ParsedJwt {
  walletAddress: string;
  role: Role | string;
  /** Unix-seconds expiration timestamp from the JWT payload. */
  exp: number;
}

function base64UrlDecode(value: string): string {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  if (typeof atob === "function") {
    return atob(padded);
  }
  // Node test environment fallback
  return Buffer.from(padded, "base64").toString("binary");
}

export function parseJwtPayload(token: string | null | undefined): ParsedJwt | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = base64UrlDecode(parts[1]);
    const decoded = JSON.parse(json) as { sub?: string; role?: string; exp?: number };
    if (!decoded.sub || !decoded.role || typeof decoded.exp !== "number") return null;
    return {
      walletAddress: decoded.sub.toLowerCase(),
      role: decoded.role,
      exp: decoded.exp
    };
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string | null | undefined, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const parsed = parseJwtPayload(token);
  if (!parsed) return true;
  return nowSeconds >= parsed.exp;
}
