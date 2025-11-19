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
  isActive: z.boolean(),
  countries: z
    .array(z.string().length(2, "Código de país debe tener 2 caracteres"))
    .min(1, "Debe seleccionar al menos un país"),
  balanceEvaluationEnabled: z.boolean(),
  depositCallbackUrl: z
    .string()
    .url("Debe ser una URL válida")
    .nullable(),
  withdrawalCallbackUrl: z
    .string()
    .url("Debe ser una URL válida")
    .nullable(),
  callbackApiKeyRef: z.string().nullable(),
  callbackSecretKeyRef: z.string().nullable(),
});

export type MerchantFormData = z.infer<typeof merchantSchema>;
