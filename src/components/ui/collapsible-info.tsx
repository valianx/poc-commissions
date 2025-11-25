"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleInfoProps {
  title?: string;
  children: React.ReactNode;
  variant?: "info" | "example" | "warning" | "success";
  defaultOpen?: boolean;
}

const variantStyles = {
  info: {
    container: "border-blue-200 bg-blue-50",
    text: "text-blue-900",
    button: "text-blue-700 hover:text-blue-900 hover:bg-blue-100",
  },
  example: {
    container: "border-amber-200 bg-amber-50",
    text: "text-amber-900",
    button: "text-amber-700 hover:text-amber-900 hover:bg-amber-100",
  },
  warning: {
    container: "border-amber-200 bg-amber-50",
    text: "text-amber-900",
    button: "text-amber-700 hover:text-amber-900 hover:bg-amber-100",
  },
  success: {
    container: "border-green-200 bg-green-50",
    text: "text-green-900",
    button: "text-green-700 hover:text-green-900 hover:bg-green-100",
  },
};

export function CollapsibleInfo({
  title = "Más información",
  children,
  variant = "info",
  defaultOpen = false,
}: CollapsibleInfoProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const styles = variantStyles[variant];

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 text-xs font-medium rounded px-1.5 py-0.5 transition-colors",
          styles.button
        )}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
      {isOpen && (
        <div
          className={cn(
            "rounded-md border p-2.5 text-sm animate-in fade-in-0 slide-in-from-top-1 duration-200",
            styles.container,
            styles.text
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
