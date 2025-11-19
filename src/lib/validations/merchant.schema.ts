import { z } from "zod";

export const merchantSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  code: z
    .string()
    .regex(
      /^[A-Z0-9_]+$/,
      "El código debe contener solo mayúsculas, números y guiones bajos"
    )
    .min(3, "El código debe tener al menos 3 caracteres")
    .max(50, "El código no puede superar los 50 caracteres"),
  isActive: z.boolean().default(true),
  countries: z
    .array(z.string().length(2, "Código de país debe tener 2 caracteres"))
    .min(1, "Debe seleccionar al menos un país"),
  balanceEvaluationEnabled: z.boolean().default(false),
  depositCallbackUrl: z
    .string()
    .url("Debe ser una URL válida")
    .nullable()
    .optional(),
  withdrawalCallbackUrl: z
    .string()
    .url("Debe ser una URL válida")
    .nullable()
    .optional(),
  callbackApiKeyRef: z.string().nullable().optional(),
  callbackSecretKeyRef: z.string().nullable().optional(),
});

export type MerchantFormData = z.infer<typeof merchantSchema>;
