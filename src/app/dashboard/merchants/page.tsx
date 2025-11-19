"use client";

import { useEffect } from "react";
import { useMerchantsStore } from "@/lib/stores/merchants.store";
import { MerchantTable } from "@/components/merchants/merchant-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function MerchantsPage() {
  const { merchants, fetchMerchants } = useMerchantsStore();

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Merchants</h1>
          <p className="text-muted-foreground">
            Gestión de comercios y configuraciones
          </p>
        </div>
        <Link href="/dashboard/merchants/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Merchant
          </Button>
        </Link>
      </div>

      <MerchantTable merchants={merchants} />
    </div>
  );
}
