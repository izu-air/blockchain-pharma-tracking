import { BrowserProvider, Contract, id, solidityPackedKeccak256, toUtf8Bytes } from "ethers";
import type { ExtendedProductStatus, Product, ProductBatch, ProductHistoryItem, VerificationResult } from "../types/product";

export const supplyChainAbi = [
  "function ADMIN_ROLE() view returns (bytes32)",
  "function MANUFACTURER_ROLE() view returns (bytes32)",
  "function DISTRIBUTOR_ROLE() view returns (bytes32)",
  "function PHARMACY_ROLE() view returns (bytes32)",
  "function REGULATOR_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function createBatch(uint256 productionDate,uint256 expirationDate,bytes32 temperatureHash,bytes32 metadataHash) returns (uint256)",
  "function createProduct(uint256 batchId,string name,string serialNumber) returns (uint256)",
  "function transferProduct(uint256 productId,address newOwner,bytes32 operationId)",
  "function updateStatus(uint256 productId,uint8 newStatus,bytes32 operationId)",
  "function recallBatch(uint256 batchId,string reason,bytes32 operationId)",
  "function unrecallBatch(uint256 batchId,string reason,bytes32 operationId)",
  "function getProduct(uint256 productId) view returns (tuple(uint256 id,uint256 batchId,string name,string serialNumber,address manufacturer,address currentOwner,uint256 createdAt,uint8 status,bool blocked,bool exists))",
  "function getProductBySerial(string serialNumber) view returns (tuple(uint256 id,uint256 batchId,string name,string serialNumber,address manufacturer,address currentOwner,uint256 createdAt,uint8 status,bool blocked,bool exists))",
  "function getProductIdBySerial(string serialNumber) view returns (uint256)",
  "function getBatch(uint256 batchId) view returns (tuple(uint256 batchId,address manufacturer,uint256 productionDate,uint256 expirationDate,bool recalled,bytes32 temperatureHash,bytes32 metadataHash,bool exists))",
  "function getBatchProducts(uint256 batchId) view returns (uint256[])",
  "function getProductHistory(uint256 productId) view returns (tuple(uint256 timestamp,address actor,address previousOwner,address newOwner,uint8 status,string action,bytes32 operationId)[])",
  "function verifyProduct(uint256 productId) view returns (tuple(bool authentic,bool recalled,bool expired,bool blocked,uint8 status,address currentOwner,uint256 batchId,uint256 expirationDate))",
  "function verifyProductBySerial(string serialNumber) view returns (tuple(bool authentic,bool recalled,bool expired,bool blocked,uint8 status,address currentOwner,uint256 batchId,uint256 expirationDate))",
  "event BatchCreated(uint256 indexed batchId,address indexed manufacturer,uint256 productionDate,uint256 expirationDate,bytes32 temperatureHash,bytes32 metadataHash)",
  "event BatchRecalled(uint256 indexed batchId,address indexed regulator,string reason)",
  "event BatchUnrecalled(uint256 indexed batchId,address indexed regulator,string reason)",
  "event ProductCreated(uint256 indexed productId,uint256 indexed batchId,string serialNumber,string name,address indexed manufacturer)"
];

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const expectedChainId = import.meta.env.VITE_CHAIN_ID;

export async function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask не найден. Установите расширение и повторите попытку.");
  }
  return new BrowserProvider(window.ethereum);
}

export async function ensureExpectedChain() {
  if (!expectedChainId) {
    return;
  }
  const provider = await getProvider();
  const network = await provider.getNetwork();
  const want = Number(expectedChainId);
  if (Number(network.chainId) !== want) {
    throw new Error(
      `Требуется сеть с chain id ${want} (задайте VITE_CHAIN_ID). Текущая сеть MetaMask: ${network.chainId}.`
    );
  }
}

/** Strict Ethereum address pattern (0x + 40 hex chars). */
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export function isValidAddress(value: string): boolean {
  return typeof value === "string" && ADDRESS_PATTERN.test(value.trim());
}

export async function connectWallet() {
  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);
  // Verify chain BEFORE returning to the caller, so subsequent contract
  // calls don't blow up with cryptic network-mismatch errors.
  await ensureExpectedChain();
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

