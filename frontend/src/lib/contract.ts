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

/**
 * Pre-validates a value before sending it to ethers as `uint256`.
 * ethers will throw a cryptic `invalid BigNumberish` if we don't catch
 * non-numeric strings here.  Throwing a localized error early gives
 * the user an actionable message.
 */
function requireUint(value: string, fieldName: string): bigint {
  const trimmed = String(value ?? "").trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `Поле «${fieldName}» должно быть положительным числом (on-chain ID). ` +
      `Получено: «${trimmed.slice(0, 32)}». Это не бизнес-номер партии, ` +
      `а числовой идентификатор, который вернул контракт после createBatch.`
    );
  }
  const parsed = BigInt(trimmed);
  if (parsed <= 0n) {
    throw new Error(`Поле «${fieldName}» должно быть положительным числом, получено ${parsed}.`);
  }
  return parsed;
}

/**
 * Pre-validates an Ethereum address.  Surfaces a clean Russian error
 * instead of letting ethers throw an internal exception deep inside the
 * encoder.
 */
function requireAddress(value: string, fieldName: string): string {
  const trimmed = String(value ?? "").trim();
  if (!ADDRESS_PATTERN.test(trimmed)) {
    throw new Error(`Поле «${fieldName}» должно быть Ethereum-адресом (0x + 40 hex символов).`);
  }
  return trimmed;
}

/**
 * Pre-validates a serial number against the same character class enforced by
 * SupplyChain.sol's createProduct.  Catches obvious typos before paying gas.
 */
function requireSerial(value: string, fieldName: string): string {
  const trimmed = String(value ?? "").trim();
  if (!/^[A-Za-z0-9._:\-]{3,64}$/.test(trimmed)) {
    throw new Error(
      `Поле «${fieldName}» должно содержать 3–64 символа: латиница, цифры или . : - _`
    );
  }
  return trimmed;
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
  const validBatchId = requireUint(batchId, "ID партии (on-chain)");
  const validSerial  = requireSerial(serialNumber, "Серийный номер");
  const cleanName    = String(name ?? "").trim();
  if (cleanName.length < 2 || cleanName.length > 200) {
    throw new Error("Название препарата должно быть от 2 до 200 символов.");
  }
  await ensureExpectedChain();
  const contract = await getSupplyChainContract(true);
  const tx = await contract.createProduct(validBatchId, cleanName, validSerial);
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
  const validProductId = requireUint(productId, "ID продукта");
  const validNewOwner = requireAddress(newOwner, "Адрес нового владельца");
  await ensureExpectedChain();
  const contract = await getSupplyChainContract(true);
  const tx = await contract.transferProduct(validProductId, validNewOwner, operationId("transfer"));
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function updateStatus(productId: string, status: ExtendedProductStatus) {
  const validProductId = requireUint(productId, "ID продукта");
  await ensureExpectedChain();
  const contract = await getSupplyChainContract(true);
  const tx = await contract.updateStatus(validProductId, status, operationId("status"));
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function recallBatch(batchId: string, reason: string) {
  const validBatchId = requireUint(batchId, "ID партии");
  const trimmed = String(reason ?? "").trim();
  if (trimmed.length < 5) throw new Error("Причина отзыва должна быть не короче 5 символов.");
  if (trimmed.length > 500) throw new Error("Причина отзыва не должна превышать 500 символов.");
  await ensureExpectedChain();
  const contract = await getSupplyChainContract(true);
  const tx = await contract.recallBatch(validBatchId, trimmed, operationId("recall"));
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function unrecallBatch(batchId: string, reason: string) {
  const validBatchId = requireUint(batchId, "ID партии");
  const trimmed = String(reason ?? "").trim();
  if (trimmed.length < 5) throw new Error("Причина восстановления должна быть не короче 5 символов.");
  if (trimmed.length > 500) throw new Error("Причина не должна превышать 500 символов.");
  await ensureExpectedChain();
  const contract = await getSupplyChainContract(true);
  const tx = await contract.unrecallBatch(validBatchId, trimmed, operationId("unrecall"));
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function getProduct(productId: string): Promise<Product> {
  const validProductId = requireUint(productId, "ID продукта");
  const contract = await getSupplyChainContract(false);
  return contract.getProduct(validProductId);
}

export async function getProductBySerial(serialNumber: string): Promise<Product> {
  const contract = await getSupplyChainContract(false);
  return contract.getProductBySerial(String(serialNumber ?? "").trim());
}

export async function getProductIdBySerial(serialNumber: string): Promise<bigint> {
  const contract = await getSupplyChainContract(false);
  return contract.getProductIdBySerial(String(serialNumber ?? "").trim());
}

export async function getBatch(batchId: string): Promise<ProductBatch> {
  const validBatchId = requireUint(batchId, "ID партии");
  const contract = await getSupplyChainContract(false);
  return contract.getBatch(validBatchId);
}

export async function getProductHistory(productId: string): Promise<ProductHistoryItem[]> {
  const validProductId = requireUint(productId, "ID продукта");
  const contract = await getSupplyChainContract(false);
  return contract.getProductHistory(validProductId);
}

export async function verifyProduct(productId: string): Promise<VerificationResult> {
  const validProductId = requireUint(productId, "ID продукта");
  const contract = await getSupplyChainContract(false);
  return contract.verifyProduct(validProductId);
}

export async function verifyProductBySerial(serialNumber: string): Promise<VerificationResult> {
  const contract = await getSupplyChainContract(false);
  return contract.verifyProductBySerial(String(serialNumber ?? "").trim());
}
