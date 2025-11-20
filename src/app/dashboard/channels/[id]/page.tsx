"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { ChannelPSPAssignment } from "@/types/channel";

const COUNTRIES = [
  { code: "CL", name: "Chile" },
  { code: "BR", name: "Brasil" },
  { code: "PE", name: "Perú" },
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
];

export default function ChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getChannelById, getPSPById, fetchChannels, fetchPSPs, updateChannel } =
    useChannelsStore();
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedPSP, setSelectedPSP] = useState<string>("");

  useEffect(() => {
    fetchChannels();
    fetchPSPs();
  }, [fetchChannels, fetchPSPs]);

  const channel = getChannelById(id);
  const allPSPs = useChannelsStore((state) => state.psps);

  if (!channel) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/channels">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Canal no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddAssignment = () => {
    if (!selectedCountry || !selectedPSP) {
      alert("Debe seleccionar un país y un PSP");
      return;
    }

    // Ensure pspAssignments exists
    const currentAssignments = channel.pspAssignments || [];

    // Check if this specific PSP is already assigned to this country
    const exists = currentAssignments.some(
      (a) => a.countryCode === selectedCountry && a.pspId === selectedPSP
    );

    if (exists) {
      alert("Este PSP ya está asignado a este país");
      return;
    }

    const newAssignment: ChannelPSPAssignment = {
      countryCode: selectedCountry,
      pspId: selectedPSP,
      isActive: true,
    };

    updateChannel(channel.id, {
      pspAssignments: [...currentAssignments, newAssignment],
    });

    setSelectedCountry("");
    setSelectedPSP("");
    setIsAddingAssignment(false);
  };

  const handleToggleAssignment = (countryCode: string, pspId: string) => {
    const currentAssignments = channel.pspAssignments || [];
    const updatedAssignments = currentAssignments.map((assignment) =>
      assignment.countryCode === countryCode && assignment.pspId === pspId
        ? { ...assignment, isActive: !assignment.isActive }
        : assignment
    );

    updateChannel(channel.id, {
      pspAssignments: updatedAssignments,
    });
  };

  const handleRemoveAssignment = (countryCode: string, pspId: string) => {
    const pspName = getPSPName(pspId);
    const countryName = getCountryName(countryCode);

    if (
      confirm(
        `¿Está seguro de eliminar la asignación de ${pspName} para ${countryName}?`
      )
    ) {
      const currentAssignments = channel.pspAssignments || [];
      const updatedAssignments = currentAssignments.filter(
        (a) => !(a.countryCode === countryCode && a.pspId === pspId)
      );

      updateChannel(channel.id, {
        pspAssignments: updatedAssignments,
      });
    }
  };

  const getCountryName = (code: string) => {
    return COUNTRIES.find((c) => c.code === code)?.name || code;
  };

  const getPSPName = (pspId: string) => {
    return getPSPById(pspId)?.name || "PSP no encontrado";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/channels">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{channel.name}</h1>
            <p className="text-muted-foreground">
              Configuración de PSPs por país
            </p>
          </div>
        </div>
        <Badge variant={channel.isActive ? "success" : "destructive"}>
          {channel.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Canal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{channel.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="font-mono">{channel.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p className="text-sm">{channel.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadatos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Creación</p>
              <p className="font-medium">{formatDateTime(channel.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Última Actualización
              </p>
              <p className="font-medium">{formatDateTime(channel.updatedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID</p>
              <p className="font-mono text-sm">{channel.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Asignación de PSPs por País</CardTitle>
            <Button
              size="sm"
              onClick={() => setIsAddingAssignment(!isAddingAssignment)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Asignar PSP
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAddingAssignment && (
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">País</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Seleccionar país</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">PSP</label>
                    <select
                      value={selectedPSP}
                      onChange={(e) => setSelectedPSP(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Seleccionar PSP</option>
                      {allPSPs
                        .filter((psp) => psp.isActive)
                        .map((psp) => (
                          <option key={psp.id} value={psp.id}>
                            {psp.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingAssignment(false);
                      setSelectedCountry("");
                      setSelectedPSP("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleAddAssignment}>
                    Guardar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(!channel.pspAssignments || channel.pspAssignments.length === 0) ? (
            <div className="py-10 text-center text-muted-foreground">
              No hay PSPs asignados. Haz clic en "Asignar PSP" para comenzar.
            </div>
          ) : (
            <div className="space-y-3">
              {channel.pspAssignments.map((assignment) => (
                <div
                  key={`${assignment.countryCode}-${assignment.pspId}`}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">
                        {getCountryName(assignment.countryCode)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getPSPName(assignment.pspId)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={assignment.isActive ? "success" : "secondary"}
                    >
                      {assignment.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleAssignment(assignment.countryCode, assignment.pspId)
                      }
                    >
                      {assignment.isActive ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRemoveAssignment(assignment.countryCode, assignment.pspId)
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
