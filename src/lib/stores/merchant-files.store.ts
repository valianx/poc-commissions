import { create } from "zustand";
import { MerchantFile, CreateMerchantFileDto } from "@/types/merchant";
import { merchantFilesRepository } from "@/lib/repositories/merchant-files.repository";

interface MerchantFilesState {
  files: MerchantFile[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;

  // Actions
  fetchFilesByMerchant: (merchantId: string) => void;
  uploadFile: (dto: CreateMerchantFileDto) => Promise<MerchantFile>;
  deleteFile: (id: string) => void;
  downloadFile: (id: string) => void;
  setError: (error: string | null) => void;
}

export const useMerchantFilesStore = create<MerchantFilesState>()((set, get) => ({
  files: [],
  isLoading: false,
  isUploading: false,
  error: null,

  fetchFilesByMerchant: (merchantId: string) => {
    set({ isLoading: true, error: null });
    try {
      const files = merchantFilesRepository.getByMerchantId(merchantId);
      set({ files, isLoading: false });
    } catch (error) {
      set({
        error: "Error al cargar los archivos",
        isLoading: false,
      });
    }
  },

  uploadFile: async (dto: CreateMerchantFileDto) => {
    set({ isUploading: true, error: null });
    try {
      const file = merchantFilesRepository.createFile(dto);
      set({ files: [file, ...get().files], isUploading: false });
      return file;
    } catch (error) {
      set({
        error: "Error al subir el archivo",
        isUploading: false,
      });
      throw error;
    }
  },

  deleteFile: (id: string) => {
    try {
      merchantFilesRepository.deleteFile(id);
      set({ files: get().files.filter((f) => f.id !== id) });
    } catch (error) {
      set({ error: "Error al eliminar el archivo" });
    }
  },

  downloadFile: (id: string) => {
    try {
      const file = get().files.find((f) => f.id === id);
      if (!file) {
        throw new Error("Archivo no encontrado");
      }

      const fileData = merchantFilesRepository.getFileData(id);
      if (!fileData) {
        throw new Error("Datos del archivo no encontrados");
      }

      // Create a download link
      const link = document.createElement("a");
      link.href = fileData;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Error al descargar el archivo" });
    }
  },

  setError: (error) => set({ error }),
}));
