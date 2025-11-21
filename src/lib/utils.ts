import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AssignmentStatus } from "@/types/commission";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CL").format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * Calculate commission assignment status based on dates
 * @param startDate - Commission start date
 * @param endDate - Commission end date (null means indefinite)
 * @param currentStatus - Current status (may be CANCELLED which overrides date logic)
 * @returns The calculated status
 */
export function calculateAssignmentStatus(
  startDate: string,
  endDate: string | null,
  currentStatus?: AssignmentStatus
): AssignmentStatus {
  // If manually cancelled, keep that status
  if (currentStatus === "CANCELLED") {
    return "CANCELLED";
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  // Future commission
  if (start > now) {
    return "SCHEDULED";
  }

  // Past commission (has end date and it's passed)
  if (end && end < now) {
    return "EXPIRED";
  }

  // Active commission (started and not ended yet)
  return "ACTIVE";
}
