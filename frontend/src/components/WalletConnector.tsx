import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { connectWallet, getWalletRoles, getProvider } from "../lib/contract";
import { formatAddress } from "../lib/status";

export function WalletConnector() {
  const [account, setAccount] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function syncWallet(address: string) {
    const loadedRoles = await getWalletRoles(address);
    setAccount(address);
    setRoles(loadedRoles);
  }

  async function handleConnect() {
    setError("");
    try {
      const address = await connectWallet();
      await syncWallet(address);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Ошибка подключения кошелька");
    }
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const provider = await getProvider();
        const accounts = (await provider.send("eth_accounts", [])) as string[];
        if (accounts.length > 0 && active) {
          await syncWallet(accounts[0]);
        }
      } catch {
        // Ignore bootstrap wallet errors; connect button remains available.
      }
    }

    bootstrap();

    const ethereum = window.ethereum;
    if (!ethereum) return;

    const onAccountsChanged = (accounts: string[]) => {
      void (async () => {
        if (!active) return;
        if (accounts.length === 0) {
          setAccount("");
          setRoles([]);
          return;
        }
        await syncWallet(accounts[0]);
      })();
    };

    const accountsListener = (...args: unknown[]) => onAccountsChanged((args[0] as string[]) ?? []);
    const onChainChanged = () => window.location.reload();

    ethereum.on?.("accountsChanged", accountsListener);
    ethereum.on?.("chainChanged", onChainChanged);

    return () => {
      active = false;
      ethereum.removeListener?.("accountsChanged", accountsListener);
      ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  return (
    <div className="flex flex-col items-end gap-1">
      <button className="button-secondary" onClick={handleConnect}>
        <Wallet size={18} />
        {account ? formatAddress(account) : "Подключить MetaMask"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {roles.length > 0 && <span className="text-xs text-stone-600">{roles.join(", ")}</span>}
    </div>
  );
}
