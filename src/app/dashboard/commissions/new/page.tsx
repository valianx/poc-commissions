import { CommissionTemplateForm } from "@/components/commissions/commission-template-form";
import Link from "next/link";

export default function NewCommissionTemplatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nuevo Template de Comisión</h1>
          <p className="text-muted-foreground">
            Crear un nuevo template de comisión para merchants y canales
          </p>
        </div>
        <Link
          href="/dashboard/commissions"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Volver a Comisiones
        </Link>
      </div>

      <CommissionTemplateForm />
    </div>
  );
}
