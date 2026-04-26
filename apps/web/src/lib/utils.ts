// FILE: apps/web/src/lib/utils.ts
// PURPOSE: shadcn cn() utility + shared helper functions
// DEPENDS ON: clsx, tailwind-merge
// LAST UPDATED: F07 - Next.js Frontend Setup

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ─────────────────────────────────────────────
// shadcn class merge utility
// ─────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────
// Format currency amount
// ─────────────────────────────────────────────

export function formatCurrency(
  amount: number | string,
  currency = "INR",
  locale = "en-IN"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// ─────────────────────────────────────────────
// Format relative time (e.g. "2 hours ago")
// ─────────────────────────────────────────────

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}

// ─────────────────────────────────────────────
// Format date for display
// ─────────────────────────────────────────────

export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

// ─────────────────────────────────────────────
// Get initials from name (for avatars)
// ─────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─────────────────────────────────────────────
// Truncate long text
// ─────────────────────────────────────────────

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// ─────────────────────────────────────────────
// Generate a random pastel color from a string
// Used for group/user avatar backgrounds
// ─────────────────────────────────────────────

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

// ─────────────────────────────────────────────
// Sleep (for testing/demos)
// ─────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────
// Get category label (import from CategoryPicker
// is a client component — this is a pure utility)
// ─────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  food: "Food",
  transport: "Transport",
  accommodation: "Accommodation",
  entertainment: "Entertainment",
  shopping: "Shopping",
  utilities: "Utilities",
  rent: "Rent",
  groceries: "Groceries",
  drinks: "Drinks",
  health: "Health",
  education: "Education",
  gifts: "Gifts",
  travel: "Travel",
  other: "Other",
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}