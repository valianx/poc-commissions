"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCommissionsStore } from "@/lib/stores/commissions.store";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, Save, TrendingUp } from "lucide-react";
import { CollapsibleInfo } from "@/components/ui/collapsible-info";
import { RequiredIndicator } from "@/components/ui/required-indicator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Form schema for editing - matches the new commission structure
const editCommissionSchema = z.object({
  // Assignment dates
  description: z.string().optional(),
  vatPercentage: z.string().optional(),
  startDate: z.string().min(1, "Fecha de inicio requerida"),
  endDate: z.string().optional(),
  status: z.enum(["ACTIVE", "SCHEDULED", "EXPIRED", "CANCELLED"]),
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
    message: "Debe completar todos los campos de comisión por rango mínimo",
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

type EditCommissionFormData = z.infer<typeof editCommissionSchema>;

export default function EditCommissionPage() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.merchantId as string;
  const assignmentId = params.assignmentId as string;
  const [saveError, setSaveError] = useState<string | null>(null);

  const { assignments, updateAssignment, fetchAssignments } = useCommissionsStore();
  const { merchants, fetchMerchants } = useMerchantsStore();
  const { channels, fetchChannels } = useChannelsStore();

  useEffect(() => {
    fetchMerchants();
    fetchChannels();
    fetchAssignments();
  }, [fetchMerchants, fetchChannels, fetchAssignments]);

  const assignment = assignments.find((a) => a.id === assignmentId);
  const merchant = merchants.find((m) => m.id === merchantId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<EditCommissionFormData>({
    resolver: zodResolver(editCommissionSchema),
    defaultValues: {
      description: "",
      vatPercentage: "",
      status: "ACTIVE",
      basePercentageValue: "",
      baseFixedValue: "",
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

  const enableMinimumCommission = watch("enableMinimumCommission");
  const enableTier2 = watch("enableTier2");

  // Load assignment data when it becomes available
  useEffect(() => {
    if (assignment) {
      const hasMinimumCommission = !!(assignment.minimumCommission && assignment.minimumCommission.isActive);
      const hasTier2 = !!(assignment.tier2Commission && assignment.tier2Commission.isActive);

      reset({
        description: assignment.description || "",
        vatPercentage: assignment.vatPercentage
          ? (assignment.vatPercentage * 100).toString()
          : "",
        status: assignment.status || "ACTIVE",
        basePercentageValue: assignment.basePercentageValue
          ? (assignment.basePercentageValue * 100).toString()
          : "",
        baseFixedValue: assignment.baseFixedValue?.toString() || "",
        startDate: assignment.startDate ? new Date(assignment.startDate).toISOString().split('T')[0] : "",
        endDate: assignment.endDate ? new Date(assignment.endDate).toISOString().split('T')[0] : "",
        // Minimum commission
        enableMinimumCommission: hasMinimumCommission,
        minTransactionAmount: hasMinimumCommission
          ? assignment.minimumCommission!.minTransactionAmount.toString()
          : "",
        maxTransactionAmount: hasMinimumCommission
          ? assignment.minimumCommission!.maxTransactionAmount.toString()
          : "",
        minPercentageValue: hasMinimumCommission && assignment.minimumCommission!.percentageValue
          ? (assignment.minimumCommission!.percentageValue * 100).toString()
          : "",
        minFixedValue: hasMinimumCommission && assignment.minimumCommission!.fixedValue
          ? assignment.minimumCommission!.fixedValue.toString()
          : "",
        // Tier 2
        enableTier2: hasTier2,
        tier2CumulativeThreshold: hasTier2
          ? assignment.tier2Commission!.cumulativeThreshold.toString()
          : "",
        tier2PercentageValue: hasTier2 && assignment.tier2Commission!.percentageValue
          ? (assignment.tier2Commission!.percentageValue * 100).toString()
          : "",
        tier2FixedValue: hasTier2 && assignment.tier2Commission!.fixedValue
          ? assignment.tier2Commission!.fixedValue.toString()
          : "",
      });
    }
  }, [assignment, reset]);

  if (!assignment || !merchant) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            {!assignment ? "Configuración no encontrada" : "Merchant no encontrado"}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/dashboard/commissions/${merchantId}`)}
          >
            Volver a Configuraciones
          </Button>
        </div>
      </div>
    );
  }

  const channel = channels.find((c) => c.code === assignment.channelCode);

  const onSubmit = async (data: EditCommissionFormData) => {
    try {
      setSaveError(null);

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

      await updateAssignment(assignmentId, {
        description: data.description || undefined,
        vatPercentage: data.vatPercentage
          ? parseFloat(data.vatPercentage) / 100
          : null,
        startDate: data.startDate,
        endDate: data.endDate || null,
        basePercentageValue: data.basePercentageValue
          ? parseFloat(data.basePercentageValue) / 100
          : null,
        baseFixedValue: data.baseFixedValue
          ? parseFloat(data.baseFixedValue)
          : null,
        minimumCommission,
        tier2Commission,
        // Clear legacy ranges when using new structure
        commissionRanges: [],
        status: data.status,
        // assignedBy is not editable - keep original value
      });

      router.push(`/dashboard/commissions/${merchantId}`);
    } catch (error) {
      console.error("Error updating commission assignment:", error);
      setSaveError(error instanceof Error ? error.message : "Error al guardar la comisión");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold">Editar Comisión</h1>
          <p className="text-muted-foreground">
            {merchant.name} • {assignment.countryCode} • {channel?.name}
          </p>
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
            {/* Country, Channel, Status */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">País</p>
                <p className="font-medium">{assignment.countryCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Canal</p>
                <p className="font-medium">{channel?.name || assignment.channelCode}</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="status">Estado<RequiredIndicator /></Label>
                <select
                  id="status"
                  {...register("status")}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="SCHEDULED">Programado</option>
                  <option value="EXPIRED">Expirado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status.message}</p>
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
              <p className="text-sm font-medium py-2">{assignment.assignedBy}</p>
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
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
