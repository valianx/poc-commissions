# REQUISITOS PARA DEMO DE NEGOCIO - ZIPPY DASHBOARD POC

**Fecha:** 2025-01-20
**Versión:** 1.0
**Objetivo:** Prototipo funcional para demostración a negocio

---

## 📋 ÍNDICE

1. [Estado Actual del Prototipo](#1-estado-actual-del-prototipo)
2. [Modelos de Datos - Revisión](#2-modelos-de-datos---revisión)
3. [Sistema de Transacciones para Demo](#3-sistema-de-transacciones-para-demo)
4. [Datos de Demo (Seed Data)](#4-datos-de-demo-seed-data)
5. [Flujo Completo de Demo](#5-flujo-completo-de-demo)
6. [Checklist de Completitud](#6-checklist-de-completitud)

---

## 1. ESTADO ACTUAL DEL PROTOTIPO

### ✅ Lo que YA ESTÁ funcionando:

**Merchants:**
- ✅ Lista de merchants
- ✅ Crear merchant
- ✅ Editar merchant
- ✅ Ver detalle merchant
- ✅ Configuración merchant-channel-PSP

**Channels:**
- ✅ Lista de channels
- ✅ Crear channel
- ✅ Editar channel
- ✅ Asignar PSP a channel por país

**PSPs:**
- ✅ Lista de PSPs
- ✅ Crear PSP
- ✅ Configurar comisiones PSP por país

**Commissions:**
- ✅ Vista de merchants con estado de comisiones
- ✅ Configurar comisión para merchant-país-canal
- ✅ Editar comisión existente
- ✅ Soporte para nuevo modelo (valores directos + rangos)

**Simulator:**
- ✅ Simulador de pagos funcional
- ✅ Cálculo correcto de comisiones
- ✅ Desglose financiero completo

### ❌ Lo que FALTA para la demo:

1. **Datos de Demostración**
   - ❌ No hay datos pre-cargados
   - ❌ Hay que crear todo manualmente

2. **Transacciones**
   - ❌ No hay forma de ver transacciones históricas
   - ❌ No hay dashboard con métricas
   - ❌ No se puede simular múltiples transacciones

3. **Dashboard Principal**
   - ❌ El dashboard `/dashboard` está vacío
   - ❌ No hay métricas visuales
   - ❌ No hay overview del negocio

4. **Experiencia de Demo**
   - ❌ No hay botón "Reset Demo Data"
   - ❌ No hay datos de ejemplo listos

---

## 2. MODELOS DE DATOS - REVISIÓN

### 2.1. NUEVO Modelo: Transaction (Para historial de demo)

```typescript
interface Transaction {
  id: string;
  externalId: string | null;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL';

  // Participantes
  merchantId: string;
  merchantName: string;  // Desnormalizado para performance

  // Monto
  amount: number;
  currency: string;

  // Ubicación y canal
  countryCode: string;
  channelCode: string;
  channelName: string;   // Desnormalizado
  pspId: string;
  pspName: string;       // Desnormalizado

  // Estado
  status: TransactionStatus;

  // Comisiones (snapshot del cálculo)
  commissionSnapshot: {
    merchantCommission: number;    // Lo que Zippy cobra al merchant
    taxes: number;                 // Impuestos
    pspCommission: number;         // Lo que PSP cobra
    merchantReceives: number;      // Lo que recibe el merchant
    zippyNetProfit: number;        // Ganancia de Zippy
  };

  // Auditoría
  createdAt: string;
  completedAt: string | null;
}

type TransactionStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';
```

**Justificación:** Necesitamos mostrar historial de transacciones en la demo.

---

## 3. SISTEMA DE TRANSACCIONES PARA DEMO

### 3.1. Repository de Transacciones

```typescript
// src/types/transaction.ts
export interface Transaction {
  id: string;
  externalId: string | null;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL';
  merchantId: string;
  merchantName: string;
  amount: number;
  currency: string;
  countryCode: string;
  channelCode: string;
  channelName: string;
  pspId: string;
  pspName: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  commissionSnapshot: {
    merchantCommission: number;
    taxes: number;
    pspCommission: number;
    merchantReceives: number;
    zippyNetProfit: number;
  };
  createdAt: string;
  completedAt: string | null;
}
```

```typescript
// src/lib/repositories/transactions.repository.ts
import { Transaction } from "@/types/transaction";
import { STORAGE_KEYS } from "@/types/storage";
import { BaseRepository } from "./base.repository";

class TransactionsRepository extends BaseRepository<Transaction> {
  constructor() {
    super(STORAGE_KEYS.TRANSACTIONS);
  }

  getByMerchant(merchantId: string): Transaction[] {
    return this.findBy(t => t.merchantId === merchantId);
  }

  getCompleted(): Transaction[] {
    return this.findBy(t => t.status === 'COMPLETED');
  }

  getByDateRange(from: string, to: string): Transaction[] {
    return this.findBy(t => t.createdAt >= from && t.createdAt <= to);
  }

  getTotalVolume(): number {
    const completed = this.getCompleted();
    return completed.reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalZippyProfit(): number {
    const completed = this.getCompleted();
    return completed.reduce((sum, t) => sum + t.commissionSnapshot.zippyNetProfit, 0);
  }

  getSuccessRate(): number {
    const all = this.getAll();
    if (all.length === 0) return 0;
    const completed = all.filter(t => t.status === 'COMPLETED').length;
    return (completed / all.length) * 100;
  }
}

export const transactionsRepository = new TransactionsRepository();
```

```typescript
// Agregar a src/types/storage.ts
export const STORAGE_KEYS = {
  // ... existentes
  TRANSACTIONS: 'zippy:transactions',
} as const;
```

---

### 3.2. Página de Transacciones (Vista Simple)

```typescript
// src/app/dashboard/transactions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Transaction } from "@/types/transaction";
import { transactionsRepository } from "@/lib/repositories/transactions.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    volume: 0,
    profit: 0,
    successRate: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const txs = transactionsRepository.getAll()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    setTransactions(txs);
    setStats({
      total: txs.length,
      volume: transactionsRepository.getTotalVolume(),
      profit: transactionsRepository.getTotalZippyProfit(),
      successRate: transactionsRepository.getSuccessRate(),
    });
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const colors = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={colors[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transacciones</h1>
        <p className="text-muted-foreground">
          Historial de transacciones procesadas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transacciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volumen Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.volume, 'CLP')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ganancia Zippy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.profit, 'CLP')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Éxito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Transacciones */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3">Merchant</th>
                  <th className="pb-3">Canal</th>
                  <th className="pb-3">Monto</th>
                  <th className="pb-3">Comisión Zippy</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b">
                    <td className="py-3 text-sm">
                      {format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="py-3 text-sm font-medium">
                      {tx.merchantName}
                    </td>
                    <td className="py-3 text-sm">{tx.channelName}</td>
                    <td className="py-3 text-sm font-mono font-medium">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="py-3 text-sm font-mono font-medium text-green-600">
                      {formatCurrency(tx.commissionSnapshot.zippyNetProfit, tx.currency)}
                    </td>
                    <td className="py-3">{getStatusBadge(tx.status)}</td>
                    <td className="py-3">
                      <Link href={`/dashboard/transactions/${tx.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver Detalle
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {transactions.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No hay transacciones registradas
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 3.3. Página de Detalle de Transacción

```typescript
// src/app/dashboard/transactions/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Transaction } from "@/types/transaction";
import { transactionsRepository } from "@/lib/repositories/transactions.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Building2, CreditCard, MapPin } from "lucide-react";
import Link from "next/link";

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const tx = transactionsRepository.getById(params.id as string);
    setTransaction(tx);
  }, [params.id]);

  if (!transaction) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Transacción no encontrada</h2>
          <Link href="/dashboard/transactions">
            <Button className="mt-4">Volver a Transacciones</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: Transaction['status']) => {
    const colors = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={colors[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/transactions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Detalle de Transacción</h1>
            <p className="text-muted-foreground">
              ID: {transaction.id.substring(0, 8)}...
            </p>
          </div>
        </div>
        {getStatusBadge(transaction.status)}
      </div>

      {/* Información General */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                <p className="font-medium">
                  {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                </p>
              </div>
            </div>

            {transaction.completedAt && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Completado</p>
                  <p className="font-medium">
                    {format(new Date(transaction.completedAt), 'dd/MM/yyyy HH:mm:ss')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Building2 className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Merchant</p>
                <p className="font-medium">{transaction.merchantName}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {transaction.merchantId}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Canal de Pago</p>
                <p className="font-medium">{transaction.channelName}</p>
                <p className="text-xs text-muted-foreground">
                  PSP: {transaction.pspName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">País</p>
                <p className="font-medium">{transaction.countryCode}</p>
              </div>
            </div>

            {transaction.externalId && (
              <div>
                <p className="text-sm text-muted-foreground">ID Externo</p>
                <p className="font-mono text-sm">{transaction.externalId}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Tipo de Transacción</p>
              <p className="font-medium">{transaction.transactionType}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monto de la Transacción</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-6">
                <p className="text-sm text-gray-600">Monto Original</p>
                <p className="text-4xl font-bold">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </p>
                <p className="mt-1 text-sm text-gray-500">{transaction.currency}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Merchant Recibe</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      transaction.commissionSnapshot.merchantReceives,
                      transaction.currency
                    )}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Ganancia Zippy</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {formatCurrency(
                      transaction.commissionSnapshot.zippyNetProfit,
                      transaction.currency
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose de Comisiones */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose de Comisiones y Taxes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comisión de Zippy al Merchant */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Comisión Zippy → Merchant</h3>
            <div className="border-l-4 border-blue-500 pl-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Comisión Base</span>
                <span className="font-mono text-lg font-semibold">
                  {formatCurrency(
                    transaction.commissionSnapshot.merchantCommission,
                    transaction.currency
                  )}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta es la comisión que Zippy cobra al merchant por procesar la transacción
              </p>
            </div>
          </div>

          {/* Taxes */}
          {transaction.commissionSnapshot.taxes > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Impuestos (Taxes)</h3>
              <div className="border-l-4 border-yellow-500 pl-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">IVA / VAT (19%)</span>
                  <span className="font-mono text-lg font-semibold">
                    {formatCurrency(
                      transaction.commissionSnapshot.taxes,
                      transaction.currency
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Impuesto aplicado sobre la comisión base
                </p>
                <div className="mt-2 rounded bg-yellow-50 p-2">
                  <p className="text-xs">
                    <span className="font-semibold">Cálculo:</span>{' '}
                    {formatCurrency(
                      transaction.commissionSnapshot.merchantCommission,
                      transaction.currency
                    )}{' '}
                    × 19% ={' '}
                    {formatCurrency(
                      transaction.commissionSnapshot.taxes,
                      transaction.currency
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Total Cobrado al Merchant */}
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">Total Cobrado al Merchant</p>
                <p className="text-xs text-gray-600">
                  Comisión Base + Impuestos
                </p>
              </div>
              <span className="font-mono text-2xl font-bold text-red-700">
                {formatCurrency(
                  transaction.commissionSnapshot.merchantCommission +
                    transaction.commissionSnapshot.taxes,
                  transaction.currency
                )}
              </span>
            </div>
          </div>

          {/* Comisión PSP */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Comisión del PSP</h3>
            <div className="border-l-4 border-purple-500 pl-4 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-600">PSP: </span>
                  <span className="font-medium">{transaction.pspName}</span>
                </div>
                <span className="font-mono text-lg font-semibold text-purple-700">
                  {formatCurrency(
                    transaction.commissionSnapshot.pspCommission,
                    transaction.currency
                  )}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Comisión que Zippy paga al PSP por procesar la transacción.
                Se calcula sobre el monto original de la transacción.
              </p>
            </div>
          </div>

          {/* Flujo de Dinero */}
          <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-4">
            <h3 className="mb-4 font-semibold text-lg">Flujo de Dinero</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span>Monto Original</span>
                </span>
                <span className="font-mono text-lg font-bold">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </div>

              <div className="ml-8 space-y-2 border-l-2 border-gray-300 pl-4">
                <div className="flex justify-between text-red-600">
                  <span>− Comisión Zippy (base + impuestos)</span>
                  <span className="font-mono font-medium">
                    {formatCurrency(
                      transaction.commissionSnapshot.merchantCommission +
                        transaction.commissionSnapshot.taxes,
                      transaction.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>− Comisión PSP</span>
                  <span className="font-mono font-medium">
                    {formatCurrency(
                      transaction.commissionSnapshot.pspCommission,
                      transaction.currency
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t-2 pt-3">
                <span className="flex items-center gap-2 font-semibold text-green-700">
                  <span className="text-2xl">✓</span>
                  <span>Merchant Recibe</span>
                </span>
                <span className="font-mono text-xl font-bold text-green-700">
                  {formatCurrency(
                    transaction.commissionSnapshot.merchantReceives,
                    transaction.currency
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Resumen para Zippy */}
          <div className="rounded-lg bg-emerald-50 p-4">
            <h3 className="mb-3 font-semibold text-lg">Resumen para Zippy</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cobra al Merchant:</span>
                <span className="font-mono">
                  {formatCurrency(
                    transaction.commissionSnapshot.merchantCommission +
                      transaction.commissionSnapshot.taxes,
                    transaction.currency
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paga al PSP:</span>
                <span className="font-mono text-red-600">
                  −{formatCurrency(
                    transaction.commissionSnapshot.pspCommission,
                    transaction.currency
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Ganancia Neta Zippy:</span>
                <span className="font-mono text-xl font-bold text-emerald-700">
                  {formatCurrency(
                    transaction.commissionSnapshot.zippyNetProfit,
                    transaction.currency
                  )}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Margen:{' '}
                {(
                  (transaction.commissionSnapshot.zippyNetProfit /
                    (transaction.commissionSnapshot.merchantCommission +
                      transaction.commissionSnapshot.taxes)) *
                  100
                ).toFixed(2)}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón Volver */}
      <div className="flex justify-center">
        <Link href="/dashboard/transactions">
          <Button size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Transacciones
          </Button>
        </Link>
      </div>
    </div>
  );
}
```

---

### 3.4. Dashboard Principal con Métricas

```typescript
// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { useChannelsStore } from "@/lib/stores/channels.store";
import { transactionsRepository } from "@/lib/repositories/transactions.repository";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Users, CreditCard, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { merchants, fetchMerchants } = useMerchantsStore();
  const { channels, fetchChannels } = useChannelsStore();
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    totalProfit: 0,
    successRate: 0,
    activeMerchants: 0,
    activeChannels: 0,
  });

  useEffect(() => {
    fetchMerchants();
    fetchChannels();
    loadStats();
  }, []);

  const loadStats = () => {
    const activeMerchants = merchants.filter(m => m.isActive && !m.deletedAt).length;
    const activeChannels = channels.filter(c => c.isActive && !c.deletedAt).length;

    setStats({
      totalTransactions: transactionsRepository.getAll().length,
      totalVolume: transactionsRepository.getTotalVolume(),
      totalProfit: transactionsRepository.getTotalZippyProfit(),
      successRate: transactionsRepository.getSuccessRate(),
      activeMerchants,
      activeChannels,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del sistema de comisiones
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transacciones
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Tasa de éxito: {stats.successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Volumen Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalVolume, 'CLP')}
            </div>
            <p className="text-xs text-muted-foreground">Procesado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Ganancia Zippy
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalProfit, 'CLP')}
            </div>
            <p className="text-xs text-muted-foreground">
              Margen:{' '}
              {stats.totalVolume > 0
                ? ((stats.totalProfit / stats.totalVolume) * 100).toFixed(2)
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Merchants Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMerchants}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeChannels} canales activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Gestiona los comercios y sus configuraciones
            </p>
            <Link href="/dashboard/merchants">
              <Button className="w-full">Ver Merchants</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comisiones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Configura comisiones por merchant-país-canal
            </p>
            <Link href="/dashboard/commissions">
              <Button className="w-full">Configurar Comisiones</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Simulador</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Simula pagos y calcula comisiones
            </p>
            <Link href="/dashboard/simulator">
              <Button className="w-full">Abrir Simulador</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Actividad Reciente</CardTitle>
            <Link href="/dashboard/transactions">
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <RecentTransactions />
        </CardContent>
      </Card>
    </div>
  );
}

function RecentTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const txs = transactionsRepository
      .getAll()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
    setTransactions(txs);
  }, []);

  if (transactions.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No hay transacciones recientes
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div>
            <p className="font-medium">{tx.merchantName}</p>
            <p className="text-sm text-muted-foreground">
              {tx.channelName} • {format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono font-medium">
              {formatCurrency(tx.amount, tx.currency)}
            </p>
            <p className="text-sm text-green-600">
              +{formatCurrency(tx.commissionSnapshot.zippyNetProfit, tx.currency)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 4. DATOS DE DEMO (SEED DATA)

### 4.1. Script de Seed Data Completo

```typescript
// src/lib/seed/demo-data.ts
import { merchantsRepository } from "@/lib/repositories/merchants.repository";
import { channelsRepository, pspsRepository } from "@/lib/repositories/channels.repository";
import { merchantChannelConfigRepository } from "@/lib/repositories/merchant-channel-config.repository";
import { commissionAssignmentsRepository } from "@/lib/repositories/commissions.repository";
import { transactionsRepository } from "@/lib/repositories/transactions.repository";
import { Merchant } from "@/types/merchant";
import { Channel, PSP } from "@/types/channel";
import { MerchantChannelConfig } from "@/types/merchant-channel-config";
import { CommissionAssignment } from "@/types/commission";
import { Transaction } from "@/types/transaction";

export function seedDemoData() {
  console.log("🌱 Seeding demo data...");

  // Limpiar datos existentes
  localStorage.clear();

  // 1. PSPs
  const pagsmile: PSP = {
    id: crypto.randomUUID(),
    code: "PAGSMILE",
    name: "PagSmile",
    isActive: true,
    commissionsByCountry: [
      {
        countryCode: "BR",
        commissionType: "PERCENTAGE",
        percentageValue: 0.015,
        fixedValue: null,
      },
      {
        countryCode: "CL",
        commissionType: "PERCENTAGE",
        percentageValue: 0.018,
        fixedValue: null,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  const getnet: PSP = {
    id: crypto.randomUUID(),
    code: "GETNET",
    name: "GetNet",
    isActive: true,
    commissionsByCountry: [
      {
        countryCode: "BR",
        commissionType: "PERCENTAGE",
        percentageValue: 0.012,
        fixedValue: null,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  pspsRepository.create(pagsmile);
  pspsRepository.create(getnet);
  console.log("✅ PSPs creados");

  // 2. Channels
  const pix: Channel = {
    id: crypto.randomUUID(),
    code: "pix",
    name: "PIX",
    description: "Sistema de pagos instantáneos de Brasil",
    isActive: true,
    pspAssignments: [
      {
        countryCode: "BR",
        pspId: pagsmile.id,
        isActive: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  const creditCard: Channel = {
    id: crypto.randomUUID(),
    code: "credit_card",
    name: "Tarjeta de Crédito",
    description: "Pagos con tarjeta de crédito",
    isActive: true,
    pspAssignments: [
      {
        countryCode: "BR",
        pspId: getnet.id,
        isActive: true,
      },
      {
        countryCode: "CL",
        pspId: pagsmile.id,
        isActive: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  const bankTransfer: Channel = {
    id: crypto.randomUUID(),
    code: "bank_transfer",
    name: "Transferencia Bancaria",
    description: "Transferencias bancarias locales",
    isActive: true,
    pspAssignments: [
      {
        countryCode: "CL",
        pspId: pagsmile.id,
        isActive: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  channelsRepository.create(pix);
  channelsRepository.create(creditCard);
  channelsRepository.create(bankTransfer);
  console.log("✅ Channels creados");

  // 3. Merchants
  const merchant1xbet: Merchant = {
    id: crypto.randomUUID(),
    name: "1XBET",
    code: "1XBET_001",
    isActive: true,
    countries: ["BR", "CL"],
    balanceEvaluationEnabled: true,
    depositCallbackUrl: "https://1xbet.com/api/callback",
    withdrawalCallbackUrl: "https://1xbet.com/api/callback",
    callbackApiKeyRef: null,
    callbackSecretKeyRef: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  const merchantBetano: Merchant = {
    id: crypto.randomUUID(),
    name: "Betano",
    code: "BETANO_001",
    isActive: true,
    countries: ["BR", "CL"],
    balanceEvaluationEnabled: true,
    depositCallbackUrl: "https://betano.com/api/webhook",
    withdrawalCallbackUrl: null,
    callbackApiKeyRef: null,
    callbackSecretKeyRef: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  const merchantCodere: Merchant = {
    id: crypto.randomUUID(),
    name: "Codere",
    code: "CODERE_001",
    isActive: true,
    countries: ["CL"],
    balanceEvaluationEnabled: false,
    depositCallbackUrl: "https://codere.com/api/webhook",
    withdrawalCallbackUrl: "https://codere.com/api/webhook",
    callbackApiKeyRef: null,
    callbackSecretKeyRef: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  merchantsRepository.create(merchant1xbet);
  merchantsRepository.create(merchantBetano);
  merchantsRepository.create(merchantCodere);
  console.log("✅ Merchants creados");

  // 4. Merchant Channel Configs (con taxes)
  const config1xbetPixBR: MerchantChannelConfig = {
    id: crypto.randomUUID(),
    merchantId: merchant1xbet.id,
    countryCode: "BR",
    channelId: pix.id,
    pspId: pagsmile.id,
    taxes: [
      {
        taxCode: "VAT",
        taxName: "IVA",
        rate: 0.19,
        isActive: true,
      },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  const config1xbetCardCL: MerchantChannelConfig = {
    id: crypto.randomUUID(),
    merchantId: merchant1xbet.id,
    countryCode: "CL",
    channelId: creditCard.id,
    pspId: pagsmile.id,
    taxes: [
      {
        taxCode: "VAT",
        taxName: "IVA",
        rate: 0.19,
        isActive: true,
      },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  merchantChannelConfigRepository.create(config1xbetPixBR);
  merchantChannelConfigRepository.create(config1xbetCardCL);
  console.log("✅ Merchant Channel Configs creados");

  // 5. Commission Assignments
  const commission1xbetPixBR: CommissionAssignment = {
    id: crypto.randomUUID(),
    merchantId: merchant1xbet.id,
    countryCode: "BR",
    channelCode: pix.code,
    basePercentageValue: 0.035, // 3.5%
    baseFixedValue: null,
    commissionRanges: [],
    status: "ACTIVE",
    assignedBy: "admin@zippy.com",
    createdAt: new Date().toISOString(),
  };

  const commission1xbetCardCL: CommissionAssignment = {
    id: crypto.randomUUID(),
    merchantId: merchant1xbet.id,
    countryCode: "CL",
    channelCode: creditCard.code,
    basePercentageValue: 0.04, // 4%
    baseFixedValue: null,
    commissionRanges: [],
    status: "ACTIVE",
    assignedBy: "admin@zippy.com",
    createdAt: new Date().toISOString(),
  };

  const commissionBetanoPixBR: CommissionAssignment = {
    id: crypto.randomUUID(),
    merchantId: merchantBetano.id,
    countryCode: "BR",
    channelCode: pix.code,
    basePercentageValue: 0.03, // 3%
    baseFixedValue: null,
    commissionRanges: [],
    status: "ACTIVE",
    assignedBy: "admin@zippy.com",
    createdAt: new Date().toISOString(),
  };

  commissionAssignmentsRepository.create(commission1xbetPixBR);
  commissionAssignmentsRepository.create(commission1xbetCardCL);
  commissionAssignmentsRepository.create(commissionBetanoPixBR);
  console.log("✅ Commission Assignments creados");

  // 6. Transacciones de ejemplo
  const baseDate = new Date();
  const transactions: Transaction[] = [];

  // Generar 20 transacciones de ejemplo
  for (let i = 0; i < 20; i++) {
    const merchants = [merchant1xbet, merchantBetano, merchantCodere];
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const amount = Math.floor(Math.random() * 50000) + 10000; // 10k - 60k
    const channel = Math.random() > 0.5 ? pix : creditCard;
    const country = merchant.countries[Math.floor(Math.random() * merchant.countries.length)];

    const merchantCommission = amount * 0.035;
    const taxes = merchantCommission * 0.19;
    const pspCommission = amount * 0.015;
    const merchantReceives = amount - merchantCommission - taxes - pspCommission;
    const zippyNetProfit = merchantCommission + taxes - pspCommission;

    const status = Math.random() > 0.1 ? 'COMPLETED' : 'FAILED';

    transactions.push({
      id: crypto.randomUUID(),
      externalId: `EXT-${Date.now()}-${i}`,
      transactionType: 'DEPOSIT',
      merchantId: merchant.id,
      merchantName: merchant.name,
      amount,
      currency: country === 'BR' ? 'BRL' : 'CLP',
      countryCode: country,
      channelCode: channel.code,
      channelName: channel.name,
      pspId: pagsmile.id,
      pspName: pagsmile.name,
      status,
      commissionSnapshot: {
        merchantCommission,
        taxes,
        pspCommission,
        merchantReceives,
        zippyNetProfit,
      },
      createdAt: new Date(baseDate.getTime() - i * 3600000).toISOString(), // 1 hora atrás cada una
      completedAt: status === 'COMPLETED' ? new Date(baseDate.getTime() - i * 3600000 + 60000).toISOString() : null,
    });
  }

  transactions.forEach(tx => transactionsRepository.create(tx));
  console.log(`✅ ${transactions.length} transacciones creadas`);

  console.log("🎉 Demo data seed completed!");
  console.log({
    merchants: 3,
    channels: 3,
    psps: 2,
    configs: 2,
    commissions: 3,
    transactions: transactions.length,
  });
}
```

---

### 4.2. Botón "Cargar Datos de Demo"

```typescript
// src/components/demo/load-demo-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import { seedDemoData } from "@/lib/seed/demo-data";
import { RefreshCw } from "lucide-react";

export function LoadDemoButton() {
  const handleLoadDemo = () => {
    if (confirm("¿Seguro que deseas cargar los datos de demostración? Esto borrará todos los datos actuales.")) {
      seedDemoData();
      window.location.reload();
    }
  };

  return (
    <Button onClick={handleLoadDemo} variant="outline" size="sm">
      <RefreshCw className="mr-2 h-4 w-4" />
      Cargar Datos de Demo
    </Button>
  );
}
```

**Agregarlo en el Topbar:**

```typescript
// src/components/dashboard/topbar.tsx
import { LoadDemoButton } from "@/components/demo/load-demo-button";

export function Topbar() {
  return (
    <header className="...">
      {/* ... contenido existente ... */}
      <LoadDemoButton />
    </header>
  );
}
```

---

## 5. FLUJO COMPLETO DE DEMO

### Script de Demostración para Negocio:

**1. Inicio (Dashboard Principal)**
- Mostrar overview: merchants activos, transacciones, volumen, ganancia
- Explicar: "Este es el dashboard principal donde vemos métricas en tiempo real"

**2. Merchants**
- Ir a `/dashboard/merchants`
- Mostrar lista de merchants (1XBET, Betano, Codere)
- Hacer click en "Ver" de 1XBET
- Explicar: "Aquí configuramos cada merchant con sus países y callbacks"

**3. Configuración de Comisiones**
- Ir a `/dashboard/commissions`
- Mostrar tabla de merchants con progreso de configuración
- Hacer click en "Ver Configuraciones" de 1XBET
- Explicar: "Esta tabla muestra TODAS las combinaciones posibles de país-canal para este merchant"
- Filtrar por "Configuradas"
- Hacer click en "Configurar" una no configurada
- Mostrar formulario simple con % y fecha
- Explicar: "Así de simple configuramos una nueva comisión"

**4. Simulador de Pagos**
- Ir a `/dashboard/simulator`
- Seleccionar: 1XBET, Brasil, PIX, $10,000
- Hacer click en "Simular Pago"
- Explicar desglose:
  - "El merchant recibe $10,000"
  - "Zippy cobra $417 (3.5% + IVA 19%)"
  - "PSP cobra $150 (1.5%)"
  - "Merchant finalmente recibe $9,433"
  - "Zippy gana neto $267"

**5. Transacciones**
- Ir a `/dashboard/transactions`
- Mostrar historial de 20 transacciones
- Explicar stats: volumen total, ganancia total, tasa de éxito
- Hacer click en una transacción para ver detalle
- Explicar: "Cada transacción queda registrada con su desglose de comisiones"

**6. Channels y PSPs**
- Ir a `/dashboard/channels`
- Mostrar PIX, Tarjeta, Transferencia
- Hacer click en "Ver" PIX
- Explicar: "Aquí vemos qué PSP está asignado para cada país"
- Ir a PSPs
- Mostrar PagSmile y GetNet
- Explicar: "Cada PSP tiene su propia comisión por país"

---

## 6. CHECKLIST DE COMPLETITUD

### Para que el prototipo esté 100% listo para demo:

#### Datos y Contenido:
- [ ] Crear modelo Transaction
- [ ] Crear repositorio de transacciones
- [ ] Implementar seed data completo (merchants, channels, PSPs, configs, transacciones)
- [ ] Agregar botón "Cargar Datos de Demo" en topbar

#### Páginas Nuevas:
- [ ] Dashboard principal (`/dashboard/page.tsx`) con métricas y actividad reciente
- [ ] Página de transacciones (`/dashboard/transactions/page.tsx`) con tabla y stats

#### Navegación:
- [ ] Agregar link "Dashboard" en sidebar
- [ ] Agregar link "Transacciones" en sidebar
- [ ] Verificar que todos los links funcionan

#### Verificación Final:
- [ ] Cargar datos de demo y verificar que todo se ve bien
- [ ] Probar flujo completo: Dashboard → Merchants → Commissions → Simulator → Transactions
- [ ] Verificar que los números cuadran (totales, comisiones, ganancias)
- [ ] Verificar que no hay errores en consola

---

## ESTIMACIÓN DE TIEMPO

Para completar lo que falta:

1. **Modelo Transaction + Repository:** 30 minutos
2. **Página Dashboard principal:** 1 hora
3. **Página Transacciones:** 1 hora
4. **Seed Data completo:** 1 hora
5. **Botón Load Demo + Testing:** 30 minutos

**Total: ~4 horas de trabajo**

---

## RESULTADO FINAL

Al completar estos puntos, tendrás un prototipo **100% funcional** para mostrar a negocio que incluye:

✅ Dashboard con métricas visuales
✅ Gestión completa de Merchants
✅ Gestión completa de Channels y PSPs
✅ Configuración de comisiones simplificada
✅ Simulador de pagos en tiempo real
✅ Historial de transacciones
✅ Datos de demo pre-cargados
✅ Flujo completo de demostración

**El prototipo mostrará exactamente cómo funcionará el sistema real sin necesidad de backend.**
