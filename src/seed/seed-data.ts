import { v4 as uuidv4 } from "uuid";
import { Merchant } from "@/types/merchant";
import { Channel, PSP } from "@/types/channel";
import {
  CommissionTemplate,
  CommissionParameter,
  CommissionAssignment,
  MerchantTaxConfig,
  PSPCommission,
} from "@/types/commission";
import { MerchantChannelConfig } from "@/types/merchant-channel-config";
import { STORAGE_KEYS, StorageMetadata } from "@/types/storage";

export function seedDatabase() {
  if (typeof window === "undefined") return;

  // Check if already seeded
  const metadata = localStorage.getItem(STORAGE_KEYS.METADATA);
  if (metadata) {
    console.log("Database already seeded");
    return;
  }

  console.log("Seeding database...");

  // Create merchants - Each merchant operates in 5+ countries with 3+ channels
  const merchants: Merchant[] = [
    {
      id: uuidv4(),
      name: "1XBET",
      code: "1XBET_001",
      isActive: true,
      countries: ["CL", "BR", "PE", "AR", "MX", "CO"], // 6 países
      balanceEvaluationEnabled: true,
      depositCallbackUrl: "https://1xbet.com/api/callback/deposit",
      withdrawalCallbackUrl: "https://1xbet.com/api/callback/withdrawal",
      callbackApiKeyRef: "1xbet_api_key",
      callbackSecretKeyRef: "1xbet_secret",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      name: "BetWarrior",
      code: "BETWARRIOR_001",
      isActive: true,
      countries: ["CL", "PE", "CO", "BR", "AR"], // 5 países
      balanceEvaluationEnabled: true,
      depositCallbackUrl: "https://betwarrior.com/api/deposit",
      withdrawalCallbackUrl: "https://betwarrior.com/api/withdrawal",
      callbackApiKeyRef: "betwarrior_api_key",
      callbackSecretKeyRef: "betwarrior_secret",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
  ];

  // Create PSPs first (needed for channel assignments)
  const psps: PSP[] = [
    {
      id: uuidv4(),
      code: "PAYU",
      name: "PayU",
      isActive: true,
      commissionsByChannelCountry: [
        // Credit Card - Multiple countries
        {
          channelCode: "credit_card",
          countryCode: "CL",
          commissionType: "PERCENTAGE",
          percentageValue: 0.029, // 2.9%
          fixedValue: null,
        },
        {
          channelCode: "credit_card",
          countryCode: "PE",
          commissionType: "PERCENTAGE",
          percentageValue: 0.032, // 3.2%
          fixedValue: null,
        },
        {
          channelCode: "credit_card",
          countryCode: "CO",
          commissionType: "PERCENTAGE",
          percentageValue: 0.033, // 3.3%
          fixedValue: null,
        },
        {
          channelCode: "credit_card",
          countryCode: "MX",
          commissionType: "PERCENTAGE",
          percentageValue: 0.035, // 3.5%
          fixedValue: null,
        },
        // Debit Card
        {
          channelCode: "debit_card",
          countryCode: "CL",
          commissionType: "PERCENTAGE",
          percentageValue: 0.019, // 1.9%
          fixedValue: null,
        },
        {
          channelCode: "debit_card",
          countryCode: "PE",
          commissionType: "PERCENTAGE",
          percentageValue: 0.022, // 2.2%
          fixedValue: null,
        },
        {
          channelCode: "debit_card",
          countryCode: "CO",
          commissionType: "PERCENTAGE",
          percentageValue: 0.021, // 2.1%
          fixedValue: null,
        },
        // Bank Transfer
        {
          channelCode: "bank_transfer",
          countryCode: "CL",
          commissionType: "FIXED",
          percentageValue: null,
          fixedValue: 500, // $500 CLP fijo
        },
        {
          channelCode: "bank_transfer",
          countryCode: "PE",
          commissionType: "FIXED",
          percentageValue: null,
          fixedValue: 3, // 3 PEN fijo
        },
        {
          channelCode: "bank_transfer",
          countryCode: "CO",
          commissionType: "FIXED",
          percentageValue: null,
          fixedValue: 2500, // 2500 COP fijo
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      code: "MERCADOPAGO",
      name: "MercadoPago",
      isActive: true,
      commissionsByChannelCountry: [
        // PIX - Solo Brasil
        {
          channelCode: "pix",
          countryCode: "BR",
          commissionType: "PERCENTAGE",
          percentageValue: 0.0499, // 4.99%
          fixedValue: null,
        },
        // Credit Card
        {
          channelCode: "credit_card",
          countryCode: "BR",
          commissionType: "PERCENTAGE",
          percentageValue: 0.0399, // 3.99%
          fixedValue: null,
        },
        {
          channelCode: "credit_card",
          countryCode: "AR",
          commissionType: "PERCENTAGE",
          percentageValue: 0.0399, // 3.99%
          fixedValue: null,
        },
        // Debit Card
        {
          channelCode: "debit_card",
          countryCode: "BR",
          commissionType: "PERCENTAGE",
          percentageValue: 0.0299, // 2.99%
          fixedValue: null,
        },
        {
          channelCode: "debit_card",
          countryCode: "AR",
          commissionType: "PERCENTAGE",
          percentageValue: 0.0299, // 2.99%
          fixedValue: null,
        },
        // Bank Transfer
        {
          channelCode: "bank_transfer",
          countryCode: "BR",
          commissionType: "PERCENTAGE",
          percentageValue: 0.0099, // 0.99%
          fixedValue: null,
        },
        {
          channelCode: "bank_transfer",
          countryCode: "AR",
          commissionType: "PERCENTAGE",
          percentageValue: 0.012, // 1.2%
          fixedValue: null,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      code: "TRANSBANK",
      name: "Transbank",
      isActive: true,
      commissionsByChannelCountry: [
        // WebPay - Solo Chile
        {
          channelCode: "webpay",
          countryCode: "CL",
          commissionType: "PERCENTAGE",
          percentageValue: 0.025, // 2.5%
          fixedValue: null,
        },
        // Credit Card - Chile
        {
          channelCode: "credit_card",
          countryCode: "CL",
          commissionType: "PERCENTAGE",
          percentageValue: 0.0265, // 2.65%
          fixedValue: null,
        },
        // Debit Card - Chile
        {
          channelCode: "debit_card",
          countryCode: "CL",
          commissionType: "PERCENTAGE",
          percentageValue: 0.015, // 1.5%
          fixedValue: null,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      code: "CRYPTO_PAY",
      name: "CryptoPay",
      isActive: true,
      commissionsByChannelCountry: [
        // Crypto - Multiple countries
        {
          channelCode: "crypto",
          countryCode: "CL",
          commissionType: "PERCENTAGE",
          percentageValue: 0.01, // 1%
          fixedValue: null,
        },
        {
          channelCode: "crypto",
          countryCode: "BR",
          commissionType: "PERCENTAGE",
          percentageValue: 0.01, // 1%
          fixedValue: null,
        },
        {
          channelCode: "crypto",
          countryCode: "AR",
          commissionType: "PERCENTAGE",
          percentageValue: 0.01, // 1%
          fixedValue: null,
        },
        {
          channelCode: "crypto",
          countryCode: "MX",
          commissionType: "PERCENTAGE",
          percentageValue: 0.01, // 1%
          fixedValue: null,
        },
        {
          channelCode: "crypto",
          countryCode: "CO",
          commissionType: "PERCENTAGE",
          percentageValue: 0.01, // 1%
          fixedValue: null,
        },
        {
          channelCode: "crypto",
          countryCode: "PE",
          commissionType: "PERCENTAGE",
          percentageValue: 0.01, // 1%
          fixedValue: null,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
  ];

  // Create channels - Each channel's pspAssignments must match PSPs that offer that channel
  const channels: Channel[] = [
    {
      id: uuidv4(),
      code: "pix",
      name: "PIX",
      description: "Sistema de pagos instantáneos de Brasil",
      isActive: true,
      pspAssignments: [
        // Solo MercadoPago ofrece PIX (solo en Brasil)
        {
          countryCode: "BR",
          pspId: psps[1].id, // MercadoPago
          isActive: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      code: "credit_card",
      name: "Tarjeta de Crédito",
      description: "Pagos con tarjetas de crédito Visa/Mastercard",
      isActive: true,
      pspAssignments: [
        // PayU ofrece credit_card en CL, PE, CO, MX
        {
          countryCode: "CL",
          pspId: psps[0].id, // PayU
          isActive: true,
        },
        {
          countryCode: "PE",
          pspId: psps[0].id, // PayU
          isActive: true,
        },
        {
          countryCode: "CO",
          pspId: psps[0].id, // PayU
          isActive: true,
        },
        {
          countryCode: "MX",
          pspId: psps[0].id, // PayU
          isActive: true,
        },
        // MercadoPago ofrece credit_card en BR, AR
        {
          countryCode: "BR",
          pspId: psps[1].id, // MercadoPago
          isActive: true,
        },
        {
          countryCode: "AR",
          pspId: psps[1].id, // MercadoPago
          isActive: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      code: "debit_card",
      name: "Tarjeta de Débito",
      description: "Pagos con tarjetas de débito",
      isActive: true,
      pspAssignments: [
        // PayU ofrece debit_card en CL, PE, CO
        {
          countryCode: "CL",
          pspId: psps[0].id, // PayU
          isActive: true,
        },
        {
          countryCode: "PE",
          pspId: psps[0].id, // PayU
          isActive: true,
        },
        {
          countryCode: "CO",
          pspId: psps[0].id, // PayU
          isActive: true,
        },
        // MercadoPago ofrece debit_card en BR, AR
        {
          countryCode: "BR",
          pspId: psps[1].id, // MercadoPago
          isActive: true,
        },
        {
          countryCode: "AR",
          pspId: psps[1].id, // MercadoPago
          isActive: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      code: "bank_transfer",
      name: "Transferencia Bancaria",
      description: "Transferencias bancarias directas",
      isActive: true,
      pspAssignments: [
        // PayU ofrece bank_transfer en CL, PE, CO
        {
          countryCode: "CL",
          pspId: psps[0].id, // PayU
          isActive: true,
        },
        {
          countryCode: "PE",
          pspId: psps[0].id, // PayU
          isActive: true,
        },
        {
          countryCode: "CO",
          pspId: psps[0].id, // PayU
          isActive: true,
        },
        // MercadoPago ofrece bank_transfer en BR, AR
        {
          countryCode: "BR",
          pspId: psps[1].id, // MercadoPago
          isActive: true,
        },
        {
          countryCode: "AR",
          pspId: psps[1].id, // MercadoPago
          isActive: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      code: "webpay",
      name: "WebPay",
      description: "Sistema de pago chileno Transbank",
      isActive: true,
      pspAssignments: [
        // Solo Transbank ofrece WebPay (solo en Chile)
        {
          countryCode: "CL",
          pspId: psps[2].id, // Transbank
          isActive: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      code: "crypto",
      name: "Criptomonedas",
      description: "Pagos con Bitcoin, Ethereum y otras criptomonedas",
      isActive: true,
      pspAssignments: [
        // Solo CryptoPay ofrece crypto en múltiples países
        {
          countryCode: "CL",
          pspId: psps[3].id, // CryptoPay
          isActive: true,
        },
        {
          countryCode: "BR",
          pspId: psps[3].id, // CryptoPay
          isActive: true,
        },
        {
          countryCode: "AR",
          pspId: psps[3].id, // CryptoPay
          isActive: true,
        },
        {
          countryCode: "MX",
          pspId: psps[3].id, // CryptoPay
          isActive: true,
        },
        {
          countryCode: "CO",
          pspId: psps[3].id, // CryptoPay
          isActive: true,
        },
        {
          countryCode: "PE",
          pspId: psps[3].id, // CryptoPay
          isActive: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
  ];

  // Create commission templates
  const templates: CommissionTemplate[] = [
    {
      id: uuidv4(),
      code: "PERCENTAGE_3_5",
      name: "Comisión Porcentual 3.5%",
      type: "PERCENTAGE",
      status: "APPROVED",
      effectiveDate: new Date().toISOString(),
      expirationDate: null,
      createdBy: "admin@zippy.com",
      approvedBy: "manager@zippy.com",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      code: "MIXED_2_5_500",
      name: "Comisión Mixta 2.5% + $500",
      type: "MIXED",
      status: "APPROVED",
      effectiveDate: new Date().toISOString(),
      expirationDate: null,
      createdBy: "admin@zippy.com",
      approvedBy: "manager@zippy.com",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      code: "FIXED_1000",
      name: "Comisión Fija $1000",
      type: "FIXED",
      status: "APPROVED",
      effectiveDate: new Date().toISOString(),
      expirationDate: null,
      createdBy: "admin@zippy.com",
      approvedBy: "manager@zippy.com",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
  ];

  // Create commission parameters
  const parameters: CommissionParameter[] = [
    {
      id: uuidv4(),
      commissionTemplateId: templates[0].id,
      parameterType: "PERCENTAGE",
      value: 0.035,
      currency: "CLP",
      minRange: null,
      maxRange: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      commissionTemplateId: templates[1].id,
      parameterType: "PERCENTAGE",
      value: 0.025,
      currency: "CLP",
      minRange: null,
      maxRange: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      commissionTemplateId: templates[1].id,
      parameterType: "FIXED_FEE",
      value: 500,
      currency: "CLP",
      minRange: null,
      maxRange: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      commissionTemplateId: templates[2].id,
      parameterType: "FIXED_FEE",
      value: 1000,
      currency: "CLP",
      minRange: null,
      maxRange: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Create commission assignments - Each merchant has commissions for 3+ channels across 5+ countries
  const assignments: CommissionAssignment[] = [
    // ==========================================
    // 1XBET - 6 países (CL, BR, PE, AR, MX, CO)
    // Canales: credit_card, debit_card, pix, webpay, crypto, bank_transfer
    // ==========================================

    // 1XBET - Chile (CL) - 4 canales
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CL",
      channelCode: "webpay",
      description: "WebPay Chile con IVA",
      basePercentageValue: 0.025,
      baseFixedValue: null,
      vatPercentage: 0.19,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CL",
      channelCode: "credit_card",
      description: "Tarjeta de crédito Chile con IVA",
      basePercentageValue: 0.03,
      baseFixedValue: null,
      vatPercentage: 0.19,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CL",
      channelCode: "debit_card",
      description: "Tarjeta de débito Chile con IVA",
      basePercentageValue: 0.02,
      baseFixedValue: null,
      vatPercentage: 0.19,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CL",
      channelCode: "crypto",
      description: "Criptomonedas Chile",
      basePercentageValue: 0.015,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },

    // 1XBET - Brasil (BR) - 4 canales
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "BR",
      channelCode: "pix",
      description: "PIX Brasil",
      basePercentageValue: 0.02,
      baseFixedValue: 50,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "BR",
      channelCode: "credit_card",
      description: "Tarjeta de crédito Brasil",
      basePercentageValue: 0.035,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "BR",
      channelCode: "debit_card",
      description: "Tarjeta de débito Brasil",
      basePercentageValue: 0.025,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "BR",
      channelCode: "crypto",
      description: "Criptomonedas Brasil",
      basePercentageValue: 0.015,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },

    // 1XBET - Perú (PE) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "PE",
      channelCode: "credit_card",
      description: "Tarjeta de crédito Perú",
      basePercentageValue: 0.03,
      baseFixedValue: null,
      vatPercentage: 0.18,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "PE",
      channelCode: "debit_card",
      description: "Tarjeta de débito Perú",
      basePercentageValue: 0.022,
      baseFixedValue: null,
      vatPercentage: 0.18,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "PE",
      channelCode: "crypto",
      description: "Criptomonedas Perú",
      basePercentageValue: 0.015,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },

    // 1XBET - Argentina (AR) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "AR",
      channelCode: "credit_card",
      description: "Tarjeta de crédito Argentina",
      basePercentageValue: 0.04,
      baseFixedValue: null,
      vatPercentage: 0.21,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "AR",
      channelCode: "debit_card",
      description: "Tarjeta de débito Argentina",
      basePercentageValue: 0.03,
      baseFixedValue: null,
      vatPercentage: 0.21,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "AR",
      channelCode: "crypto",
      description: "Criptomonedas Argentina",
      basePercentageValue: 0.012,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },

    // 1XBET - México (MX) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "MX",
      channelCode: "credit_card",
      description: "Tarjeta de crédito México con IVA",
      basePercentageValue: 0.035,
      baseFixedValue: null,
      vatPercentage: 0.16,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "MX",
      channelCode: "crypto",
      description: "Criptomonedas México",
      basePercentageValue: 0.015,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "MX",
      channelCode: "bank_transfer",
      description: "Transferencia bancaria México",
      basePercentageValue: 0.01,
      baseFixedValue: 100,
      vatPercentage: 0.16,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },

    // 1XBET - Colombia (CO) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CO",
      channelCode: "credit_card",
      description: "Tarjeta de crédito Colombia con IVA",
      basePercentageValue: 0.033,
      baseFixedValue: null,
      vatPercentage: 0.19,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CO",
      channelCode: "debit_card",
      description: "Tarjeta de débito Colombia con IVA",
      basePercentageValue: 0.025,
      baseFixedValue: null,
      vatPercentage: 0.19,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CO",
      channelCode: "crypto",
      description: "Criptomonedas Colombia",
      basePercentageValue: 0.015,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },

    // ==========================================
    // BetWarrior - 5 países (CL, PE, CO, BR, AR)
    // Canales: credit_card, debit_card, pix, bank_transfer, crypto
    // ==========================================

    // BetWarrior - Chile (CL) - 4 canales
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CL",
      channelCode: "credit_card",
      description: "Tarjeta de crédito Chile con IVA",
      basePercentageValue: 0.035,
      baseFixedValue: null,
      vatPercentage: 0.19,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CL",
      channelCode: "debit_card",
      description: "Tarjeta de débito Chile con IVA",
      basePercentageValue: 0.025,
      baseFixedValue: null,
      vatPercentage: 0.19,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CL",
      channelCode: "bank_transfer",
      description: "Transferencia bancaria Chile",
      basePercentageValue: null,
      baseFixedValue: 800,
      vatPercentage: 0.19,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CL",
      channelCode: "crypto",
      description: "Criptomonedas Chile",
      basePercentageValue: 0.018,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },

    // BetWarrior - Perú (PE) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "PE",
      channelCode: "credit_card",
      description: "Tarjeta de crédito Perú con IGV",
      basePercentageValue: 0.032,
      baseFixedValue: null,
      vatPercentage: 0.18,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "PE",
      channelCode: "debit_card",
      description: "Tarjeta de débito Perú con IGV",
      basePercentageValue: 0.024,
      baseFixedValue: null,
      vatPercentage: 0.18,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "PE",
      channelCode: "crypto",
      description: "Criptomonedas Perú",
      basePercentageValue: 0.016,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },

    // BetWarrior - Colombia (CO) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CO",
      channelCode: "credit_card",
      description: "Tarjeta de crédito Colombia con IVA",
      basePercentageValue: 0.034,
      baseFixedValue: null,
      vatPercentage: 0.19,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CO",
      channelCode: "debit_card",
      description: "Tarjeta de débito Colombia con IVA",
      basePercentageValue: 0.026,
      baseFixedValue: null,
      vatPercentage: 0.19,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CO",
      channelCode: "crypto",
      description: "Criptomonedas Colombia",
      basePercentageValue: 0.017,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },

    // BetWarrior - Brasil (BR) - 4 canales
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "BR",
      channelCode: "pix",
      description: "PIX Brasil",
      basePercentageValue: 0.022,
      baseFixedValue: 30,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "BR",
      channelCode: "credit_card",
      description: "Tarjeta de crédito Brasil",
      basePercentageValue: 0.038,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "BR",
      channelCode: "debit_card",
      description: "Tarjeta de débito Brasil",
      basePercentageValue: 0.028,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "BR",
      channelCode: "crypto",
      description: "Criptomonedas Brasil",
      basePercentageValue: 0.014,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },

    // BetWarrior - Argentina (AR) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "AR",
      channelCode: "credit_card",
      description: "Tarjeta de crédito Argentina con IVA",
      basePercentageValue: 0.042,
      baseFixedValue: null,
      vatPercentage: 0.21,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "AR",
      channelCode: "debit_card",
      description: "Tarjeta de débito Argentina con IVA",
      basePercentageValue: 0.032,
      baseFixedValue: null,
      vatPercentage: 0.21,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "AR",
      channelCode: "crypto",
      description: "Criptomonedas Argentina",
      basePercentageValue: 0.013,
      baseFixedValue: null,
      vatPercentage: null,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
  ];

  // Create merchant tax configs
  const taxConfigs: MerchantTaxConfig[] = [
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CL",
      channelCode: "webpay",
      taxCode: "IVA",
      taxName: "Impuesto al Valor Agregado",
      rate: 0.19,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "BR",
      channelCode: "pix",
      taxCode: "ICMS",
      taxName: "Imposto sobre Circulação de Mercadorias",
      rate: 0.18,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // Create PSP commissions
  const pspCommissions: PSPCommission[] = [
    {
      id: uuidv4(),
      pspId: psps[2].id,
      pspName: psps[2].name,
      countryCode: "CL",
      channelCode: "webpay",
      commissionType: "PERCENTAGE",
      percentage: 0.015,
      fixedFee: 0,
      currency: "CLP",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      pspId: psps[1].id,
      pspName: psps[1].name,
      countryCode: "BR",
      channelCode: "pix",
      commissionType: "MIXED",
      percentage: 0.01,
      fixedFee: 200,
      currency: "BRL",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      pspId: psps[0].id,
      pspName: psps[0].name,
      countryCode: "CL",
      channelCode: "credit_card",
      commissionType: "PERCENTAGE",
      percentage: 0.02,
      fixedFee: 0,
      currency: "CLP",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // Create merchant channel configurations - Each commission assignment needs its config
  const merchantChannelConfigs: MerchantChannelConfig[] = [
    // ==========================================
    // 1XBET - 6 países (CL, BR, PE, AR, MX, CO)
    // ==========================================

    // 1XBET - Chile (CL) - 4 canales
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CL",
      channelId: channels.find((c) => c.code === "webpay")!.id,
      pspId: psps[2].id, // Transbank
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CL",
      channelId: channels.find((c) => c.code === "credit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CL",
      channelId: channels.find((c) => c.code === "debit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CL",
      channelId: channels.find((c) => c.code === "crypto")!.id,
      pspId: psps[3].id, // CryptoPay
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },

    // 1XBET - Brasil (BR) - 4 canales
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "BR",
      channelId: channels.find((c) => c.code === "pix")!.id,
      pspId: psps[1].id, // MercadoPago
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "BR",
      channelId: channels.find((c) => c.code === "credit_card")!.id,
      pspId: psps[1].id, // MercadoPago
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "BR",
      channelId: channels.find((c) => c.code === "debit_card")!.id,
      pspId: psps[1].id, // MercadoPago
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "BR",
      channelId: channels.find((c) => c.code === "crypto")!.id,
      pspId: psps[3].id, // CryptoPay
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },

    // 1XBET - Perú (PE) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "PE",
      channelId: channels.find((c) => c.code === "credit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "PE",
      channelId: channels.find((c) => c.code === "debit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "PE",
      channelId: channels.find((c) => c.code === "crypto")!.id,
      pspId: psps[3].id, // CryptoPay
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },

    // 1XBET - Argentina (AR) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "AR",
      channelId: channels.find((c) => c.code === "credit_card")!.id,
      pspId: psps[1].id, // MercadoPago
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "AR",
      channelId: channels.find((c) => c.code === "debit_card")!.id,
      pspId: psps[1].id, // MercadoPago
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "AR",
      channelId: channels.find((c) => c.code === "crypto")!.id,
      pspId: psps[3].id, // CryptoPay
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },

    // 1XBET - México (MX) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "MX",
      channelId: channels.find((c) => c.code === "credit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "MX",
      channelId: channels.find((c) => c.code === "crypto")!.id,
      pspId: psps[3].id, // CryptoPay
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "MX",
      channelId: channels.find((c) => c.code === "bank_transfer")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },

    // 1XBET - Colombia (CO) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CO",
      channelId: channels.find((c) => c.code === "credit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CO",
      channelId: channels.find((c) => c.code === "debit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[0].id,
      countryCode: "CO",
      channelId: channels.find((c) => c.code === "crypto")!.id,
      pspId: psps[3].id, // CryptoPay
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },

    // ==========================================
    // BetWarrior - 5 países (CL, PE, CO, BR, AR)
    // ==========================================

    // BetWarrior - Chile (CL) - 4 canales
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CL",
      channelId: channels.find((c) => c.code === "credit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CL",
      channelId: channels.find((c) => c.code === "debit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CL",
      channelId: channels.find((c) => c.code === "bank_transfer")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CL",
      channelId: channels.find((c) => c.code === "crypto")!.id,
      pspId: psps[3].id, // CryptoPay
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },

    // BetWarrior - Perú (PE) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "PE",
      channelId: channels.find((c) => c.code === "credit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "PE",
      channelId: channels.find((c) => c.code === "debit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "PE",
      channelId: channels.find((c) => c.code === "crypto")!.id,
      pspId: psps[3].id, // CryptoPay
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },

    // BetWarrior - Colombia (CO) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CO",
      channelId: channels.find((c) => c.code === "credit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CO",
      channelId: channels.find((c) => c.code === "debit_card")!.id,
      pspId: psps[0].id, // PayU
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "CO",
      channelId: channels.find((c) => c.code === "crypto")!.id,
      pspId: psps[3].id, // CryptoPay
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },

    // BetWarrior - Brasil (BR) - 4 canales
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "BR",
      channelId: channels.find((c) => c.code === "pix")!.id,
      pspId: psps[1].id, // MercadoPago
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "BR",
      channelId: channels.find((c) => c.code === "credit_card")!.id,
      pspId: psps[1].id, // MercadoPago
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "BR",
      channelId: channels.find((c) => c.code === "debit_card")!.id,
      pspId: psps[1].id, // MercadoPago
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "BR",
      channelId: channels.find((c) => c.code === "crypto")!.id,
      pspId: psps[3].id, // CryptoPay
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },

    // BetWarrior - Argentina (AR) - 3 canales
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "AR",
      channelId: channels.find((c) => c.code === "credit_card")!.id,
      pspId: psps[1].id, // MercadoPago
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "AR",
      channelId: channels.find((c) => c.code === "debit_card")!.id,
      pspId: psps[1].id, // MercadoPago
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      merchantId: merchants[1].id,
      countryCode: "AR",
      channelId: channels.find((c) => c.code === "crypto")!.id,
      pspId: psps[3].id, // CryptoPay
      taxes: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
  ];

  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.MERCHANTS, JSON.stringify(merchants));
  localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
  localStorage.setItem(STORAGE_KEYS.PSPS, JSON.stringify(psps));
  localStorage.setItem(
    STORAGE_KEYS.COMMISSION_TEMPLATES,
    JSON.stringify(templates)
  );
  localStorage.setItem(
    STORAGE_KEYS.COMMISSION_PARAMETERS,
    JSON.stringify(parameters)
  );
  localStorage.setItem(
    STORAGE_KEYS.COMMISSION_ASSIGNMENTS,
    JSON.stringify(assignments)
  );
  localStorage.setItem(
    STORAGE_KEYS.MERCHANT_TAX_CONFIGS,
    JSON.stringify(taxConfigs)
  );
  localStorage.setItem(
    STORAGE_KEYS.PSP_COMMISSIONS,
    JSON.stringify(pspCommissions)
  );
  localStorage.setItem(
    STORAGE_KEYS.MERCHANT_CHANNEL_CONFIGS,
    JSON.stringify(merchantChannelConfigs)
  );

  // Save metadata
  const seedMetadata: StorageMetadata = {
    version: "1.0",
    lastSeeded: new Date().toISOString(),
    recordCounts: {
      merchants: merchants.length,
      channels: channels.length,
      psps: psps.length,
      commissionTemplates: templates.length,
      commissionParameters: parameters.length,
      commissionAssignments: assignments.length,
      merchantTaxConfigs: taxConfigs.length,
      pspCommissions: pspCommissions.length,
      merchantChannelConfigs: merchantChannelConfigs.length,
    },
  };

  localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(seedMetadata));

  console.log("Database seeded successfully:", seedMetadata);
}

export function clearDatabase() {
  if (typeof window === "undefined") return;

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  console.log("Database cleared");
}
