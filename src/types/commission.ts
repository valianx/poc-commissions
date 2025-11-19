export type CommissionType = "FIXED" | "PERCENTAGE" | "MIXED";
export type CommissionStatus = "DRAFT" | "APPROVED" | "PUBLISHED";
export type AssignmentStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";
export type ParameterType = "PERCENTAGE" | "FIXED_FEE" | "MIN_RANGE" | "MAX_RANGE";

export interface CommissionTemplate {
  id: string;
  code: string;
  name: string;
  type: CommissionType;
  status: CommissionStatus;
  effectiveDate: string;
  expirationDate: string | null;
  createdBy: string;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CommissionParameter {
  id: string;
  commissionTemplateId: string;
  parameterType: ParameterType;
  value: number;
  currency: string;
  minRange: number | null;
  maxRange: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionAssignment {
  id: string;
  commissionTemplateId: string;
  merchantId: string;
  countryCode: string;
  channelCode: string;
  startDate: string;
  endDate: string | null;
  status: AssignmentStatus;
  assignedBy: string;
  createdAt: string;
}

export interface MerchantTaxConfig {
  id: string;
  merchantId: string;
  countryCode: string;
  channelCode: string;
  taxCode: string;
  taxName: string;
  rate: number;
  isActive: boolean;
  createdAt: string;
}

export interface PSPCommission {
  id: string;
  pspId: string;
  pspName: string;
  countryCode: string;
  channelCode: string;
  commissionType: CommissionType;
  percentage: number;
  fixedFee: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCommissionTemplateDto
  extends Omit<
    CommissionTemplate,
    "id" | "createdAt" | "updatedAt" | "deletedAt" | "approvedBy"
  > {}

export interface CreateCommissionParameterDto
  extends Omit<CommissionParameter, "id" | "createdAt" | "updatedAt"> {}

export interface CreateCommissionAssignmentDto
  extends Omit<CommissionAssignment, "id" | "createdAt"> {}

export interface CreateMerchantTaxConfigDto
  extends Omit<MerchantTaxConfig, "id" | "createdAt"> {}

export interface CreatePSPCommissionDto
  extends Omit<PSPCommission, "id" | "createdAt"> {}
