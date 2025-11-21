"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCommissionsStore } from "@/lib/stores/commissions.store";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { useMerchantChannelConfigStore } from "@/lib/stores/merchant-channel-config.store";
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
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Edit,
  Building2,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ConfigurationRow {
  countryCode: string;
  channelCode: string;
  channelName: string;
  isConfigured: boolean;
  assignmentId?: string;
  commissionValue?: string;
  pspName?: string;
  pspCommissionValue?: string;
  taxesCount: number;
  status?: string;
  startDate?: string;
  endDate?: string | null;
}

export default function MerchantCommissionsPage() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.merchantId as string;

  const {
    assignments,
    pspCommissions,
    taxConfigs,
    fetchAssignments,
    fetchPSPCommissions,
    fetchTaxConfigs,
  } = useCommissionsStore();
  const { merchants, fetchMerchants } = useMerchantsStore();
  const { channels, psps, fetchChannels, fetchPSPs } = useChannelsStore();
  const { fetchConfigs, getConfigsByMerchant } = useMerchantChannelConfigStore();

  const [filterStatus, setFilterStatus] = useState<"all" | "configured" | "unconfigured">(
    "all"
  );
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterPSP, setFilterPSP] = useState<string>("all");

  useEffect(() => {
    fetchMerchants();
    fetchChannels();
    fetchPSPs();
    fetchAssignments();
    fetchPSPCommissions();
    fetchTaxConfigs();
    fetchConfigs();
  }, [
    fetchMerchants,
    fetchChannels,
    fetchPSPs,
    fetchAssignments,
    fetchPSPCommissions,
    fetchTaxConfigs,
    fetchConfigs,
  ]);

  const merchant = merchants.find((m) => m.id === merchantId);

  if (!merchant) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Merchant no encontrado</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/dashboard/commissions")}
          >
            Volver a Comisiones
          </Button>
        </div>
      </div>
    );
  }

  const renderCommissionValue = (assignment: any) => {
    const parts = [];
    if (assignment.basePercentageValue !== null && assignment.basePercentageValue !== undefined) {
      parts.push(`${(assignment.basePercentageValue * 100).toFixed(2)}%`);
    }
    if (assignment.baseFixedValue !== null && assignment.baseFixedValue !== undefined) {
      parts.push(`$${assignment.baseFixedValue.toFixed(2)}`);
    }
    return parts.length > 0 ? parts.join(" + ") : "N/A";
  };

  // Generate all possible configurations
  const generateConfigurationRows = (): ConfigurationRow[] => {
    const rows: ConfigurationRow[] = [];
    const merchantConfigs = getConfigsByMerchant(merchantId);

    merchant.countries.forEach((countryCode) => {
      // Only show channels configured for this merchant and country
      const configsForCountry = merchantConfigs.filter(
        (c) => c.countryCode === countryCode
      );

      configsForCountry.forEach((config) => {
        const channel = channels.find((ch) => ch.id === config.channelId);
        if (!channel) return;

          // Get ALL assignments for this merchant, country, and channel (not just ACTIVE)
          const channelAssignments = assignments.filter(
            (a) =>
              a.merchantId === merchantId &&
              a.countryCode === countryCode &&
              a.channelCode === channel.code
          );

          // Get PSP info from merchant channel config
          const psp = psps.find((p) => p.id === config.pspId);

          // Find PSP commission using the pspId from merchant channel config
          const pspCommission = pspCommissions.find(
            (pc) =>
              pc.pspId === config.pspId &&
              pc.channelCode === channel.code &&
              pc.countryCode === countryCode &&
              pc.isActive
          );

          const taxes = taxConfigs.filter(
            (tc) =>
              tc.merchantId === merchantId &&
              tc.channelCode === channel.code &&
              tc.countryCode === countryCode &&
              tc.isActive
          );

          let pspCommissionValue = "N/A";
          if (pspCommission) {
            if (pspCommission.commissionType === "PERCENTAGE") {
              pspCommissionValue = `${(pspCommission.percentage * 100).toFixed(2)}%`;
            } else if (pspCommission.commissionType === "FIXED") {
              pspCommissionValue = formatCurrency(
                pspCommission.fixedFee,
                pspCommission.currency
              );
            } else if (pspCommission.commissionType === "MIXED") {
              pspCommissionValue = `${(pspCommission.percentage * 100).toFixed(2)}% + ${formatCurrency(
                pspCommission.fixedFee,
                pspCommission.currency
              )}`;
            }
          }

          // If there are assignments, create a row for each one
          if (channelAssignments.length > 0) {
            channelAssignments.forEach((assignment) => {
              rows.push({
                countryCode,
                channelCode: channel.code,
                channelName: channel.name,
                isConfigured: true,
                assignmentId: assignment.id,
                commissionValue: renderCommissionValue(assignment),
                pspName: psp?.name,
                pspCommissionValue,
                taxesCount: taxes.length,
                status: config.isActive ? assignment.status : "INACTIVE",
                startDate: assignment.startDate,
                endDate: assignment.endDate,
              });
            });
          } else {
            // No assignments, show as unconfigured
            rows.push({
              countryCode,
              channelCode: channel.code,
              channelName: channel.name,
              isConfigured: false,
              pspName: psp?.name,
              pspCommissionValue,
              taxesCount: taxes.length,
              status: config.isActive ? "UNCONFIGURED" : "INACTIVE",
            });
          }
      });
    });

    return rows;
  };

  const allRows = generateConfigurationRows();

  // Get unique values for filters
  const uniqueCountries = Array.from(new Set(allRows.map((r) => r.countryCode))).sort();
  const uniqueChannels = Array.from(
    new Set(allRows.map((r) => ({ code: r.channelCode, name: r.channelName })))
  ).sort((a, b) => a.name.localeCompare(b.name));
  const uniquePSPs = Array.from(
    new Set(allRows.map((r) => r.pspName).filter((p) => p !== undefined))
  ).sort() as string[];

  const filteredRows = allRows.filter((row) => {
    // Filter by status
    if (filterStatus === "configured" && !row.isConfigured) return false;
    if (filterStatus === "unconfigured" && row.isConfigured) return false;

    // Filter by country
    if (filterCountry !== "all" && row.countryCode !== filterCountry) return false;

    // Filter by channel
    if (filterChannel !== "all" && row.channelCode !== filterChannel) return false;

    // Filter by PSP
    if (filterPSP !== "all" && row.pspName !== filterPSP) return false;

    return true;
  });

  const configuredCount = allRows.filter((r) => r.isConfigured).length;
  const unconfiguredCount = allRows.filter((r) => !r.isConfigured).length;
  const progressPercent =
    allRows.length > 0 ? (configuredCount / allRows.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/commissions")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{merchant.name}</h1>
            <p className="text-muted-foreground">
              {merchant.code} • Configuraciones de Comisiones
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/dashboard/commissions/${merchantId}/configure-simple`)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Configuración
        </Button>
      </div>

      {/* Merchant Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-500" />
            <CardTitle>Información del Merchant</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-gray-600">Países Operativos</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {merchant.countries.map((country) => (
                  <Badge key={country} variant="outline">
                    {country}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Configuraciones</p>
              <p className="mt-1 text-2xl font-bold">{allRows.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Configuradas</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {configuredCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Progreso</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">
                  {progressPercent.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurations Table */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>Configuraciones por País y Canal</CardTitle>
              <Badge variant="outline">
                {filteredRows.length} de {allRows.length} configuraciones
              </Badge>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Filtros:</span>
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as "all" | "configured" | "unconfigured")
                }
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                <option value="all">Estado: Todas</option>
                <option value="configured">Estado: Configuradas</option>
                <option value="unconfigured">Estado: Sin configurar</option>
              </select>

              {/* Country Filter */}
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                <option value="all">País: Todos</option>
                {uniqueCountries.map((country) => (
                  <option key={country} value={country}>
                    País: {country}
                  </option>
                ))}
              </select>

              {/* Channel Filter */}
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                <option value="all">Canal: Todos</option>
                {uniqueChannels.map((channel) => (
                  <option key={channel.code} value={channel.code}>
                    Canal: {channel.name}
                  </option>
                ))}
              </select>

              {/* PSP Filter */}
              <select
                value={filterPSP}
                onChange={(e) => setFilterPSP(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                <option value="all">PSP: Todos</option>
                {uniquePSPs.map((psp) => (
                  <option key={psp} value={psp}>
                    PSP: {psp}
                  </option>
                ))}
              </select>

              {/* Clear Filters Button */}
              {(filterStatus !== "all" ||
                filterCountry !== "all" ||
                filterChannel !== "all" ||
                filterPSP !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterCountry("all");
                    setFilterChannel("all");
                    setFilterPSP("all");
                  }}
                  className="text-sm"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>País</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Comisión Merchant</TableHead>
                  <TableHead>PSP</TableHead>
                  <TableHead>Comisión PSP</TableHead>
                  <TableHead>Impuestos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No hay configuraciones que coincidan con el filtro
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge variant="outline">{row.countryCode}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{row.channelName}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.channelCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.isConfigured ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-medium">Configurada</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-orange-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Sin configurar</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.startDate ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {formatDate(row.startDate)}
                            </div>
                            {row.endDate ? (
                              <div className="text-xs text-muted-foreground">
                                hasta {formatDate(row.endDate)}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                Indefinido
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.isConfigured ? (
                          <div className="font-mono text-sm font-semibold">
                            {row.commissionValue}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.pspName ? (
                          <div className="text-sm font-medium">{row.pspName}</div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin PSP</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {row.pspCommissionValue}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.taxesCount > 0 ? (
                          <Badge variant="outline">
                            {row.taxesCount} impuesto{row.taxesCount > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Sin impuestos
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {row.isConfigured ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/commissions/${merchantId}/edit/${row.assignmentId}`
                                )
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/commissions/${merchantId}/configure-simple?country=${row.countryCode}&channel=${row.channelCode}`
                                )
                              }
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              Configurar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
