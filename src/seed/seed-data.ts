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

  // Create merchants
  const merchants: Merchant[] = [
    {
      id: uuidv4(),
      name: "1XBET",
      code: "1XBET_001",
      isActive: true,
      countries: ["CL", "BR", "PE"],
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
      countries: ["CL", "PE", "CO"],
      balanceEvaluationEnabled: true,
      depositCallbackUrl: "https://betwarrior.com/api/deposit",
      withdrawalCallbackUrl: null,
      callbackApiKeyRef: null,
      callbackSecretKeyRef: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      name: "Caliente",
      code: "CALIENTE_MX",
      isActive: true,
      countries: ["MX"],
      balanceEvaluationEnabled: false,
      depositCallbackUrl: "https://caliente.mx/webhooks/deposit",
      withdrawalCallbackUrl: "https://caliente.mx/webhooks/withdrawal",
      callbackApiKeyRef: "caliente_key",
      callbackSecretKeyRef: "caliente_secret",
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      code: "MERCADOPAGO",
      name: "MercadoPago",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuidv4(),
      code: "TRANSBANK",
      name: "Transbank",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
  ];

  // Create channels
  const channels: Channel[] = [
    {
      id: uuidv4(),
      code: "pix",
      name: "PIX",
      description: "Sistema de pagos instantáneos de Brasil",
      isActive: true,
      pspAssignments: [],
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
        {
          countryCode: "CL",
          pspId: psps[2].id, // Transbank for Chile
          isActive: true,
        },
        {
          countryCode: "AR",
          pspId: psps[1].id, // MercadoPago for Argentina
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
      pspAssignments: [],
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
      pspAssignments: [],
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
        {
          countryCode: "CL",
          pspId: psps[2].id, // Transbank for Chile
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

  // Create commission assignments
  const assignments: CommissionAssignment[] = [
    {
      id: uuidv4(),
      commissionTemplateId: templates[0].id,
      merchantId: merchants[0].id,
      countryCode: "CL",
      channelCode: "webpay",
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      commissionTemplateId: templates[1].id,
      merchantId: merchants[0].id,
      countryCode: "BR",
      channelCode: "pix",
      startDate: new Date().toISOString(),
      endDate: null,
      status: "ACTIVE",
      assignedBy: "admin@zippy.com",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      commissionTemplateId: templates[0].id,
      merchantId: merchants[1].id,
      countryCode: "CL",
      channelCode: "credit_card",
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
