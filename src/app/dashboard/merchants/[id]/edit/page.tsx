"use client";

import { useEffect } from "react";
import { use } from "react";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Settings, FileText } from "lucide-react";
import Link from "next/link";
import { MerchantEditForm } from "@/components/merchants/merchant-edit-form";
import { MerchantChannelConfig } from "@/components/merchants/merchant-channel-config";
import { MerchantFiles } from "@/components/merchants/merchant-files";
import { useRouter } from "next/navigation";

export default function EditMerchantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getMerchantById, fetchMerchants } = useMerchantsStore();

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const merchant = getMerchantById(id);

  if (!merchant) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/merchants">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Merchant no encontrado</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/dashboard/merchants")}
            >
              Volver a Merchants
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/merchants/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Merchant</h1>
          <p className="text-muted-foreground">
            {merchant.name} ({merchant.code})
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Información Básica
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración de Canales
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Archivos
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Información Básica y Configuración de Callbacks */}
        <TabsContent value="info">
          <MerchantEditForm
            merchant={merchant}
            onCancel={() => router.push(`/dashboard/merchants/${id}`)}
          />
        </TabsContent>

        {/* Tab 2: Configuración de Canales */}
        <TabsContent value="channels">
          <MerchantChannelConfig merchant={merchant} />
        </TabsContent>

        {/* Tab 3: Archivos */}
        <TabsContent value="files">
          <MerchantFiles merchantId={merchant.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
