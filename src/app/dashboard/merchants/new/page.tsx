import { MerchantForm } from "@/components/merchants/merchant-form";

export default function NewMerchantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Crear Nuevo Merchant</h1>
        <p className="text-muted-foreground">
          Complete el formulario para registrar un nuevo comercio
        </p>
      </div>

      <MerchantForm />
    </div>
  );
}
