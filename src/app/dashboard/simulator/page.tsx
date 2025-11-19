import { PaymentSimulator } from "@/components/simulator/payment-simulator";

export default function SimulatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Simulador de Pagos</h1>
        <p className="text-muted-foreground">
          Simule transacciones y vea el desglose completo de comisiones
        </p>
      </div>

      <PaymentSimulator />
    </div>
  );
}
