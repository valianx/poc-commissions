"use client";

import { cn } from "@/lib/utils";

interface RequiredIndicatorProps {
  className?: string;
}

export function RequiredIndicator({ className }: RequiredIndicatorProps) {
  return (
    <span className={cn("text-red-500 ml-0.5", className)} aria-label="campo requerido">
      *
    </span>
  );
}
