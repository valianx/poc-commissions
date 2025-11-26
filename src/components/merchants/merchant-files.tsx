"use client";

import { useEffect, useState, useRef } from "react";
import { useMerchantFilesStore } from "@/lib/stores/merchant-files.store";
import { MerchantFileCategory } from "@/types/merchant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Plus,
  Loader2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface MerchantFilesProps {
  merchantId: string;
}

const FILE_CATEGORIES: { value: MerchantFileCategory; label: string }[] = [
  { value: "CONTRACT", label: "Contrato" },
  { value: "ADDENDUM", label: "Adenda" },
  { value: "LEGAL", label: "Legal" },
  { value: "COMPLIANCE", label: "Compliance" },
  { value: "INVOICE", label: "Factura" },
  { value: "OTHER", label: "Otro" },
];

const getCategoryBadgeVariant = (category: MerchantFileCategory) => {
  switch (category) {
    case "CONTRACT":
      return "default";
    case "ADDENDUM":
      return "secondary";
    case "LEGAL":
      return "outline";
    case "COMPLIANCE":
      return "destructive";
    case "INVOICE":
      return "success";
    default:
      return "outline";
  }
};

const getCategoryLabel = (category: MerchantFileCategory) => {
  return FILE_CATEGORIES.find((c) => c.value === category)?.label || category;
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("pdf") || mimeType.includes("document")) {
    return <FileText className="h-4 w-4" />;
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return <FileSpreadsheet className="h-4 w-4" />;
  }
  if (mimeType.includes("image")) {
    return <FileImage className="h-4 w-4" />;
  }
  return <File className="h-4 w-4" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function MerchantFiles({ merchantId }: MerchantFilesProps) {
  const { files, isLoading, isUploading, error, fetchFilesByMerchant, uploadFile, deleteFile, downloadFile, setError } =
    useMerchantFilesStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MerchantFileCategory>("CONTRACT");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFilesByMerchant(merchantId);
  }, [merchantId, fetchFilesByMerchant]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB for localStorage limitations)
      if (file.size > 10 * 1024 * 1024) {
        setError("El archivo no debe superar los 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;

        await uploadFile({
          merchantId,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          category: selectedCategory,
          description: description || undefined,
          uploadedBy: "admin@zippy.com",
          fileData: base64Data,
        });

        // Reset form
        setSelectedFile(null);
        setDescription("");
        setSelectedCategory("CONTRACT");
        setIsDialogOpen(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch {
      // Error is handled in the store
    }
  };

  const handleDelete = (id: string) => {
    deleteFile(id);
    setDeleteConfirmId(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Archivos del Merchant
          </CardTitle>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Subir Archivo
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader onClose={() => setIsDialogOpen(false)}>
                <DialogTitle>Subir Nuevo Archivo</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Archivo</Label>
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos permitidos: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG. Máximo 10MB.
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="rounded-md bg-muted p-3">
                      <div className="flex items-center gap-2">
                        {getFileIcon(selectedFile.type)}
                        <div>
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as MerchantFileCategory)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {FILE_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ej: Contrato de servicios 2024"
                    />
                  </div>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-auto p-0 text-red-800 underline"
              onClick={() => setError(null)}
            >
              Cerrar
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No hay archivos subidos para este merchant
            </p>
            <p className="text-xs text-muted-foreground">
              Sube contratos, documentos legales y otros archivos relevantes
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Subido Por</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.mimeType)}
                        <div>
                          <p className="font-medium">{file.fileName}</p>
                          {file.description && (
                            <p className="text-xs text-muted-foreground">{file.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(file.category)}>
                        {getCategoryLabel(file.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(file.fileSize)}
                    </TableCell>
                    <TableCell className="text-sm">{file.uploadedBy}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(file.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadFile(file.id)}
                          title="Descargar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {deleteConfirmId === file.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(file.id)}
                            >
                              Confirmar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(file.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
