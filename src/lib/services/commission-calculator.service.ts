import {
  commissionTemplatesRepository,
  commissionParametersRepository,
  commissionAssignmentsRepository,
  merchantTaxConfigsRepository,
  pspCommissionsRepository,
} from "@/lib/repositories/commissions.repository";
import { PaymentSimulation, SimulationResult } from "@/types/simulator";

export class CommissionCalculatorService {
  calculate(simulation: PaymentSimulation): SimulationResult {
    // 1. Buscar asignaciones activas
    const assignments = commissionAssignmentsRepository.getActiveAssignments(
      simulation.merchantId,
      simulation.countryCode,
      simulation.channelCode
    );

    if (assignments.length === 0) {
      throw new Error(
        "No hay comisión configurada para este merchant-país-canal"
      );
    }

    // 2. Calculate base commission (support both new and legacy models)
    const assignment = assignments[0];
    let baseCommission: number;
    let percentage: number | null = null;
    let fixedFee: number | null = null;
    let type: "FIXED" | "PERCENTAGE" | "MIXED";

    if (assignment.basePercentageValue !== undefined || assignment.baseFixedValue !== undefined) {
      // New model: direct values
      const percentageComm = (assignment.basePercentageValue || 0) * simulation.amount;
      const fixedComm = assignment.baseFixedValue || 0;
      baseCommission = percentageComm + fixedComm;
      percentage = assignment.basePercentageValue ?? null;
      fixedFee = assignment.baseFixedValue ?? null;

      if (assignment.basePercentageValue && assignment.baseFixedValue) {
        type = "MIXED";
      } else if (assignment.basePercentageValue) {
        type = "PERCENTAGE";
      } else {
        type = "FIXED";
      }
    } else {
      // Legacy model: template-based
      const template = commissionTemplatesRepository.getById(
        assignment.commissionTemplateId!
      );
      if (!template) {
        throw new Error("Template de comisión no encontrado");
      }

      const parameters = commissionParametersRepository.getByTemplateId(
        template.id
      );

      const result = this.calculateBaseCommission(simulation.amount, parameters);
      baseCommission = result.baseCommission;
      percentage = result.percentage;
      fixedFee = result.fixedFee;
      type = result.type;
    }

    // 4. Obtener impuestos
    const taxes = merchantTaxConfigsRepository.getActiveConfigs(
      simulation.merchantId,
      simulation.countryCode,
      simulation.channelCode
    );

    const taxesBreakdown = taxes.map((tax) => ({
      taxCode: tax.taxCode,
      taxName: tax.taxName,
      rate: tax.rate,
      amount: baseCommission * tax.rate,
    }));

    const totalTaxes = taxesBreakdown.reduce(
      (sum, tax) => sum + tax.amount,
      0
    );

    // 5. Comisión total al merchant
    const totalMerchantCommission = baseCommission + totalTaxes;

    // 6. Obtener comisión PSP
    const pspCommissions = pspCommissionsRepository.getByChannel(
      simulation.countryCode,
      simulation.channelCode
    );

    const pspCommission = pspCommissions[0];
    if (!pspCommission) {
      throw new Error("No hay comisión PSP configurada");
    }

    const pspAmount = this.calculatePSPCommission(
      simulation.amount,
      pspCommission
    );

    // 7. Calcular resultado final
    // El merchant recibe el monto original menos las comisiones de Zippy y PSP
    const merchantReceives = simulation.amount - totalMerchantCommission - pspAmount;

    // Zippy cobra totalMerchantCommission (comisión base + impuestos)
    const zippyRevenue = totalMerchantCommission;

    // Zippy debe pagar la comisión del PSP (costo de Zippy)
    const zippyCost = pspAmount;

    // Ganancia neta de Zippy = Lo que cobra - Lo que paga al PSP
    const zippyNetProfit = zippyRevenue - zippyCost;

    // Margen de Zippy sobre su ingreso total
    const zippyMargin =
      zippyRevenue > 0 ? (zippyNetProfit / zippyRevenue) * 100 : 0;

    return {
      transactionAmount: simulation.amount,
      currency: simulation.currency,
      merchantCommission: {
        type,
        baseAmount: baseCommission,
        percentage: percentage ?? undefined,
        fixedFee: fixedFee ?? undefined,
        subtotal: baseCommission,
      },
      taxes: taxesBreakdown,
      totalTaxes,
      totalMerchantCommission,
      pspCommission: {
        pspName: pspCommission.pspName,
        type: pspCommission.commissionType,
        percentage:
          pspCommission.commissionType === "PERCENTAGE" ||
          pspCommission.commissionType === "MIXED"
            ? pspCommission.percentage
            : undefined,
        fixedFee:
          pspCommission.commissionType === "FIXED" ||
          pspCommission.commissionType === "MIXED"
            ? pspCommission.fixedFee
            : undefined,
        amount: pspAmount,
      },
      merchantReceives,
      zippyRevenue,
      zippyCost,
      zippyNetProfit,
      zippyMargin,
    };
  }

  private calculateBaseCommission(amount: number, parameters: any[]) {
    const percentageParam = parameters.find(
      (p) => p.parameterType === "PERCENTAGE"
    );
    const fixedFeeParam = parameters.find(
      (p) => p.parameterType === "FIXED_FEE"
    );

    let type: "FIXED" | "PERCENTAGE" | "MIXED";
    let baseCommission = 0;
    let percentage = 0;
    let fixedFee = 0;

    if (percentageParam && fixedFeeParam) {
      type = "MIXED";
      percentage = percentageParam.value;
      fixedFee = fixedFeeParam.value;
      baseCommission = amount * percentage + fixedFee;
    } else if (percentageParam) {
      type = "PERCENTAGE";
      percentage = percentageParam.value;
      baseCommission = amount * percentage;
    } else if (fixedFeeParam) {
      type = "FIXED";
      fixedFee = fixedFeeParam.value;
      baseCommission = fixedFee;
    } else {
      type = "FIXED";
      baseCommission = 0;
    }

    return { type, baseCommission, percentage, fixedFee };
  }

  private calculatePSPCommission(amount: number, pspCommission: any): number {
    if (pspCommission.commissionType === "PERCENTAGE") {
      return amount * pspCommission.percentage;
    } else if (pspCommission.commissionType === "FIXED") {
      return pspCommission.fixedFee;
    } else if (pspCommission.commissionType === "MIXED") {
      return amount * pspCommission.percentage + pspCommission.fixedFee;
    }
    return 0;
  }
}

export const commissionCalculator = new CommissionCalculatorService();
