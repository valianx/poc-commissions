import { z } from "zod";

// Minimum commission schema - applies when transaction amount is within a specific range
export const minimumCommissionSchema = z.object({
  minTransactionAmount: z.number().min(0, "El monto mínimo debe ser mayor o igual a 0"),
  maxTransactionAmount: z.number().min(0, "El monto máximo debe ser mayor o igual a 0"),
  percentageValue: z
    .number()
    .min(0)
    .max(1, "El porcentaje debe estar entre 0 y 1")
    .nullable(),
  fixedValue: z.number().min(0, "El valor fijo debe ser mayor o igual a 0").nullable(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => data.percentageValue !== null || data.fixedValue !== null,
  {
    message: "Debe especificar un valor porcentual y/o un valor fijo",
  }
).refine(
  (data) => data.maxTransactionAmount > data.minTransactionAmount,
  {
    message: "El monto máximo debe ser mayor que el monto mínimo",
  }
);

// Tier 2 commission schema - applies when merchant reaches cumulative threshold
export const tier2CommissionSchema = z.object({
  cumulativeThreshold: z.number().min(0, "El umbral debe ser mayor o igual a 0"),
  percentageValue: z
    .number()
    .min(0)
    .max(1, "El porcentaje debe estar entre 0 y 1")
    .nullable(),
  fixedValue: z.number().min(0, "El valor fijo debe ser mayor o igual a 0").nullable(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => data.percentageValue !== null || data.fixedValue !== null,
  {
    message: "Debe especificar un valor porcentual y/o un valor fijo",
  }
);

// Legacy commission range schema (deprecated but kept for backward compatibility)
export const commissionRangeSchema = z.object({
  minAmount: z.number().min(0, "El monto mínimo debe ser mayor o igual a 0"),
  maxAmount: z.number().min(0, "El monto máximo debe ser mayor o igual a 0"),
  percentageValue: z
    .number()
    .min(0)
    .max(1, "El porcentaje debe estar entre 0 y 1")
    .nullable(),
  fixedValue: z.number().min(0, "El valor fijo debe ser mayor o igual a 0").nullable(),
  isActive: z.boolean().default(true),
});

// Commission assignment schema (supports both new and legacy models)
export const commissionAssignmentSchema = z.object({
  merchantId: z.string().uuid("ID de merchant inválido"),
  countryCode: z
    .string()
    .length(2, "El código de país debe tener 2 caracteres")
    .toUpperCase(),
  channelCode: z.string().min(2, "Código de canal inválido"),
  // Date range for validity
  startDate: z.string().datetime({ message: "Debe especificar una fecha de inicio válida" }),
  endDate: z.string().datetime().nullable().optional(),
  // Base commission fields
  basePercentageValue: z
    .number()
    .min(0)
    .max(1, "El porcentaje debe estar entre 0 y 1")
    .nullable()
    .optional(),
  baseFixedValue: z.number().min(0, "El valor fijo debe ser mayor o igual a 0").nullable().optional(),
  // New commission structures
  minimumCommission: minimumCommissionSchema.nullable().optional(),
  tier2Commission: tier2CommissionSchema.nullable().optional(),
  // Legacy fields (deprecated)
  commissionRanges: z.array(commissionRangeSchema).optional(),
  commissionTemplateId: z.string().uuid("ID de template inválido").optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "SCHEDULED"], {
    message: "Estado inválido",
  }),
  assignedBy: z.string().email("Debe ser un email válido"),
}).refine(
  (data) => !data.endDate || new Date(data.startDate) < new Date(data.endDate),
  {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["endDate"],
  }
);

// Legacy schemas - kept for backward compatibility
export const commissionTemplateSchema = z.object({
  code: z
    .string()
    .regex(
      /^[A-Z0-9_]+$/,
      "El código debe contener solo mayúsculas, números y guiones bajos"
    )
    .min(3, "El código debe tener al menos 3 caracteres"),
  name: z
    .string()
    .min(5, "El nombre debe tener al menos 5 caracteres")
    .max(200, "El nombre no puede superar los 200 caracteres"),
  type: z.enum(["FIXED", "PERCENTAGE", "MIXED"], {
    message: "Tipo de comisión inválido",
  }),
  status: z.enum(["DRAFT", "APPROVED", "PUBLISHED"], {
    message: "Estado inválido",
  }),
  effectiveDate: z.string().datetime(),
  expirationDate: z.string().datetime().nullable(),
  createdBy: z.string().email("Debe ser un email válido"),
});

export const commissionParameterSchema = z.object({
  commissionTemplateId: z.string().uuid("ID de template inválido"),
  parameterType: z.enum(["PERCENTAGE", "FIXED_FEE", "MIN_RANGE", "MAX_RANGE"], {
    message: "Tipo de parámetro inválido",
  }),
  value: z.number().min(0, "El valor debe ser mayor o igual a 0"),
  currency: z.string().length(3, "El código de moneda debe tener 3 caracteres"),
  minRange: z.number().nullable(),
  maxRange: z.number().nullable(),
});

export const merchantTaxConfigSchema = z.object({
  merchantId: z.string().uuid("ID de merchant inválido"),
  countryCode: z
    .string()
    .length(2, "El código de país debe tener 2 caracteres")
    .toUpperCase(),
  channelCode: z.string().min(2, "Código de canal inválido"),
  taxCode: z.string().min(2, "Código de impuesto inválido").toUpperCase(),
  taxName: z.string().min(3, "Nombre de impuesto inválido"),
  rate: z
    .number()
    .min(0, "La tasa debe ser mayor o igual a 0")
    .max(1, "La tasa debe ser menor o igual a 1"),
  isActive: z.boolean(),
});

export const pspCommissionSchema = z.object({
  pspId: z.string().uuid("ID de PSP inválido"),
  pspName: z.string().min(3, "Nombre de PSP inválido"),
  countryCode: z
    .string()
    .length(2, "El código de país debe tener 2 caracteres")
    .toUpperCase(),
  channelCode: z.string().min(2, "Código de canal inválido"),
  commissionType: z.enum(["FIXED", "PERCENTAGE", "MIXED"], {
    message: "Tipo de comisión inválido",
  }),
  percentage: z.number().min(0).max(1),
  fixedFee: z.number().min(0),
  currency: z.string().length(3, "El código de moneda debe tener 3 caracteres"),
  isActive: z.boolean(),
});

export const paymentSimulationSchema = z.object({
  merchantId: z.string().uuid("ID de merchant inválido"),
  countryCode: z
    .string()
    .length(2, "El código de país debe tener 2 caracteres")
    .toUpperCase(),
  channelCode: z.string().min(2, "Código de canal inválido"),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  currency: z.string().length(3, "El código de moneda debe tener 3 caracteres"),
});

export type CommissionRangeFormData = z.infer<typeof commissionRangeSchema>;
export type CommissionAssignmentFormData = z.infer<
  typeof commissionAssignmentSchema
>;
export type MerchantTaxConfigFormData = z.infer<typeof merchantTaxConfigSchema>;
export type PSPCommissionFormData = z.infer<typeof pspCommissionSchema>;
export type PaymentSimulationFormData = z.infer<typeof paymentSimulationSchema>;

// Legacy form data types
export type CommissionTemplateFormData = z.infer<
  typeof commissionTemplateSchema
>;
export type CommissionParameterFormData = z.infer<
  typeof commissionParameterSchema
>;
