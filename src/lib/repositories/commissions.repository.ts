import {
  CommissionTemplate,
  CommissionParameter,
  CommissionAssignment,
  MerchantTaxConfig,
  PSPCommission,
} from "@/types/commission";
import { STORAGE_KEYS } from "@/types/storage";
import { BaseRepository } from "./base.repository";

class CommissionTemplatesRepository extends BaseRepository<CommissionTemplate> {
  constructor() {
    super(STORAGE_KEYS.COMMISSION_TEMPLATES);
  }

  getByCode(code: string): CommissionTemplate | null {
    return this.findOne((t) => t.code === code);
  }

  getApproved(): CommissionTemplate[] {
    return this.findBy(
      (t) => t.status === "APPROVED" || t.status === "PUBLISHED"
    );
  }
}

class CommissionParametersRepository extends BaseRepository<CommissionParameter> {
  constructor() {
    super(STORAGE_KEYS.COMMISSION_PARAMETERS);
  }

  getByTemplateId(templateId: string): CommissionParameter[] {
    return this.findBy((p) => p.commissionTemplateId === templateId);
  }
}

class CommissionAssignmentsRepository extends BaseRepository<CommissionAssignment> {
  constructor() {
    super(STORAGE_KEYS.COMMISSION_ASSIGNMENTS);
  }

  getActiveAssignments(
    merchantId: string,
    countryCode: string,
    channelCode: string
  ): CommissionAssignment[] {
    const now = new Date();
    return this.findBy(
      (a) =>
        a.merchantId === merchantId &&
        a.countryCode === countryCode &&
        a.channelCode === channelCode &&
        a.status === "ACTIVE" &&
        // Legacy model: check date ranges if startDate exists
        (!a.startDate || new Date(a.startDate) <= now) &&
        (!a.endDate || new Date(a.endDate) >= now)
    );
  }

  getByMerchant(merchantId: string): CommissionAssignment[] {
    return this.findBy((a) => a.merchantId === merchantId);
  }
}

class MerchantTaxConfigsRepository extends BaseRepository<MerchantTaxConfig> {
  constructor() {
    super(STORAGE_KEYS.MERCHANT_TAX_CONFIGS);
  }

  getActiveConfigs(
    merchantId: string,
    countryCode: string,
    channelCode: string
  ): MerchantTaxConfig[] {
    return this.findBy(
      (t) =>
        t.merchantId === merchantId &&
        t.countryCode === countryCode &&
        t.channelCode === channelCode &&
        t.isActive
    );
  }
}

class PSPCommissionsRepository extends BaseRepository<PSPCommission> {
  constructor() {
    super(STORAGE_KEYS.PSP_COMMISSIONS);
  }

  getActiveCommission(
    pspId: string,
    countryCode: string,
    channelCode: string
  ): PSPCommission | null {
    return this.findOne(
      (p) =>
        p.pspId === pspId &&
        p.countryCode === countryCode &&
        p.channelCode === channelCode &&
        p.isActive
    );
  }

  getByChannel(countryCode: string, channelCode: string): PSPCommission[] {
    return this.findBy(
      (p) =>
        p.countryCode === countryCode &&
        p.channelCode === channelCode &&
        p.isActive
    );
  }
}

export const commissionTemplatesRepository =
  new CommissionTemplatesRepository();
export const commissionParametersRepository =
  new CommissionParametersRepository();
export const commissionAssignmentsRepository =
  new CommissionAssignmentsRepository();
export const merchantTaxConfigsRepository =
  new MerchantTaxConfigsRepository();
export const pspCommissionsRepository = new PSPCommissionsRepository();
