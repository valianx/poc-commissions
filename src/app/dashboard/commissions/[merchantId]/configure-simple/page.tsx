"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCommissionsStore } from "@/lib/stores/commissions.store";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { useMerchantChannelConfigStore } from "@/lib/stores/merchant-channel-config.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, MapPin, CreditCard, Save, Plus, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { commissionAssignmentSchema } from "@/lib/validations/commission.schema";
import { v4 as uuidv4 } from "uuid";

// Simplified form schema (without ranges for now, we'll add them later)
const configureSimpleCommissionSchema = z.object({
  countryCode: z.string().length(2, "Código de país inválido"),
  channelCode: z.string().min(1, "Debe seleccionar un canal"),
  basePercentageValue: z.string().optional(),
  baseFixedValue: z.string().optional(),
  assignedBy: z.string().email("Debe ser un email válido"),
}).refine(
  (data) => data.basePercentageValue || data.baseFixedValue,
  {
    message: "Debe especificar al menos un valor de comisión (porcentaje o fijo)",
    path: ["basePercentageValue"],
  }
);

type ConfigureSimpleCommissionFormData = z.infer<typeof configureSimpleCommissionSchema>;

export default function ConfigureSimpleCommissionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const merchantId = params.merchantId as string;

  // Get pre-selected values from URL params
  const preSelectedCountry = searchParams.get("country");
  const preSelectedChannel = searchParams.get("channel");

  const { createAssignment } = useCommissionsStore();
  const { merchants, fetchMerchants } = useMerchantsStore();
  const { channels, fetchChannels } = useChannelsStore();
  const { fetchConfigs, getConfigsByMerchant } =
    useMerchantChannelConfigStore();

  useEffect(() => {
    fetchMerchants();
    fetchChannels();
    fetchConfigs();
  }, [fetchMerchants, fetchChannels, fetchConfigs]);

  const merchant = merchants.find((m) => m.id === merchantId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ConfigureSimpleCommissionFormData>({
    resolver: zodResolver(configureSimpleCommissionSchema),
    defaultValues: {
      countryCode: preSelectedCountry || "",
      channelCode: preSelectedChannel || "",
      assignedBy: "admin@zippy.com",
    },
  });

  const selectedCountry = watch("countryCode");
  const selectedChannel = watch("channelCode");

  // Get merchant's configured channels
  const merchantConfigs = getConfigsByMerchant(merchantId);

  // Filter channels based on merchant config and selected country
  const getAvailableChannels = () => {
    if (!selectedCountry) {
      const configuredChannelIds = merchantConfigs
        .filter((c) => c.isActive)
        .map((c) => c.channelId);
      return channels.filter((ch) => configuredChannelIds.includes(ch.id));
    }

    const configsForCountry = merchantConfigs.filter(
      (c) => c.countryCode === selectedCountry && c.isActive
    );

    const channelIds = configsForCountry.map((c) => c.channelId);
    return channels.filter((ch) => channelIds.includes(ch.id));
  };

  const availableChannels = getAvailableChannels();

  if (!merchant) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Merchant no encontrado</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/dashboard/commissions")}
          >
            Volver a Comisiones
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ConfigureSimpleCommissionFormData) => {
    try {
      await createAssignment({
        merchantId,
        countryCode: data.countryCode,
        channelCode: data.channelCode,
        basePercentageValue: data.basePercentageValue
          ? parseFloat(data.basePercentageValue) / 100
          : null,
        baseFixedValue: data.baseFixedValue
          ? parseFloat(data.baseFixedValue)
          : null,
        commissionRanges: [],
        status: "ACTIVE",
        assignedBy: data.assignedBy,
      });

      router.push(`/dashboard/commissions/${merchantId}`);
    } catch (error) {
      console.error("Error creating commission assignment:", error);
    }
  };

  const getChannelName = (code: string) => {
    return channels.find((c) => c.code === code)?.name || code;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/commissions/${merchantId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nueva Configuración de Comisión</h1>
            <p className="text-muted-foreground">
              {merchant.name} • {merchant.code}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Merchant and Selection Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              <CardTitle>Configuración Base</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Country Selection */}
              <div className="space-y-2">
                <Label htmlFor="countryCode">
                  <MapPin className="mr-1 inline h-4 w-4" />
                  País *
                </Label>
                <select
                  id="countryCode"
                  {...register("countryCode")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Seleccionar país</option>
                  {merchant.countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {errors.countryCode && (
                  <p className="text-sm text-red-500">{errors.countryCode.message}</p>
                )}
              </div>

              {/* Channel Selection */}
              <div className="space-y-2">
                <Label htmlFor="channelCode">
                  <CreditCard className="mr-1 inline h-4 w-4" />
                  Canal *
                </Label>
                <select
                  id="channelCode"
                  {...register("channelCode")}
                  disabled={!selectedCountry}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">
                    {!selectedCountry
                      ? "Primero seleccione un país"
                      : availableChannels.length === 0
                      ? "No hay canales configurados para este país"
                      : "Seleccionar canal"}
                  </option>
                  {availableChannels.map((channel) => (
                    <option key={channel.code} value={channel.code}>
                      {channel.name}
                    </option>
                  ))}
                </select>
                {errors.channelCode && (
                  <p className="text-sm text-red-500">{errors.channelCode.message}</p>
                )}
                {selectedCountry && availableChannels.length === 0 && (
                  <p className="text-sm text-amber-600">
                    Este merchant no tiene canales configurados para {selectedCountry}.
                    Configure canales en la página del merchant.
                  </p>
                )}
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label>Configurando</Label>
                <div className="rounded-md border bg-muted p-3">
                  <p className="text-sm font-medium">
                    {selectedCountry && selectedChannel ? (
                      <>
                        {selectedCountry} • {getChannelName(selectedChannel)}
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Seleccione país y canal
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Values */}
        <Card>
          <CardHeader>
            <CardTitle>Comisión Base (Permanente)</CardTitle>
            <p className="text-sm text-muted-foreground">
              La comisión base aplica siempre y no tiene fecha de vencimiento
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="basePercentageValue">Comisión Porcentual (%)</Label>
                <Input
                  id="basePercentageValue"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Ej: 3.5"
                  {...register("basePercentageValue")}
                />
                <p className="text-xs text-muted-foreground">
                  Ingrese el porcentaje (ej: 3.5 para 3.5%)
                </p>
                {errors.basePercentageValue && (
                  <p className="text-sm text-red-500">{errors.basePercentageValue.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseFixedValue">Comisión Fija</Label>
                <Input
                  id="baseFixedValue"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 500"
                  {...register("baseFixedValue")}
                />
                <p className="text-xs text-muted-foreground">
                  Ingrese el monto fijo en la moneda del país
                </p>
                {errors.baseFixedValue && (
                  <p className="text-sm text-red-500">{errors.baseFixedValue.message}</p>
                )}
              </div>
            </div>

            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-900">
                <strong>Nota:</strong> Puede configurar solo porcentaje, solo fijo, o ambos.
                Si configura ambos, se aplicarán las dos comisiones.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Assigned By */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Asignación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignedBy">Asignado Por *</Label>
              <Input
                id="assignedBy"
                type="email"
                {...register("assignedBy")}
                placeholder="admin@zippy.com"
              />
              {errors.assignedBy && (
                <p className="text-sm text-red-500">{errors.assignedBy.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/commissions/${merchantId}`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </form>
    </div>
  );
}
