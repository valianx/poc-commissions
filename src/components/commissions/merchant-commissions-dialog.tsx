"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CommissionAssignment,
  CommissionTemplate,
  CommissionParameter,
  MerchantTaxConfig,
  PSPCommission,
} from "@/types/commission";
import { Merchant } from "@/types/merchant";
import { Channel } from "@/types/channel";
import { formatCurrency } from "@/lib/utils";
import { Building2, MapPin, CreditCard, Receipt, DollarSign } from "lucide-react";

interface MerchantCommissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchant: Merchant | null;
  assignments: CommissionAssignment[];
  templates: CommissionTemplate[];
  parameters: CommissionParameter[];
  channels: Channel[];
  pspCommissions: PSPCommission[];
  taxConfigs: MerchantTaxConfig[];
}

export function MerchantCommissionsDialog({
  open,
  onOpenChange,
  merchant,
  assignments,
  templates,
  parameters,
  channels,
  pspCommissions,
  taxConfigs,
}: MerchantCommissionsDialogProps) {
  if (!merchant) return null;

  const getChannelName = (code: string) => {
    return channels.find((c) => c.code === code)?.name || code;
  };

  const getTemplate = (templateId: string) => {
    return templates.find((t) => t.id === templateId);
  };

  const getTemplateParameters = (templateId: string) => {
    return parameters.filter((p) => p.commissionTemplateId === templateId);
  };

  const getPSPCommission = (channelCode: string, countryCode: string) => {
    return pspCommissions.find(
      (pc) =>
        pc.channelCode === channelCode &&
        pc.countryCode === countryCode &&
        pc.isActive
    );
  };

  const getTaxes = (channelCode: string, countryCode: string) => {
    return taxConfigs.filter(
      (tc) =>
        tc.merchantId === merchant.id &&
        tc.channelCode === channelCode &&
        tc.countryCode === countryCode &&
        tc.isActive
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "EXPIRED":
        return "secondary";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const renderCommissionValue = (templateId: string) => {
    const template = getTemplate(templateId);
    const params = getTemplateParameters(templateId);

    if (!template) return "N/A";

    const percentageParam = params.find((p) => p.parameterType === "PERCENTAGE");
    const fixedFeeParam = params.find((p) => p.parameterType === "FIXED_FEE");

    if (template.type === "PERCENTAGE" && percentageParam) {
      return `${(percentageParam.value * 100).toFixed(2)}%`;
    } else if (template.type === "FIXED" && fixedFeeParam) {
      return formatCurrency(fixedFeeParam.value, fixedFeeParam.currency);
    } else if (template.type === "MIXED" && percentageParam && fixedFeeParam) {
      return `${(percentageParam.value * 100).toFixed(2)}% + ${formatCurrency(
        fixedFeeParam.value,
        fixedFeeParam.currency
      )}`;
    }

    return template.type;
  };

  const configuredCount = assignments.length;
  const totalPossible = merchant.countries.length * channels.filter((c) => c.isActive).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>Configuraciones de Comisiones</DialogTitle>
          <DialogDescription>
            {merchant.name} • {merchant.code}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6">
            {/* Merchant Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <CardTitle className="text-lg">Información del Merchant</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium">{merchant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Código</p>
                    <p className="font-medium">{merchant.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Países Operativos</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {merchant.countries.map((country) => (
                        <Badge key={country} variant="outline">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Configuraciones</p>
                    <p className="font-medium">
                      {configuredCount} de {totalPossible}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignments by Country */}
            {merchant.countries.map((countryCode) => {
              const countryAssignments = assignments.filter(
                (a) => a.countryCode === countryCode
              );

              if (countryAssignments.length === 0) return null;

              return (
                <Card key={countryCode}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">País: {countryCode}</CardTitle>
                      <Badge variant="outline">
                        {countryAssignments.length} canal(es)
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Canal</TableHead>
                          <TableHead>Comisión Merchant</TableHead>
                          <TableHead>PSP</TableHead>
                          <TableHead>Impuestos</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {countryAssignments.map((assignment) => {
                          const template = getTemplate(assignment.commissionTemplateId);
                          const pspComm = getPSPCommission(
                            assignment.channelCode,
                            assignment.countryCode
                          );
                          const taxes = getTaxes(
                            assignment.channelCode,
                            assignment.countryCode
                          );

                          return (
                            <TableRow key={assignment.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {getChannelName(assignment.channelCode)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {assignment.channelCode}
                                </div>
                              </TableCell>
                              <TableCell>
                                {template && (
                                  <div>
                                    <div className="text-sm font-medium">
                                      {renderCommissionValue(assignment.commissionTemplateId)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {template.name}
                                    </div>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {pspComm ? (
                                  <div>
                                    <div className="text-sm font-medium">
                                      {pspComm.pspName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {pspComm.commissionType === "PERCENTAGE" &&
                                        `${(pspComm.percentage * 100).toFixed(2)}%`}
                                      {pspComm.commissionType === "FIXED" &&
                                        formatCurrency(pspComm.fixedFee, pspComm.currency)}
                                      {pspComm.commissionType === "MIXED" &&
                                        `${(pspComm.percentage * 100).toFixed(2)}% + ${formatCurrency(
                                          pspComm.fixedFee,
                                          pspComm.currency
                                        )}`}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    Sin PSP
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {taxes.length > 0 ? (
                                  <div className="space-y-1">
                                    {taxes.map((tax) => (
                                      <div key={tax.id} className="text-xs">
                                        <span className="font-medium">
                                          {tax.taxCode}
                                        </span>
                                        : {(tax.rate * 100).toFixed(2)}%
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    Sin impuestos
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(assignment.status)}>
                                  {assignment.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}

            {/* Unconfigured Notice */}
            {configuredCount < totalPossible && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-orange-900">
                    <Receipt className="h-5 w-5" />
                    <p className="text-sm">
                      Hay <strong>{totalPossible - configuredCount}</strong> combinaciones
                      país-canal sin configurar
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button variant="default">
            <DollarSign className="mr-2 h-4 w-4" />
            Nueva Configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
