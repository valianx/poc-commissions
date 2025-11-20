import { z } from "zod";

export const merchantChannelConfigSchema = z.object({
  merchantId: z.string().uuid("Debe ser un ID válido"),
  countryCode: z.string().length(2, "Código de país debe tener 2 caracteres"),
  channelId: z.string().uuid("Debe ser un ID válido"),
  pspId: z.string().uuid("Debe ser un ID válido"),
  isActive: z.boolean(),
});

export type MerchantChannelConfigFormData = z.infer<
  typeof merchantChannelConfigSchema
>;
