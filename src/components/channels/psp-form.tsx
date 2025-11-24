"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const pspFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  code: z.string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .regex(/^[A-Z_]+$/, "El código debe contener solo mayúsculas y guiones bajos"),
  isActive: z.boolean(),
  commissionsByChannelCountry: z.array(z.object({
    channelCode: z.string().min(1, "Seleccione un canal"),
    countryCode: z.string().length(2, "Código de país inválido"),
    commissionType: z.enum(["PERCENTAGE", "FIXED", "MIXED"]),
    percentageValue: z.string().optional(),
    fixedValue: z.string().optional(),
  })).optional(),
});

type PSPFormData = z.infer<typeof pspFormSchema>;

const AVAILABLE_COUNTRIES = ["AR", "BR", "CL", "CO", "MX", "PE", "UY", "PY", "BO", "EC", "VE"];
const AVAILABLE_CHANNELS = ["credit_card", "debit_card", "pix", "webpay", "bank_transfer"];

export function PSPForm() {
  const router = useRouter();
  const { createPSP } = useChannelsStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<PSPFormData>({
    resolver: zodResolver(pspFormSchema),
    defaultValues: {
      isActive: true,
      commissionsByChannelCountry: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "commissionsByChannelCountry",
  });

  const onSubmit = async (data: PSPFormData) => {
    try {
      const processedCommissions = data.commissionsByChannelCountry?.map(commission => ({
        channelCode: commission.channelCode,
        countryCode: commission.countryCode,
        commissionType: commission.commissionType,
        percentageValue: commission.percentageValue && commission.commissionType === "PERCENTAGE"
          ? parseFloat(commission.percentageValue) / 100
          : null,
        fixedValue: commission.fixedValue && commission.commissionType === "FIXED"
          ? parseFloat(commission.fixedValue)
          : null,
      })) || [];

      createPSP({
        name: data.name,
        code: data.code,
        isActive: data.isActive,
        commissionsByChannelCountry: processedCommissions,
      });
      router.push("/dashboard/channels");
    } catch (error) {
      console.error("Error creating PSP:", error);
    }
  };

  const getUsedCombinations = () => {
    return watch("commissionsByChannelCountry")?.map(c => `${c.channelCode}-${c.countryCode}`) || [];
  };

  const isCombinationUsed = (channelCode: string, countryCode: string, currentIndex: number) => {
    const current = watch(`commissionsByChannelCountry.${currentIndex}`);
    if (current?.channelCode === channelCode && current?.countryCode === countryCode) {
      return false;
    }
    return getUsedCombinations().includes(`${channelCode}-${countryCode}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del PSP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código del PSP *</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="Ej: PAYU, STRIPE"
                className="uppercase"
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ej: PayU, Stripe"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              PSP Activo
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* PSP Commissions by Channel+Country */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Comisiones del PSP por Canal/País (Opcional)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comisiones que el PSP cobra por cada combinación de canal y país
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({
                channelCode: "",
                countryCode: "",
                commissionType: "PERCENTAGE",
                percentageValue: "",
                fixedValue: "",
              })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Comisión
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No hay comisiones configuradas. Haga clic en "Agregar Comisión" para crear una.
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Comisión {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`commissionsByChannelCountry.${index}.channelCode`}>
                        Canal *
                      </Label>
                      <select
                        id={`commissionsByChannelCountry.${index}.channelCode`}
                        {...register(`commissionsByChannelCountry.${index}.channelCode`)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Seleccionar canal</option>
                        {AVAILABLE_CHANNELS.map(channel => (
                          <option key={channel} value={channel}>
                            {channel}
                          </option>
                        ))}
                      </select>
                      {errors.commissionsByChannelCountry?.[index]?.channelCode && (
                        <p className="text-sm text-red-500">
                          {errors.commissionsByChannelCountry[index]?.channelCode?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`commissionsByChannelCountry.${index}.countryCode`}>
                        País *
                      </Label>
                      <select
                        id={`commissionsByChannelCountry.${index}.countryCode`}
                        {...register(`commissionsByChannelCountry.${index}.countryCode`)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Seleccionar país</option>
                        {AVAILABLE_COUNTRIES.map(country => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                      {errors.commissionsByChannelCountry?.[index]?.countryCode && (
                        <p className="text-sm text-red-500">
                          {errors.commissionsByChannelCountry[index]?.countryCode?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`commissionsByChannelCountry.${index}.commissionType`}>
                        Tipo de Comisión *
                      </Label>
                      <select
                        id={`commissionsByChannelCountry.${index}.commissionType`}
                        {...register(`commissionsByChannelCountry.${index}.commissionType`)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="PERCENTAGE">Porcentual</option>
                        <option value="FIXED">Fija</option>
                      </select>
                    </div>

                    {watch(`commissionsByChannelCountry.${index}.commissionType`) === "PERCENTAGE" && (
                      <div className="space-y-2">
                        <Label htmlFor={`commissionsByChannelCountry.${index}.percentageValue`}>
                          Porcentaje (%)
                        </Label>
                        <Input
                          id={`commissionsByChannelCountry.${index}.percentageValue`}
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="Ej: 2.9"
                          {...register(`commissionsByChannelCountry.${index}.percentageValue`)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Ingrese el porcentaje (ej: 2.9 para 2.9%)
                        </p>
                      </div>
                    )}

                    {watch(`commissionsByChannelCountry.${index}.commissionType`) === "FIXED" && (
                      <div className="space-y-2">
                        <Label htmlFor={`commissionsByChannelCountry.${index}.fixedValue`}>
                          Valor Fijo
                        </Label>
                        <Input
                          id={`commissionsByChannelCountry.${index}.fixedValue`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Ej: 500"
                          {...register(`commissionsByChannelCountry.${index}.fixedValue`)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/channels")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear PSP"}
        </Button>
      </div>
    </form>
  );
}
