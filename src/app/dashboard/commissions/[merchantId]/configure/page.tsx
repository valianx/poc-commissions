"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCommissionsStore } from "@/lib/stores/commissions.store";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, MapPin, CreditCard, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const configureCommissionSchema = z.object({
  templateId: z.string().min(1, "Debe seleccionar un template de comisión"),
  countryCode: z.string().length(2, "Código de país inválido"),
  channelCode: z.string().min(1, "Debe seleccionar un canal"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  assignedBy: z.string().email("Debe ser un email válido"),
});

type ConfigureCommissionFormData = z.infer<typeof configureCommissionSchema>;

export default function ConfigureCommissionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const merchantId = params.merchantId as string;

  // Get pre-selected values from URL params
  const preSelectedCountry = searchParams.get("country");
  const preSelectedChannel = searchParams.get("channel");

  const {
    templates,
    parameters,
    fetchTemplates,
    fetchParameters,
    createAssignment,
  } = useCommissionsStore();
  const { merchants, fetchMerchants } = useMerchantsStore();
  const { channels, fetchChannels } = useChannelsStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    fetchMerchants();
    fetchChannels();
    fetchTemplates();
    fetchParameters();
  }, [fetchMerchants, fetchChannels, fetchTemplates, fetchParameters]);

  const merchant = merchants.find((m) => m.id === merchantId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ConfigureCommissionFormData>({
    resolver: zodResolver(configureCommissionSchema),
    defaultValues: {
      countryCode: preSelectedCountry || "",
      channelCode: preSelectedChannel || "",
      startDate: new Date().toISOString().slice(0, 16),
      assignedBy: "admin@zippy.com",
    },
  });

  const selectedCountry = watch("countryCode");
  const selectedChannel = watch("channelCode");

  useEffect(() => {
    if (watch("templateId")) {
      setSelectedTemplateId(watch("templateId"));
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

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const templateParams = selectedTemplateId
    ? parameters.filter((p) => p.commissionTemplateId === selectedTemplateId)
    : [];

  const onSubmit = async (data: ConfigureCommissionFormData) => {
    try {
      await createAssignment({
        commissionTemplateId: data.templateId,
        merchantId,
        countryCode: data.countryCode,
        channelCode: data.channelCode,
        startDate: data.startDate,
        endDate: data.endDate || null,
        status: "ACTIVE",
        assignedBy: data.assignedBy,
      });

      // Navigate back to merchant commissions page
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Seleccionar canal</option>
                  {channels
                    .filter((c) => c.isActive)
                    .map((channel) => (
                      <option key={channel.code} value={channel.code}>
                        {channel.name}
                      </option>
                    ))}
                </select>
                {errors.channelCode && (
                  <p className="text-sm text-red-500">{errors.channelCode.message}</p>
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

        {/* Validity Period */}
        <Card>
          <CardHeader>
            <CardTitle>Vigencia</CardTitle>
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
