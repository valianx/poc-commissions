export interface ChannelTax {
  taxCode: string;
  taxName: string;
  rate: number; // e.g., 0.19 for 19% VAT
  isActive: boolean;
}

export interface MerchantChannelConfig {
  id: string;
  merchantId: string;
  countryCode: string;
  channelId: string;
  pspId: string;
  taxes: ChannelTax[]; // Array of taxes (VAT, etc.)
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
