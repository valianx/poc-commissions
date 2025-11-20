"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function EditCommissionPage() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.merchantId as string;
  const assignmentId = params.assignmentId as string;

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
            Funcionalidad en desarrollo
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <CardTitle>Función en Desarrollo</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            La funcionalidad de edición de comisiones está siendo rediseñada para soportar el nuevo modelo simplificado.
          </p>
          <p className="text-muted-foreground">
            Por ahora, puede crear nuevas configuraciones de comisión desde la página principal.
          </p>
          <Button onClick={() => router.push(`/dashboard/commissions/${merchantId}`)}>
            Ir a Configuraciones de Comisión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
