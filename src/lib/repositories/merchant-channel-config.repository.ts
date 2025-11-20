import { BaseRepository } from "./base.repository";
import { MerchantChannelConfig } from "@/types/merchant-channel-config";

class MerchantChannelConfigRepository extends BaseRepository<MerchantChannelConfig> {
  constructor() {
    super("merchant-channel-configs");
  }

  findByMerchant(merchantId: string): MerchantChannelConfig[] {
    return this.findBy((config) => config.merchantId === merchantId);
  }

  findByMerchantAndCountry(
    merchantId: string,
    countryCode: string
  ): MerchantChannelConfig[] {
    return this.findBy(
      (config) =>
        config.merchantId === merchantId && config.countryCode === countryCode
    );
  }

  findByMerchantCountryAndChannel(
    merchantId: string,
    countryCode: string,
    channelId: string
  ): MerchantChannelConfig | null {
    return this.findOne(
      (config) =>
        config.merchantId === merchantId &&
        config.countryCode === countryCode &&
        config.channelId === channelId
    );
  }
}

export const merchantChannelConfigRepository =
  new MerchantChannelConfigRepository();
