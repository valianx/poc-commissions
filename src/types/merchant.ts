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

export interface CreateMerchantDto
  extends Omit<Merchant, "id" | "createdAt" | "updatedAt" | "deletedAt"> {}

export interface UpdateMerchantDto extends Partial<CreateMerchantDto> {}
