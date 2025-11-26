"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useMerchantChannelConfigStore } from "@/lib/stores/merchant-channel-config.store";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { Merchant } from "@/types/merchant";

const COUNTRIES = [
  { code: "CL", name: "Chile" },
  { code: "BR", name: "Brasil" },
  { code: "PE", name: "Perú" },
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
];

interface MerchantChannelConfigProps {
  merchant: Merchant;
}

export function MerchantChannelConfig({
  merchant,
}: MerchantChannelConfigProps) {
  const {
    configs,
    fetchConfigs,
    getConfigsByMerchant,
    createConfig,
    updateConfig,
    deleteConfig,
  } = useMerchantChannelConfigStore();

  const { channels, psps, fetchChannels, fetchPSPs } = useChannelsStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedPSP, setSelectedPSP] = useState("");

  // Filter states
  const [filterCountry, setFilterCountry] = useState<string>("");
  const [filterChannel, setFilterChannel] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchConfigs();
    fetchChannels();
    fetchPSPs();
  }, [fetchConfigs, fetchChannels, fetchPSPs]);

  const merchantConfigs = getConfigsByMerchant(merchant.id);

  // Apply filters
  const filteredConfigs = merchantConfigs.filter((config) => {
    if (filterCountry && config.countryCode !== filterCountry) return false;
    if (filterChannel && config.channelId !== filterChannel) return false;
    return true;
  });

  // Pagination calculations
  const totalItems = filteredConfigs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedConfigs = filteredConfigs.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCountry, filterChannel]);

  // Get available PSPs for selected country and channel
  const getAvailablePSPs = () => {
    if (!selectedCountry || !selectedChannel) return [];

    const channel = channels.find((c) => c.id === selectedChannel);
    if (!channel || !channel.pspAssignments) return [];

    // Get PSPs assigned to this channel for the selected country
    const channelPSPAssignments = channel.pspAssignments.filter(
      (a) => a.countryCode === selectedCountry && a.isActive
    );

    // Return the actual PSP objects
    return channelPSPAssignments
      .map((assignment) => psps.find((p) => p.id === assignment.pspId))
      .filter((psp) => psp !== undefined);
  };


  const handleAddConfig = () => {
    if (!selectedCountry || !selectedChannel || !selectedPSP) {
      alert("Debe seleccionar país, canal y PSP");
      return;
    }

    // Check if configuration already exists
    const exists = merchantConfigs.some(
      (c) =>
        c.countryCode === selectedCountry && c.channelId === selectedChannel
    );

    if (exists) {
      alert("Ya existe una configuración para este país y canal");
      return;
    }

    createConfig({
      merchantId: merchant.id,
      countryCode: selectedCountry,
      channelId: selectedChannel,
      pspId: selectedPSP,
      taxes: [],
      isActive: true,
    });

    setSelectedCountry("");
    setSelectedChannel("");
    setSelectedPSP("");
    setIsAdding(false);
  };

  const handleEditConfig = (configId: string) => {
    const config = configs.find((c) => c.id === configId);
    if (config) {
      setEditingConfigId(configId);
      setSelectedCountry(config.countryCode);
      setSelectedChannel(config.channelId);
      setSelectedPSP(config.pspId);
    }
  };

  const handleUpdateConfig = () => {
    if (!editingConfigId) return;

    if (!selectedPSP) {
      alert("Debe seleccionar un PSP");
      return;
    }

    updateConfig(editingConfigId, {
      pspId: selectedPSP,
      taxes: [],
    });

    setEditingConfigId(null);
    setSelectedCountry("");
    setSelectedChannel("");
    setSelectedPSP("");
  };

  const handleCancelEdit = () => {
    setEditingConfigId(null);
    setSelectedCountry("");
    setSelectedChannel("");
    setSelectedPSP("");
  };

  const handleToggleConfig = (configId: string) => {
    const config = configs.find((c) => c.id === configId);
    if (config) {
      updateConfig(configId, { isActive: !config.isActive });
    }
  };

  const handleDeleteConfig = (configId: string) => {
    const config = configs.find((c) => c.id === configId);
    if (config && confirm("¿Está seguro de eliminar esta configuración?")) {
      deleteConfig(configId);
    }
  };

  const getCountryName = (code: string) => {
    return COUNTRIES.find((c) => c.code === code)?.name || code;
  };

  const getChannelName = (channelId: string) => {
    return channels.find((c) => c.id === channelId)?.name || "Canal no encontrado";
  };

  const getPSPName = (pspId: string) => {
    return psps.find((p) => p.id === pspId)?.name || "PSP no encontrado";
  };

  const availablePSPs = getAvailablePSPs();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Configuración de Canales</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setIsAdding(!isAdding);
              if (editingConfigId) {
                handleCancelEdit();
              }
            }}
            disabled={editingConfigId !== null}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Canal
          </Button>
        </div>

        {/* Filters Section */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Filtrar por País</label>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos los países</option>
              {merchant.countries.map((countryCode) => {
                const country = COUNTRIES.find((c) => c.code === countryCode);
                return (
                  <option key={countryCode} value={countryCode}>
                    {country?.name || countryCode}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Filtrar por Canal</label>
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Todos los canales</option>
              {channels
                .filter((ch) => ch.isActive)
                .map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
            </select>
          </div>

          {(filterCountry || filterChannel) && (
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterCountry("");
                  setFilterChannel("");
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">País</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      setSelectedChannel("");
                      setSelectedPSP("");
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Seleccionar país</option>
                    {merchant.countries.map((countryCode) => {
                      const country = COUNTRIES.find((c) => c.code === countryCode);
                      return (
                        <option key={countryCode} value={countryCode}>
                          {country?.name || countryCode}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Canal</label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => {
                      setSelectedChannel(e.target.value);
                      setSelectedPSP("");
                    }}
                    disabled={!selectedCountry}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <option value="">Seleccionar canal</option>
                    {channels
                      .filter((ch) => ch.isActive)
                      .filter((ch) => {
                        // Only show channels that have PSP assignments for the selected country
                        const assignments = ch.pspAssignments || [];
                        return assignments.some(
                          (a) => a.countryCode === selectedCountry && a.isActive
                        );
                      })
                      .map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          {channel.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">PSP</label>
                  <select
                    value={selectedPSP}
                    onChange={(e) => setSelectedPSP(e.target.value)}
                    disabled={!selectedChannel}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <option value="">Seleccionar PSP</option>
                    {availablePSPs.map((psp) => (
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
                    setIsAdding(false);
                    setSelectedCountry("");
                    setSelectedChannel("");
                    setSelectedPSP("");
                  }}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleAddConfig}>
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {merchantConfigs.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            No hay canales configurados. Haz clic en "Agregar Canal" para comenzar.
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            No se encontraron canales con los filtros seleccionados.
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Canal
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Provider
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    País
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {editingConfigId && (
                  <tr className="border-b bg-blue-50">
                    <td colSpan={5} className="p-4">
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>País</Label>
                            <Input
                              value={getCountryName(
                                paginatedConfigs.find((c) => c.id === editingConfigId)
                                  ?.countryCode || ""
                              )}
                              disabled
                              className="bg-gray-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Canal</Label>
                            <Input
                              value={getChannelName(
                                paginatedConfigs.find((c) => c.id === editingConfigId)
                                  ?.channelId || ""
                              )}
                              disabled
                              className="bg-gray-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>PSP</Label>
                            <select
                              value={selectedPSP}
                              onChange={(e) => setSelectedPSP(e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="">Seleccionar PSP</option>
                              {psps
                                .filter((psp) => psp.isActive)
                                .map((psp) => (
                                  <option key={psp.id} value={psp.id}>
                                    {psp.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={handleUpdateConfig}>
                            Guardar Cambios
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedConfigs.map((config) => {
                  if (editingConfigId === config.id) return null;
                  return (
                    <tr key={config.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 align-middle font-medium">
                        {getChannelName(config.channelId)}
                      </td>
                      <td className="p-4 align-middle">
                        {getPSPName(config.pspId)}
                      </td>
                      <td className="p-4 align-middle">
                        {getCountryName(config.countryCode)}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant={config.isActive ? "success" : "secondary"}>
                          {config.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditConfig(config.id)}
                            disabled={isAdding || editingConfigId !== null}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleConfig(config.id)}
                            disabled={editingConfigId !== null}
                          >
                            {config.isActive ? "Desactivar" : "Activar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteConfig(config.id)}
                            className="text-red-500 hover:text-red-700"
                            disabled={editingConfigId !== null}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} configuraciones
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
