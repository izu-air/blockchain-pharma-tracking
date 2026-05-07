export type ProductStatus = 0 | 1 | 2 | 3;

export interface Product {
  id: bigint;
  name: string;
  manufacturer: string;
  currentOwner: string;
  createdAt: bigint;
  status: ProductStatus;
  exists: boolean;
}

export interface ProductHistoryItem {
  timestamp: bigint;
  actor: string;
  from: string;
  to: string;
  status: ProductStatus;
  action: string;
}

export interface ProductMetadata {
  id: number;
  blockchainProductId: number;
  batchNumber: string;
  expirationDate: string;
  description: string;
  createdAt: string;
}
