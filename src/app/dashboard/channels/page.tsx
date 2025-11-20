"use client";

import { useEffect, useState } from "react";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ChannelsPage() {
  const { channels, psps, fetchChannels, fetchPSPs, deleteChannel, deletePSP } =
    useChannelsStore();
  const [activeTab, setActiveTab] = useState<"channels" | "psps">("channels");

  useEffect(() => {
    fetchChannels();
    fetchPSPs();
  }, [fetchChannels, fetchPSPs]);

  const handleDeleteChannel = (id: string, name: string) => {
    if (confirm(`¿Está seguro de eliminar el canal "${name}"?`)) {
      deleteChannel(id);
    }
  };

  const handleDeletePSP = (id: string, name: string) => {
    if (confirm(`¿Está seguro de eliminar el PSP "${name}"?`)) {
      deletePSP(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Canales y PSPs</h1>
          <p className="text-muted-foreground">
            Gestión de métodos de pago y proveedores de servicios
          </p>
        </div>
        <Link
          href={
            activeTab === "channels"
              ? "/dashboard/channels/new"
              : "/dashboard/channels/psps/new"
          }
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === "channels" ? "Nuevo Canal" : "Nuevo PSP"}
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("channels")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "channels"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Channels ({channels.length})
        </button>
        <button
          onClick={() => setActiveTab("psps")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "psps"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          PSPs ({psps.length})
        </button>
      </div>

      {activeTab === "channels" && (
        <Card>
          <CardHeader>
            <CardTitle>Canales de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No hay canales registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    channels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/channels/${channel.id}`}
                            className="text-primary hover:underline"
                          >
                            {channel.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                            {channel.code}
                          </code>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {channel.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={channel.isActive ? "success" : "destructive"}
                          >
                            {channel.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDeleteChannel(channel.id, channel.name)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "psps" && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Service Providers (PSPs)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {psps.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No hay PSPs registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    psps.map((psp) => (
                      <TableRow key={psp.id}>
                        <TableCell className="font-medium">{psp.name}</TableCell>
                        <TableCell>
                          <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                            {psp.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={psp.isActive ? "success" : "destructive"}>
                            {psp.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePSP(psp.id, psp.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
