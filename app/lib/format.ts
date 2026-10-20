import type { Priority } from "@/lib/types";

export const priorityStyles: Record<Priority, string> = {
  LOW: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  MEDIUM: "bg-sky-50 text-sky-700 ring-sky-200",
  HIGH: "bg-amber-50 text-amber-700 ring-amber-200",
  URGENT: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const priorityDot: Record<Priority, string> = {
  LOW: "bg-zinc-400",
  MEDIUM: "bg-sky-500",
  HIGH: "bg-amber-500",
  URGENT: "bg-rose-500",
};

export const roleStyles: Record<string, string> = {
  OWNER: "bg-violet-50 text-violet-700 ring-violet-200",
  ADMIN: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  MEMBER: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function isOverdue(value: string | null): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
