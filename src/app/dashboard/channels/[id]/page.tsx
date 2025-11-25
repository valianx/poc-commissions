"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { useMerchantChannelConfigStore } from "@/lib/stores/merchant-channel-config.store";
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
  const { syncPSPForChannel, fetchConfigs } =
    useMerchantChannelConfigStore();
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedPSP, setSelectedPSP] = useState<string>("");

  useEffect(() => {
    fetchChannels();
    fetchPSPs();
    fetchConfigs();
  }, [fetchChannels, fetchPSPs, fetchConfigs]);

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
      alert("Debe seleccionar un país y un provider");
      return;
    }

    const currentAssignments = channel.pspAssignments || [];

    // Check if this exact PSP+country combination already exists
    const exactMatch = currentAssignments.find(
      (a) => a.countryCode === selectedCountry && a.pspId === selectedPSP
    );

    if (exactMatch) {
      alert("Este provider ya está asignado a este país");
      return;
    }

    // Check if there's an ACTIVE PSP assigned to this country
    const activeAssignmentForCountry = currentAssignments.find(
      (a) => a.countryCode === selectedCountry && a.isActive
    );

    if (activeAssignmentForCountry) {
      const existingPSPName = getPSPName(activeAssignmentForCountry.pspId);
      const newPSPName = getPSPName(selectedPSP);
      const countryName = getCountryName(selectedCountry);

      const choice = confirm(
        `Ya existe un provider activo (${existingPSPName}) para ${countryName}.\n\n` +
        `¿Desea reemplazarlo con ${newPSPName}?\n\n` +
        `• Aceptar: ${existingPSPName} será desactivado y ${newPSPName} será el nuevo provider activo.\n` +
        `• Cancelar: ${newPSPName} será agregado como inactivo.`
      );

      if (choice) {
        // Deactivate existing and add new as active
        const updatedAssignments = currentAssignments.map((a) =>
          a.countryCode === selectedCountry && a.isActive
            ? { ...a, isActive: false }
            : a
        );

        const newAssignment: ChannelPSPAssignment = {
          countryCode: selectedCountry,
          pspId: selectedPSP,
          isActive: true,
        };

        updateChannel(channel.id, {
          pspAssignments: [...updatedAssignments, newAssignment],
        });

        // Sync merchant configs with the new active PSP
        syncPSPForChannel(channel.id, selectedCountry, selectedPSP);
      } else {
        // Add new as inactive
        const newAssignment: ChannelPSPAssignment = {
          countryCode: selectedCountry,
          pspId: selectedPSP,
          isActive: false,
        };

        updateChannel(channel.id, {
          pspAssignments: [...currentAssignments, newAssignment],
        });
      }
    } else {
      // No active assignment for this country, add as active
      const newAssignment: ChannelPSPAssignment = {
        countryCode: selectedCountry,
        pspId: selectedPSP,
        isActive: true,
      };

      updateChannel(channel.id, {
        pspAssignments: [...currentAssignments, newAssignment],
      });

      // Sync merchant configs with the new PSP
      syncPSPForChannel(channel.id, selectedCountry, selectedPSP);
    }

    setSelectedCountry("");
    setSelectedPSP("");
    setIsAddingAssignment(false);
  };

  const handleToggleAssignment = (countryCode: string, pspId: string) => {
    const currentAssignments = channel.pspAssignments || [];
    const currentAssignment = currentAssignments.find(
      (a) => a.countryCode === countryCode && a.pspId === pspId
    );

    if (!currentAssignment) return;

    // If trying to activate
    if (!currentAssignment.isActive) {
      // Check if there's another active PSP for this country
      const otherActiveAssignment = currentAssignments.find(
        (a) => a.countryCode === countryCode && a.isActive && a.pspId !== pspId
      );

      if (otherActiveAssignment) {
        const existingPSPName = getPSPName(otherActiveAssignment.pspId);
        const newPSPName = getPSPName(pspId);
        const countryName = getCountryName(countryCode);

        const choice = confirm(
          `Ya existe un provider activo (${existingPSPName}) para ${countryName}.\n\n` +
          `¿Desea reemplazarlo con ${newPSPName}?\n\n` +
          `• Aceptar: ${existingPSPName} será desactivado y ${newPSPName} será el nuevo provider activo.\n` +
          `• Cancelar: No se realizará ningún cambio.`
        );

        if (choice) {
          // Deactivate existing and activate the selected one
          const updatedAssignments = currentAssignments.map((a) => {
            if (a.countryCode === countryCode && a.pspId === otherActiveAssignment.pspId) {
              return { ...a, isActive: false };
            }
            if (a.countryCode === countryCode && a.pspId === pspId) {
              return { ...a, isActive: true };
            }
            return a;
          });

          updateChannel(channel.id, {
            pspAssignments: updatedAssignments,
          });

          // Sync merchant configs with the new active PSP
          syncPSPForChannel(channel.id, countryCode, pspId);
        }
        // If cancelled, do nothing
        return;
      }

      // No other active assignment, just activate
      const updatedAssignments = currentAssignments.map((a) =>
        a.countryCode === countryCode && a.pspId === pspId
          ? { ...a, isActive: true }
          : a
      );

      updateChannel(channel.id, {
        pspAssignments: updatedAssignments,
      });

      // Sync merchant configs with the new active PSP
      syncPSPForChannel(channel.id, countryCode, pspId);
    } else {
      // Deactivating - just deactivate without warning
      const updatedAssignments = currentAssignments.map((a) =>
        a.countryCode === countryCode && a.pspId === pspId
          ? { ...a, isActive: false }
          : a
      );

      updateChannel(channel.id, {
        pspAssignments: updatedAssignments,
      });
    }
  };

  const handleRemoveAssignment = (countryCode: string, pspId: string) => {
    const pspName = getPSPName(pspId);
    const countryName = getCountryName(countryCode);
    const currentAssignments = channel.pspAssignments || [];
    const assignmentToRemove = currentAssignments.find(
      (a) => a.countryCode === countryCode && a.pspId === pspId
    );

    if (!assignmentToRemove) return;

    // If it's active, warn that it will affect merchants
    if (assignmentToRemove.isActive) {
      if (
        confirm(
          `¿Está seguro de eliminar la asignación activa de ${pspName} para ${countryName}?\n\n` +
          `Nota: Las configuraciones de merchants que usan este provider en este país permanecerán pero quedarán sin provider activo asignado.`
        )
      ) {
        const updatedAssignments = currentAssignments.filter(
          (a) => !(a.countryCode === countryCode && a.pspId === pspId)
        );

        updateChannel(channel.id, {
          pspAssignments: updatedAssignments,
        });
      }
    } else {
      // If inactive, just remove without special warning
      if (
        confirm(
          `¿Está seguro de eliminar la asignación inactiva de ${pspName} para ${countryName}?`
        )
      ) {
        const updatedAssignments = currentAssignments.filter(
          (a) => !(a.countryCode === countryCode && a.pspId === pspId)
        );

        updateChannel(channel.id, {
          pspAssignments: updatedAssignments,
        });
      }
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
            <CardTitle>Asignación de Providers por País</CardTitle>
            <Button
              size="sm"
              onClick={() => setIsAddingAssignment(!isAddingAssignment)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Asignar Provider
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
                    <label className="text-sm font-medium">Provider</label>
                    <select
                      value={selectedPSP}
                      onChange={(e) => setSelectedPSP(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Seleccionar provider</option>
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
              No hay providers asignados. Haz clic en "Asignar Provider" para comenzar.
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
