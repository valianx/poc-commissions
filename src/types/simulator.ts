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
  baseAmount: number; // Comisión bruta de Zippy (sin VAT)
  percentage?: number;
  fixedFee?: number;
}

export interface ZippyBreakdown {
  grossCommission: number; // Comisión bruta de Zippy (sin IVA)
  pspCost: number; // Lo que Zippy paga al PSP
  ingresoZippy: number; // Total cobrado - PSP (grossCommission + vatAmount)
  vatPercentage: number | null; // Porcentaje de VAT (ej: 0.19)
  vatAmount: number; // VAT sobre grossCommission
  netProfit: number; // Ganancia neta de Zippy (ingresoZippy - vatAmount = grossCommission)
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

  // Comisión configurada de Zippy
  merchantCommission: CommissionBreakdown;

  // Comisión del PSP
  pspCommission: PSPCommissionBreakdown;

  // Desglose de lo que cobra/gana Zippy
  zippyBreakdown: ZippyBreakdown;

  // Resultado final para el merchant
  merchantReceives: number; // Monto original - total cobrado por Zippy
  totalChargedToMerchant: number; // Total que se le cobra al merchant
}
