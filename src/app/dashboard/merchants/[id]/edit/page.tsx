"use client";

import { useEffect } from "react";
import { use } from "react";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MerchantEditForm } from "@/components/merchants/merchant-edit-form";
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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/merchants">
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
      <MerchantEditForm
        merchant={merchant}
        onCancel={() => router.push(`/dashboard/merchants/${id}`)}
      />
    </div>
  );
}
