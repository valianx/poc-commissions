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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, MapPin, CreditCard, Save, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const editCommissionSchema = z.object({
  templateId: z.string().min(1, "Debe seleccionar un template de comisión"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]),
});

type EditCommissionFormData = z.infer<typeof editCommissionSchema>;

export default function EditCommissionPage() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.merchantId as string;
  const assignmentId = params.assignmentId as string;

  const {
    assignments,
    templates,
    parameters,
    fetchAssignments,
    fetchTemplates,
    fetchParameters,
    updateAssignment,
  } = useCommissionsStore();
  const { merchants, fetchMerchants } = useMerchantsStore();
  const { channels, fetchChannels } = useChannelsStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    fetchMerchants();
    fetchChannels();
    fetchAssignments();
    fetchTemplates();
    fetchParameters();
  }, [fetchMerchants, fetchChannels, fetchAssignments, fetchTemplates, fetchParameters]);

  const merchant = merchants.find((m) => m.id === merchantId);
  const assignment = assignments.find((a) => a.id === assignmentId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<EditCommissionFormData>({
    resolver: zodResolver(editCommissionSchema),
    defaultValues: {
      templateId: assignment?.commissionTemplateId || "",
      startDate: assignment?.startDate
        ? new Date(assignment.startDate).toISOString().slice(0, 16)
        : "",
      endDate: assignment?.endDate
        ? new Date(assignment.endDate).toISOString().slice(0, 16)
        : undefined,
      status: assignment?.status || "ACTIVE",
    },
  });

  useEffect(() => {
    if (assignment) {
      setValue("templateId", assignment.commissionTemplateId);
      setValue(
        "startDate",
        new Date(assignment.startDate).toISOString().slice(0, 16)
      );
      if (assignment.endDate) {
        setValue(
          "endDate",
          new Date(assignment.endDate).toISOString().slice(0, 16)
        );
      }
      setValue("status", assignment.status);
      setSelectedTemplateId(assignment.commissionTemplateId);
    }
  }, [assignment, setValue]);

  useEffect(() => {
    const templateId = watch("templateId");
    if (templateId) {
      setSelectedTemplateId(templateId);
    }
  }, [watch("templateId")]);

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

  if (!assignment) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            Configuración no encontrada
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/dashboard/commissions/${merchantId}`)}
          >
            Volver a {merchant.name}
          </Button>
        </div>
      </div>
    );
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const templateParams = selectedTemplateId
    ? parameters.filter((p) => p.commissionTemplateId === selectedTemplateId)
    : [];

  const channel = channels.find((c) => c.code === assignment.channelCode);

  const onSubmit = async (data: EditCommissionFormData) => {
    try {
      await updateAssignment(assignmentId, {
        commissionTemplateId: data.templateId,
        startDate: data.startDate,
        endDate: data.endDate || null,
        status: data.status,
      });

      // Navigate back to merchant commissions page
      router.push(`/dashboard/commissions/${merchantId}`);
    } catch (error) {
      console.error("Error updating commission assignment:", error);
    }
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
            <h1 className="text-3xl font-bold">Editar Configuración de Comisión</h1>
            <p className="text-muted-foreground">
              {merchant.name} • {merchant.code}
            </p>
          </div>
        </div>
      </div>

      {/* Warning for editing */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="flex items-center gap-3 pt-4">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <div>
            <p className="text-sm font-medium text-orange-900">
              Edición de configuración existente
            </p>
            <p className="text-sm text-orange-700">
              Los cambios afectarán todas las transacciones futuras bajo esta
              configuración
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Configuration Info (Read-only) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              <CardTitle>Configuración Actual</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>
                  <MapPin className="mr-1 inline h-4 w-4" />
                  País
                </Label>
                <div className="rounded-md border bg-muted p-3">
                  <Badge variant="outline">{assignment.countryCode}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  <CreditCard className="mr-1 inline h-4 w-4" />
                  Canal
                </Label>
                <div className="rounded-md border bg-muted p-3">
                  <p className="text-sm font-medium">
                    {channel?.name || assignment.channelCode}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Asignado por</Label>
                <div className="rounded-md border bg-muted p-3">
                  <p className="text-sm">{assignment.assignedBy}</p>
                </div>
              </div>
            </div>

            <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 p-3">
              <p className="text-sm text-blue-900">
                <strong>Nota:</strong> El país y canal no pueden ser modificados. Para
                cambiarlos, cree una nueva configuración.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Commission Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Template de Comisión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateId">Template *</Label>
              <select
                id="templateId"
                {...register("templateId")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Seleccionar template</option>
                {templates
                  .filter((t) => t.status === "APPROVED" || t.status === "PUBLISHED")
                  .map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.type})
                    </option>
                  ))}
              </select>
              {errors.templateId && (
                <p className="text-sm text-red-500">{errors.templateId.message}</p>
              )}
            </div>

            {/* Template Details */}
            {selectedTemplate && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900">
                    Detalles del Template
                  </h3>
                  <Badge
                    variant={
                      selectedTemplate.status === "PUBLISHED"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedTemplate.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Código:</span>
                    <span className="font-medium text-blue-900">
                      {selectedTemplate.code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Tipo:</span>
                    <span className="font-medium text-blue-900">
                      {selectedTemplate.type}
                    </span>
                  </div>

                  {templateParams.length > 0 && (
                    <div className="mt-3 rounded-md border border-blue-300 bg-white p-3">
                      <p className="mb-2 text-sm font-medium text-blue-900">
                        Parámetros
                      </p>
                      {templateParams.map((param) => (
                        <div
                          key={param.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {param.parameterType === "PERCENTAGE"
                              ? "Porcentaje"
                              : "Tarifa Fija"}
                            :
                          </span>
                          <span className="font-mono font-semibold">
                            {param.parameterType === "PERCENTAGE"
                              ? `${(param.value * 100).toFixed(2)}%`
                              : `${param.value} ${param.currency}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validity Period and Status */}
        <Card>
          <CardHeader>
            <CardTitle>Vigencia y Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register("startDate")}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Fin (Opcional)</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...register("endDate")}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <select
                id="status"
                {...register("status")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ACTIVE">Activa</option>
                <option value="EXPIRED">Expirada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
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
