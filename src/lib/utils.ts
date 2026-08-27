import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatRating(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toFixed(1);
}

export function truncate(value: string, length = 48): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1)}…`;
}

export async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: unknown }).error)
        : response.statusText;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
