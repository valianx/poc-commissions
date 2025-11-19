import { Channel, PSP } from "@/types/channel";
import { STORAGE_KEYS } from "@/types/storage";
import { BaseRepository } from "./base.repository";

class ChannelsRepository extends BaseRepository<Channel> {
  constructor() {
    super(STORAGE_KEYS.CHANNELS);
  }

  getByCode(code: string): Channel | null {
    return this.findOne((c) => c.code === code);
  }

  getAllActive(): Channel[] {
    return this.findBy((c) => c.isActive && c.deletedAt === null);
  }
}

class PSPsRepository extends BaseRepository<PSP> {
  constructor() {
    super(STORAGE_KEYS.PSPS);
  }

  getByCode(code: string): PSP | null {
    return this.findOne((p) => p.code === code);
  }

  getAllActive(): PSP[] {
    return this.findBy((p) => p.isActive && p.deletedAt === null);
  }
}

export const channelsRepository = new ChannelsRepository();
export const pspsRepository = new PSPsRepository();
