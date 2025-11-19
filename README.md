# Zippy Dashboard POC

Dashboard corporativo de Next.js para gestión de Merchants, Channels y Commissions con simulación de integración usando localStorage.

## Características

- 📊 **Dashboard Analítico**: Vista general con métricas clave
- 🏪 **Gestión de Merchants**: CRUD completo con configuraciones de callback
- 💳 **Canales y PSPs**: Administración de métodos de pago y proveedores
- 💰 **Comisiones**: Templates, parámetros y asignaciones
- 🧮 **Simulador de Pagos**: Calculadora interactiva con desglose detallado
- 💾 **localStorage**: Persistencia de datos sin backend

## Stack Tecnológico

- **Framework**: Next.js 16.0.3 (App Router + Turbopack)
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS v4.1.17 (CSS-based configuration)
- **PostCSS**: @tailwindcss/postcss + autoprefixer
- **UI Components**: shadcn/ui (Badge, Button, Card, Dialog, Input, Label, Table)
- **State Management**: Zustand 5.0.8 con persist middleware
- **Forms**: React Hook Form 7.66.1 + Zod 4.1.12
- **Icons**: Lucide React 0.554.0
- **Package Manager**: pnpm 10.20.0

## Instalación

```bash
# Clonar el repositorio
cd zippy-dashboard

# Instalar dependencias
pnpm install

# Ejecutar en modo desarrollo
pnpm dev

# Construir para producción
pnpm build

# Ejecutar en producción
pnpm start
```

## Estructura del Proyecto

```
src/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Dashboard routes
│   │   ├── merchants/           # Gestión de merchants
│   │   │   ├── [id]/           # Detalle de merchant
│   │   │   ├── new/            # Crear merchant
│   │   │   └── page.tsx        # Lista de merchants
│   │   ├── channels/            # Gestión de channels y PSPs
│   │   │   ├── new/            # Crear channel
│   │   │   ├── psps/new/       # Crear PSP
│   │   │   └── page.tsx        # Lista de channels/PSPs
│   │   ├── commissions/         # Gestión de comisiones
│   │   │   ├── [merchantId]/   # Comisiones por merchant
│   │   │   │   ├── configure/  # Configurar comisión
│   │   │   │   └── edit/       # Editar comisión
│   │   │   └── page.tsx        # Vista merchant-centric
│   │   ├── simulator/           # Simulador de pagos
│   │   │   └── page.tsx
│   │   ├── layout.tsx           # Dashboard layout con sidebar
│   │   └── page.tsx             # Dashboard overview
│   ├── globals.css              # Tailwind CSS v4 configuration
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                   # Componentes React
│   ├── ui/                      # shadcn/ui components
│   ├── dashboard/               # Sidebar y Topbar
│   ├── merchants/               # Formularios y tablas
│   ├── channels/                # Channel y PSP forms
│   ├── commissions/             # Dialogs de configuración
│   └── simulator/               # Calculadora de pagos
├── lib/                         # Lógica de negocio
│   ├── repositories/            # Data access layer (localStorage)
│   ├── services/                # Business logic (calculadora)
│   ├── stores/                  # Zustand stores
│   ├── validations/             # Zod schemas
│   └── utils.ts                 # cn() helper
├── types/                       # TypeScript interfaces
│   ├── merchant.ts
│   ├── channel.ts
│   ├── commission.ts
│   ├── simulator.ts
│   └── storage.ts
└── seed/                        # Datos de ejemplo
    └── seed-data.ts
```

## Funcionalidades Principales

### Merchants
- Crear y listar merchants
- Configurar países de operación
- URLs de callback para depósitos y retiros
- Evaluación de balance

### Channels
- Gestionar canales de pago (PIX, tarjetas, etc.)
- Administrar PSPs (Payment Service Providers)
- Estado activo/inactivo

### Commissions

