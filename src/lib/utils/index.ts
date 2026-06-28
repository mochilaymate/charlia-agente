import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Preserve leading '+' and strip non-digit chars after it. Returns E.164 or empty. */
export function normalizeE164(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.slice(1).replace(/\D/g, "");
  }
  return trimmed.replace(/\D/g, "");
}

/** @deprecated Use normalizeE164 for outbound calls — this strips '+' */
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isWithinWhatsAppWindow(
  lastInboundAt: string | null,
  now = new Date()
): boolean {
  if (!lastInboundAt) return false;
  const diff = now.getTime() - new Date(lastInboundAt).getTime();
  return diff < 24 * 60 * 60 * 1000;
}

export function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

export function classNames(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
