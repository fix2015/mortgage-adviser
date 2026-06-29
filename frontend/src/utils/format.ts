import { format, formatDistanceToNow } from "date-fns";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

function parseUTC(date: string | Date): Date {
  if (typeof date === "string" && !date.endsWith("Z") && !date.includes("+")) {
    return new Date(date + "Z");
  }
  return new Date(date);
}

export function formatDate(date: string | Date): string {
  return format(parseUTC(date), "dd MMM yyyy");
}

export function formatDateTime(date: string | Date): string {
  return format(parseUTC(date), "dd MMM yyyy, HH:mm");
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(parseUTC(date), { addSuffix: true });
}

export function formatPounds(amount: number): string {
  const rounded = Math.round(amount);
  return `\u00A3${rounded.toLocaleString("en-GB")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}
