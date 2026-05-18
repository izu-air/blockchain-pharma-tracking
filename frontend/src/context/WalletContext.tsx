import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode
} from "react";
import { connectWallet, getProvider, getWalletRoles } from "../lib/contract";
import { humanizeError } from "../lib/errors";
import { normalizeRoles, type Role } from "../lib/roles";

const expectedChainIdStr = import.meta.env.VITE_CHAIN_ID ?? "";
const expectedChainId = expectedChainIdStr ? Number(expectedChainIdStr) : null;

interface WalletState {
  /** Lower-case 0x-prefixed address, "" when wallet disconnected. */
  address: string;
  /** Numeric chain id reported by MetaMask. {@code null} if unknown. */
  chainId: number | null;
  /** Required chain id from VITE_CHAIN_ID (null when not enforced). */
  expectedChainId: number | null;
  /** True when chainId !== expectedChainId AND expectedChainId is set. */
  wrongChain: boolean;
  /** Roles the contract grants to {@link address}.  Empty when disconnected. */
  roles: Role[];
  /** Raw labels (Russian) for display. */
  roleLabels: string[];
  loading: boolean;
  error: string;
  connect: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Trigger wallet_switchEthereumChain to expectedChainId. */
  switchChain: () => Promise<void>;
  /** Forget local cache (does not unpair from MetaMask — that's a wallet UX action). */
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

type Listener = (...args: unknown[]) => void;

/** Callback that receives the new account list reported by MetaMask. */
export type OnAccountsChange = (accounts: string[]) => void;

export function WalletProvider({
  children,
  onAccountsChanged
}: {
  children: ReactNode;
  /**
   * Optional hook so a sibling context (e.g. AuthContext) can clear its JWT
   * when the user switches wallet without each context calling localStorage
   * directly.
   */
  onAccountsChanged?: OnAccountsChange;
}) {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [roleLabels, setRoleLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sync = useCallback(async (addr: string) => {
    setLoading(true);
    try {
      const labels = addr ? await getWalletRoles(addr) : [];
      setAddress(addr.toLowerCase());
      setRoleLabels(labels);
      setError("");
    } catch (exception) {
      setAddress(addr.toLowerCase());
      setRoleLabels([]);
      setError(humanizeError(exception, "Не удалось получить роли с контракта."));
    } finally {
      setLoading(false);
    }
  }, []);

  const readChain = useCallback(async () => {
    try {
      const provider = await getProvider();
      const net = await provider.getNetwork();
      setChainId(Number(net.chainId));
    } catch {
      setChainId(null);
    }
  }, []);

  const connect = useCallback(async () => {
    setError("");
    try {
      const addr = await connectWallet();
      await sync(addr);
      await readChain();
    } catch (exception) {
      setError(humanizeError(exception, "Не удалось подключить кошелёк."));
    }
  }, [sync, readChain]);

  const refresh = useCallback(async () => {
    if (address) await sync(address);
    await readChain();
  }, [address, sync, readChain]);

  const disconnect = useCallback(() => {
    setAddress("");
    setRoleLabels([]);
    setError("");
  }, []);

  const switchChain = useCallback(async () => {
    if (!expectedChainId) return;
    const ethereum = window.ethereum;
    if (!ethereum?.request) {
      setError("MetaMask недоступен — переключите сеть вручную.");
      return;
    }
    const hex = "0x" + expectedChainId.toString(16);
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hex }]
      });
      await readChain();
    } catch (exception) {
      const code = (exception as { code?: number }).code;
      if (code === 4902 && expectedChainId === 31337) {
        // Hardhat local network typically isn't pre-installed in MetaMask.
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: hex,
              chainName: "Hardhat Local",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
            }]
          });
          await readChain();
          return;
        } catch (addExc) {
          setError(humanizeError(addExc, "Не удалось добавить локальную сеть в MetaMask."));
          return;
        }
      }
      setError(humanizeError(exception, "Не удалось переключить сеть."));
    }
  }, [readChain]);

  // bootstrap + event subscription
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const provider = await getProvider();
        const accounts = (await provider.send("eth_accounts", [])) as string[];
        if (accounts.length > 0 && active) {
          await sync(accounts[0]);
          await readChain();
        }
      } catch {
        /* MetaMask absent — connect button stays available */
      }
    })();

    const ethereum = window.ethereum;
    if (!ethereum) return () => { active = false; };

    const handleAccounts = (accounts: string[]) => {
      if (!active) return;
      onAccountsChanged?.(accounts);
      if (accounts.length === 0) {
        disconnect();
        return;
      }
      void sync(accounts[0]);
    };
    const accountListener: Listener = (...args) =>
        handleAccounts((args[0] as string[]) ?? []);
    const chainListener: Listener = (...args) => {
      const raw = args[0];
      if (typeof raw === "string") setChainId(Number(raw));
      else if (typeof raw === "number") setChainId(raw);
      // Roles may differ per chain — re-pull if a wallet is connected.
      if (address) void sync(address);
    };
    ethereum.on?.("accountsChanged", accountListener);
    ethereum.on?.("chainChanged", chainListener);
    return () => {
      active = false;
      ethereum.removeListener?.("accountsChanged", accountListener);
      ethereum.removeListener?.("chainChanged", chainListener);
    };
  // disconnect / sync are stable; address ref captured intentionally as initial
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrongChain = useMemo(
    () => Boolean(expectedChainId && chainId && chainId !== expectedChainId),
    [chainId]
  );

  const value = useMemo<WalletState>(() => ({
    address,
    chainId,
    expectedChainId,
    wrongChain,
    roles: normalizeRoles(roleLabels),
    roleLabels,
    loading,
    error,
    connect,
    refresh,
    switchChain,
    disconnect
  }), [address, chainId, wrongChain, roleLabels, loading, error,
       connect, refresh, switchChain, disconnect]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within <WalletProvider>");
  return ctx;
}
