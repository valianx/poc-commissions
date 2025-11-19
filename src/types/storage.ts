export const STORAGE_KEYS = {
  MERCHANTS: "zippy:merchants",
  CHANNELS: "zippy:channels",
  PSPS: "zippy:psps",
  COMMISSION_TEMPLATES: "zippy:commission_templates",
  COMMISSION_PARAMETERS: "zippy:commission_parameters",
  COMMISSION_ASSIGNMENTS: "zippy:commission_assignments",
  MERCHANT_TAX_CONFIGS: "zippy:merchant_tax_configs",
  PSP_COMMISSIONS: "zippy:psp_commissions",
  METADATA: "zippy:metadata",
} as const;

export interface StorageMetadata {
  version: string;
  lastSeeded: string;
  recordCounts: {
    merchants: number;
    channels: number;
    psps: number;
    commissionTemplates: number;
    commissionParameters: number;
    commissionAssignments: number;
    merchantTaxConfigs: number;
    pspCommissions: number;
  };
}
