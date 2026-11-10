import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS class names with conflict resolution.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string.
 * @example formatDate(new Date()) // "Nov 9, 2026"
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
}

/**
 * Format a date as a relative time string (e.g. "2 hours ago", "in 3 days").
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isFuture = diffMs < 0;

  const seconds = Math.floor(absDiffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const format = (value: number, unit: string): string => {
    const plural = value !== 1 ? "s" : "";
    return isFuture
      ? `in ${value} ${unit}${plural}`
      : `${value} ${unit}${plural} ago`;
  };

  if (seconds < 60) return "just now";
  if (minutes < 60) return format(minutes, "minute");
  if (hours < 24) return format(hours, "hour");
  if (days < 7) return format(days, "day");
  if (weeks < 5) return format(weeks, "week");
  if (months < 12) return format(months, "month");
  return format(years, "year");
}

/**
 * Generate a URL-safe slug from a string.
 * @example generateSlug("My Project Name!") // "my-project-name"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word characters (except spaces and hyphens)
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

/**
 * Truncate text to a maximum length, appending an ellipsis if truncated.
 * @example truncateText("Hello World", 5) // "Hello…"
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Get initials from a name for avatar fallbacks.
 * @example getInitials("John Doe")   // "JD"
 * @example getInitials("Alice")      // "A"
 * @example getInitials("")           // "?"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
