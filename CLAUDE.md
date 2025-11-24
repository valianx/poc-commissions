# CLAUDE.md

This file provides guidance for Claude Code when working with this repository.

## Project Overview

Zippy Dashboard is a Next.js POC (Proof of Concept) for managing merchants, payment channels, PSPs (Payment Service Providers), and commission configurations. It uses localStorage for data persistence and is designed as a demonstration tool, not for production use.

## Commands

```bash
# Install dependencies
pnpm install

# Development server with Turbopack
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

## Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS v4 (CSS-based configuration in `src/app/globals.css`)
- **State Management**: Zustand with persist middleware
- **Forms**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui (Badge, Button, Card, Dialog, Input, Label, Table)
- **Icons**: Lucide React
- **Package Manager**: pnpm 10.20.0

## Architecture

### Directory Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── dashboard/           # Main dashboard routes
│   │   ├── merchants/       # Merchant CRUD
│   │   ├── channels/        # Channels and PSPs management
│   │   ├── commissions/     # Commission configuration
│   │   └── simulator/       # Payment calculator
│   └── globals.css          # Tailwind CSS v4 config
├── components/              # React components
│   ├── ui/                  # shadcn/ui base components
│   ├── dashboard/           # Sidebar, Topbar
│   ├── merchants/           # Merchant forms and tables
│   ├── channels/            # Channel and PSP forms
│   ├── commissions/         # Commission dialogs
│   └── simulator/           # Payment calculator UI
├── lib/
│   ├── repositories/        # Data access layer (localStorage)
│   ├── stores/              # Zustand stores
│   ├── services/            # Business logic
│   ├── validations/         # Zod schemas
│   └── utils.ts             # cn() helper for classnames
├── types/                   # TypeScript interfaces
│   ├── merchant.ts
│   ├── channel.ts
│   ├── commission.ts
│   └── simulator.ts
└── seed/                    # Initial seed data
    └── seed-data.ts
```

### Data Flow Pattern

1. **Repositories** (`lib/repositories/`): Direct localStorage access with CRUD operations
2. **Stores** (`lib/stores/`): Zustand stores with persist middleware, consume repositories
3. **Components**: Use stores via hooks (e.g., `useChannelsStore()`, `useMerchantsStore()`)

### Key Domain Concepts

**Merchants**: Companies that use Zippy for payment processing
- Have assigned countries of operation
- Commission assignments are per merchant-country-channel combination

**Channels**: Payment methods (PIX, Credit Card, Debit Card, WebPay, etc.)
- Have PSP assignments per country
- Channels are a central entity shared across the system

**PSPs (Payment Service Providers)**: Backend providers that process payments
- Have commission configurations per channel+country combination
- Examples: PayU, MercadoPago, Transbank

**Commission Assignments**: Define what Zippy charges merchants
- Scoped to merchant-country-channel
- Can have base percentage/fixed values or amount ranges
- Include optional VAT configuration

### Commission Calculation Flow

Located in `src/lib/services/commission-calculator.service.ts`:

1. Look up active commission assignments for merchant-country-channel
2. Calculate gross commission (percentage + fixed fees)
3. Find channel's PSP assignment for the country
4. Look up PSP's commission for that channel+country
5. Calculate VAT on gross commission
6. Return breakdown: `totalChargedToMerchant = grossCommission + pspAmount + vatAmount`

### localStorage Keys

Data is stored with `zippy:` prefix:
- `zippy:merchants`
- `zippy:channels`
- `zippy:psps`
- `zippy:commission_assignments`
- `zippy:commission_templates` (legacy)
- `zippy:commission_parameters` (legacy)
- `zippy:metadata`

## Important Patterns

### Tailwind CSS v4

This project uses Tailwind CSS v4 with CSS-based configuration (no `tailwind.config.js`):
- Theme customization in `src/app/globals.css` using `@theme`
- Uses `@tailwindcss/postcss` plugin

### Form Validation

All forms use React Hook Form with Zod resolvers:
```typescript
const schema = z.object({ ... });
const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

### PSP Commission Structure

PSP commissions are keyed by channel+country combination:
```typescript
interface PSPCommissionByChannelCountry {
  channelCode: string;
  countryCode: string;
  commissionType: "PERCENTAGE" | "FIXED" | "MIXED";
  percentageValue: number | null;  // e.g., 0.029 for 2.9%
  fixedValue: number | null;
}
```

## Common Tasks

### Adding a New Page

1. Create page in `src/app/dashboard/[section]/page.tsx`
2. Add route to sidebar in `src/components/dashboard/sidebar.tsx`
3. Create components in `src/components/[section]/`

### Adding a New Entity Type

1. Define types in `src/types/[entity].ts`
2. Create repository in `src/lib/repositories/[entity].repository.ts`
3. Create Zustand store in `src/lib/stores/[entity].store.ts`
4. Add Zod schema in `src/lib/validations/[entity].schema.ts`
5. Update seed data in `src/seed/seed-data.ts`

### Resetting Data

Visit `/clear-storage` to clear all localStorage data. The app will re-seed on next load.

## Notes

- This is a POC - data persists only in browser localStorage
- Seed data loads automatically on first visit
- To migrate to production, replace repositories with API calls
- Language in UI is Spanish
