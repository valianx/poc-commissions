export interface MerchantChannelConfig {
  id: string;
  merchantId: string;
  countryCode: string;
  channelId: string;
  pspId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateMerchantChannelConfigDto
  extends Omit<
    MerchantChannelConfig,
    "id" | "createdAt" | "updatedAt" | "deletedAt"
  > {}

export interface UpdateMerchantChannelConfigDto
  extends Partial<CreateMerchantChannelConfigDto> {}
