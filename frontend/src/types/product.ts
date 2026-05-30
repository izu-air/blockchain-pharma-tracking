export type ProductStatus = 0 | 1 | 2 | 3;
export type ExtendedProductStatus = 0 | 1 | 2 | 3 | 4;

export interface Product {
  id: bigint;
  batchId: bigint;
  name: string;
  serialNumber: string;
  manufacturer: string;
  currentOwner: string;
  createdAt: bigint;
  status: ExtendedProductStatus;
  blocked: boolean;
  exists: boolean;
}

export interface ProductBatch {
  batchId: bigint;
  manufacturer: string;
  productionDate: bigint;
  expirationDate: bigint;
  recalled: boolean;
  temperatureHash: string;
  metadataHash: string;
  exists: boolean;
}

export interface ProductHistoryItem {
  timestamp: bigint;
  actor: string;
  previousOwner: string;
  newOwner: string;
  status: ExtendedProductStatus;
  action: string;
  operationId: string;
}

export interface VerificationResult {
  authentic: boolean;
  recalled: boolean;
  expired: boolean;
  blocked: boolean;
  status: ExtendedProductStatus;
  currentOwner: string;
  batchId: bigint;
  expirationDate: bigint;
}

export interface ProductMetadata {
  id: number;
  blockchainProductId: number;
  batchNumber: string;
  expirationDate: string;
  description: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  metadataRecords: number;
  cachedEvents: number;
  createdEvents: number;
  transferEvents: number;
  statusEvents: number;
  recallEvents: number;
}

export interface AnalyticsDaily {
  window: number;
  buckets: Array<{
    date: string;       // ISO calendar date, e.g. "2026-05-25"
    total: number;
    created: number;
    transferred: number;
    status: number;
    recalled: number;
  }>;
}
