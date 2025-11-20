import { z } from "zod";

export const pspAssignmentSchema = z.object({
  countryCode: z.string().length(2, "Código de país debe tener 2 caracteres"),
  pspId: z.string().uuid("Debe ser un ID válido"),
  isActive: z.boolean(),
});

export const channelSchema = z.object({
  code: z
    .string()
    .regex(
      /^[a-z0-9_]+$/,
      "El código debe contener solo minúsculas, números y guiones bajos"
    )
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(50, "El código no puede superar los 50 caracteres"),
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(500, "La descripción no puede superar los 500 caracteres"),
  isActive: z.boolean(),
  pspAssignments: z.array(pspAssignmentSchema),
});

export const pspSchema = z.object({
  code: z
    .string()
    .regex(
      /^[A-Z0-9_]+$/,
      "El código debe contener solo mayúsculas, números y guiones bajos"
    )
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(50, "El código no puede superar los 50 caracteres"),
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  apiUrl: z
    .string()
    .url("Debe ser una URL válida")
    .optional(),
  isActive: z.boolean(),
});

export type ChannelFormData = z.infer<typeof channelSchema>;
export type PSPFormData = z.infer<typeof pspSchema>;