- **Vista Merchant-Centric**: Lista de merchants con progreso de configuración
- **Templates de comisión**: Fija, Porcentual, Mixta
- **Parámetros configurables**: Valores, rangos, monedas
- **Asignaciones**: Por merchant-país-canal con fechas de vigencia
- **Configuración de impuestos**: VAT/IVA por jurisdicción
- **Comisiones de PSP**: Configuración por proveedor y canal
- **Estados**: DRAFT, APPROVED, PUBLISHED para templates
- **Estados de asignación**: ACTIVE, EXPIRED, CANCELLED

### Simulador de Pagos
- Selección de merchant, país y canal
- Cálculo automático de comisiones
- Desglose detallado:
  - Comisión base de Zippy
  - Impuestos aplicados
  - Comisión del PSP
  - Resumen financiero con márgenes

## Modelo de Datos

Los datos se almacenan en localStorage con las siguientes keys:

- `zippy:merchants` - Información de merchants
- `zippy:channels` - Canales de pago
- `zippy:psps` - Proveedores de servicios
- `zippy:commission_templates` - Templates de comisión
- `zippy:commission_parameters` - Parámetros de comisión
- `zippy:commission_assignments` - Asignaciones activas
- `zippy:merchant_tax_configs` - Configuración de impuestos
- `zippy:psp_commissions` - Comisiones de PSP
- `zippy:metadata` - Metadatos del sistema

## Seed Data

El sistema incluye datos de ejemplo que se cargan automáticamente al primer uso:

- 3 Merchants (1XBET, BetWarrior, Caliente)
- 5 Channels (PIX, Tarjetas de Crédito/Débito, Transferencia, WebPay)
- 3 PSPs (PayU, MercadoPago, Transbank)
- 3 Templates de comisión
- Asignaciones y configuraciones de impuestos

## Scripts Disponibles

```bash
# Desarrollo con Turbopack
pnpm dev

# Build de producción
pnpm build

# Iniciar servidor de producción
pnpm start

# Linting
pnpm lint
```

## Rutas de Navegación

- `/` - Landing page con auto-redirect a dashboard
- `/dashboard` - Vista general con métricas
- `/dashboard/merchants` - Lista de merchants
  - `/dashboard/merchants/new` - Crear merchant
  - `/dashboard/merchants/[id]` - Detalle de merchant
- `/dashboard/channels` - Tabs de Channels y PSPs
  - `/dashboard/channels/new` - Crear channel
  - `/dashboard/channels/psps/new` - Crear PSP
- `/dashboard/commissions` - Vista merchant-centric de comisiones
  - `/dashboard/commissions/[merchantId]` - Detalle por merchant
  - `/dashboard/commissions/[merchantId]/configure` - Configurar comisión
  - `/dashboard/commissions/[merchantId]/edit/[assignmentId]` - Editar asignación
- `/dashboard/simulator` - Simulador de pagos interactivo

## Detalles Técnicos

### Tailwind CSS v4

Este proyecto usa la nueva versión de Tailwind CSS v4 con configuración basada en CSS:

- Configuración en `src/app/globals.css` usando `@theme`
- Variables CSS con prefijo `--color-*` para colores
- PostCSS plugin `@tailwindcss/postcss` en lugar del plugin legacy
- No se usa archivo `tailwind.config.js/ts`

### Arquitectura de Datos

- **Repository Pattern**: Abstracción sobre localStorage
- **Zustand Stores**: Estado global con persistencia automática
- **Zod Validation**: Validación de formularios en cliente
- **Type Safety**: Full TypeScript con interfaces estrictas

## Notas Importantes

- Este es un **POC** (Proof of Concept) para presentación
- Los datos se almacenan en **localStorage** del navegador
- No está diseñado para producción
- Para migrar a producción, reemplazar repositories con llamadas API REST
- La primera carga ejecuta automáticamente el seeder con datos de ejemplo

## Migración a API Real

Para convertir este POC en una aplicación de producción:

1. Crear API REST endpoints en el backend
2. Reemplazar los repositories por servicios con `fetch`
3. Implementar React Query para manejo de estado servidor
4. Agregar autenticación y autorización
5. Implementar manejo robusto de errores
6. Agregar testing end-to-end

## Licencia

Este es un proyecto de demostración interno para Zippy.
