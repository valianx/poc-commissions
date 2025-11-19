"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pspSchema, PSPFormData } from "@/lib/validations/channel.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { useRouter } from "next/navigation";

export function PSPForm() {
  const router = useRouter();
  const { createPSP } = useChannelsStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PSPFormData>({
    resolver: zodResolver(pspSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const onSubmit = async (data: PSPFormData) => {
    try {
      createPSP(data);
      router.push("/dashboard/channels");
    } catch (error) {
      console.error("Error creating PSP:", error);
    }
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
              <Label htmlFor="code">Código del PSP</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="Ej: stripe, mercadopago"
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
                placeholder="Ej: Stripe, MercadoPago"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiUrl">URL de API</Label>
            <Input
              id="apiUrl"
              {...register("apiUrl")}
              placeholder="https://api.example.com"
              type="url"
            />
            {errors.apiUrl && (
              <p className="text-sm text-red-500">{errors.apiUrl.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive">PSP Activo</Label>
          </div>
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
