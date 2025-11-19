import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CommissionTemplate,
  CommissionParameter,
  CommissionAssignment,
  MerchantTaxConfig,
  PSPCommission,
  CreateCommissionTemplateDto,
  CreateCommissionParameterDto,
  CreateCommissionAssignmentDto,
  CreateMerchantTaxConfigDto,
  CreatePSPCommissionDto,
} from "@/types/commission";
import {
  commissionTemplatesRepository,
  commissionParametersRepository,
  commissionAssignmentsRepository,
  merchantTaxConfigsRepository,
  pspCommissionsRepository,
} from "@/lib/repositories/commissions.repository";
import { v4 as uuidv4 } from "uuid";

interface CommissionsState {
  templates: CommissionTemplate[];
  parameters: CommissionParameter[];
  assignments: CommissionAssignment[];
  taxConfigs: MerchantTaxConfig[];
  pspCommissions: PSPCommission[];
  isLoading: boolean;
  error: string | null;

  // Template Actions
  fetchTemplates: () => void;
  createTemplate: (template: CreateCommissionTemplateDto) => void;
  approveTemplate: (id: string, approvedBy: string) => void;

  // Parameter Actions
  fetchParameters: () => void;
  createParameter: (parameter: CreateCommissionParameterDto) => void;
  getParametersByTemplateId: (templateId: string) => CommissionParameter[];

  // Assignment Actions
  fetchAssignments: () => void;
  createAssignment: (assignment: CreateCommissionAssignmentDto) => void;
  getAssignmentsByMerchant: (merchantId: string) => CommissionAssignment[];

  // Tax Config Actions
  fetchTaxConfigs: () => void;
  createTaxConfig: (config: CreateMerchantTaxConfigDto) => void;

  // PSP Commission Actions
  fetchPSPCommissions: () => void;
  createPSPCommission: (commission: CreatePSPCommissionDto) => void;

  setError: (error: string | null) => void;
}

export const useCommissionsStore = create<CommissionsState>()(
  persist(
    (set, get) => ({
      templates: [],
      parameters: [],
      assignments: [],
      taxConfigs: [],
      pspCommissions: [],
      isLoading: false,
      error: null,

      fetchTemplates: () => {
        set({ isLoading: true, error: null });
        try {
          const templates = commissionTemplatesRepository.getAll();
          set({ templates, isLoading: false });
        } catch (error) {
          set({ error: "Failed to fetch templates", isLoading: false });
        }
      },

      createTemplate: (templateData) => {
        try {
          const template: CommissionTemplate = {
            ...templateData,
            id: uuidv4(),
            approvedBy: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          };
          commissionTemplatesRepository.create(template);
          set({ templates: [...get().templates, template] });
        } catch (error) {
          set({ error: "Failed to create template" });
        }
      },

      approveTemplate: (id, approvedBy) => {
        try {
          const updated = commissionTemplatesRepository.update(id, {
            status: "APPROVED",
            approvedBy,
          });
          if (updated) {
            set({
              templates: get().templates.map((t) =>
                t.id === id ? updated : t
              ),
            });
          }
        } catch (error) {
          set({ error: "Failed to approve template" });
        }
      },

      fetchParameters: () => {
        try {
          const parameters = commissionParametersRepository.getAll();
          set({ parameters });
        } catch (error) {
          set({ error: "Failed to fetch parameters" });
        }
      },

      createParameter: (parameterData) => {
        try {
          const parameter: CommissionParameter = {
            ...parameterData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          commissionParametersRepository.create(parameter);
          set({ parameters: [...get().parameters, parameter] });
        } catch (error) {
          set({ error: "Failed to create parameter" });
        }
      },

      getParametersByTemplateId: (templateId) => {
        return get().parameters.filter(
          (p) => p.commissionTemplateId === templateId
        );
      },

      fetchAssignments: () => {
        try {
          const assignments = commissionAssignmentsRepository.getAll();
          set({ assignments });
        } catch (error) {
          set({ error: "Failed to fetch assignments" });
        }
      },

      createAssignment: (assignmentData) => {
        try {
          const assignment: CommissionAssignment = {
            ...assignmentData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
          };
          commissionAssignmentsRepository.create(assignment);
          set({ assignments: [...get().assignments, assignment] });
        } catch (error) {
          set({ error: "Failed to create assignment" });
        }
      },

      getAssignmentsByMerchant: (merchantId) => {
        return get().assignments.filter((a) => a.merchantId === merchantId);
      },

      fetchTaxConfigs: () => {
        try {
          const taxConfigs = merchantTaxConfigsRepository.getAll();
          set({ taxConfigs });
        } catch (error) {
          set({ error: "Failed to fetch tax configs" });
        }
      },

      createTaxConfig: (configData) => {
        try {
          const config: MerchantTaxConfig = {
            ...configData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
          };
          merchantTaxConfigsRepository.create(config);
          set({ taxConfigs: [...get().taxConfigs, config] });
        } catch (error) {
          set({ error: "Failed to create tax config" });
        }
      },

      fetchPSPCommissions: () => {
        try {
          const pspCommissions = pspCommissionsRepository.getAll();
          set({ pspCommissions });
        } catch (error) {
          set({ error: "Failed to fetch PSP commissions" });
        }
      },

      createPSPCommission: (commissionData) => {
        try {
          const commission: PSPCommission = {
            ...commissionData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
          };
          pspCommissionsRepository.create(commission);
          set({ pspCommissions: [...get().pspCommissions, commission] });
        } catch (error) {
          set({ error: "Failed to create PSP commission" });
        }
      },

      setError: (error) => set({ error }),
    }),
    {
      name: "commissions-storage",
    }
  )
);
