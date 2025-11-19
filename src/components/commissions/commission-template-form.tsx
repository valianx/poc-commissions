"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  commissionTemplateSchema,
  CommissionTemplateFormData,
} from "@/lib/validations/commission.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCommissionsStore } from "@/lib/stores/commissions.store";
import { useRouter } from "next/navigation";

export function CommissionTemplateForm() {
  const router = useRouter();
  const { createTemplate } = useCommissionsStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CommissionTemplateFormData>({
    resolver: zodResolver(commissionTemplateSchema),
    defaultValues: {
      status: "DRAFT",
      createdBy: "admin@zippy.com",
    },
  });

  const onSubmit = async (data: CommissionTemplateFormData) => {
    try {
      createTemplate(data);
      router.push("/dashboard/commissions");
    } catch (error) {
      console.error("Error creating commission template:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código del Template</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="Ej: COMM_BR_PIX"
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ej: Comisión PIX Brasil"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Comisión</Label>
              <select
                id="type"
                {...register("type")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Seleccionar tipo</option>
                <option value="FIXED">Fija</option>
                <option value="PERCENTAGE">Porcentaje</option>
                <option value="MIXED">Mixta</option>
              </select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                {...register("status")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="DRAFT">Borrador</option>
                <option value="APPROVED">Aprobado</option>
                <option value="PUBLISHED">Publicado</option>
              </select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Fecha de Inicio</Label>
              <Input
                id="effectiveDate"
                type="datetime-local"
                {...register("effectiveDate")}
              />
              {errors.effectiveDate && (
                <p className="text-sm text-red-500">
                  {errors.effectiveDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">
                Fecha de Expiración (Opcional)
              </Label>
              <Input
                id="expirationDate"
                type="datetime-local"
                {...register("expirationDate")}
              />
              {errors.expirationDate && (
                <p className="text-sm text-red-500">
                  {errors.expirationDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="createdBy">Creado Por (Email)</Label>
            <Input
              id="createdBy"
              type="email"
              {...register("createdBy")}
              placeholder="admin@zippy.com"
            />
            {errors.createdBy && (
              <p className="text-sm text-red-500">{errors.createdBy.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/commissions")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear Template"}
        </Button>
      </div>
    </form>
  );
}
