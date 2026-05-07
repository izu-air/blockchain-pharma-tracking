import { Wallet } from "lucide-react";
import { useState } from "react";
import { connectWallet } from "../lib/contract";
import { formatAddress } from "../lib/status";

export function WalletConnector() {
  const [account, setAccount] = useState("");
  const [error, setError] = useState("");

  async function handleConnect() {
    setError("");
    try {
      const address = await connectWallet();
      setAccount(address);
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
    </div>
  );
}
