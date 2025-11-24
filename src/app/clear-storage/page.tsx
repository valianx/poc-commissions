"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClearStoragePage() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  const handleClearStorage = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      setCleared(true);

      // Hard reload after 2 seconds to force Zustand stores to reinitialize
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Clear Local Storage</CardTitle>
          <CardDescription>
            This will clear all local data and reseed the database with fresh data including VAT configurations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!cleared ? (
            <Button
              onClick={handleClearStorage}
              variant="destructive"
              className="w-full"
            >
              Clear Storage & Reseed
            </Button>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-green-600 font-semibold">✓ Storage cleared successfully!</p>
              <p className="text-sm text-gray-600">Redirecting to home page...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
