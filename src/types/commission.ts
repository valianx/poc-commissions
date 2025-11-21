export type AssignmentStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "SCHEDULED";

// Commission range for amount-based commission overrides
// Note: Ranges don't have dates - they inherit the dates from the parent assignment
export interface CommissionRange {
  id: string;
  minAmount: number;
  maxAmount: number;
  percentageValue: number | null; // Percentage commission (e.g., 0.035 for 3.5%)
  fixedValue: number | null; // Fixed commission amount
  isActive: boolean; // Can be enabled/disabled without deletion
}

export interface CommissionAssignment {
  id: string;
  merchantId: string;
  countryCode: string;
  channelCode: string;
  description?: string; // Optional description for why this commission is charged
  // Date range for when this commission is valid
  startDate: string; // Required: when commission starts
  endDate: string | null; // null means no end date (indefinite)
  // New model fields (optional for backward compatibility)
  basePercentageValue?: number | null; // Percentage commission (e.g., 0.035 for 3.5%)
  baseFixedValue?: number | null; // Fixed commission amount
  commissionRanges?: CommissionRange[];
  // Legacy model fields (optional for forward compatibility)
  commissionTemplateId?: string;
  status: AssignmentStatus; // Calculated based on dates: SCHEDULED (future), ACTIVE (current), EXPIRED (past), CANCELLED (manually cancelled)
  assignedBy: string;
  createdAt: string;
  updatedAt?: string;
}

// Legacy types - kept for backward compatibility during migration
export type CommissionType = "FIXED" | "PERCENTAGE" | "MIXED";
export type CommissionStatus = "DRAFT" | "APPROVED" | "PUBLISHED";
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

export interface CreateCommissionRangeDto
  extends Omit<CommissionRange, "id"> {}

export interface CreateCommissionAssignmentDto
  extends Omit<CommissionAssignment, "id" | "createdAt" | "updatedAt"> {}

export interface CreateMerchantTaxConfigDto
  extends Omit<MerchantTaxConfig, "id" | "createdAt"> {}

export interface CreatePSPCommissionDto
  extends Omit<PSPCommission, "id" | "createdAt"> {}

// Legacy DTOs - kept for backward compatibility
export interface CreateCommissionTemplateDto
  extends Omit<
    CommissionTemplate,
    "id" | "createdAt" | "updatedAt" | "deletedAt" | "approvedBy"
  > {}

export interface CreateCommissionParameterDto
  extends Omit<CommissionParameter, "id" | "createdAt" | "updatedAt"> {}