function operationId(label: string) {
  return solidityPackedKeccak256(["string", "uint256"], [`${label}-${crypto.randomUUID()}`, Date.now()]);
}

export function metadataHash(value: string) {
  return id(value.trim() || "empty");
}

export function temperatureHash(value: string) {
  return id(value.trim() || "temperature-not-provided");
}

export async function getWalletRoles(address: string) {
  const contract = await getSupplyChainContract(false);
  const roles = [
    ["Администратор", await contract.ADMIN_ROLE()],
    ["Производитель", await contract.MANUFACTURER_ROLE()],
    ["Дистрибьютор", await contract.DISTRIBUTOR_ROLE()],
    ["Аптека", await contract.PHARMACY_ROLE()],
    ["Регулятор", await contract.REGULATOR_ROLE()]
  ] as const;

  const checks = await Promise.all(roles.map(async ([label, role]) => ({
    label,
    enabled: await contract.hasRole(role, address)
  })));
  return checks.filter((role) => role.enabled).map((role) => role.label);
}

export async function createBatch(productionDate: number, expirationDate: number, temperatureLog: string, metadata: string) {
  await ensureExpectedChain();
  const contract = await getSupplyChainContract(true);
  const tx = await contract.createBatch(
    productionDate,
    expirationDate,
    temperatureHash(temperatureLog),
    metadataHash(metadata)
  );
  const receipt = await tx.wait();
  const event = receipt.logs
    .map((log: unknown) => {
      try {
        return contract.interface.parseLog(log as never);
      } catch {
        return null;
      }
    })
    .find((parsed: { name?: string } | null) => parsed?.name === "BatchCreated");

  return {
    txHash: receipt.hash,
    batchId: event?.args?.batchId?.toString() ?? ""
  };
}

export async function createProduct(batchId: string, name: string, serialNumber: string) {
  await ensureExpectedChain();
  const contract = await getSupplyChainContract(true);
  const tx = await contract.createProduct(batchId, name, serialNumber);
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
  await ensureExpectedChain();
  const contract = await getSupplyChainContract(true);
  const tx = await contract.transferProduct(productId, newOwner, operationId("transfer"));
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function updateStatus(productId: string, status: ExtendedProductStatus) {
  await ensureExpectedChain();
  const contract = await getSupplyChainContract(true);
  const tx = await contract.updateStatus(productId, status, operationId("status"));
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function recallBatch(batchId: string, reason: string) {
  await ensureExpectedChain();
  const contract = await getSupplyChainContract(true);
  const tx = await contract.recallBatch(batchId, reason, operationId("recall"));
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function unrecallBatch(batchId: string, reason: string) {
  await ensureExpectedChain();
  const contract = await getSupplyChainContract(true);
  const tx = await contract.unrecallBatch(batchId, reason, operationId("unrecall"));
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function getProduct(productId: string): Promise<Product> {
  const contract = await getSupplyChainContract(false);
  return contract.getProduct(productId);
}

export async function getProductBySerial(serialNumber: string): Promise<Product> {
  const contract = await getSupplyChainContract(false);
  return contract.getProductBySerial(serialNumber);
}

export async function getProductIdBySerial(serialNumber: string): Promise<bigint> {
  const contract = await getSupplyChainContract(false);
  return contract.getProductIdBySerial(serialNumber);
}

export async function getBatch(batchId: string): Promise<ProductBatch> {
  const contract = await getSupplyChainContract(false);
  return contract.getBatch(batchId);
}

export async function getProductHistory(productId: string): Promise<ProductHistoryItem[]> {
  const contract = await getSupplyChainContract(false);
  return contract.getProductHistory(productId);
}

export async function verifyProduct(productId: string): Promise<VerificationResult> {
  const contract = await getSupplyChainContract(false);
  return contract.verifyProduct(productId);
}

export async function verifyProductBySerial(serialNumber: string): Promise<VerificationResult> {
  const contract = await getSupplyChainContract(false);
  return contract.verifyProductBySerial(serialNumber);
}
