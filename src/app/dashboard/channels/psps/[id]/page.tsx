"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Save, Plus, Trash2, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const editPSPSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  code: z.string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .regex(/^[A-Z_]+$/, "El código debe contener solo mayúsculas y guiones bajos"),
  isActive: z.boolean(),
});

type EditPSPFormData = z.infer<typeof editPSPSchema>;
type CommissionEntry = {
  id?: string;
  channelCode: string;
  countryCode: string;
  commissionType: "PERCENTAGE" | "FIXED" | "MIXED";
  value: string;
};

const AVAILABLE_COUNTRIES = ["AR", "BR", "CL", "CO", "MX", "PE", "UY", "PY", "BO", "EC", "VE"];
const AVAILABLE_CHANNELS = ["credit_card", "debit_card", "pix", "webpay", "bank_transfer"];

export default function EditPSPPage() {
  const params = useParams();
  const router = useRouter();
  const pspId = params.id as string;

  const { psps, updatePSP, fetchPSPs } = useChannelsStore();
  const [commissions, setCommissions] = useState<CommissionEntry[]>([]);
  const [newChannel, setNewChannel] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newType, setNewType] = useState<"PERCENTAGE" | "FIXED" | "MIXED">("PERCENTAGE");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    fetchPSPs();
  }, [fetchPSPs]);

  const psp = psps.find((p) => p.id === pspId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditPSPFormData>({
    resolver: zodResolver(editPSPSchema),
    defaultValues: {
      name: "",
      code: "",
      isActive: true,
    },
  });

  // Load PSP data when available
  useEffect(() => {
    if (psp) {
      reset({
        name: psp.name,
        code: psp.code,
        isActive: psp.isActive,
      });

      // Load commissions
      const loadedCommissions: CommissionEntry[] = psp.commissionsByChannelCountry?.map(c => ({
        channelCode: c.channelCode,
        countryCode: c.countryCode,
        commissionType: c.commissionType,
        value: c.commissionType === "PERCENTAGE" && c.percentageValue !== null
          ? (c.percentageValue * 100).toString()
          : c.commissionType === "FIXED" && c.fixedValue !== null
          ? c.fixedValue.toString()
          : "",
      })) || [];
      setCommissions(loadedCommissions);
    }
  }, [psp, reset]);

  if (!psp) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">PSP no encontrado</p>
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

  const onSubmit = (data: EditPSPFormData) => {
    try {
      const processedCommissions = commissions.map(c => ({
        channelCode: c.channelCode,
        countryCode: c.countryCode,
        commissionType: c.commissionType,
        percentageValue: c.commissionType === "PERCENTAGE" && c.value
          ? parseFloat(c.value) / 100
          : null,
        fixedValue: c.commissionType === "FIXED" && c.value
          ? parseFloat(c.value)
          : null,
      }));

      updatePSP(pspId, {
        name: data.name,
        code: data.code,
        isActive: data.isActive,
        commissionsByChannelCountry: processedCommissions,
      });

      // Refetch to ensure we have the latest data
      fetchPSPs();

      router.push("/dashboard/channels");
    } catch (error) {
      console.error("Error updating PSP:", error);
    }
  };

  const handleAddCommission = () => {
    if (!newChannel || !newCountry || !newValue) return;

    // Check if this channel+country combination already exists
    const exists = commissions.some(
      c => c.channelCode === newChannel && c.countryCode === newCountry
    );
    if (exists) {
      alert("Ya existe una comisión para esta combinación de canal y país");
      return;
    }

    setCommissions([...commissions, {
      channelCode: newChannel,
      countryCode: newCountry,
      commissionType: newType,
      value: newValue,
    }]);

    setNewChannel("");
    setNewCountry("");
    setNewValue("");
  };

  const handleRemoveCommission = (index: number) => {
    setCommissions(commissions.filter((_, i) => i !== index));
  };


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
            <h1 className="text-3xl font-bold">Editar PSP</h1>
            <p className="text-muted-foreground">
              {psp.name} • {psp.code}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/channels/psps/${pspId}/view`)}
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalles
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Ej: PayU"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="Ej: PAYU"
                  className="uppercase"
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Activo
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PSP Commissions by Channel+Country */}
        <Card>
          <CardHeader>
            <CardTitle>
              Comisiones del PSP por Canal/País ({commissions.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Estas comisiones son lo que el PSP cobra por cada combinación de canal y país
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Commission */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="font-medium mb-3 text-blue-900">Agregar Comisión</h4>
              <div className="grid gap-3 md:grid-cols-5">
                <div className="space-y-1">
                  <Label htmlFor="newChannel" className="text-xs">Canal</Label>
                  <select
                    id="newChannel"
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="">Seleccionar</option>
                    {AVAILABLE_CHANNELS.map(channel => (
                      <option key={channel} value={channel}>{channel}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="newCountry" className="text-xs">País</Label>
                  <select
                    id="newCountry"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="">Seleccionar</option>
                    {AVAILABLE_COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="newType" className="text-xs">Tipo</Label>
                  <select
                    id="newType"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "PERCENTAGE" | "FIXED" | "MIXED")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="PERCENTAGE">Porcentual</option>
                    <option value="FIXED">Fija</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="newValue" className="text-xs">
                    {newType === "PERCENTAGE" ? "% Valor" : "Valor Fijo"}
                  </Label>
                  <Input
                    id="newValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={newType === "PERCENTAGE" ? "2.9" : "500"}
                    className="h-9"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddCommission}
                    disabled={!newChannel || !newCountry || !newValue}
                    className="w-full h-9"
                    size="sm"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {/* Commissions Table */}
            {commissions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No hay comisiones configuradas
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <code className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800">
                            {commission.channelCode}
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                            {commission.countryCode}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {commission.commissionType === "PERCENTAGE" ? "Porcentual" : "Fija"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {commission.commissionType === "PERCENTAGE"
                            ? `${parseFloat(commission.value).toFixed(2)}%`
                            : `$${parseFloat(commission.value).toFixed(2)}`
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCommission(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/channels")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
