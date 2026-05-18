import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode
} from "react";
import {
  clearStoredToken, getStoredToken, setStoredToken
} from "../lib/auth";
import { loginWithSignature, requestLoginNonce } from "../lib/api";
import { signLoginMessage } from "../lib/contract";
import { humanizeError } from "../lib/errors";
import { isJwtExpired, parseJwtPayload } from "../lib/jwt";
import type { Role } from "../lib/roles";

interface AuthState {
  /** Raw JWT or "" when not authenticated. */
  token: string;
  /** Wallet address embedded in the JWT (lower-case). */
  walletAddress: string;
  /** Backend role from the JWT.  Use this for off-chain authorization decisions. */
  backendRole: Role | null;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  loginStep: LoginStep;
  error: string;
  /** Full SIWE login flow for a wallet that is already MetaMask-connected. */
  loginWithWallet: (walletAddress: string) => Promise<void>;
  logout: () => void;
  /** Subscribe wallet account-change events here to keep JWT consistent. */
  onWalletAccountsChanged: (accounts: string[]) => void;
}

export type LoginStep =
  | "idle"
  | "requesting-nonce"
  | "awaiting-signature"
  | "verifying"
  | "done";

const AuthContext = createContext<AuthState | null>(null);

const ROLE_VALUES = new Set([
  "ADMIN", "MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "REGULATOR", "CONSUMER"
]);

function readStoredAuth(): { token: string; walletAddress: string; backendRole: Role | null } {
  const stored = getStoredToken();
  if (!stored || isJwtExpired(stored)) {
    if (stored) clearStoredToken();
    return { token: "", walletAddress: "", backendRole: null };
  }
  const parsed = parseJwtPayload(stored);
  if (!parsed) return { token: "", walletAddress: "", backendRole: null };
  const role: Role | null = ROLE_VALUES.has(parsed.role) ? (parsed.role as Role) : null;
  return { token: stored, walletAddress: parsed.walletAddress, backendRole: role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState(() => readStoredAuth());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>("idle");
  const [error, setError] = useState("");

  const logout = useCallback(() => {
    clearStoredToken();
    setAuth({ token: "", walletAddress: "", backendRole: null });
    setLoginStep("idle");
    setError("");
  }, []);

  /**
   * Hook for WalletContext: when MetaMask switches account away from the
   * one our JWT was issued for, the JWT becomes meaningless — drop it.
   * Exposed on the context value so a higher-level component can wire it
   * to WalletProvider without creating a circular import.
   */
  const onWalletAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      logout();
      return;
    }
    const next = accounts[0].toLowerCase();
    if (auth.walletAddress && next !== auth.walletAddress) {
      logout();
    }
  }, [auth.walletAddress, logout]);

  const loginWithWallet = useCallback(async (walletAddress: string) => {
    setIsLoggingIn(true);
    setError("");
    try {
      setLoginStep("requesting-nonce");
      const nonce = await requestLoginNonce(walletAddress);

      setLoginStep("awaiting-signature");
      const signature = await signLoginMessage(nonce.message);

      setLoginStep("verifying");
      const result = await loginWithSignature(walletAddress, nonce.message, signature);
      setStoredToken(result.token);

      const parsed = parseJwtPayload(result.token);
      setAuth({
        token: result.token,
        walletAddress: parsed?.walletAddress ?? walletAddress.toLowerCase(),
        backendRole: ROLE_VALUES.has(result.role) ? (result.role as Role) : null
      });
      setLoginStep("done");
    } catch (exception) {
      setLoginStep("idle");
      setError(humanizeError(exception, "Не удалось войти через MetaMask."));
      throw exception;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  // Periodic expiration check — if the JWT silently expires while the tab
  // is open, downgrade to unauthenticated state instead of letting the
  // user hit 401 on the next API call.
  useEffect(() => {
    if (!auth.token) return;
    const check = () => {
      if (isJwtExpired(auth.token)) logout();
    };
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, [auth.token, logout]);

  const value = useMemo<AuthState>(() => ({
    token: auth.token,
    walletAddress: auth.walletAddress,
    backendRole: auth.backendRole,
    isAuthenticated: Boolean(auth.token),
    isLoggingIn,
    loginStep,
    error,
    loginWithWallet,
    logout,
    onWalletAccountsChanged
  }), [auth, isLoggingIn, loginStep, error, loginWithWallet, logout, onWalletAccountsChanged]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
