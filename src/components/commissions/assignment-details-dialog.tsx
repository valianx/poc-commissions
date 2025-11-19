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
import { CommissionAssignment, MerchantTaxConfig, PSPCommission } from "@/types/commission";
import { Merchant } from "@/types/merchant";
import { Channel } from "@/types/channel";
import { formatCurrency } from "@/lib/utils";
import { Calendar, DollarSign, Receipt, Building2, CreditCard } from "lucide-react";

interface AssignmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: CommissionAssignment | null;
  merchant: Merchant | null;
  channel: Channel | null;
  templateName?: string;
  templateType?: string;
  templateStatus?: string;
  parameters?: Array<{ parameterType: string; value: number; currency: string }>;
  taxes: MerchantTaxConfig[];
  pspCommission: PSPCommission | null;
}

export function AssignmentDetailsDialog({
  open,
  onOpenChange,
  assignment,
  merchant,
  channel,
  templateName,
  templateType,
  templateStatus,
  parameters = [],
  taxes,
  pspCommission,
}: AssignmentDetailsDialogProps) {
  if (!assignment || !merchant || !channel) return null;

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

  const getTemplateStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case "PUBLISHED":
        return "default";
      case "APPROVED":
        return "secondary";
      case "DRAFT":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>Detalles de Comisión</DialogTitle>
          <DialogDescription>
            {merchant.name} • {assignment.countryCode} • {channel.name}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6">
            {/* Información General */}
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold">Información General</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600">Merchant</p>
                  <p className="font-medium">{merchant.name}</p>
                  <p className="text-xs text-gray-500">{merchant.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Canal</p>
                  <p className="font-medium">{channel.name}</p>
                  <p className="text-xs text-gray-500">{channel.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">País</p>
                  <p className="font-medium">{assignment.countryCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <Badge variant={getStatusBadgeVariant(assignment.status)}>
                    {assignment.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <h3 className="font-semibold">Vigencia</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600">Fecha de Inicio</p>
                  <p className="font-medium">
                    {new Date(assignment.startDate).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Fin</p>
                  <p className="font-medium">
                    {assignment.endDate
                      ? new Date(assignment.endDate).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Sin fecha de expiración"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Asignado Por</p>
                  <p className="font-medium">{assignment.assignedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Creación</p>
                  <p className="font-medium">
                    {new Date(assignment.createdAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>
            </div>

            {/* Comisión Zippy → Merchant */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  Comisión Zippy → Merchant
                </h3>
              </div>
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-blue-700">Nombre del Template</p>
                    <p className="font-medium text-blue-900">
                      {templateName || "Sin template"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Estado del Template</p>
                    <Badge variant={getTemplateStatusBadgeVariant(templateStatus)}>
                      {templateStatus || "N/A"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Tipo de Comisión</p>
                    <p className="font-medium text-blue-900">
                      {templateType || "N/A"}
                    </p>
                  </div>
                </div>

                {parameters.length > 0 && (
                  <div className="rounded-md border border-blue-300 bg-white p-3">
                    <p className="mb-2 text-sm font-medium text-blue-900">
                      Parámetros de Comisión
                    </p>
                    <div className="space-y-2">
                      {parameters.map((param, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {param.parameterType === "PERCENTAGE"
                              ? "Porcentaje"
                              : param.parameterType === "FIXED_FEE"
                              ? "Tarifa Fija"
                              : param.parameterType}
                          </span>
                          <span className="font-mono font-semibold text-blue-900">
                            {param.parameterType === "PERCENTAGE"
                              ? `${(param.value * 100).toFixed(2)}%`
                              : `${formatCurrency(param.value, param.currency)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Impuestos */}
            {taxes.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-900">
                    Impuestos Configurados
                  </h3>
                </div>
                <div className="space-y-2">
                  {taxes.map((tax) => (
                    <div
                      key={tax.id}
                      className="flex items-center justify-between rounded-md border border-yellow-300 bg-white p-3"
                    >
                      <div>
                        <p className="font-medium text-yellow-900">{tax.taxName}</p>
                        <p className="text-sm text-yellow-700">
                          Código: {tax.taxCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-lg font-bold text-yellow-900">
                          {(tax.rate * 100).toFixed(2)}%
                        </p>
                        <Badge variant={tax.isActive ? "default" : "secondary"}>
                          {tax.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comisión PSP */}
            {pspCommission && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">
                    Comisión PSP → Zippy
                  </h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-purple-700">Proveedor PSP</p>
                    <p className="font-medium text-purple-900">
                      {pspCommission.pspName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700">Tipo de Comisión</p>
                    <p className="font-medium text-purple-900">
                      {pspCommission.commissionType}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="rounded-md border border-purple-300 bg-white p-3">
                      <p className="mb-2 text-sm font-medium text-purple-900">
                        Valores
                      </p>
                      <div className="space-y-1 text-sm">
                        {(pspCommission.commissionType === "PERCENTAGE" ||
                          pspCommission.commissionType === "MIXED") && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Porcentaje</span>
                            <span className="font-mono font-semibold text-purple-900">
                              {(pspCommission.percentage * 100).toFixed(2)}%
                            </span>
                          </div>
                        )}
                        {(pspCommission.commissionType === "FIXED" ||
                          pspCommission.commissionType === "MIXED") && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tarifa Fija</span>
                            <span className="font-mono font-semibold text-purple-900">
                              {formatCurrency(
                                pspCommission.fixedFee,
                                pspCommission.currency
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button variant="default">Editar Configuración</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
