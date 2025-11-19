"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { merchantSchema, MerchantFormData } from "@/lib/validations/merchant.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  { code: "CL", name: "Chile" },
  { code: "BR", name: "Brasil" },
  { code: "PE", name: "Perú" },
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "México" },
];

export function MerchantForm() {
  const router = useRouter();
  const { createMerchant } = useMerchantsStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<MerchantFormData>({
    resolver: zodResolver(merchantSchema),
    defaultValues: {
      isActive: true,
      balanceEvaluationEnabled: false,
      countries: [],
      depositCallbackUrl: null,
      withdrawalCallbackUrl: null,
      callbackApiKeyRef: null,
      callbackSecretKeyRef: null,
    },
  });

  const countries = watch("countries") || [];

  const toggleCountry = (countryCode: string) => {
    const newCountries = countries.includes(countryCode)
      ? countries.filter((c) => c !== countryCode)
      : [...countries, countryCode];
    setValue("countries", newCountries);
  };

  const onSubmit = async (data: MerchantFormData) => {
    try {
      createMerchant(data);
      router.push("/dashboard/merchants");
    } catch (error) {
      console.error("Error creating merchant:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Merchant</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ej: 1XBET"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código Único</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="Ej: 1XBET_001"
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Países Disponibles</Label>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => toggleCountry(country.code)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    countries.includes(country.code)
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {country.name}
                </button>
              ))}
            </div>
            {errors.countries && (
              <p className="text-sm text-red-500">{errors.countries.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive">Merchant Activo</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="balanceEvaluationEnabled"
              {...register("balanceEvaluationEnabled")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="balanceEvaluationEnabled">
              Habilitar Evaluación de Balance
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Callbacks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="depositCallbackUrl">URL Callback Depósitos</Label>
            <Input
              id="depositCallbackUrl"
              {...register("depositCallbackUrl")}
              placeholder="https://example.com/callback/deposit"
              type="url"
            />
            {errors.depositCallbackUrl && (
              <p className="text-sm text-red-500">
                {errors.depositCallbackUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdrawalCallbackUrl">URL Callback Retiros</Label>
            <Input
              id="withdrawalCallbackUrl"
              {...register("withdrawalCallbackUrl")}
              placeholder="https://example.com/callback/withdrawal"
              type="url"
            />
            {errors.withdrawalCallbackUrl && (
              <p className="text-sm text-red-500">
                {errors.withdrawalCallbackUrl.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="callbackApiKeyRef">API Key Reference</Label>
              <Input
                id="callbackApiKeyRef"
                {...register("callbackApiKeyRef")}
                placeholder="api-key-ref"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="callbackSecretKeyRef">Secret Key Reference</Label>
              <Input
                id="callbackSecretKeyRef"
                {...register("callbackSecretKeyRef")}
                placeholder="secret-key-ref"
                type="password"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/merchants")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear Merchant"}
        </Button>
      </div>
    </form>
  );
}
