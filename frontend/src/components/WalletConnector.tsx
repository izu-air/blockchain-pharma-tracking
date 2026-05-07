import { Wallet } from "lucide-react";
import { useState } from "react";
import { connectWallet, getWalletRoles } from "../lib/contract";
import { formatAddress } from "../lib/status";

export function WalletConnector() {
  const [account, setAccount] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function handleConnect() {
    setError("");
    try {
      const address = await connectWallet();
      const loadedRoles = await getWalletRoles(address);
      setAccount(address);
      setRoles(loadedRoles);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Ошибка подключения кошелька");
    }
  }

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
