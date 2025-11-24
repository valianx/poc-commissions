import {
  commissionTemplatesRepository,
  commissionParametersRepository,
  commissionAssignmentsRepository,
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

    // 2. Calcular comisión bruta de Zippy (SIN VAT - el VAT se aplica sobre la ganancia neta)
    let grossCommission: number = 0;
    let totalPercentage: number = 0;
    let totalFixedFee: number = 0;
    let hasPercentage = false;
    let hasFixed = false;
    let vatPercentage: number | null = null;

    // Sumar todas las asignaciones activas
    for (const assignment of assignments) {
      // Guardar el VAT de la primera asignación que lo tenga
      if (vatPercentage === null && assignment.vatPercentage) {
        vatPercentage = assignment.vatPercentage;
      }

      if (assignment.basePercentageValue !== undefined || assignment.baseFixedValue !== undefined) {
        // Modelo nuevo: valores directos
        let rangeFound = false;

        if (assignment.commissionRanges && assignment.commissionRanges.length > 0) {
          const matchingRange = assignment.commissionRanges.find(range => {
            const isInRange = simulation.amount >= range.minAmount && simulation.amount <= range.maxAmount;
            return isInRange && range.isActive;
          });

          if (matchingRange) {
            rangeFound = true;
            const percentageComm = (matchingRange.percentageValue || 0) * simulation.amount;
            const fixedComm = matchingRange.fixedValue || 0;
            grossCommission += percentageComm + fixedComm;

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

        if (!rangeFound) {
          const percentageComm = (assignment.basePercentageValue || 0) * simulation.amount;
          const fixedComm = assignment.baseFixedValue || 0;
          grossCommission += percentageComm + fixedComm;

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
        // Modelo legacy: basado en templates
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
        grossCommission += result.baseCommission;

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

    // Determinar tipo de comisión
    let type: "FIXED" | "PERCENTAGE" | "MIXED" = "FIXED";
    if (hasPercentage && hasFixed) {
      type = "MIXED";
    } else if (hasPercentage) {
      type = "PERCENTAGE";
    }

    // 3. Obtener el canal y PSP
    const channel = channelsRepository.getByCode(simulation.channelCode);
    if (!channel) {
      throw new Error("Canal no encontrado");
    }

    const pspAssignment = channel.pspAssignments?.find(
      (assignment) => assignment.countryCode === simulation.countryCode && assignment.isActive
    );

    if (!pspAssignment) {
      throw new Error(`No hay PSP asignado para el canal ${simulation.channelCode} en ${simulation.countryCode}`);
    }

    const psp = pspsRepository.getById(pspAssignment.pspId);
    if (!psp) {
      throw new Error("PSP no encontrado");
    }

    const pspCommissionConfig = psp.commissionsByChannelCountry?.find(
      (commission) =>
        commission.channelCode === simulation.channelCode &&
        commission.countryCode === simulation.countryCode
    );

    if (!pspCommissionConfig) {
      throw new Error(`No hay comisión configurada para el PSP ${psp.name} en canal ${simulation.channelCode} / país ${simulation.countryCode}`);
    }

    // 4. Calcular comisión del PSP
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

    // 5. Calcular desglose de Zippy:
    // Total cobrado = grossCommission + pspAmount + VAT
    // Ingreso Zippy = Total cobrado - PSP = grossCommission + VAT
    // VAT se calcula sobre Ingreso Zippy (antes de IVA)
    // Para sacar el IVA: Ingreso con IVA = grossCommission, entonces VAT = grossCommission * vatPercentage
    const vatAmount = vatPercentage ? grossCommission * vatPercentage : 0;
    const totalChargedToMerchant = grossCommission + pspAmount + vatAmount;
    const merchantReceives = simulation.amount - totalChargedToMerchant;

    // Ingreso Zippy = Total cobrado - PSP
    const ingresoZippy = totalChargedToMerchant - pspAmount; // = grossCommission + vatAmount
    // Ganancia neta = Ingreso - IVA
    const netProfit = ingresoZippy - vatAmount; // = grossCommission

    return {
      transactionAmount: simulation.amount,
      currency: simulation.currency,
      merchantCommission: {
        type,
        baseAmount: grossCommission,
        percentage: hasPercentage ? totalPercentage : undefined,
        fixedFee: hasFixed ? totalFixedFee : undefined,
      },
      pspCommission: {
        pspName: psp.name,
        type: pspType,
        percentage: pspPercentage,
        fixedFee: pspFixedFee,
        amount: pspAmount,
      },
      zippyBreakdown: {
        grossCommission,
        pspCost: pspAmount,
        netProfit,
        vatPercentage,
        vatAmount,
        ingresoZippy,
      },
      merchantReceives,
      totalChargedToMerchant,
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
