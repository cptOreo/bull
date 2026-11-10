export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | { [key: string]: boolean | number | string | undefined | null }
  | ClassValue[];

/**
 * Combines CSS class names conditionally and flattens arrays/objects into a space-separated string.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input).trim());
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) classes.push(inner);
    } else if (typeof input === "object") {
      for (const [key, val] of Object.entries(input)) {
        if (Boolean(val)) classes.push(key);
      }
    }
  }
  return classes.filter(Boolean).join(" ");
}
