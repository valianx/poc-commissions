export type AssignmentStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "SCHEDULED";

// Minimum commission - applies when transaction amount is within a specific range
export interface MinimumCommission {
  minTransactionAmount: number; // Lower bound: transactions >= this amount
  maxTransactionAmount: number; // Upper bound: transactions <= this amount
  percentageValue: number | null; // Percentage commission for this range
  fixedValue: number | null; // Fixed commission for this range
  isActive: boolean;
}

// Tier 2 commission - applies when merchant reaches cumulative transaction threshold in channel/country
export interface Tier2Commission {
  cumulativeThreshold: number; // Minimum cumulative amount to unlock tier 2 (sum of all transactions in channel/country)
  percentageValue: number | null; // Tier 2 percentage commission
  fixedValue: number | null; // Tier 2 fixed commission
  isActive: boolean;
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
  // Base commission fields
  basePercentageValue?: number | null; // Percentage commission (e.g., 0.035 for 3.5%)
  baseFixedValue?: number | null; // Fixed commission amount
  // Minimum commission - single range for special commission on specific transaction amounts
  minimumCommission?: MinimumCommission | null;
  // Tier 2 commission - applies when merchant reaches cumulative threshold
  tier2Commission?: Tier2Commission | null;
  // VAT configuration (optional - applies to commission)
  vatPercentage?: number | null; // VAT percentage to apply (e.g., 0.19 for 19% VAT)
  // Legacy fields (kept for backward compatibility)
  commissionRanges?: { id: string; minAmount: number; maxAmount: number; percentageValue: number | null; fixedValue: number | null; isActive: boolean; }[]; // DEPRECATED
  commissionTemplateId?: string;
  isVat?: boolean; // DEPRECATED: Use vatPercentage instead
  status: AssignmentStatus; // Calculated based on dates
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
