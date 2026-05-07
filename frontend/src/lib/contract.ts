import { BrowserProvider, Contract } from "ethers";
import type { Product, ProductHistoryItem, ProductStatus } from "../types/product";

export const supplyChainAbi = [
  "function createProduct(string name) returns (uint256)",
  "function transferProduct(uint256 productId, address newOwner)",
  "function updateStatus(uint256 productId, uint8 newStatus)",
  "function getProduct(uint256 productId) view returns (tuple(uint256 id,string name,address manufacturer,address currentOwner,uint256 createdAt,uint8 status,bool exists))",
  "function getProductHistory(uint256 productId) view returns (tuple(uint256 timestamp,address actor,address from,address to,uint8 status,string action)[])",
  "event ProductCreated(uint256 indexed productId, string name, address indexed manufacturer)"
];

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

export async function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask не найден. Установите расширение и повторите попытку.");
  }
  return new BrowserProvider(window.ethereum);
}

export async function connectWallet() {
  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  return signer.getAddress();
}

export async function getSupplyChainContract(withSigner = false) {
  if (!contractAddress) {
    throw new Error("Адрес контракта не задан в VITE_CONTRACT_ADDRESS.");
  }

  const provider = await getProvider();
  if (withSigner) {
    const signer = await provider.getSigner();
    return new Contract(contractAddress, supplyChainAbi, signer);
  }
  return new Contract(contractAddress, supplyChainAbi, provider);
}

export async function createProduct(name: string) {
  const contract = await getSupplyChainContract(true);
  const tx = await contract.createProduct(name);
  const receipt = await tx.wait();
  const event = receipt.logs
    .map((log: unknown) => {
      try {
        return contract.interface.parseLog(log as never);
      } catch {
        return null;
      }
    })
    .find((parsed: { name?: string } | null) => parsed?.name === "ProductCreated");

  return {
    txHash: receipt.hash,
    productId: event?.args?.productId?.toString() ?? ""
  };
}

export async function transferProduct(productId: string, newOwner: string) {
  const contract = await getSupplyChainContract(true);
  const tx = await contract.transferProduct(productId, newOwner);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function updateStatus(productId: string, status: ProductStatus) {
  const contract = await getSupplyChainContract(true);
  const tx = await contract.updateStatus(productId, status);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function getProduct(productId: string): Promise<Product> {
  const contract = await getSupplyChainContract(false);
  return contract.getProduct(productId);
}

export async function getProductHistory(productId: string): Promise<ProductHistoryItem[]> {
  const contract = await getSupplyChainContract(false);
  return contract.getProductHistory(productId);
}
