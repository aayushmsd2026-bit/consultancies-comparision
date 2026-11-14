type ClassValue = string | false | null | undefined;

/** Joins class names and drops empty ones. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
