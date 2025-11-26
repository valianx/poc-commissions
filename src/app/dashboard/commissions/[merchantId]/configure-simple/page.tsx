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
import { ArrowLeft, Building2, MapPin, CreditCard, Save, TrendingUp } from "lucide-react";
import { CollapsibleInfo } from "@/components/ui/collapsible-info";
import { RequiredIndicator } from "@/components/ui/required-indicator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Form schema with minimum commission and tier 2
const configureSimpleCommissionSchema = z.object({
  countryCode: z.string().length(2, "Código de país inválido"),
  channelCode: z.string().min(1, "Debe seleccionar un canal"),
  description: z.string().optional(),
  vatPercentage: z.string().optional(),
  // Assignment dates (required)
  startDate: z.string().min(1, "Fecha de inicio requerida"),
  endDate: z.string().optional(),
  basePercentageValue: z.string().optional(),
  baseFixedValue: z.string().optional(),
  // Minimum commission (optional - single range)
  enableMinimumCommission: z.boolean().optional(),
  minTransactionAmount: z.string().optional(),
  maxTransactionAmount: z.string().optional(),
  minPercentageValue: z.string().optional(),
  minFixedValue: z.string().optional(),
  // Tier 2 commission (optional)
  enableTier2: z.boolean().optional(),
  tier2CumulativeThreshold: z.string().optional(),
  tier2PercentageValue: z.string().optional(),
  tier2FixedValue: z.string().optional(),
}).refine(
  (data) => data.basePercentageValue || data.baseFixedValue,
  {
    message: "Debe especificar al menos un valor de comisión (porcentaje o fijo)",
    path: ["basePercentageValue"],
  }
).refine(
  (data) => !data.endDate || new Date(data.startDate) < new Date(data.endDate),
  {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["endDate"],
  }
).refine(
  (data) => {
    if (data.enableMinimumCommission) {
      return data.minTransactionAmount && data.maxTransactionAmount && (data.minPercentageValue || data.minFixedValue);
    }
    return true;
  },
  {
    message: "Debe completar todos los campos de comisión mínima",
    path: ["minTransactionAmount"],
  }
).refine(
  (data) => {
    if (data.enableTier2) {
      return data.tier2CumulativeThreshold && (data.tier2PercentageValue || data.tier2FixedValue);
    }
    return true;
  },
  {
    message: "Debe completar todos los campos de Tier 2",
    path: ["tier2CumulativeThreshold"],
  }
);

type ConfigureSimpleCommissionFormData = z.infer<typeof configureSimpleCommissionSchema>;

export default function ConfigureSimpleCommissionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const merchantId = params.merchantId as string;
  const [saveError, setSaveError] = useState<string | null>(null);

  // Get pre-selected values from URL params
  const preSelectedCountry = searchParams.get("country");
  const preSelectedChannel = searchParams.get("channel");

  const { createAssignment, fetchAssignments } = useCommissionsStore();
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
    setValue,
  } = useForm<ConfigureSimpleCommissionFormData>({
    resolver: zodResolver(configureSimpleCommissionSchema),
    defaultValues: {
      countryCode: preSelectedCountry || "",
      channelCode: preSelectedChannel || "",
      description: "",
      vatPercentage: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      enableMinimumCommission: false,
      minTransactionAmount: "",
      maxTransactionAmount: "",
      minPercentageValue: "",
      minFixedValue: "",
      enableTier2: false,
      tier2CumulativeThreshold: "",
      tier2PercentageValue: "",
      tier2FixedValue: "",
    },
  });

  // Log validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
    }
  }, [errors]);

  const selectedCountry = watch("countryCode");
  const selectedChannel = watch("channelCode");
  const enableMinimumCommission = watch("enableMinimumCommission");
  const enableTier2 = watch("enableTier2");

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

  const onSubmit = (data: ConfigureSimpleCommissionFormData) => {
    try {
      setSaveError(null);

      // Calculate status based on dates
      const startDate = data.startDate || new Date().toISOString();
      const now = new Date();
      const start = new Date(startDate);
      let status: "ACTIVE" | "SCHEDULED" | "EXPIRED" | "CANCELLED" = "ACTIVE";

      if (start > now) {
        status = "SCHEDULED";
      }

      // Build minimum commission if enabled
      const minimumCommission = data.enableMinimumCommission && data.minTransactionAmount && data.maxTransactionAmount
        ? {
            minTransactionAmount: parseFloat(data.minTransactionAmount),
            maxTransactionAmount: parseFloat(data.maxTransactionAmount),
            percentageValue: data.minPercentageValue
              ? parseFloat(data.minPercentageValue) / 100
              : null,
            fixedValue: data.minFixedValue
              ? parseFloat(data.minFixedValue)
              : null,
            isActive: true,
          }
        : null;

      // Build tier 2 commission if enabled
      const tier2Commission = data.enableTier2 && data.tier2CumulativeThreshold
        ? {
            cumulativeThreshold: parseFloat(data.tier2CumulativeThreshold),
            percentageValue: data.tier2PercentageValue
              ? parseFloat(data.tier2PercentageValue) / 100
              : null,
            fixedValue: data.tier2FixedValue
              ? parseFloat(data.tier2FixedValue)
              : null,
            isActive: true,
          }
        : null;

      const assignmentData = {
        merchantId,
        countryCode: data.countryCode,
        channelCode: data.channelCode,
        description: data.description || undefined,
        vatPercentage: data.vatPercentage
          ? parseFloat(data.vatPercentage) / 100
          : null,
        startDate,
        endDate: data.endDate || null,
        basePercentageValue: data.basePercentageValue
          ? parseFloat(data.basePercentageValue) / 100
          : null,
        baseFixedValue: data.baseFixedValue
          ? parseFloat(data.baseFixedValue)
          : null,
        minimumCommission,
        tier2Commission,
        status,
        assignedBy: "admin@zippy.com",
      };

      createAssignment(assignmentData);
      fetchAssignments();
      router.push(`/dashboard/commissions/${merchantId}`);
    } catch (error) {
      console.error("Error creating commission assignment:", error);
      setSaveError(error instanceof Error ? error.message : "Error al guardar la comisión");
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

      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log("Form validation failed:", errors);
        setSaveError("Por favor complete todos los campos requeridos correctamente");
      })} className="space-y-6">
        {/* General Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              <CardTitle>Configuración General</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Country and Channel Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="countryCode">
                  <MapPin className="mr-1 inline h-4 w-4" />
                  País<RequiredIndicator />
                </Label>
                <select
                  id="countryCode"
                  {...register("countryCode")}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

              <div className="space-y-1">
                <Label htmlFor="channelCode">
                  <CreditCard className="mr-1 inline h-4 w-4" />
                  Canal<RequiredIndicator />
                </Label>
                <select
                  id="channelCode"
                  {...register("channelCode")}
                  disabled={!selectedCountry}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">
                    {!selectedCountry
                      ? "Primero seleccione un país"
                      : availableChannels.length === 0
                      ? "No hay canales configurados"
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
                  <p className="text-xs text-amber-600">
                    No hay canales configurados para {selectedCountry}.
                  </p>
                )}
              </div>
            </div>

            {/* Description and VAT */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  type="text"
                  {...register("description")}
                  placeholder="Ej: Comisión promoción navideña"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vatPercentage">VAT/IVA %</Label>
                <Input
                  id="vatPercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register("vatPercentage")}
                  placeholder="Ej: 19"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="startDate">Fecha de Inicio<RequiredIndicator /></Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate">Fecha de Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Created By */}
            <div className="space-y-1">
              <Label>Creado Por</Label>
              <p className="text-sm font-medium py-2">admin@zippy.com</p>
            </div>
          </CardContent>
        </Card>

        {/* Base Commission Values */}
        <Card>
          <CardHeader>
            <CardTitle>Comisión Base</CardTitle>
            <p className="text-sm text-muted-foreground">
              La comisión estándar que se aplica a todas las transacciones
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
              </div>
            </div>

            <CollapsibleInfo title="Nota" variant="info">
              Puede configurar solo porcentaje, solo fijo, o ambos.
            </CollapsibleInfo>
          </CardContent>
        </Card>

        {/* Minimum Commission - for small transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comisión por Rango Mínimo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Aplica una comisión diferente para transacciones de monto bajo (dentro del rango especificado)
                </p>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("enableMinimumCommission")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Habilitar</span>
              </label>
            </div>
          </CardHeader>
          {enableMinimumCommission && (
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minTransactionAmount">Desde (monto mínimo)<RequiredIndicator /></Label>
                  <Input
                    id="minTransactionAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 0"
                    {...register("minTransactionAmount")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Transacciones mayores o iguales a este monto
                  </p>
                  {errors.minTransactionAmount && (
                    <p className="text-sm text-red-500">{errors.minTransactionAmount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTransactionAmount">Hasta (monto máximo)<RequiredIndicator /></Label>
                  <Input
                    id="maxTransactionAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 100000"
                    {...register("maxTransactionAmount")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Transacciones menores o iguales a este monto
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minPercentageValue">Comisión para este rango (%)</Label>
                  <Input
                    id="minPercentageValue"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="Ej: 6"
                    {...register("minPercentageValue")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minFixedValue">Comisión Fija para este rango</Label>
                  <Input
                    id="minFixedValue"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 200"
                    {...register("minFixedValue")}
                  />
                </div>
              </div>

              <CollapsibleInfo title="¿Cómo funciona?" variant="info">
                Si la transacción está dentro de este rango, se aplica esta comisión.
                Si está fuera del rango, se aplica la Comisión Base.
                <br /><br />
                <strong>Ejemplo:</strong> Rango 0-100,000 con 6% → transacciones hasta $100,000 cobran 6%. Superiores a $100,000 cobran la Comisión Base.
              </CollapsibleInfo>
            </CardContent>
          )}
        </Card>

        {/* Tier 2 Commission */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <CardTitle>Comisión Tier 2</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Se activa cuando el merchant alcanza un monto acumulado de transacciones en este canal/país
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("enableTier2")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Habilitar</span>
              </label>
            </div>
          </CardHeader>
          {enableTier2 && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tier2CumulativeThreshold">Umbral Acumulado<RequiredIndicator /></Label>
                <Input
                  id="tier2CumulativeThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 1000000"
                  {...register("tier2CumulativeThreshold")}
                />
                <p className="text-xs text-muted-foreground">
                  Suma total de transacciones en el canal/país para desbloquear Tier 2
                </p>
                {errors.tier2CumulativeThreshold && (
                  <p className="text-sm text-red-500">{errors.tier2CumulativeThreshold.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tier2PercentageValue">Comisión Tier 2 Porcentual (%)</Label>
                  <Input
                    id="tier2PercentageValue"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="Ej: 2.0"
                    {...register("tier2PercentageValue")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tier2FixedValue">Comisión Tier 2 Fija</Label>
                  <Input
                    id="tier2FixedValue"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 300"
                    {...register("tier2FixedValue")}
                  />
                </div>
              </div>

              <CollapsibleInfo title="¿Cómo funciona?" variant="success">
                Si el umbral es 1,000,000 y el merchant ya procesó esa cantidad en este canal/país,
                se aplicará la comisión Tier 2 en lugar de la base.
              </CollapsibleInfo>
            </CardContent>
          )}
        </Card>

        {/* Error Message */}
        {saveError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">{saveError}</p>
              </div>
            </CardContent>
          </Card>
        )}

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
