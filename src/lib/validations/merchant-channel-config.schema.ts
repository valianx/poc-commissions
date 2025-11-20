import { z } from "zod";

export const channelTaxSchema = z.object({
  taxCode: z.string().min(1, "Código de impuesto requerido"),
  taxName: z.string().min(1, "Nombre de impuesto requerido"),
  rate: z.number().min(0, "Tasa debe ser mayor o igual a 0").max(1, "Tasa debe ser menor o igual a 1"),
  isActive: z.boolean(),
});

export const merchantChannelConfigSchema = z.object({
  merchantId: z.string().uuid("Debe ser un ID válido"),
  countryCode: z.string().length(2, "Código de país debe tener 2 caracteres"),
  channelId: z.string().uuid("Debe ser un ID válido"),
  pspId: z.string().uuid("Debe ser un ID válido"),
  taxes: z.array(channelTaxSchema).default([]),
  isActive: z.boolean(),
});

export type ChannelTaxFormData = z.infer<typeof channelTaxSchema>;
export type MerchantChannelConfigFormData = z.infer<
  typeof merchantChannelConfigSchema
>;
