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

    // 2. Calculate total commission from ALL active assignments
    // Each assignment now includes its own VAT percentage
    let totalCommission: number = 0;
    let totalPercentage: number = 0;
    let totalFixedFee: number = 0;
    let hasPercentage = false;
    let hasFixed = false;

    // Sum all active commission assignments (each with their own VAT)
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
            const baseForThisRange = percentageComm + fixedComm;

            // Apply VAT if configured for this assignment
            const vat = assignment.vatPercentage || 0;
            const vatAmount = baseForThisRange * vat;
            const totalForThisRange = baseForThisRange + vatAmount;

            totalCommission += totalForThisRange;

            if (matchingRange.percentageValue) {
              const effectivePercentage = matchingRange.percentageValue * (1 + vat);
              totalPercentage += effectivePercentage;
              hasPercentage = true;
            }
            if (matchingRange.fixedValue) {
              const effectiveFixed = matchingRange.fixedValue * (1 + vat);
              totalFixedFee += effectiveFixed;
              hasFixed = true;
            }
          }
        }

        // If no range found, use base values
        if (!rangeFound) {
          // Calculate base commission for this assignment
          const percentageComm = (assignment.basePercentageValue || 0) * simulation.amount;
          const fixedComm = assignment.baseFixedValue || 0;
          const baseForThisAssignment = percentageComm + fixedComm;

          // Apply VAT if configured for this assignment
          const vat = assignment.vatPercentage || 0;
          const vatAmount = baseForThisAssignment * vat;
          const totalForThisAssignment = baseForThisAssignment + vatAmount;

          totalCommission += totalForThisAssignment;

          if (assignment.basePercentageValue) {
            // Track total percentage including VAT
            const effectivePercentage = assignment.basePercentageValue * (1 + vat);
            totalPercentage += effectivePercentage;
            hasPercentage = true;
          }
          if (assignment.baseFixedValue) {
            // Fixed fee with VAT applied
            const effectiveFixed = assignment.baseFixedValue * (1 + vat);
            totalFixedFee += effectiveFixed;
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
        totalCommission += result.baseCommission;

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

    // 3. Obtener el canal para encontrar tanto el PSP asignado como los taxes
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

    // 4. Obtener comisión PSP

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
    // Zippy cobra al merchant: su comisión (con VAT incluido) + comisión del PSP
    const totalChargedToMerchant = totalCommission + pspAmount;

    // El merchant recibe el monto original menos todo lo que Zippy cobra
    const merchantReceives = simulation.amount - totalChargedToMerchant;

    // Zippy cobra en total (comisión Zippy + comisión PSP)
    const zippyRevenue = totalChargedToMerchant;

    // Zippy paga al PSP (pass-through)
    const zippyCost = pspAmount;

    // Ganancia neta de Zippy = Solo su comisión (con VAT incluido) - la comisión del PSP es pass-through
    const zippyNetProfit = totalCommission;

    return {
      transactionAmount: simulation.amount,
      currency: simulation.currency,
      merchantCommission: {
        type,
        baseAmount: totalCommission, // Total commission including VAT
        percentage: percentage ?? undefined,
        fixedFee: fixedFee ?? undefined,
        subtotal: totalCommission, // Total commission (base + VAT)
      },
      taxes: [], // No separate taxes - VAT is included in commission
      totalTaxes: 0, // VAT is included in totalCommission
      totalMerchantCommission: totalCommission,
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
