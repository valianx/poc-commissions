import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MerchantChannelConfig,
  CreateMerchantChannelConfigDto,
} from "@/types/merchant-channel-config";
import { merchantChannelConfigRepository } from "@/lib/repositories/merchant-channel-config.repository";
import { v4 as uuidv4 } from "uuid";

interface MerchantChannelConfigState {
  configs: MerchantChannelConfig[];
  isLoading: boolean;
  error: string | null;

  fetchConfigs: () => void;
  getConfigsByMerchant: (merchantId: string) => MerchantChannelConfig[];
  getConfigByMerchantCountryChannel: (
    merchantId: string,
    countryCode: string,
    channelId: string
  ) => MerchantChannelConfig | null;
  createConfig: (config: CreateMerchantChannelConfigDto) => void;
  updateConfig: (
    id: string,
    updates: Partial<MerchantChannelConfig>
  ) => void;
  deleteConfig: (id: string) => void;
  syncPSPForChannel: (
    channelId: string,
    countryCode: string,
    newPspId: string
  ) => void;
  removeConfigsForChannel: (channelId: string, countryCode: string) => void;
  setError: (error: string | null) => void;
}

export const useMerchantChannelConfigStore =
  create<MerchantChannelConfigState>()(
    persist(
      (set, get) => ({
        configs: [],
        isLoading: false,
        error: null,

        fetchConfigs: () => {
          set({ isLoading: true, error: null });
          try {
            const configs = merchantChannelConfigRepository.getAll();
            set({ configs, isLoading: false });
          } catch (error) {
            set({
              error: "Failed to fetch merchant channel configs",
              isLoading: false,
            });
          }
        },

        getConfigsByMerchant: (merchantId) => {
          return get().configs.filter((c) => c.merchantId === merchantId);
        },

        getConfigByMerchantCountryChannel: (
          merchantId,
          countryCode,
          channelId
        ) => {
          return (
            get().configs.find(
              (c) =>
                c.merchantId === merchantId &&
                c.countryCode === countryCode &&
                c.channelId === channelId
            ) || null
          );
        },

        createConfig: (configData) => {
          try {
            const config: MerchantChannelConfig = {
              ...configData,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              deletedAt: null,
            };
            merchantChannelConfigRepository.create(config);
            set({ configs: [...get().configs, config] });
          } catch (error) {
            set({ error: "Failed to create merchant channel config" });
          }
        },

        updateConfig: (id, updates) => {
          try {
            const updated = merchantChannelConfigRepository.update(id, updates);
            if (updated) {
              set({
                configs: get().configs.map((c) => (c.id === id ? updated : c)),
              });
            }
          } catch (error) {
            set({ error: "Failed to update merchant channel config" });
          }
        },

        deleteConfig: (id) => {
          try {
            merchantChannelConfigRepository.delete(id);
            set({ configs: get().configs.filter((c) => c.id !== id) });
          } catch (error) {
            set({ error: "Failed to delete merchant channel config" });
          }
        },

        syncPSPForChannel: (channelId, countryCode, newPspId) => {
          try {
            const configs = get().configs;
            const configsToUpdate = configs.filter(
              (c) => c.channelId === channelId && c.countryCode === countryCode
            );

            const updatedConfigs = configs.map((config) => {
              if (
                config.channelId === channelId &&
                config.countryCode === countryCode
              ) {
                const updated = {
                  ...config,
                  pspId: newPspId,
                  updatedAt: new Date().toISOString(),
                };
                merchantChannelConfigRepository.update(config.id, {
                  pspId: newPspId,
                });
                return updated;
              }
              return config;
            });

            set({ configs: updatedConfigs });
          } catch (error) {
            set({ error: "Failed to sync PSP for channel" });
          }
        },

        removeConfigsForChannel: (channelId, countryCode) => {
          try {
            const configs = get().configs;
            const configsToRemove = configs.filter(
              (c) => c.channelId === channelId && c.countryCode === countryCode
            );

            configsToRemove.forEach((config) => {
              merchantChannelConfigRepository.delete(config.id);
            });

            set({
              configs: configs.filter(
                (c) =>
                  !(c.channelId === channelId && c.countryCode === countryCode)
              ),
            });
          } catch (error) {
            set({ error: "Failed to remove configs for channel" });
          }
        },

        setError: (error) => set({ error }),
      }),
      {
        name: "merchant-channel-config-storage",
      }
    )
  );
