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

export default function ViewChannelPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.id as string;

  const { channels, psps, fetchChannels, fetchPSPs } = useChannelsStore();

  useEffect(() => {
    fetchChannels();
    fetchPSPs();
  }, [fetchChannels, fetchPSPs]);

  const channel = channels.find((c) => c.id === channelId);

  if (!channel) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Canal no encontrado</p>
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
            <h1 className="text-3xl font-bold">{channel.name}</h1>
            <p className="text-muted-foreground">
              Detalles del Canal de Pago
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/dashboard/channels/${channelId}`)}>
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
              <p className="font-medium">{channel.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="font-medium">
                <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                  {channel.code}
                </code>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <div className="mt-1">
                <Badge variant={channel.isActive ? "success" : "destructive"}>
                  {channel.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Descripción</p>
            <p className="font-medium">{channel.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* PSP Assignments by Country */}
      <Card>
        <CardHeader>
          <CardTitle>
            Asignaciones de PSP por País ({channel.pspAssignments?.length || 0})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            PSPs asignados para procesar pagos de este canal en cada país
          </p>
        </CardHeader>
        <CardContent>
          {!channel.pspAssignments || channel.pspAssignments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No hay PSPs asignados para este canal
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>País</TableHead>
                    <TableHead>PSP</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channel.pspAssignments.map((assignment, index) => {
                    const psp = psps.find((p) => p.id === assignment.pspId);
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                            {assignment.countryCode}
                          </code>
                        </TableCell>
                        <TableCell>
                          {psp ? psp.name : assignment.pspId}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignment.isActive ? "success" : "destructive"
                            }
                          >
                            {assignment.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                {new Date(channel.createdAt).toLocaleString("es-ES")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Actualización</p>
              <p className="text-sm font-medium">
                {new Date(channel.updatedAt).toLocaleString("es-ES")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
