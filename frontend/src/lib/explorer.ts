/**
 * Maps chain id → block explorer URL prefix.  Local Hardhat / forks
 * do not have a public explorer, so we return null and the UI falls
 * back to showing the raw tx hash with a Copy button.
 */
const EXPLORERS: Record<number, string> = {
  1:      "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
  137:    "https://polygonscan.com",
  80002:  "https://amoy.polygonscan.com",
  10:     "https://optimistic.etherscan.io",
  42161:  "https://arbiscan.io",
  8453:   "https://basescan.org",
  56:     "https://bscscan.com"
};

export function explorerTxUrl(chainId: number | null, txHash: string): string | null {
  if (!chainId || !txHash) return null;
  const base = EXPLORERS[chainId];
  return base ? `${base}/tx/${txHash}` : null;
}

export function explorerAddressUrl(chainId: number | null, address: string): string | null {
  if (!chainId || !address) return null;
  const base = EXPLORERS[chainId];
  return base ? `${base}/address/${address}` : null;
}
