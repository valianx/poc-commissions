"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCommissionsStore } from "@/lib/stores/commissions.store";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, Save, Plus, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Form schema for editing
const editCommissionSchema = z.object({
  // Assignment dates
  description: z.string().optional(),
  isVat: z.boolean().optional(),
  startDate: z.string().min(1, "Fecha de inicio requerida"),
  endDate: z.string().optional(),
  status: z.enum(["ACTIVE", "SCHEDULED", "EXPIRED", "CANCELLED"]),
  basePercentageValue: z.string().optional(),
  baseFixedValue: z.string().optional(),
  assignedBy: z.string().email("Debe ser un email válido"),
  commissionRanges: z.array(z.object({
    id: z.string().optional(),
    minAmount: z.string().min(1, "Monto mínimo requerido"),
    maxAmount: z.string().min(1, "Monto máximo requerido"),
    percentageValue: z.string().optional(),
    fixedValue: z.string().optional(),
    // Ranges don't have dates, only isActive
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

type EditCommissionFormData = z.infer<typeof editCommissionSchema>;

export default function EditCommissionPage() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.merchantId as string;
  const assignmentId = params.assignmentId as string;

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
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditCommissionFormData>({
    resolver: zodResolver(editCommissionSchema),
    defaultValues: {
      description: "",
      isVat: false,
      status: "ACTIVE",
      basePercentageValue: "",
      baseFixedValue: "",
      assignedBy: "admin@zippy.com",
      commissionRanges: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "commissionRanges",
  });

  // Load assignment data when it becomes available
  useEffect(() => {
    if (assignment) {
      reset({
        description: assignment.description || "",
        isVat: assignment.isVat || false,
        status: assignment.status || "ACTIVE",
        basePercentageValue: assignment.basePercentageValue
          ? (assignment.basePercentageValue * 100).toString()
          : "",
        baseFixedValue: assignment.baseFixedValue?.toString() || "",
        startDate: assignment.startDate ? new Date(assignment.startDate).toISOString().split('T')[0] : "",
        endDate: assignment.endDate ? new Date(assignment.endDate).toISOString().split('T')[0] : "",
        assignedBy: assignment.assignedBy,
        commissionRanges: assignment.commissionRanges?.map(range => ({
          id: range.id,
          minAmount: range.minAmount.toString(),
          maxAmount: range.maxAmount.toString(),
          percentageValue: range.percentageValue
            ? (range.percentageValue * 100).toString()
            : "",
          fixedValue: range.fixedValue?.toString() || "",
        })) || [],
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
      // Process commission ranges (no dates, only isActive)
      const processedRanges = data.commissionRanges?.map(range => ({
        id: range.id || uuidv4(),
        minAmount: parseFloat(range.minAmount),
        maxAmount: parseFloat(range.maxAmount),
        percentageValue: range.percentageValue
          ? parseFloat(range.percentageValue) / 100
          : null,
        fixedValue: range.fixedValue
          ? parseFloat(range.fixedValue)
          : null,
        isActive: true, // Keep ranges active by default when editing
      })) || [];

      // Use the status from the form (manually set by user)
      const status = data.status;

      await updateAssignment(assignmentId, {
        description: data.description || undefined,
        isVat: data.isVat || false,
        startDate: data.startDate,
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
      });

      router.push(`/dashboard/commissions/${merchantId}`);
    } catch (error) {
      console.error("Error updating commission assignment:", error);
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Configuration Info (Read-only) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              <CardTitle>Información de Configuración</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">País</p>
                <p className="font-medium">{assignment.countryCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Canal</p>
                <p className="font-medium">{channel?.name || assignment.channelCode}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado *</Label>
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
                <p className="text-xs text-muted-foreground">
                  Cambie manualmente el estado de la comisión
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description Section */}
        <Card>
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
            <p className="text-sm text-muted-foreground">
              Descripción opcional del propósito de esta comisión
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
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
            </div>
          </CardContent>
        </Card>

        {/* Date Range Section */}
        <Card>
          <CardHeader>
            <CardTitle>Vigencia de la Comisión</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure el período de validez de esta comisión
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
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
                <Label htmlFor="endDate">Fecha de Fin (Opcional)</Label>
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
