"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Edit } from "lucide-react";

export default function ViewPSPPage() {
  const params = useParams();
  const router = useRouter();
  const pspId = params.id as string;

  const { psps, fetchPSPs } = useChannelsStore();

  useEffect(() => {
    fetchPSPs();
  }, [fetchPSPs]);

  const psp = psps.find((p) => p.id === pspId);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold">{psp.name}</h1>
            <p className="text-muted-foreground">
              Detalles del Payment Service Provider
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/dashboard/channels/psps/${pspId}`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{psp.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="font-medium">
                <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                  {psp.code}
                </code>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <div className="mt-1">
                <Badge variant={psp.isActive ? "success" : "destructive"}>
                  {psp.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PSP Commissions by Country */}
      <Card>
        <CardHeader>
          <CardTitle>
            Comisiones por País ({psp.commissionsByCountry?.length || 0})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Estas comisiones son lo que el PSP cobra (solo para trazabilidad de costos)
          </p>
        </CardHeader>
        <CardContent>
          {!psp.commissionsByCountry || psp.commissionsByCountry.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No hay comisiones configuradas para este PSP
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>País</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {psp.commissionsByCountry.map((commission, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                          {commission.countryCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {commission.commissionType === "PERCENTAGE"
                            ? "Porcentual"
                            : "Fija"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {commission.commissionType === "PERCENTAGE" &&
                        commission.percentageValue !== null
                          ? `${(commission.percentageValue * 100).toFixed(2)}%`
                          : commission.commissionType === "FIXED" &&
                            commission.fixedValue !== null
                          ? `$${commission.fixedValue.toFixed(2)}`
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadatos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Creación</p>
              <p className="text-sm font-medium">
                {new Date(psp.createdAt).toLocaleString("es-ES")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Actualización</p>
              <p className="text-sm font-medium">
                {new Date(psp.updatedAt).toLocaleString("es-ES")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
