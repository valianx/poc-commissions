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

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand con persist middleware
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

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
│   ├── (dashboard)/             # Layout dashboard
│   │   ├── merchants/           # Gestión de merchants
│   │   ├── channels/            # Gestión de channels
│   │   ├── commissions/         # Gestión de comisiones
│   │   ├── simulator/           # Simulador de pagos
│   │   └── dashboard/           # Dashboard principal
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # Componentes React
│   ├── ui/                      # shadcn/ui components
│   ├── dashboard/               # Componentes dashboard
│   ├── merchants/               # Componentes merchants
│   ├── channels/                # Componentes channels
│   └── simulator/               # Componente simulador
├── lib/                         # Lógica de negocio
│   ├── repositories/            # Data access layer
│   ├── services/                # Business logic
│   ├── stores/                  # Zustand stores
│   ├── validations/             # Zod schemas
│   └── utils.ts                 # Funciones helper
├── types/                       # TypeScript types
└── seed/                        # Datos iniciales
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
- Templates de comisión (Fija, Porcentual, Mixta)
- Parámetros configurables
- Asignaciones por merchant-país-canal
- Configuración de impuestos
- Comisiones de PSP

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

## Notas Importantes

- Este es un **POC** (Proof of Concept) para presentación
- Los datos se almacenan en **localStorage** del navegador
- No está diseñado para producción
- Para migrar a producción, reemplazar repositories con llamadas API REST

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
