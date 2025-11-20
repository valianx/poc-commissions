import {
  commissionTemplatesRepository,
  commissionParametersRepository,
  commissionAssignmentsRepository,
  merchantTaxConfigsRepository,
  pspCommissionsRepository,
} from "@/lib/repositories/commissions.repository";
import { PaymentSimulation, SimulationResult } from "@/types/simulator";
import { channelsRepository, pspsRepository } from "@/lib/repositories/channels.repository";

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
    // Primero obtener el canal para encontrar el PSP asignado
    const channel = channelsRepository.getByCode(simulation.channelCode);
    if (!channel) {
      throw new Error("Canal no encontrado");
    }

    // Buscar el PSP asignado para el país en este canal
    const pspAssignment = channel.pspAssignments?.find(
      (assignment) => assignment.countryCode === simulation.countryCode && assignment.isActive
    );

    if (!pspAssignment) {
      throw new Error(`No hay PSP asignado para el canal ${simulation.channelCode} en ${simulation.countryCode}`);
    }

    // Obtener el PSP
    const psp = pspsRepository.getById(pspAssignment.pspId);
    if (!psp) {
      throw new Error("PSP no encontrado");
    }

    // Buscar la comisión del PSP para este país
    const pspCommissionConfig = psp.commissionsByCountry?.find(
      (commission) => commission.countryCode === simulation.countryCode
    );

    if (!pspCommissionConfig) {
      throw new Error(`No hay comisión configurada para el PSP ${psp.name} en ${simulation.countryCode}`);
    }

    // Calcular el monto de la comisión del PSP
    let pspAmount = 0;
    let pspType: "FIXED" | "PERCENTAGE" | "MIXED" = "FIXED";
    let pspPercentage: number | undefined;
    let pspFixedFee: number | undefined;

    if (pspCommissionConfig.commissionType === "PERCENTAGE" && pspCommissionConfig.percentageValue !== null) {
      pspAmount = simulation.amount * pspCommissionConfig.percentageValue;
      pspType = "PERCENTAGE";
      pspPercentage = pspCommissionConfig.percentageValue;
    } else if (pspCommissionConfig.commissionType === "FIXED" && pspCommissionConfig.fixedValue !== null) {
      pspAmount = pspCommissionConfig.fixedValue;
      pspType = "FIXED";
      pspFixedFee = pspCommissionConfig.fixedValue;
    }

    // 7. Calcular resultado final
    // Zippy cobra al merchant: su comisión + impuestos + comisión del PSP
    const totalChargedToMerchant = totalMerchantCommission + pspAmount;

    // El merchant recibe el monto original menos todo lo que Zippy cobra
    const merchantReceives = simulation.amount - totalChargedToMerchant;

    // Zippy cobra en total (comisión Zippy + impuestos + comisión PSP)
    const zippyRevenue = totalChargedToMerchant;

    // Zippy paga al PSP (pass-through)
    const zippyCost = pspAmount;

    // Ganancia neta de Zippy = Solo su comisión + impuestos (la comisión del PSP es pass-through)
    const zippyNetProfit = totalMerchantCommission;

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
        pspName: psp.name,
        type: pspType,
        percentage: pspPercentage,
        fixedFee: pspFixedFee,
        amount: pspAmount,
      },
      merchantReceives,
      zippyRevenue,
      zippyCost,
      zippyNetProfit,
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

}

export const commissionCalculator = new CommissionCalculatorService();
