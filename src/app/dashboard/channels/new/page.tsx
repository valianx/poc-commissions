import { ChannelForm } from "@/components/channels/channel-form";

export default function NewChannelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Crear Nuevo Canal</h1>
        <p className="text-muted-foreground">
          Complete el formulario para registrar un nuevo método de pago
        </p>
      </div>

      <ChannelForm />
    </div>
  );
}
