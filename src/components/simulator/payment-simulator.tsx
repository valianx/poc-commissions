"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  paymentSimulationSchema,
  PaymentSimulationFormData,
} from "@/lib/validations/commission.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { commissionCalculator } from "@/lib/services/commission-calculator.service";
import { SimulationResult } from "@/types/simulator";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export function PaymentSimulator() {
  const { merchants, fetchMerchants } = useMerchantsStore();
  const { channels, fetchChannels } = useChannelsStore();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMerchants();
    fetchChannels();
  }, [fetchMerchants, fetchChannels]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PaymentSimulationFormData>({
    resolver: zodResolver(paymentSimulationSchema),
    defaultValues: {
      amount: 10000,
      currency: "CLP",
      countryCode: "CL",
    },
  });

  const selectedMerchant = merchants.find((m) => m.id === watch("merchantId"));

  const onSubmit = (data: PaymentSimulationFormData) => {
    try {
      setError(null);
      const simulationResult = commissionCalculator.calculate(data);
      setResult(simulationResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al calcular la comisión"
      );
      setResult(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Configurar Simulación</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merchantId">Merchant</Label>
              <select
                id="merchantId"
                {...register("merchantId")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar Merchant</option>
                {merchants
                  .filter((m) => m.isActive)
                  .map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>
                      {merchant.name} ({merchant.code})
                    </option>
                  ))}
              </select>
              {errors.merchantId && (
                <p className="text-sm text-red-500">
                  {errors.merchantId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryCode">País</Label>
              <select
                id="countryCode"
                {...register("countryCode")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar País</option>
                {selectedMerchant?.countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {errors.countryCode && (
                <p className="text-sm text-red-500">
                  {errors.countryCode.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="channelCode">Canal</Label>
              <select
                id="channelCode"
                {...register("channelCode")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar Canal</option>
                {channels
                  .filter((c) => c.isActive)
                  .map((channel) => (
                    <option key={channel.id} value={channel.code}>
                      {channel.name}
                    </option>
                  ))}
              </select>
              {errors.channelCode && (
                <p className="text-sm text-red-500">
                  {errors.channelCode.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register("amount", { valueAsNumber: true })}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <select
                  id="currency"
                  {...register("currency")}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="CLP">CLP</option>
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="PEN">PEN</option>
                </select>
                {errors.currency && (
                  <p className="text-sm text-red-500">
                    {errors.currency.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full">
              Simular Pago
            </Button>
          </form>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-red-50 p-4 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Desglose del Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-gray-600">Monto de Transacción</p>
              <p className="text-2xl font-bold">
                {formatCurrency(result.transactionAmount, result.currency)}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Comisión Zippy → Merchant</h3>
              <div className="space-y-1 border-l-2 border-blue-500 pl-4">
                <div className="flex justify-between text-sm">
                  <span>Tipo: {result.merchantCommission.type}</span>
                  <span className="font-mono">
                    {formatCurrency(
                      result.merchantCommission.subtotal,
                      result.currency
                    )}
                  </span>
                </div>
                {result.merchantCommission.percentage && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      Porcentaje ({(result.merchantCommission.percentage * 100).toFixed(2)}%)
                    </span>
                  </div>
                )}
                {result.merchantCommission.fixedFee && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tarifa Fija</span>
                    <span className="font-mono">
                      {formatCurrency(
                        result.merchantCommission.fixedFee,
                        result.currency
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {result.taxes.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Impuestos</h3>
                <div className="space-y-1 border-l-2 border-yellow-500 pl-4">
                  {result.taxes.map((tax) => (
                    <div key={tax.taxCode} className="flex justify-between text-sm">
                      <span>
                        {tax.taxName} ({(tax.rate * 100).toFixed(2)}%)
                      </span>
                      <span className="font-mono">
                        {formatCurrency(tax.amount, result.currency)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-1 font-semibold">
                    <span>Total Impuestos</span>
                    <span className="font-mono">
                      {formatCurrency(result.totalTaxes, result.currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-red-50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total Comisión Merchant</span>
                <span className="font-mono text-xl font-bold text-red-700">
                  {formatCurrency(
                    result.totalMerchantCommission,
                    result.currency
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Comisión PSP</h3>
              <div className="space-y-1 border-l-2 border-purple-500 pl-4">
                <div className="flex justify-between text-sm">
                  <span>Proveedor</span>
                  <span className="font-semibold">
                    {result.pspCommission.pspName}
                  </span>
                </div>
                {result.pspCommission.percentage && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      Porcentaje ({(result.pspCommission.percentage * 100).toFixed(2)}%)
                    </span>
                  </div>
                )}
                {result.pspCommission.fixedFee && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tarifa Fija</span>
                    <span className="font-mono">
                      {formatCurrency(result.pspCommission.fixedFee, result.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Total Costo PSP</span>
                  <span className="font-mono text-purple-700">
                    {formatCurrency(result.pspCommission.amount, result.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t-2 pt-4">
              <h3 className="text-lg font-bold">Resumen Financiero</h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="mb-1 text-xs text-gray-600">Merchant Recibe</p>
                  <p className="font-mono text-base font-bold text-green-700">
                    {formatCurrency(result.merchantReceives, result.currency)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    (Monto - Total cobrado)
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="mb-1 text-xs text-gray-600">Zippy Cobra Total</p>
                  <p className="font-mono text-base font-bold text-blue-700">
                    {formatCurrency(result.zippyRevenue, result.currency)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    (Comisión + Impuestos + PSP)
                  </p>
                </div>

                <div className="rounded-lg bg-purple-50 p-3">
                  <p className="mb-1 text-xs text-gray-600">Zippy Paga a PSP</p>
                  <p className="font-mono text-base font-bold text-purple-700">
                    {formatCurrency(result.zippyCost, result.currency)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    (Pass-through)
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="mb-1 text-xs text-gray-600">Ganancia Neta Zippy</p>
                <p className="font-mono text-lg font-bold text-emerald-700">
                  {formatCurrency(result.zippyNetProfit, result.currency)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  (Comisión Zippy + Impuestos)
                </p>
              </div>

              <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-3">
                <p className="mb-2 text-xs font-semibold text-gray-700">
                  Flujo de Dinero
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>💰 Monto Original</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(result.transactionAmount, result.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>- Comisión Zippy (+ impuestos)</span>
                    <span className="font-mono">
                      -{formatCurrency(result.totalMerchantCommission, result.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>- Comisión PSP</span>
                    <span className="font-mono">
                      -{formatCurrency(result.pspCommission.amount, result.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-semibold text-green-600">
                    <span>= Merchant recibe</span>
                    <span className="font-mono">
                      {formatCurrency(result.merchantReceives, result.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
