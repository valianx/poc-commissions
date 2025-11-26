export interface Merchant {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  countries: string[];
  balanceEvaluationEnabled: boolean;
  depositCallbackUrl: string | null;
  withdrawalCallbackUrl: string | null;
  callbackApiKeyRef: string | null;
  callbackSecretKeyRef: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Merchant file types for document management
export type MerchantFileCategory =
  | "CONTRACT"      // Contracts and agreements
  | "ADDENDUM"      // Contract addendums
  | "LEGAL"         // Legal documents
  | "COMPLIANCE"    // Compliance documents
  | "INVOICE"       // Invoices
  | "OTHER";        // Other documents

export interface MerchantFile {
  id: string;
  merchantId: string;
  fileName: string;           // Original file name
  fileSize: number;           // Size in bytes
  mimeType: string;           // MIME type (e.g., application/pdf)
  category: MerchantFileCategory;
  description?: string;       // Optional description
  uploadedBy: string;         // Email of uploader
  bucketPath: string;         // Simulated bucket path (in POC: stored as base64 in localStorage)
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMerchantFileDto {
  merchantId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: MerchantFileCategory;
  description?: string;
  uploadedBy: string;
  fileData: string;           // Base64 encoded file data (for POC)
}

export interface CreateMerchantDto
  extends Omit<Merchant, "id" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface UpdateMerchantDto extends Partial<CreateMerchantDto> {}
