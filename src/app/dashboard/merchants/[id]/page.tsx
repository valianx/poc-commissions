"use client";

import { useEffect } from "react";
import { use } from "react";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

export default function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getMerchantById, fetchMerchants } = useMerchantsStore();

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const merchant = getMerchantById(id);

  if (!merchant) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/merchants">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Merchant no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/merchants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{merchant.name}</h1>
            <p className="text-muted-foreground">
              Detalles del merchant {merchant.code}
            </p>
          </div>
        </div>
        <Badge variant={merchant.isActive ? "success" : "destructive"}>
          {merchant.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{merchant.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="font-mono">{merchant.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Países</p>
              <div className="mt-1 flex gap-1">
                {merchant.countries.map((country) => (
                  <Badge key={country} variant="outline">
                    {country}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Evaluación de Balance
              </p>
              <Badge
                variant={
                  merchant.balanceEvaluationEnabled ? "default" : "secondary"
                }
              >
                {merchant.balanceEvaluationEnabled
                  ? "Habilitado"
                  : "Deshabilitado"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Callbacks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                URL Callback Depósitos
              </p>
              <p className="font-mono text-sm">
                {merchant.depositCallbackUrl || "No configurado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                URL Callback Retiros
              </p>
              <p className="font-mono text-sm">
                {merchant.withdrawalCallbackUrl || "No configurado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">API Key Reference</p>
              <p className="font-mono text-sm">
                {merchant.callbackApiKeyRef || "No configurado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Secret Key Reference
              </p>
              <p className="font-mono text-sm">
                {merchant.callbackSecretKeyRef ? "***********" : "No configurado"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Metadatos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Creación</p>
              <p className="font-medium">{formatDateTime(merchant.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Última Actualización
              </p>
              <p className="font-medium">{formatDateTime(merchant.updatedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-mono text-sm">{merchant.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
