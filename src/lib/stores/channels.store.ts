import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Channel, PSP, CreateChannelDto, CreatePSPDto } from "@/types/channel";
import {
  channelsRepository,
  pspsRepository,
} from "@/lib/repositories/channels.repository";
import { v4 as uuidv4 } from "uuid";

interface ChannelsState {
  channels: Channel[];
  psps: PSP[];
  isLoading: boolean;
  error: string | null;

  // Channel Actions
  fetchChannels: () => void;
  getChannelById: (id: string) => Channel | undefined;
  createChannel: (channel: CreateChannelDto) => void;
  updateChannel: (id: string, updates: Partial<Channel>) => void;
  deleteChannel: (id: string) => void;

  // PSP Actions
  fetchPSPs: () => void;
  getPSPById: (id: string) => PSP | undefined;
  createPSP: (psp: CreatePSPDto) => void;
  updatePSP: (id: string, updates: Partial<PSP>) => void;
  deletePSP: (id: string) => void;

  setError: (error: string | null) => void;
}

export const useChannelsStore = create<ChannelsState>()(
  persist(
    (set, get) => ({
      channels: [],
      psps: [],
      isLoading: false,
      error: null,

      fetchChannels: () => {
        set({ isLoading: true, error: null });
        try {
          const channels = channelsRepository.getAll();
          set({ channels, isLoading: false });
        } catch (error) {
          set({ error: "Failed to fetch channels", isLoading: false });
        }
      },

      getChannelById: (id) => {
        return get().channels.find((c) => c.id === id);
      },

      createChannel: (channelData) => {
        try {
          const channel: Channel = {
            ...channelData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          };
          channelsRepository.create(channel);
          set({ channels: [...get().channels, channel] });
        } catch (error) {
          set({ error: "Failed to create channel" });
        }
      },

      updateChannel: (id, updates) => {
        try {
          const updated = channelsRepository.update(id, updates);
          if (updated) {
            set({
              channels: get().channels.map((c) =>
                c.id === id ? updated : c
              ),
            });
          }
        } catch (error) {
          set({ error: "Failed to update channel" });
        }
      },

      deleteChannel: (id) => {
        try {
          channelsRepository.delete(id);
          set({ channels: get().channels.filter((c) => c.id !== id) });
        } catch (error) {
          set({ error: "Failed to delete channel" });
        }
      },

      fetchPSPs: () => {
        set({ isLoading: true, error: null });
        try {
          const psps = pspsRepository.getAll();
          set({ psps, isLoading: false });
        } catch (error) {
          set({ error: "Failed to fetch PSPs", isLoading: false });
        }
      },

      getPSPById: (id) => {
        return get().psps.find((p) => p.id === id);
      },

      createPSP: (pspData) => {
        try {
          const psp: PSP = {
            ...pspData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          };
          pspsRepository.create(psp);
          set({ psps: [...get().psps, psp] });
        } catch (error) {
          set({ error: "Failed to create PSP" });
        }
      },

      updatePSP: (id, updates) => {
        try {
          const updated = pspsRepository.update(id, updates);
          if (updated) {
            set({
              psps: get().psps.map((p) => (p.id === id ? updated : p)),
            });
          }
        } catch (error) {
          set({ error: "Failed to update PSP" });
        }
      },

      deletePSP: (id) => {
        try {
          pspsRepository.delete(id);
          set({ psps: get().psps.filter((p) => p.id !== id) });
        } catch (error) {
          set({ error: "Failed to delete PSP" });
        }
      },

      setError: (error) => set({ error }),
    }),
    {
      name: "channels-storage",
    }
  )
);
