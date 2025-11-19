# POC DASHBOARD ZIPPY - PLAN DE TRABAJO

**Fecha:** 2025-01-19
**Versión:** 1.0
**Tipo:** Plan de Implementación
**Objetivo:** Dashboard corporativo NextJS con shadcn/ui que simula integración con Merchants, Channels y Commissions services usando localStorage

---

## 📋 ÍNDICE

1. [Visión General](#visión-general)
2. [Análisis de Servicios Existentes](#análisis-de-servicios-existentes)
3. [Arquitectura del Dashboard](#arquitectura-del-dashboard)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Modelo de Datos LocalStorage](#modelo-de-datos-localstorage)
6. [Plan de Implementación](#plan-de-implementación)
7. [Diseño UI/UX](#diseño-uiux)
8. [Testing y Validación](#testing-y-validación)

---

## 1. VISIÓN GENERAL

### Objetivo

Crear una Prueba de Concepto (POC) de un dashboard corporativo que permita:
- **Gestión básica** de Merchants, Channels, PSPs y Commissions
- **Simulador de pagos** interactivo con desglose completo de comisiones
- **Visualización** de configuraciones activas por merchant-país-canal

### Alcance Reducido (MVP)

**Endpoints Implementados:**
- ✅ CRUD básico de Merchants (crear, listar, ver detalle)
- ✅ CRUD básico de Channels (crear, listar)
- ✅ CRUD básico de PSPs (crear, listar)
- ✅ Templates de comisión (crear, listar, aprobar)
- ✅ Asignaciones de comisiones (asignar, listar activas)
- ✅ **Simulador de pagos** (calcular comisión en tiempo real)

**Funcionalidades Simplificadas:**
- ❌ No soft delete (delete físico)
- ❌ No edición completa (solo creación y vista)
- ❌ No histórico completo (solo estado actual)
- ❌ No múltiples usuarios (un solo admin)

### Stack Tecnológico

**Frontend:**
- **Next.js 14+** (App Router)
- **TypeScript**
- **shadcn/ui** (componentes)
- **Tailwind CSS** (estilos)
- **Recharts** (gráficas)
- **Zustand** (state management)
- **React Hook Form** + Zod (formularios)

**Storage:**
- **localStorage** (base de datos simulada)
- **Zustand persist middleware** (sincronización)

**Testing:**
- **Vitest** (unit tests)
- **Playwright** (e2e tests)

---

## 2. ANÁLISIS DE SERVICIOS EXISTENTES

### 2.1 Merchants Service

**Ubicación:** `C:\Users\Admn\zippy\merchants`

**Entidad Principal:**
```typescript
interface Merchant {
  id: string;                    // UUID
  name: string;                  // Nombre del merchant
  code: string;                  // Código único
  isActive: boolean;             // Estado activo/inactivo
  countries: string[];           // Países donde opera
  balanceEvaluationEnabled: boolean;
  depositCallbackUrl: string | null;
  withdrawalCallbackUrl: string | null;
  callbackApiKeyRef: string | null;
  callbackSecretKeyRef: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

**Funcionalidades Identificadas:**
- CRUD de merchants
- Gestión de países
- Configuración de callbacks
- Soft delete

---

### 2.2 Channels Service

**Ubicación:** `C:\Users\Admn\zippy\channels`

**Entidades Principales:**

**Channel:**
```typescript
interface Channel {
  id: string;          // UUID
  code: string;        // Código único (ej: 'pix', 'credit_card')
  name: string;        // Nombre descriptivo
  description: string; // Descripción
  isActive: boolean;   // Estado
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

**PSP:**
```typescript
interface PSP {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

**Funcionalidades Identificadas:**
- CRUD de channels
- CRUD de PSPs
- Relación Channel-PSP
- Soft delete

---

### 2.3 Commissions Service

**Fuente:** Documentación RFC (`COMMISSIONS_SERVICE_HIGH_LEVEL.md`)

**Entidades Principales:**

**CommissionTemplate:**
```typescript
interface CommissionTemplate {
  id: string;
  code: string;
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED';
  effectiveDate: Date;
  expirationDate: Date | null;
  createdBy: string;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

**CommissionParameter:**
```typescript
interface CommissionParameter {
  id: string;
  commissionTemplateId: string;
  parameterType: 'PERCENTAGE' | 'FIXED_FEE' | 'MIN_RANGE' | 'MAX_RANGE';
  value: number;
  currency: string;
  minRange: number | null;
  maxRange: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**CommissionAssignment:**
```typescript
interface CommissionAssignment {
  id: string;
  commissionTemplateId: string;
  merchantId: string;
  countryCode: string;
  channelCode: string;
  startDate: Date;
  endDate: Date | null;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  assignedBy: string;
  createdAt: Date;
}
```

**MerchantTaxConfig:**
```typescript
interface MerchantTaxConfig {
  id: string;
  merchantId: string;
  countryCode: string;
  channelCode: string;
  taxCode: string;    // 'IVA', 'ICMS', 'PIS', etc.
  taxName: string;
  rate: number;       // 0.19 para 19%
  isActive: boolean;
  createdAt: Date;
}
```

**PSPCommission:**
```typescript
interface PSPCommission {
  id: string;
  pspId: string;
  countryCode: string;
  channelCode: string;
  commissionType: 'PERCENTAGE' | 'FIXED' | 'MIXED';
  percentage: number;
  fixedFee: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
}
```

---

## 3. ARQUITECTURA DEL DASHBOARD

### 3.1 Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD NEXTJS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PRESENTATION LAYER                     │   │
│  │  - Pages (App Router)                              │   │
│  │  - Components (shadcn/ui)                          │   │
│  │  - Forms (React Hook Form + Zod)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             STATE MANAGEMENT                        │   │
│  │  - Zustand Stores (merchants, channels, commissions)│   │
│  │  - Persist Middleware (sync localStorage)          │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             SERVICE LAYER                           │   │
│  │  - merchantsService (CRUD)                         │   │
│  │  - channelsService (CRUD)                          │   │
│  │  - commissionsService (CRUD)                       │   │
│  │  - Simulación de API REST                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             DATA LAYER                              │   │
│  │  - localStorage (persistencia)                      │   │
│  │  - Seed data (datos iniciales)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Patrones de Diseño

**1. Repository Pattern:**
- Abstracción del acceso a datos (localStorage)
- Facilita migración futura a API real

**2. Service Layer:**
- Lógica de negocio centralizada
- Validaciones
- Transformaciones de datos

**3. State Management:**
- Zustand para estado global
- React Query pattern (simulado)
- Optimistic updates

---

## 4. ESTRUCTURA DEL PROYECTO

```
zippy-dashboard/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (dashboard)/           # Layout dashboard
│   │   │   ├── merchants/         # Gestión de merchants
│   │   │   │   ├── page.tsx       # Lista de merchants
│   │   │   │   ├── [id]/          # Detalle merchant
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/           # Crear merchant
│   │   │   │       └── page.tsx
│   │   │   ├── channels/          # Gestión de channels
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── commissions/       # Gestión de comisiones
│   │   │   │   ├── page.tsx       # Vista principal
│   │   │   │   ├── templates/     # Templates
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [id]/
│   │   │   │   │   └── new/
│   │   │   │   └── assignments/   # Asignaciones
│   │   │   │       ├── page.tsx
│   │   │   │       └── new/
│   │   │   ├── analytics/         # Dashboard analytics
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx         # Layout compartido
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Home / Login
│   │
│   ├── components/                # Componentes compartidos
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── dashboard/             # Componentes dashboard
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   └── stats-card.tsx
│   │   ├── merchants/             # Componentes merchants
│   │   │   ├── merchant-table.tsx
│   │   │   ├── merchant-form.tsx
│   │   │   └── merchant-card.tsx
│   │   ├── channels/              # Componentes channels
│   │   │   ├── channel-table.tsx
│   │   │   └── channel-form.tsx
│   │   └── commissions/           # Componentes commissions
│   │       ├── template-form.tsx
│   │       ├── assignment-form.tsx
│   │       └── commission-calculator.tsx
│   │
│   ├── lib/                       # Utilidades
│   │   ├── repositories/          # Data access layer
│   │   │   ├── merchants.repository.ts
│   │   │   ├── channels.repository.ts
│   │   │   └── commissions.repository.ts
│   │   ├── services/              # Business logic
│   │   │   ├── merchants.service.ts
│   │   │   ├── channels.service.ts
│   │   │   └── commissions.service.ts
│   │   ├── stores/                # Zustand stores
│   │   │   ├── merchants.store.ts
│   │   │   ├── channels.store.ts
│   │   │   └── commissions.store.ts
│   │   ├── validations/           # Zod schemas
│   │   │   ├── merchant.schema.ts
│   │   │   ├── channel.schema.ts
│   │   │   └── commission.schema.ts
│   │   └── utils.ts               # Funciones helper
│   │
│   ├── types/                     # TypeScript types
│   │   ├── merchant.ts
│   │   ├── channel.ts
│   │   └── commission.ts
│   │
│   └── seed/                      # Datos iniciales
│       └── seed-data.ts
│
├── public/                        # Assets estáticos
├── tests/                         # Tests
│   ├── unit/
│   └── e2e/
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 5. MODELO DE DATOS LOCALSTORAGE

### 5.1 Estructura de Keys

```typescript
// Keys principales
const STORAGE_KEYS = {
  MERCHANTS: 'zippy:merchants',
  CHANNELS: 'zippy:channels',
  PSPS: 'zippy:psps',
  COMMISSION_TEMPLATES: 'zippy:commission_templates',
  COMMISSION_PARAMETERS: 'zippy:commission_parameters',
  COMMISSION_ASSIGNMENTS: 'zippy:commission_assignments',
  MERCHANT_TAX_CONFIGS: 'zippy:merchant_tax_configs',
  PSP_COMMISSIONS: 'zippy:psp_commissions',
  METADATA: 'zippy:metadata',
} as const;
```

### 5.2 Formato de Datos

```typescript
// localStorage structure
{
  "zippy:merchants": [
    {
      id: "uuid-1",
      name: "1XBET",
      code: "1XBET_001",
      isActive: true,
      countries: ["CL", "BR", "PE"],
      balanceEvaluationEnabled: true,
      depositCallbackUrl: "https://1xbet.com/callback/deposit",
      withdrawalCallbackUrl: null,
      callbackApiKeyRef: null,
      callbackSecretKeyRef: null,
      createdAt: "2025-01-19T00:00:00Z",
      updatedAt: "2025-01-19T00:00:00Z",
      deletedAt: null
    }
  ],

  "zippy:channels": [
    {
      id: "uuid-2",
      code: "pix",
      name: "PIX",
      description: "Sistema de pagos instantáneos de Brasil",
      isActive: true,
      createdAt: "2025-01-19T00:00:00Z",
      updatedAt: "2025-01-19T00:00:00Z",
      deletedAt: null
    }
  ],

  "zippy:commission_templates": [
    {
      id: "uuid-3",
      code: "STANDARD_PERCENTAGE",
      name: "Comisión Estándar Porcentual",
      type: "PERCENTAGE",
      status: "APPROVED",
      effectiveDate: "2025-01-01T00:00:00Z",
      expirationDate: null,
      createdBy: "admin@zippy.com",
      approvedBy: "manager@zippy.com",
      createdAt: "2025-01-19T00:00:00Z",
      updatedAt: "2025-01-19T00:00:00Z",
      deletedAt: null
    }
  ],

  "zippy:metadata": {
    version: "1.0",
    lastSeeded: "2025-01-19T00:00:00Z",
    recordCounts: {
      merchants: 5,
      channels: 8,
      commissionTemplates: 10
    }
  }
}
```

---

## 6. PLAN DE IMPLEMENTACIÓN (SIMPLIFICADO)

### FASE 1: SETUP Y FUNDAMENTOS (Día 1)

#### Día 1: Configuración Inicial

**Task 1.1: Crear proyecto Next.js**
```bash
npx create-next-app@latest zippy-dashboard --typescript --tailwind --app --src-dir
cd zippy-dashboard
```

**Task 1.2: Instalar dependencias**
```bash
# UI Components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card table input select form dialog sheet badge

# State & Forms
npm install zustand react-hook-form zod @hookform/resolvers

# Charts & Icons
npm install recharts lucide-react

# Utils
npm install clsx tailwind-merge date-fns uuid

# Dev Dependencies
npm install -D @types/uuid vitest @testing-library/react playwright
```

**Task 1.3: Configurar estructura base**
- Crear estructura de carpetas
- Configurar Tailwind (tema corporativo)
- Configurar TypeScript (strict mode)
- Setup de shadcn/ui

**Entregables:**
- ✅ Proyecto Next.js configurado
- ✅ shadcn/ui instalado
- ✅ Estructura de carpetas creada
- ✅ Configuración TypeScript

---

#### Día 2: Tipos y Repositorios

**Task 1.4: Definir tipos TypeScript**

Crear archivos en `src/types/`:

```typescript
// src/types/merchant.ts
export interface Merchant {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  countries: string[];
  balanceEvaluationEnabled: boolean;
  depositCallbackUrl: string | null;
  withdrawalCallbackUrl: string | null;
  callbackApiKeyRef: string | null;
  callbackSecretKeyRef: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// src/types/channel.ts
export interface Channel {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// src/types/commission.ts
export interface CommissionTemplate {
  id: string;
  code: string;
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED';
  effectiveDate: string;
  expirationDate: string | null;
  createdBy: string;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
```

**Task 1.5: Implementar repositorios localStorage**

```typescript
// src/lib/repositories/base.repository.ts
export class BaseRepository<T extends { id: string }> {
  constructor(private storageKey: string) {}

  getAll(): T[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  getById(id: string): T | null {
    const items = this.getAll();
    return items.find(item => item.id === id) || null;
  }

  create(item: T): T {
    const items = this.getAll();
    items.push(item);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    return item;
  }

  update(id: string, updates: Partial<T>): T | null {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    return items[index];
  }

  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    return filtered.length < items.length;
  }

  softDelete(id: string): T | null {
    return this.update(id, { deletedAt: new Date().toISOString() } as Partial<T>);
  }
}
```

**Entregables:**
- ✅ Tipos TypeScript completos
- ✅ BaseRepository genérico
- ✅ Repositorios específicos (merchants, channels, commissions)

---

### FASE 2: ESTADO Y SERVICIOS (Día 3)

**Task 2.1: Zustand Stores**

```typescript
// src/lib/stores/merchants.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Merchant } from '@/types/merchant';
import { merchantsRepository } from '@/lib/repositories';

interface MerchantsState {
  merchants: Merchant[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMerchants: () => void;
  getMerchantById: (id: string) => Merchant | undefined;
  createMerchant: (merchant: Omit<Merchant, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMerchant: (id: string, updates: Partial<Merchant>) => void;
  deleteMerchant: (id: string) => void;
}

export const useMerchantsStore = create<MerchantsState>()(
  persist(
    (set, get) => ({
      merchants: [],
      isLoading: false,
      error: null,

      fetchMerchants: () => {
        set({ isLoading: true });
        try {
          const merchants = merchantsRepository.getAll();
          set({ merchants, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to fetch merchants', isLoading: false });
        }
      },

      getMerchantById: (id) => {
        return get().merchants.find(m => m.id === id);
      },

      createMerchant: (merchantData) => {
        const merchant = merchantsRepository.create({
          ...merchantData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        });
        set({ merchants: [...get().merchants, merchant] });
      },

      updateMerchant: (id, updates) => {
        const updated = merchantsRepository.update(id, updates);
        if (updated) {
          set({
            merchants: get().merchants.map(m => m.id === id ? updated : m)
          });
        }
      },

      deleteMerchant: (id) => {
        merchantsRepository.delete(id);
        set({ merchants: get().merchants.filter(m => m.id !== id) });
      },
    }),
    {
      name: 'merchants-storage',
    }
  )
);
```

**Task 2.2: Servicios de Validación**

```typescript
// src/lib/validations/merchant.schema.ts
import { z } from 'zod';

export const merchantSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  code: z.string().regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric'),
  isActive: z.boolean(),
  countries: z.array(z.string().length(2)),
  balanceEvaluationEnabled: z.boolean(),
  depositCallbackUrl: z.string().url().nullable(),
  withdrawalCallbackUrl: z.string().url().nullable(),
  callbackApiKeyRef: z.string().nullable(),
  callbackSecretKeyRef: z.string().nullable(),
});

export type MerchantFormData = z.infer<typeof merchantSchema>;
```

**Entregables:**
- ✅ Zustand stores configurados
- ✅ Persist middleware habilitado
- ✅ Schemas de validación Zod
- ✅ Servicios con lógica de negocio

---

### FASE 3: COMPONENTES UI (Día 4-5)

**Task 3.1: Layout del Dashboard**

```typescript
// src/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Task 3.2: Componentes de Merchants**

- **MerchantTable**: Tabla con búsqueda, filtros, paginación
- **MerchantForm**: Formulario con validación
- **MerchantCard**: Card visual con stats
- **MerchantDetail**: Vista detallada

**Task 3.3: Componentes de Channels**

- **ChannelTable**: Gestión de canales
- **ChannelForm**: Crear/editar canal
- **PSPTable**: Gestión de PSPs

**Task 3.4: Componentes de Commissions**

- **TemplateForm**: Crear templates
- **AssignmentForm**: Asignar comisiones
- **CommissionCalculator**: Calculadora interactiva
- **TaxConfigForm**: Configurar impuestos

**Entregables:**
- ✅ Layout dashboard responsivo
- ✅ Sidebar con navegación
- ✅ Componentes de merchants
- ✅ Componentes de channels
- ✅ Componentes de commissions

---

### FASE 4: PÁGINAS Y RUTAS (Día 6)

**Task 4.1: Páginas de Merchants**

```typescript
// src/app/(dashboard)/merchants/page.tsx
'use client';

import { useMerchantsStore } from '@/lib/stores/merchants.store';
import { MerchantTable } from '@/components/merchants/merchant-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function MerchantsPage() {
  const { merchants, fetchMerchants } = useMerchantsStore();

  React.useEffect(() => {
    fetchMerchants();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Merchants</h1>
          <p className="text-gray-500">Gestión de comercios</p>
        </div>
        <Link href="/merchants/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Merchant
          </Button>
        </Link>
      </div>

      <MerchantTable merchants={merchants} />
    </div>
  );
}
```

**Task 4.2: Páginas de Channels**
- Lista de channels
- Crear/editar channel
- Detalle de channel

**Task 4.3: Páginas de Commissions**
- Dashboard de comisiones
- Gestión de templates
- Asignaciones
- Configuración de impuestos

**Entregables:**
- ✅ Rutas de merchants
- ✅ Rutas de channels
- ✅ Rutas de commissions
- ✅ Navegación entre páginas

---

### FASE 5: SIMULADOR DE PAGOS (Día 6-7)

**Task 5.1: Componente Simulador**

```typescript
// src/components/simulator/payment-simulator.tsx
'use client';

interface PaymentSimulation {
  merchantId: string;
  countryCode: string;
  channelCode: string;
  amount: number;
  currency: string;
}

interface SimulationResult {
  // Información del pago
  transactionAmount: number;
  currency: string;

  // Comisión de Zippy al Merchant
  merchantCommission: {
    type: 'FIXED' | 'PERCENTAGE' | 'MIXED';
    baseAmount: number;
    percentage?: number;
    fixedFee?: number;
    subtotal: number;
  };

  // Impuestos aplicados
  taxes: Array<{
    taxCode: string;
    taxName: string;
    rate: number;
    amount: number;
  }>;
  totalTaxes: number;

  // Comisión total de Zippy
  totalMerchantCommission: number;

  // Comisión del PSP a Zippy
  pspCommission: {
    pspName: string;
    type: 'FIXED' | 'PERCENTAGE' | 'MIXED';
    percentage?: number;
    fixedFee?: number;
    amount: number;
  };

  // Resumen financiero
  merchantReceives: number;      // Lo que recibe el merchant
  zippyRevenue: number;          // Ganancia neta de Zippy
  zippyCost: number;             // Costo del PSP para Zippy
  zippyMargin: number;           // Margen de Zippy
}

export function PaymentSimulator() {
  const [simulation, setSimulation] = useState<PaymentSimulation>({
    merchantId: '',
    countryCode: '',
    channelCode: '',
    amount: 10000,
    currency: 'CLP',
  });

  const [result, setResult] = useState<SimulationResult | null>(null);

  const calculateCommission = () => {
    // Lógica de cálculo usando las configuraciones de localStorage
    const config = getCommissionConfig(
      simulation.merchantId,
      simulation.countryCode,
      simulation.channelCode
    );

    // Calcular comisión base
    let baseCommission = 0;
    if (config.commission.type === 'PERCENTAGE') {
      baseCommission = simulation.amount * config.commission.percentage;
    } else if (config.commission.type === 'FIXED') {
      baseCommission = config.commission.fixedFee;
    } else if (config.commission.type === 'MIXED') {
      baseCommission =
        (simulation.amount * config.commission.percentage) +
        config.commission.fixedFee;
    }

    // Calcular impuestos
    const taxes = config.taxes.map(tax => ({
      ...tax,
      amount: baseCommission * tax.rate,
    }));
    const totalTaxes = taxes.reduce((sum, tax) => sum + tax.amount, 0);

    // Calcular comisión PSP
    const pspAmount = config.pspCommission.type === 'PERCENTAGE'
      ? simulation.amount * config.pspCommission.percentage
      : config.pspCommission.fixedFee;

    // Calcular resultado final
    const totalMerchantCommission = baseCommission + totalTaxes;
    const merchantReceives = simulation.amount - totalMerchantCommission;
    const zippyRevenue = totalMerchantCommission - pspAmount;

    setResult({
      transactionAmount: simulation.amount,
      currency: simulation.currency,
      merchantCommission: {
        type: config.commission.type,
        baseAmount: baseCommission,
        percentage: config.commission.percentage,
        fixedFee: config.commission.fixedFee,
        subtotal: baseCommission,
      },
      taxes,
      totalTaxes,
      totalMerchantCommission,
      pspCommission: {
        pspName: config.pspCommission.pspName,
        type: config.pspCommission.type,
        percentage: config.pspCommission.percentage,
        fixedFee: config.pspCommission.fixedFee,
        amount: pspAmount,
      },
      merchantReceives,
      zippyRevenue,
      zippyCost: pspAmount,
      zippyMargin: (zippyRevenue / totalMerchantCommission) * 100,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Formulario de simulación */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <Select value={simulation.merchantId} onValueChange={...}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar Merchant" />
              </SelectTrigger>
              <SelectContent>
                {merchants.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={simulation.countryCode} onValueChange={...}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar País" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CL">Chile</SelectItem>
                <SelectItem value="BR">Brasil</SelectItem>
                <SelectItem value="PE">Perú</SelectItem>
              </SelectContent>
            </Select>

            <Select value={simulation.channelCode} onValueChange={...}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar Canal" />
              </SelectTrigger>
              <SelectContent>
                {channels.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              label="Monto"
              value={simulation.amount}
              onChange={(e) => setSimulation({
                ...simulation,
                amount: parseFloat(e.target.value)
              })}
            />

            <Button onClick={calculateCommission} className="w-full">
              Simular Pago
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Resultado de simulación */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Desglose del Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Monto de transacción */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Monto de Transacción</p>
              <p className="text-2xl font-bold">
                {formatCurrency(result.transactionAmount, result.currency)}
              </p>
            </div>

            {/* Comisión de Zippy al Merchant */}
            <div className="space-y-2">
              <h3 className="font-semibold">Comisión Zippy → Merchant</h3>
              <div className="pl-4 border-l-2 border-blue-500 space-y-1">
                {result.merchantCommission.type === 'PERCENTAGE' && (
                  <div className="flex justify-between text-sm">
                    <span>Porcentaje ({result.merchantCommission.percentage}%)</span>
                    <span className="font-mono">
                      {formatCurrency(result.merchantCommission.subtotal, result.currency)}
                    </span>
                  </div>
                )}
                {result.merchantCommission.type === 'FIXED' && (
                  <div className="flex justify-between text-sm">
                    <span>Tarifa Fija</span>
                    <span className="font-mono">
                      {formatCurrency(result.merchantCommission.fixedFee, result.currency)}
                    </span>
                  </div>
                )}
                {result.merchantCommission.type === 'MIXED' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Porcentaje ({result.merchantCommission.percentage}%)</span>
                      <span className="font-mono">
                        {formatCurrency(
                          result.transactionAmount * result.merchantCommission.percentage,
                          result.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tarifa Fija</span>
                      <span className="font-mono">
                        {formatCurrency(result.merchantCommission.fixedFee, result.currency)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-semibold pt-1 border-t">
                  <span>Subtotal Comisión</span>
                  <span className="font-mono">
                    {formatCurrency(result.merchantCommission.subtotal, result.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Impuestos */}
            {result.taxes.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Impuestos</h3>
                <div className="pl-4 border-l-2 border-yellow-500 space-y-1">
                  {result.taxes.map(tax => (
                    <div key={tax.taxCode} className="flex justify-between text-sm">
                      <span>{tax.taxName} ({(tax.rate * 100).toFixed(2)}%)</span>
                      <span className="font-mono">
                        {formatCurrency(tax.amount, result.currency)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>Total Impuestos</span>
                    <span className="font-mono">
                      {formatCurrency(result.totalTaxes, result.currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Total comisión al merchant */}
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Comisión Merchant</span>
                <span className="text-xl font-bold text-red-700 font-mono">
                  {formatCurrency(result.totalMerchantCommission, result.currency)}
                </span>
              </div>
            </div>

            {/* Comisión del PSP */}
            <div className="space-y-2">
              <h3 className="font-semibold">Comisión PSP → Zippy</h3>
              <div className="pl-4 border-l-2 border-purple-500 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Proveedor</span>
                  <span className="font-semibold">{result.pspCommission.pspName}</span>
                </div>
                {result.pspCommission.type === 'PERCENTAGE' && (
                  <div className="flex justify-between text-sm">
                    <span>Porcentaje ({result.pspCommission.percentage}%)</span>
                    <span className="font-mono">
                      {formatCurrency(result.pspCommission.amount, result.currency)}
                    </span>
                  </div>
                )}
                {result.pspCommission.type === 'FIXED' && (
                  <div className="flex justify-between text-sm">
                    <span>Tarifa Fija</span>
                    <span className="font-mono">
                      {formatCurrency(result.pspCommission.fixedFee, result.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-1 border-t">
                  <span>Total Costo PSP</span>
                  <span className="font-mono text-purple-700">
                    {formatCurrency(result.pspCommission.amount, result.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Resumen Final */}
            <div className="pt-4 border-t-2 space-y-3">
              <h3 className="font-bold text-lg">Resumen Financiero</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Merchant Recibe</p>
                  <p className="text-lg font-bold text-green-700 font-mono">
                    {formatCurrency(result.merchantReceives, result.currency)}
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Ganancia Zippy</p>
                  <p className="text-lg font-bold text-blue-700 font-mono">
                    {formatCurrency(result.zippyRevenue, result.currency)}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Margen Zippy</span>
                  <span className="text-xl font-bold font-mono">
                    {result.zippyMargin.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Task 5.2: Servicio de Cálculo**

```typescript
// src/lib/services/commission-calculator.service.ts
export class CommissionCalculatorService {
  /**
   * Obtiene la configuración completa para calcular una comisión
   */
  getCommissionConfig(
    merchantId: string,
    countryCode: string,
    channelCode: string,
    date: Date = new Date()
  ) {
    // 1. Buscar asignaciones activas
    const assignments = commissionsRepository
      .getAssignments()
      .filter(a =>
        a.merchantId === merchantId &&
        a.countryCode === countryCode &&
        a.channelCode === channelCode &&
        a.status === 'ACTIVE' &&
        new Date(a.startDate) <= date &&
        (!a.endDate || new Date(a.endDate) >= date)
      );

    if (assignments.length === 0) {
      throw new Error('No hay comisión configurada para este merchant-país-canal');
    }

    // 2. Obtener templates
    const templates = assignments.map(a => {
      const template = commissionsRepository.getTemplateById(a.commissionTemplateId);
      const parameters = commissionsRepository.getParametersByTemplateId(template.id);
      return { template, parameters };
    });

    // 3. Obtener impuestos
    const taxes = commissionsRepository
      .getMerchantTaxConfigs()
      .filter(t =>
        t.merchantId === merchantId &&
        t.countryCode === countryCode &&
        t.channelCode === channelCode &&
        t.isActive
      );

    // 4. Obtener comisión PSP
    const channel = channelsRepository.getByCode(channelCode);
    const pspCommission = commissionsRepository
      .getPSPCommissions()
      .find(p =>
        p.countryCode === countryCode &&
        p.channelCode === channelCode &&
        p.isActive
      );

    return {
      commission: this.parseCommissionTemplate(templates[0]),
      taxes: taxes.map(t => ({
        taxCode: t.taxCode,
        taxName: t.taxName,
        rate: t.customRate || t.rate,
      })),
      pspCommission: pspCommission ? {
        pspName: pspCommission.pspName,
        type: pspCommission.commissionType,
        percentage: pspCommission.percentage,
        fixedFee: pspCommission.fixedFee,
      } : null,
    };
  }

  /**
   * Parsea un template y sus parámetros a formato usable
   */
  private parseCommissionTemplate(templateData: any) {
    const { template, parameters } = templateData;

    const hasPercentage = parameters.some(p => p.parameterType === 'PERCENTAGE');
    const hasFixed = parameters.some(p => p.parameterType === 'FIXED_FEE');

    let type: 'FIXED' | 'PERCENTAGE' | 'MIXED';
    if (hasPercentage && hasFixed) {
      type = 'MIXED';
    } else if (hasPercentage) {
      type = 'PERCENTAGE';
    } else {
      type = 'FIXED';
    }

    return {
      type,
      percentage: parameters.find(p => p.parameterType === 'PERCENTAGE')?.value || 0,
      fixedFee: parameters.find(p => p.parameterType === 'FIXED_FEE')?.value || 0,
    };
  }
}

export const commissionCalculator = new CommissionCalculatorService();
```

**Entregables:**
- ✅ Simulador de pagos interactivo
- ✅ Desglose visual detallado
- ✅ Cálculo de comisiones, impuestos y PSP
- ✅ Resumen financiero con márgenes

---

### FASE 6: SEED DATA Y ANALYTICS (Día 7)

**Task 5.1: Seed Data**

```typescript
// src/seed/seed-data.ts
export const seedDatabase = () => {
  const merchants = [
    {
      id: crypto.randomUUID(),
      name: "1XBET",
      code: "1XBET_001",
      isActive: true,
      countries: ["CL", "BR", "PE"],
      balanceEvaluationEnabled: true,
      depositCallbackUrl: "https://1xbet.com/callback",
      withdrawalCallbackUrl: null,
      callbackApiKeyRef: null,
      callbackSecretKeyRef: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    // ... más merchants
  ];

  const channels = [
    {
      id: crypto.randomUUID(),
      code: "pix",
      name: "PIX",
      description: "Sistema de pagos instantáneos de Brasil",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    // ... más channels
  ];

  localStorage.setItem('zippy:merchants', JSON.stringify(merchants));
  localStorage.setItem('zippy:channels', JSON.stringify(channels));
  // ... seed commissions
};
```

**Task 5.2: Dashboard Analytics**

- Cards con métricas principales
- Gráficas con Recharts
- Filtros por fecha
- Exportación de datos

**Entregables:**
- ✅ Seed data completo
- ✅ Dashboard analytics
- ✅ Gráficas interactivas
- ✅ Exportación CSV/JSON

---

### FASE 6: TESTING Y REFINAMIENTO (Día 8)

**Task 6.1: Unit Tests**

```typescript
// tests/unit/merchants.store.test.ts
import { describe, it, expect } from 'vitest';
import { useMerchantsStore } from '@/lib/stores/merchants.store';

describe('Merchants Store', () => {
  it('should create a merchant', () => {
    const store = useMerchantsStore.getState();
    const merchantData = {
      name: 'Test Merchant',
      code: 'TEST_001',
      // ...
    };

    store.createMerchant(merchantData);
    const merchants = store.merchants;

    expect(merchants).toHaveLength(1);
    expect(merchants[0].name).toBe('Test Merchant');
  });
});
```

**Task 6.2: E2E Tests**

```typescript
// tests/e2e/merchants.spec.ts
import { test, expect } from '@playwright/test';

test('create new merchant', async ({ page }) => {
  await page.goto('/merchants');
  await page.click('text=Nuevo Merchant');

  await page.fill('input[name="name"]', 'Test Merchant');
  await page.fill('input[name="code"]', 'TEST_001');

  await page.click('button[type="submit"]');

  await expect(page.locator('text=Test Merchant')).toBeVisible();
});
```

**Task 6.3: Refinamiento UI/UX**
- Animaciones smooth
- Loading states
- Error handling
- Toast notifications
- Responsive design

**Entregables:**
- ✅ Suite de unit tests
- ✅ Suite de e2e tests
- ✅ UI/UX pulido
- ✅ Documentación actualizada

---

## 7. DISEÑO UI/UX

### 7.1 Paleta de Colores (Corporativo)

```css
:root {
  /* Primary - Azul corporativo */
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;

  /* Secondary - Gris profesional */
  --secondary: 215 20% 65%;
  --secondary-foreground: 0 0% 100%;

  /* Accent - Verde éxito */
  --accent: 142 71% 45%;
  --accent-foreground: 0 0% 100%;

  /* Destructive - Rojo error */
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  /* Background */
  --background: 0 0% 97%;
  --foreground: 222 47% 11%;

  /* Card */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  /* Muted */
  --muted: 215 20% 96%;
  --muted-foreground: 215 16% 47%;

  /* Border */
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 221 83% 53%;
}
```

### 7.2 Componentes Clave

**Sidebar:**
- Logo arriba
- Navegación con iconos
- Estado activo destacado
- Collapse en mobile

**Topbar:**
- Breadcrumbs
- Usuario logueado
- Notificaciones
- Búsqueda global

**Cards:**
- Sombra sutil
- Border radius 8px
- Hover effect
- Loading skeleton

**Tables:**
- Zebra striping
- Hover row
- Sticky header
- Responsive (horizontal scroll)

**Forms:**
- Campos con labels
- Validación inline
- Error states
- Success feedback

---

## 8. TESTING Y VALIDACIÓN

### 8.1 Checklist de Testing

**Unit Tests:**
- [ ] Stores (Zustand)
- [ ] Repositories
- [ ] Validaciones (Zod)
- [ ] Helpers/utils

**Integration Tests:**
- [ ] Flujo crear merchant
- [ ] Flujo asignar comisión
- [ ] Navegación entre páginas
- [ ] Persistencia localStorage

**E2E Tests:**
- [ ] User journey completo
- [ ] CRUD merchants
- [ ] CRUD channels
- [ ] CRUD commissions
- [ ] Responsive en mobile

### 8.2 Performance

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 500KB

---

## 9. ENTREGABLES FINALES

### 9.1 Documentación

1. **README.md**
   - Instrucciones de instalación
   - Comandos disponibles
   - Arquitectura overview
   - Screenshots

2. **DEPLOYMENT.md**
   - Deploy en Vercel
   - Variables de entorno
   - Build process

3. **API_SIMULATION.md**
   - Cómo funciona localStorage
   - Estructura de datos
   - Migración a API real

### 9.2 Demo

- Video de 5 minutos mostrando:
  1. Gestión de merchants
  2. Gestión de channels
  3. Asignación de comisiones
  4. Dashboard analytics
  5. Responsive design

### 9.3 Código

- Repositorio Git limpio
- Commits descriptivos
- Branch protegido main
- PR reviews (si aplica)

---

## 10. CRONOGRAMA RESUMIDO

| Día | Fase | Tareas | Horas |
|-----|------|--------|-------|
| 1 | Setup | Proyecto + Dependencias + Estructura | 8h |
| 2 | Tipos | TypeScript types + Repositorios | 8h |
| 3 | Estado | Zustand stores + Validaciones | 8h |
| 4 | UI | Layout + Componentes Merchants/Channels | 8h |
| 5 | UI | Componentes Commissions | 8h |
| 6 | Páginas | Rutas + Navegación | 8h |
| 7 | Data | Seed + Analytics | 8h |
| 8 | Testing | Tests + Refinamiento | 8h |

**Total: 64 horas (8 días laborales)**

---

## 11. RIESGOS Y MITIGACIÓN

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| localStorage limitations (5MB) | Medio | Bajo | Implementar pagination, lazy loading |
| Complejidad modelo commissions | Alto | Medio | Empezar simple, iterar |
| Tiempo insuficiente | Alto | Medio | Priorizar features core, MVP first |
| shadcn/ui learning curve | Bajo | Medio | Documentación oficial, ejemplos |

---

## 12. PRÓXIMOS PASOS POST-POC

1. **Migración a API Real:**
   - Reemplazar localStorage por fetch
   - Implementar React Query
   - Manejo de errores robusto

2. **Autenticación:**
   - NextAuth.js
   - Roles y permisos
   - Protected routes

3. **Features Avanzadas:**
   - Bulk operations
   - Export/import CSV
   - Audit logs
   - Notifications en tiempo real

---

**Fin del Plan de Trabajo**
