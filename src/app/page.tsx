"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Wallet, Calculator, BarChart3 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to dashboard after 2 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  const features = [
    {
      icon: Store,
      title: "Merchants",
      description: "Gestión completa de comercios y configuraciones",
    },
    {
      icon: Wallet,
      title: "Channels",
      description: "Administración de canales y PSPs",
    },
    {
      icon: Calculator,
      title: "Commissions",
      description: "Templates y asignaciones de comisiones",
    },
    {
      icon: BarChart3,
      title: "Simulator",
      description: "Simulador de pagos con desglose detallado",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-24">
      <div className="max-w-5xl text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900">
          Zippy Dashboard
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          POC - Sistema de Gestión de Merchants, Channels y Commissions
        </p>

        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-2 flex justify-center">
                  <div className="rounded-lg bg-primary p-3">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-center text-lg">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={() => router.push("/dashboard")}>
            Ir al Dashboard
          </Button>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Redirigiendo automáticamente en 2 segundos...
        </p>
      </div>
    </main>
  );
}
