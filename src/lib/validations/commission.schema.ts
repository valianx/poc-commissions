import { z } from "zod";

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
    errorMap: () => ({ message: "Tipo de comisión inválido" }),
  }),
  status: z
    .enum(["DRAFT", "APPROVED", "PUBLISHED"], {
      errorMap: () => ({ message: "Estado inválido" }),
    })
    .default("DRAFT"),
  effectiveDate: z.string().datetime(),
  expirationDate: z.string().datetime().nullable().optional(),
  createdBy: z.string().email("Debe ser un email válido"),
});

export const commissionParameterSchema = z.object({
  commissionTemplateId: z.string().uuid("ID de template inválido"),
  parameterType: z.enum(["PERCENTAGE", "FIXED_FEE", "MIN_RANGE", "MAX_RANGE"], {
    errorMap: () => ({ message: "Tipo de parámetro inválido" }),
  }),
  value: z.number().min(0, "El valor debe ser mayor o igual a 0"),
  currency: z.string().length(3, "El código de moneda debe tener 3 caracteres"),
  minRange: z.number().nullable().optional(),
  maxRange: z.number().nullable().optional(),
});

export const commissionAssignmentSchema = z.object({
  commissionTemplateId: z.string().uuid("ID de template inválido"),
  merchantId: z.string().uuid("ID de merchant inválido"),
  countryCode: z
    .string()
    .length(2, "El código de país debe tener 2 caracteres")
    .toUpperCase(),
  channelCode: z.string().min(2, "Código de canal inválido"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  status: z
    .enum(["ACTIVE", "EXPIRED", "CANCELLED"], {
      errorMap: () => ({ message: "Estado inválido" }),
    })
    .default("ACTIVE"),
  assignedBy: z.string().email("Debe ser un email válido"),
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
  isActive: z.boolean().default(true),
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
    errorMap: () => ({ message: "Tipo de comisión inválido" }),
  }),
  percentage: z.number().min(0).max(1).default(0),
  fixedFee: z.number().min(0).default(0),
  currency: z.string().length(3, "El código de moneda debe tener 3 caracteres"),
  isActive: z.boolean().default(true),
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

export type CommissionTemplateFormData = z.infer<
  typeof commissionTemplateSchema
>;
export type CommissionParameterFormData = z.infer<
  typeof commissionParameterSchema
>;
export type CommissionAssignmentFormData = z.infer<
  typeof commissionAssignmentSchema
>;
export type MerchantTaxConfigFormData = z.infer<typeof merchantTaxConfigSchema>;
export type PSPCommissionFormData = z.infer<typeof pspCommissionSchema>;
export type PaymentSimulationFormData = z.infer<typeof paymentSimulationSchema>;
