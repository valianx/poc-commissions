"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { useMerchantChannelConfigStore } from "@/lib/stores/merchant-channel-config.store";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { Merchant } from "@/types/merchant";
import { ChannelTax } from "@/types/merchant-channel-config";

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
  const [taxes, setTaxes] = useState<ChannelTax[]>([]);

  // Tax form state
  const [taxCode, setTaxCode] = useState("");
  const [taxName, setTaxName] = useState("");
  const [taxRate, setTaxRate] = useState("");

  useEffect(() => {
    fetchConfigs();
    fetchChannels();
    fetchPSPs();
  }, [fetchConfigs, fetchChannels, fetchPSPs]);

  const merchantConfigs = getConfigsByMerchant(merchant.id);

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

  const handleAddTax = () => {
    if (!taxCode || !taxName || !taxRate) {
      alert("Debe completar todos los campos del impuesto");
      return;
    }

    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 1) {
      alert("La tasa debe ser un número entre 0 y 1 (ej: 0.19 para 19%)");
      return;
    }

    // Check if tax code already exists
    if (taxes.some((t) => t.taxCode === taxCode)) {
      alert("Ya existe un impuesto con este código");
      return;
    }

    setTaxes([...taxes, { taxCode, taxName, rate, isActive: true }]);
    setTaxCode("");
    setTaxName("");
    setTaxRate("");
  };

  const handleRemoveTax = (taxCode: string) => {
    setTaxes(taxes.filter((t) => t.taxCode !== taxCode));
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
      taxes: taxes,
      isActive: true,
    });

    setSelectedCountry("");
    setSelectedChannel("");
    setSelectedPSP("");
    setTaxes([]);
    setIsAdding(false);
  };

  const handleEditConfig = (configId: string) => {
    const config = configs.find((c) => c.id === configId);
    if (config) {
      setEditingConfigId(configId);
      setSelectedCountry(config.countryCode);
      setSelectedChannel(config.channelId);
      setSelectedPSP(config.pspId);
      setTaxes(config.taxes || []);
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
      taxes: taxes,
    });

    setEditingConfigId(null);
    setSelectedCountry("");
    setSelectedChannel("");
    setSelectedPSP("");
    setTaxes([]);
  };

  const handleCancelEdit = () => {
    setEditingConfigId(null);
    setSelectedCountry("");
    setSelectedChannel("");
    setSelectedPSP("");
    setTaxes([]);
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

              {/* Taxes Section */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Impuestos (VAT, etc.)</Label>
                </div>

                {/* Add Tax Form */}
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxCode">Código</Label>
                    <Input
                      id="taxCode"
                      value={taxCode}
                      onChange={(e) => setTaxCode(e.target.value)}
                      placeholder="VAT, IVA, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxName">Nombre</Label>
                    <Input
                      id="taxName"
                      value={taxName}
                      onChange={(e) => setTaxName(e.target.value)}
                      placeholder="Impuesto al Valor Agregado"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tasa (0-1)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="0.19"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTax}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                </div>

                {/* Tax List */}
                {taxes.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Impuestos agregados:
                    </Label>
                    {taxes.map((tax) => (
                      <div
                        key={tax.taxCode}
                        className="flex items-center justify-between rounded-md border bg-white p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {tax.taxCode} - {tax.taxName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Tasa: {(tax.rate * 100).toFixed(2)}%
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTax(tax.taxCode)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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
                    setTaxes([]);
                    setTaxCode("");
                    setTaxName("");
                    setTaxRate("");
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
        ) : (
          <div className="space-y-3">
            {merchantConfigs.map((config) => (
              <div key={config.id}>
                {editingConfigId === config.id ? (
                  // Edit Mode
                  <Card className="bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>País</Label>
                            <Input
                              value={getCountryName(config.countryCode)}
                              disabled
                              className="bg-gray-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Canal</Label>
                            <Input
                              value={getChannelName(config.channelId)}
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

                        {/* Taxes Section - Edit Mode */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">
                              Impuestos (VAT, etc.)
                            </Label>
                          </div>

                          {/* Add Tax Form */}
                          <div className="grid gap-3 md:grid-cols-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-taxCode">Código</Label>
                              <Input
                                id="edit-taxCode"
                                value={taxCode}
                                onChange={(e) => setTaxCode(e.target.value)}
                                placeholder="VAT, IVA, etc."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-taxName">Nombre</Label>
                              <Input
                                id="edit-taxName"
                                value={taxName}
                                onChange={(e) => setTaxName(e.target.value)}
                                placeholder="Impuesto al Valor Agregado"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-taxRate">Tasa (0-1)</Label>
                              <Input
                                id="edit-taxRate"
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={taxRate}
                                onChange={(e) => setTaxRate(e.target.value)}
                                placeholder="0.19"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddTax}
                                className="w-full"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar
                              </Button>
                            </div>
                          </div>

                          {/* Tax List */}
                          {taxes.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">
                                Impuestos agregados:
                              </Label>
                              {taxes.map((tax) => (
                                <div
                                  key={tax.taxCode}
                                  className="flex items-center justify-between rounded-md border bg-white p-3"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {tax.taxCode} - {tax.taxName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Tasa: {(tax.rate * 100).toFixed(2)}%
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveTax(tax.taxCode)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
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
                    </CardContent>
                  </Card>
                ) : (
                  // View Mode
                  <div className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {getCountryName(config.countryCode)} -{" "}
                            {getChannelName(config.channelId)}
                          </p>
                          <Badge variant={config.isActive ? "success" : "secondary"}>
                            {config.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          PSP: {getPSPName(config.pspId)}
                        </p>

                        {/* Display Taxes */}
                        {config.taxes && config.taxes.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-gray-600">
                              Impuestos:
                            </p>
                            {config.taxes.map((tax) => (
                              <div
                                key={tax.taxCode}
                                className="text-xs text-muted-foreground"
                              >
                                • {tax.taxCode} - {tax.taxName}: {(tax.rate * 100).toFixed(2)}%
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditConfig(config.id)}
                          disabled={isAdding || editingConfigId !== null}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
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
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
