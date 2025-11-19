export interface PaymentSimulation {
  merchantId: string;
  countryCode: string;
  channelCode: string;
  amount: number;
  currency: string;
}

export interface TaxBreakdown {
  taxCode: string;
  taxName: string;
  rate: number;
  amount: number;
}

export interface CommissionBreakdown {
  type: "FIXED" | "PERCENTAGE" | "MIXED";
  baseAmount: number;
  percentage?: number;
  fixedFee?: number;
  subtotal: number;
}

export interface PSPCommissionBreakdown {
  pspName: string;
  type: "FIXED" | "PERCENTAGE" | "MIXED";
  percentage?: number;
  fixedFee?: number;
  amount: number;
}

export interface SimulationResult {
  // Información del pago
  transactionAmount: number;
  currency: string;

  // Comisión de Zippy al Merchant
  merchantCommission: CommissionBreakdown;

  // Impuestos aplicados
  taxes: TaxBreakdown[];
  totalTaxes: number;

  // Comisión total de Zippy
  totalMerchantCommission: number;

  // Comisión del PSP a Zippy
  pspCommission: PSPCommissionBreakdown;

  // Resumen financiero
  merchantReceives: number; // Lo que recibe el merchant (monto original - comisión Zippy - comisión PSP)
  zippyRevenue: number; // Lo que cobra Zippy al merchant (comisión base + impuestos)
  zippyCost: number; // Lo que Zippy paga al PSP
  zippyNetProfit: number; // Ganancia neta de Zippy (revenue - costo PSP)
  zippyMargin: number; // Margen de Zippy (% de ganancia neta sobre revenue)
}
