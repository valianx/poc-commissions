import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Merchant, CreateMerchantDto } from "@/types/merchant";
import { merchantsRepository } from "@/lib/repositories/merchants.repository";
import { v4 as uuidv4 } from "uuid";

interface MerchantsState {
  merchants: Merchant[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMerchants: () => void;
  getMerchantById: (id: string) => Merchant | undefined;
  createMerchant: (merchant: CreateMerchantDto) => void;
  updateMerchant: (id: string, updates: Partial<Merchant>) => void;
  deleteMerchant: (id: string) => void;
  setError: (error: string | null) => void;
}

export const useMerchantsStore = create<MerchantsState>()(
  persist(
    (set, get) => ({
      merchants: [],
      isLoading: false,
      error: null,

      fetchMerchants: () => {
        set({ isLoading: true, error: null });
        try {
          const merchants = merchantsRepository.getAll();
          set({ merchants, isLoading: false });
        } catch (error) {
          set({
            error: "Failed to fetch merchants",
            isLoading: false,
          });
        }
      },

      getMerchantById: (id) => {
        return get().merchants.find((m) => m.id === id);
      },

      createMerchant: (merchantData) => {
        try {
          const merchant: Merchant = {
            ...merchantData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          };
          merchantsRepository.create(merchant);
          set({ merchants: [...get().merchants, merchant] });
        } catch (error) {
          set({ error: "Failed to create merchant" });
        }
      },

      updateMerchant: (id, updates) => {
        try {
          const updated = merchantsRepository.update(id, updates);
          if (updated) {
            set({
              merchants: get().merchants.map((m) =>
                m.id === id ? updated : m
              ),
            });
          }
        } catch (error) {
          set({ error: "Failed to update merchant" });
        }
      },

      deleteMerchant: (id) => {
        try {
          merchantsRepository.delete(id);
          set({ merchants: get().merchants.filter((m) => m.id !== id) });
        } catch (error) {
          set({ error: "Failed to delete merchant" });
        }
      },

      setError: (error) => set({ error }),
    }),
    {
      name: "merchants-storage",
    }
  )
);
