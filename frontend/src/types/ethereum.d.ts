import type { Eip1193Provider } from "ethers";

type MetaMaskProvider = Eip1193Provider & {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: MetaMaskProvider;
  }
}
