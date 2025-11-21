import {
  commissionTemplatesRepository,
  commissionParametersRepository,
  commissionAssignmentsRepository,
  merchantTaxConfigsRepository,
  pspCommissionsRepository,
} from "@/lib/repositories/commissions.repository";
import { PaymentSimulation, SimulationResult } from "@/types/simulator";
import { channelsRepository, pspsRepository } from "@/lib/repositories/channels.repository";
import { merchantChannelConfigRepository } from "@/lib/repositories/merchant-channel-config.repository";

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

    // 2. Calculate base commission by summing ALL active assignments
    let baseCommission: number = 0;
    let totalPercentage: number = 0;
    let totalFixedFee: number = 0;
    let hasPercentage = false;
    let hasFixed = false;

    // Sum all active commission assignments
    for (const assignment of assignments) {
      if (assignment.basePercentageValue !== undefined || assignment.baseFixedValue !== undefined) {
        // New model: direct values
        // First check if there's a matching active commission range for this amount
        let rangeFound = false;

        if (assignment.commissionRanges && assignment.commissionRanges.length > 0) {
          const matchingRange = assignment.commissionRanges.find(range => {
            const isInRange = simulation.amount >= range.minAmount && simulation.amount <= range.maxAmount;
            // Only use active ranges (dates are inherited from parent assignment)
            return isInRange && range.isActive;
          });

          if (matchingRange) {
            rangeFound = true;
            const percentageComm = (matchingRange.percentageValue || 0) * simulation.amount;
            const fixedComm = matchingRange.fixedValue || 0;
            baseCommission += percentageComm + fixedComm;

            if (matchingRange.percentageValue) {
              totalPercentage += matchingRange.percentageValue;
              hasPercentage = true;
            }
            if (matchingRange.fixedValue) {
              totalFixedFee += matchingRange.fixedValue;
              hasFixed = true;
            }
          }
        }

        // If no range found, use base values
        if (!rangeFound) {
          const percentageComm = (assignment.basePercentageValue || 0) * simulation.amount;
          const fixedComm = assignment.baseFixedValue || 0;
          baseCommission += percentageComm + fixedComm;

          if (assignment.basePercentageValue) {
            totalPercentage += assignment.basePercentageValue;
            hasPercentage = true;
          }
          if (assignment.baseFixedValue) {
            totalFixedFee += assignment.baseFixedValue;
            hasFixed = true;
          }
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
        baseCommission += result.baseCommission;

        if (result.percentage) {
          totalPercentage += result.percentage;
          hasPercentage = true;
        }
        if (result.fixedFee) {
          totalFixedFee += result.fixedFee;
          hasFixed = true;
        }
      }
    }

    // Determine commission type
    let type: "FIXED" | "PERCENTAGE" | "MIXED" = "FIXED";
    if (hasPercentage && hasFixed) {
      type = "MIXED";
    } else if (hasPercentage) {
      type = "PERCENTAGE";
    }

    const percentage = hasPercentage ? totalPercentage : null;
    const fixedFee = hasFixed ? totalFixedFee : null;

    // 4. Obtener el canal para encontrar tanto el PSP asignado como los taxes
    const channel = channelsRepository.getByCode(simulation.channelCode);
    if (!channel) {
      throw new Error("Canal no encontrado");
    }

    // 5. Obtener la configuración del merchant channel para este país y canal
    const merchantChannelConfig = merchantChannelConfigRepository.findByMerchantCountryAndChannel(
      simulation.merchantId,
      simulation.countryCode,
      channel.id
    );

    // 6. Obtener impuestos desde la configuración del merchant channel
    let taxesBreakdown: Array<{
      taxCode: string;
      taxName: string;
      rate: number;
      amount: number;
    }> = [];

    if (merchantChannelConfig && merchantChannelConfig.taxes) {
      taxesBreakdown = merchantChannelConfig.taxes
        .filter((tax) => tax.isActive)
        .map((tax) => ({
          taxCode: tax.taxCode,
          taxName: tax.taxName,
          rate: tax.rate,
          amount: baseCommission * tax.rate,
        }));
    }

    const totalTaxes = taxesBreakdown.reduce(
      (sum, tax) => sum + tax.amount,
      0
    );

    // 7. Comisión total al merchant
    const totalMerchantCommission = baseCommission + totalTaxes;

    // 8. Obtener comisión PSP

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

    // 9. Calcular resultado final
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
