"use client";

import { useEffect, useState } from "react";
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
import { Eye } from "lucide-react";
import { Merchant } from "@/types/merchant";
import { useRouter } from "next/navigation";

interface MerchantRow {
  merchant: Merchant;
  totalConfigurations: number;
  configuredCount: number;
  countries: string[];
}

export default function CommissionsPage() {
  const router = useRouter();
  const { assignments, fetchAssignments } = useCommissionsStore();
  const { merchants, fetchMerchants } = useMerchantsStore();
  const { channels, fetchChannels } = useChannelsStore();
  const { configs, fetchConfigs, getConfigsByMerchant } = useMerchantChannelConfigStore();

  useEffect(() => {
    fetchMerchants();
    fetchChannels();
    fetchAssignments();
    fetchConfigs();
  }, [fetchMerchants, fetchChannels, fetchAssignments, fetchConfigs]);

  // Generate merchant rows
  const generateMerchantRows = (): MerchantRow[] => {
    return merchants
      .filter((m) => m.isActive)
      .map((merchant) => {
        // Get merchant's configured channels (MerchantChannelConfig entries)
        const merchantChannelConfigs = getConfigsByMerchant(merchant.id).filter(
          (config) => config.isActive
        );

        // Total configurations = number of active MerchantChannelConfig entries
        const totalConfigurations = merchantChannelConfigs.length;

        // Get active commission assignments for this merchant
        const merchantAssignments = assignments.filter(
          (a) => a.merchantId === merchant.id && a.status === "ACTIVE"
        );

        // Count how many of the configured channels have commission assignments
        const configuredCount = merchantChannelConfigs.filter((config) => {
          return merchantAssignments.some(
            (assignment) =>
              assignment.countryCode === config.countryCode &&
              assignment.channelCode === channels.find((ch) => ch.id === config.channelId)?.code
          );
        }).length;

        return {
          merchant,
          totalConfigurations,
          configuredCount,
          countries: merchant.countries,
        };
      });
  };

  const merchantRows = generateMerchantRows();

  const handleViewMerchant = (merchant: Merchant) => {
    router.push(`/dashboard/commissions/${merchant.id}`);
  };

  const handleConfigureMerchant = (merchant: Merchant) => {
    router.push(`/dashboard/commissions/${merchant.id}`);
  };

  const totalMerchants = merchantRows.length;
  const totalConfigured = merchantRows.reduce((sum, row) => sum + row.configuredCount, 0);
  const totalPossible = merchantRows.reduce((sum, row) => sum + row.totalConfigurations, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Comisiones</h1>
        <p className="text-muted-foreground">
          Configure comisiones por merchant, canal y país
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Merchants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMerchants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Configuraciones Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalConfigured}
            </div>
            <p className="text-xs text-muted-foreground">de {totalPossible} posibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Progreso General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalPossible > 0
                ? ((totalConfigured / totalPossible) * 100).toFixed(1)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Merchants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>Países</TableHead>
                <TableHead>Configuraciones</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchantRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No hay merchants registrados
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                merchantRows.map((row) => {
                  const progressPercent =
                    row.totalConfigurations > 0
                      ? (row.configuredCount / row.totalConfigurations) * 100
                      : 0;

                  const isFullyConfigured = row.configuredCount === row.totalConfigurations;
                  const hasConfigurations = row.configuredCount > 0;

                  return (
                    <TableRow key={row.merchant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{row.merchant.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.merchant.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.countries.map((country) => (
                            <Badge key={country} variant="outline">
                              {country}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-semibold">{row.configuredCount}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {row.totalConfigurations}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                isFullyConfigured
                                  ? "bg-green-600"
                                  : hasConfigurations
                                  ? "bg-blue-600"
                                  : "bg-gray-400"
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {progressPercent.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isFullyConfigured ? (
                          <Badge variant="default" className="bg-green-600">
                            Completo
                          </Badge>
                        ) : hasConfigurations ? (
                          <Badge variant="default" className="bg-blue-600">
                            Parcial
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Sin configurar</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {hasConfigurations ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewMerchant(row.merchant)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              Ver
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfigureMerchant(row.merchant)}
                            >
                              Configurar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
