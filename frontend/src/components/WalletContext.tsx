import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { connectWallet, getProvider, getWalletRoles } from "../lib/contract";
import { normalizeRoles, type Role } from "../lib/roles";
import { clearStoredToken } from "../lib/auth";
import { humanizeError } from "../lib/errors";

interface WalletState {
  address: string;
  roles: Role[];
  /** Raw Russian labels from the contract (for backwards compat display). */
  roleLabels: string[];
  loading: boolean;
  error: string;
  connect: () => Promise<void>;
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState("");
  const [roleLabels, setRoleLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sync = useCallback(async (addr: string) => {
    setLoading(true);
    try {
      const labels = addr ? await getWalletRoles(addr) : [];
      setAddress(addr);
      setRoleLabels(labels);
      setError("");
    } catch (exception) {
      // Roles couldn't be fetched (contract not reachable, wrong chain) —
      // keep the address but degrade roles gracefully.
      setAddress(addr);
      setRoleLabels([]);
      setError(humanizeError(exception, "Не удалось получить роли с контракта."));
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setError("");
    try {
      const addr = await connectWallet();
      await sync(addr);
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось подключить кошелёк."));
    }
  }, [sync]);

  const refresh = useCallback(async () => {
    if (address) await sync(address);
  }, [address, sync]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const provider = await getProvider();
        const accounts = (await provider.send("eth_accounts", [])) as string[];
        if (accounts.length > 0 && active) {
          await sync(accounts[0]);
        }
      } catch {
        /* MetaMask not installed — silent */
      }
    })();

    const ethereum = window.ethereum;
    if (!ethereum) return () => { active = false; };

    const onAccountsChanged = (accounts: string[]) => {
      if (!active) return;
      if (accounts.length === 0) {
        setAddress("");
        setRoleLabels([]);
        clearStoredToken();
        return;
      }
      void sync(accounts[0]);
    };
    const listener = (...args: unknown[]) => onAccountsChanged((args[0] as string[]) ?? []);
    const onChainChanged = () => window.location.reload();
    ethereum.on?.("accountsChanged", listener);
    ethereum.on?.("chainChanged", onChainChanged);
    return () => {
      active = false;
      ethereum.removeListener?.("accountsChanged", listener);
      ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, [sync]);

  const value = useMemo<WalletState>(() => ({
    address,
    roles: normalizeRoles(roleLabels),
    roleLabels,
    loading,
    error,
    connect,
    refresh
  }), [address, roleLabels, loading, error, connect, refresh]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within <WalletProvider>");
  return ctx;
}
