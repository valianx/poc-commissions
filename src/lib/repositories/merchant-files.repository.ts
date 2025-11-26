import { MerchantFile, CreateMerchantFileDto } from "@/types/merchant";
import { STORAGE_KEYS } from "@/types/storage";
import { BaseRepository } from "./base.repository";
import { v4 as uuidv4 } from "uuid";

class MerchantFilesRepository extends BaseRepository<MerchantFile> {
  constructor() {
    super(STORAGE_KEYS.MERCHANT_FILES);
  }

  getByMerchantId(merchantId: string): MerchantFile[] {
    return this.findBy((f) => f.merchantId === merchantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createFile(dto: CreateMerchantFileDto): MerchantFile {
    const id = uuidv4();
    const now = new Date().toISOString();
    const bucketPath = `merchants/${dto.merchantId}/files/${id}-${dto.fileName}`;

    // Store the file data separately (simulating bucket storage)
    this.storeFileData(id, dto.fileData);

    const file: MerchantFile = {
      id,
      merchantId: dto.merchantId,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      mimeType: dto.mimeType,
      category: dto.category,
      description: dto.description,
      uploadedBy: dto.uploadedBy,
      bucketPath,
      createdAt: now,
    };

    this.create(file);
    return file;
  }

  private storeFileData(fileId: string, data: string): void {
    if (typeof window === "undefined") return;

    try {
      // Get existing file data storage
      const existingData = localStorage.getItem(STORAGE_KEYS.MERCHANT_FILE_DATA);
      const fileDataStore: Record<string, string> = existingData ? JSON.parse(existingData) : {};

      // Store the new file data
      fileDataStore[fileId] = data;

      localStorage.setItem(STORAGE_KEYS.MERCHANT_FILE_DATA, JSON.stringify(fileDataStore));
    } catch (error) {
      console.error("Error storing file data:", error);
      throw new Error("Failed to store file data");
    }
  }

  getFileData(fileId: string): string | null {
    if (typeof window === "undefined") return null;

    try {
      const existingData = localStorage.getItem(STORAGE_KEYS.MERCHANT_FILE_DATA);
      if (!existingData) return null;

      const fileDataStore: Record<string, string> = JSON.parse(existingData);
      return fileDataStore[fileId] || null;
    } catch (error) {
      console.error("Error getting file data:", error);
      return null;
    }
  }

  deleteFile(id: string): boolean {
    // Also remove the file data
    this.removeFileData(id);
    return this.delete(id);
  }

  private removeFileData(fileId: string): void {
    if (typeof window === "undefined") return;

    try {
      const existingData = localStorage.getItem(STORAGE_KEYS.MERCHANT_FILE_DATA);
      if (!existingData) return;

      const fileDataStore: Record<string, string> = JSON.parse(existingData);
      delete fileDataStore[fileId];

      localStorage.setItem(STORAGE_KEYS.MERCHANT_FILE_DATA, JSON.stringify(fileDataStore));
    } catch (error) {
      console.error("Error removing file data:", error);
    }
  }
}

export const merchantFilesRepository = new MerchantFilesRepository();
