"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClearStoragePage() {
  const [action, setAction] = useState<"none" | "reseed" | "clear">("none");

  const handleReseed = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      setAction("reseed");

      // Hard reload after 2 seconds to force Zustand stores to reinitialize with seed data
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const handleClearAll = () => {
    if (typeof window !== "undefined") {
      // Clear localStorage
      localStorage.clear();
      // Set a flag to prevent seeding on next load
      localStorage.setItem("zippy:skip_seed", "true");
      setAction("clear");

      // Hard reload after 2 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Gestión de Datos</CardTitle>
          <CardDescription>
            Opciones para restablecer o eliminar los datos de la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {action === "none" ? (
            <>
              <div className="space-y-2">
                <Button
                  onClick={handleReseed}
                  variant="outline"
                  className="w-full"
                >
                  Restablecer Seed
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Elimina todos los datos y los reemplaza con los datos de ejemplo iniciales.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={handleClearAll}
                  variant="destructive"
                  className="w-full"
                >
                  Eliminar Todos los Datos
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Elimina todos los datos permanentemente. La aplicación quedará vacía.
                </p>
              </div>
            </>
          ) : action === "reseed" ? (
            <div className="text-center space-y-2">
              <p className="text-green-600 font-semibold">Datos restablecidos correctamente</p>
              <p className="text-sm text-gray-600">Redirigiendo al inicio...</p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-green-600 font-semibold">Datos eliminados correctamente</p>
              <p className="text-sm text-gray-600">Redirigiendo al inicio...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
