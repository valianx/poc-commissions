import { PSPForm } from "@/components/channels/psp-form";
import Link from "next/link";

export default function NewPSPPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nuevo PSP</h1>
          <p className="text-muted-foreground">
            Registrar un nuevo Payment Service Provider
          </p>
        </div>
        <Link
          href="/dashboard/channels"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Volver a Canales
        </Link>
      </div>

      <PSPForm />
    </div>
  );
}
