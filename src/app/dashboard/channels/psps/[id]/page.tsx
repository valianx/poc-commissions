"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const editPSPSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  code: z.string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .regex(/^[A-Z_]+$/, "El código debe contener solo mayúsculas y guiones bajos"),
  isActive: z.boolean(),
  commissionsByCountry: z.array(z.object({
    countryCode: z.string().length(2, "Código de país inválido"),
    commissionType: z.enum(["PERCENTAGE", "FIXED"]),
    percentageValue: z.string().optional(),
    fixedValue: z.string().optional(),
  })).optional(),
});

type EditPSPFormData = z.infer<typeof editPSPSchema>;

const AVAILABLE_COUNTRIES = ["AR", "BR", "CL", "CO", "MX", "PE"];

export default function EditPSPPage() {
  const params = useParams();
  const router = useRouter();
  const pspId = params.id as string;

  const { psps, updatePSP, fetchPSPs } = useChannelsStore();

  useEffect(() => {
    fetchPSPs();
  }, [fetchPSPs]);

  const psp = psps.find((p) => p.id === pspId);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<EditPSPFormData>({
    resolver: zodResolver(editPSPSchema),
    defaultValues: {
      name: "",
      code: "",
      isActive: true,
      commissionsByCountry: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "commissionsByCountry",
  });

  // Load PSP data when available
  useEffect(() => {
    if (psp) {
      reset({
        name: psp.name,
        code: psp.code,
        isActive: psp.isActive,
        commissionsByCountry: psp.commissionsByCountry?.map(commission => ({
          countryCode: commission.countryCode,
          commissionType: commission.commissionType,
          percentageValue: commission.percentageValue
            ? (commission.percentageValue * 100).toString()
            : "",
          fixedValue: commission.fixedValue?.toString() || "",
        })) || [],
      });
    }
  }, [psp, reset]);

  if (!psp) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">PSP no encontrado</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/dashboard/channels")}
          >
            Volver a Canales
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: EditPSPFormData) => {
    try {
      const processedCommissions = data.commissionsByCountry?.map(commission => ({
        countryCode: commission.countryCode,
        commissionType: commission.commissionType,
        percentageValue: commission.percentageValue && commission.commissionType === "PERCENTAGE"
          ? parseFloat(commission.percentageValue) / 100
          : null,
        fixedValue: commission.fixedValue && commission.commissionType === "FIXED"
          ? parseFloat(commission.fixedValue)
          : null,
      })) || [];

      await updatePSP(pspId, {
        name: data.name,
        code: data.code,
        isActive: data.isActive,
        commissionsByCountry: processedCommissions,
      });

      router.push("/dashboard/channels");
    } catch (error) {
      console.error("Error updating PSP:", error);
    }
  };

  const getUsedCountries = () => {
    return watch("commissionsByCountry")?.map(c => c.countryCode) || [];
  };

  const getAvailableCountries = () => {
    const usedCountries = getUsedCountries();
    return AVAILABLE_COUNTRIES.filter(country => !usedCountries.includes(country));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/channels")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar PSP</h1>
          <p className="text-muted-foreground">
            Configuración de Payment Service Provider
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Ej: PayU"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="Ej: PAYU"
                  className="uppercase"
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code.message}</p>
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
                Activo
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* PSP Commissions by Country */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comisiones del PSP por País</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estas comisiones son lo que el PSP cobra (solo para trazabilidad de costos)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({
                  countryCode: "",
                  commissionType: "PERCENTAGE",
                  percentageValue: "",
                  fixedValue: "",
                })}
                disabled={getAvailableCountries().length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar País
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No hay comisiones configuradas. Haga clic en "Agregar País" para crear una.
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
                        <Label htmlFor={`commissionsByCountry.${index}.countryCode`}>
                          País *
                        </Label>
                        <select
                          id={`commissionsByCountry.${index}.countryCode`}
                          {...register(`commissionsByCountry.${index}.countryCode`)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Seleccionar país</option>
                          {AVAILABLE_COUNTRIES.map(country => (
                            <option
                              key={country}
                              value={country}
                              disabled={
                                getUsedCountries().includes(country) &&
                                watch(`commissionsByCountry.${index}.countryCode`) !== country
                              }
                            >
                              {country}
                            </option>
                          ))}
                        </select>
                        {errors.commissionsByCountry?.[index]?.countryCode && (
                          <p className="text-sm text-red-500">
                            {errors.commissionsByCountry[index]?.countryCode?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`commissionsByCountry.${index}.commissionType`}>
                          Tipo de Comisión *
                        </Label>
                        <select
                          id={`commissionsByCountry.${index}.commissionType`}
                          {...register(`commissionsByCountry.${index}.commissionType`)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="PERCENTAGE">Porcentual</option>
                          <option value="FIXED">Fija</option>
                        </select>
                      </div>

                      {watch(`commissionsByCountry.${index}.commissionType`) === "PERCENTAGE" && (
                        <div className="space-y-2">
                          <Label htmlFor={`commissionsByCountry.${index}.percentageValue`}>
                            Porcentaje (%)
                          </Label>
                          <Input
                            id={`commissionsByCountry.${index}.percentageValue`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="Ej: 2.9"
                            {...register(`commissionsByCountry.${index}.percentageValue`)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Ingrese el porcentaje (ej: 2.9 para 2.9%)
                          </p>
                        </div>
                      )}

                      {watch(`commissionsByCountry.${index}.commissionType`) === "FIXED" && (
                        <div className="space-y-2">
                          <Label htmlFor={`commissionsByCountry.${index}.fixedValue`}>
                            Valor Fijo
                          </Label>
                          <Input
                            id={`commissionsByCountry.${index}.fixedValue`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Ej: 500"
                            {...register(`commissionsByCountry.${index}.fixedValue`)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="rounded-md border border-blue-200 bg-blue-50 p-2">
                      <p className="text-xs text-blue-900">
                        Estas comisiones son informativas (lo que el PSP cobra) y se utilizan para trazabilidad de costos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/channels")}
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
