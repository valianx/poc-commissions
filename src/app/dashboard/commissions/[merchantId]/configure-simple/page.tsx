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
import { v4 as uuidv4 } from "uuid";

// Form schema with commission ranges
const configureSimpleCommissionSchema = z.object({
  countryCode: z.string().length(2, "Código de país inválido"),
  channelCode: z.string().min(1, "Debe seleccionar un canal"),
  description: z.string().optional(),
  isVat: z.boolean().optional(),
  // Assignment dates (required)
  startDate: z.string().min(1, "Fecha de inicio requerida"),
  endDate: z.string().optional(),
  basePercentageValue: z.string().optional(),
  baseFixedValue: z.string().optional(),
  assignedBy: z.string().email("Debe ser un email válido"),
  commissionRanges: z.array(z.object({
    minAmount: z.string().min(1, "Monto mínimo requerido"),
    maxAmount: z.string().min(1, "Monto máximo requerido"),
    percentageValue: z.string().optional(),
    fixedValue: z.string().optional(),
    // Ranges don't have dates, only isActive flag
  })).optional(),
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
    control,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ConfigureSimpleCommissionFormData>({
    resolver: zodResolver(configureSimpleCommissionSchema),
    defaultValues: {
      countryCode: preSelectedCountry || "",
      channelCode: preSelectedChannel || "",
      description: "",
      isVat: false,
      startDate: new Date().toISOString().split('T')[0], // Today's date
      endDate: "",
      assignedBy: "admin@zippy.com",
      commissionRanges: [],
    },
  });

  // Log validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("🔴 Validation errors:", errors);
    }
  }, [errors]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "commissionRanges",
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

  const onSubmit = (data: ConfigureSimpleCommissionFormData) => {
    try {
      setSaveError(null);
      console.log("📝 Form data received:", data);

      // Process commission ranges (no dates, only isActive)
      const processedRanges = data.commissionRanges?.map(range => ({
        id: uuidv4(),
        minAmount: parseFloat(range.minAmount),
        maxAmount: parseFloat(range.maxAmount),
        percentageValue: range.percentageValue
          ? parseFloat(range.percentageValue) / 100
          : null,
        fixedValue: range.fixedValue
          ? parseFloat(range.fixedValue)
          : null,
        isActive: true, // Ranges are active by default
      })) || [];

      // Calculate status based on dates
      const startDate = data.startDate || new Date().toISOString();
      const now = new Date();
      const start = new Date(startDate);
      let status: "ACTIVE" | "SCHEDULED" | "EXPIRED" | "CANCELLED" = "ACTIVE";

      if (start > now) {
        status = "SCHEDULED";
      }

      const assignmentData = {
        merchantId,
        countryCode: data.countryCode,
        channelCode: data.channelCode,
        description: data.description || undefined,
        isVat: data.isVat || false,
        startDate,
        endDate: data.endDate || null,
        basePercentageValue: data.basePercentageValue
          ? parseFloat(data.basePercentageValue) / 100
          : null,
        baseFixedValue: data.baseFixedValue
          ? parseFloat(data.baseFixedValue)
          : null,
        commissionRanges: processedRanges,
        status,
        assignedBy: data.assignedBy,
      };

      console.log("💾 Saving assignment:", assignmentData);

      createAssignment(assignmentData);

      console.log("✅ Assignment created, refetching...");

      // Refetch to ensure we have the latest data
      fetchAssignments();

      console.log("🔄 Redirecting to:", `/dashboard/commissions/${merchantId}`);

      router.push(`/dashboard/commissions/${merchantId}`);
    } catch (error) {
      console.error("❌ Error creating commission assignment:", error);
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
        console.log("🔴 Form validation failed:", errors);
        setSaveError("Por favor complete todos los campos requeridos correctamente");
      })} className="space-y-6">
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
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción (Opcional)
              </Label>
              <Input
                id="description"
                type="text"
                {...register("description")}
                placeholder="Ej: Comisión especial para promoción navideña"
              />
              <p className="text-xs text-muted-foreground">
                Agregue una descripción opcional para explicar el propósito de esta comisión
              </p>
            </div>

            {/* Is VAT Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                id="isVat"
                type="checkbox"
                {...register("isVat")}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <Label htmlFor="isVat" className="cursor-pointer font-normal">
                Esta es una comisión de impuesto (VAT/IVA)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Si marca esta opción, la comisión se aplicará sobre la comisión de Zippy en lugar del monto total de la transacción
            </p>

            {/* Date Range Section */}
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-blue-900">Vigencia de la Comisión</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Fecha de Inicio *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register("startDate")}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Fecha desde la cual esta comisión estará vigente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    Fecha de Fin (Opcional)
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...register("endDate")}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-500">{errors.endDate.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Dejar vacío para comisión sin fecha de expiración
                  </p>
                </div>
              </div>
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
          </CardContent>
        </Card>

        {/* Base Commission Values */}
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

        {/* Commission Ranges */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comisiones por Rango de Monto (Opcional)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estas comisiones especiales pisan la comisión base cuando el monto de la transacción
                  cae dentro del rango y está dentro de las fechas de vigencia
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({
                  minAmount: "",
                  maxAmount: "",
                  percentageValue: "",
                  fixedValue: "",
                })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Rango
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No hay rangos de comisión configurados. Haga clic en "Agregar Rango" para crear uno.
              </p>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Rango {index + 1}</h4>
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
                        <Label htmlFor={`commissionRanges.${index}.minAmount`}>
                          Monto Mínimo *
                        </Label>
                        <Input
                          id={`commissionRanges.${index}.minAmount`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Ej: 1000"
                          {...register(`commissionRanges.${index}.minAmount`)}
                        />
                        {errors.commissionRanges?.[index]?.minAmount && (
                          <p className="text-sm text-red-500">
                            {errors.commissionRanges[index]?.minAmount?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`commissionRanges.${index}.maxAmount`}>
                          Monto Máximo *
                        </Label>
                        <Input
                          id={`commissionRanges.${index}.maxAmount`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Ej: 5000"
                          {...register(`commissionRanges.${index}.maxAmount`)}
                        />
                        {errors.commissionRanges?.[index]?.maxAmount && (
                          <p className="text-sm text-red-500">
                            {errors.commissionRanges[index]?.maxAmount?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`commissionRanges.${index}.percentageValue`}>
                          Comisión Porcentual (%)
                        </Label>
                        <Input
                          id={`commissionRanges.${index}.percentageValue`}
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="Ej: 2.5"
                          {...register(`commissionRanges.${index}.percentageValue`)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`commissionRanges.${index}.fixedValue`}>
                          Comisión Fija
                        </Label>
                        <Input
                          id={`commissionRanges.${index}.fixedValue`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Ej: 300"
                          {...register(`commissionRanges.${index}.fixedValue`)}
                        />
                      </div>
                    </div>

                    <div className="rounded-md border border-amber-200 bg-amber-50 p-2">
                      <p className="text-xs text-amber-900">
                        Al menos uno de los valores de comisión (porcentaje o fijo) debe ser especificado
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
