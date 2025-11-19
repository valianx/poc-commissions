import { Merchant } from "@/types/merchant";
import { STORAGE_KEYS } from "@/types/storage";
import { BaseRepository } from "./base.repository";

class MerchantsRepository extends BaseRepository<Merchant> {
  constructor() {
    super(STORAGE_KEYS.MERCHANTS);
  }

  getByCode(code: string): Merchant | null {
    return this.findOne((m) => m.code === code);
  }

  getActiveByCountry(countryCode: string): Merchant[] {
    return this.findBy(
      (m) =>
        m.isActive &&
        m.deletedAt === null &&
        m.countries.includes(countryCode)
    );
  }

  getAllActive(): Merchant[] {
    return this.findBy((m) => m.isActive && m.deletedAt === null);
  }
}

export const merchantsRepository = new MerchantsRepository();
