import type { ConfigRef, DataRef, DerivedRef, ProfileRef, Ref, RefUnit } from "@/lib/engine/types";
import { formatCrore, formatPercent, formatPrice, formatRatio, formatTimes } from "@/lib/engine/format";

export function createDataRef(id: string, value: number | string, unit: RefUnit, asOf: string, source: string): DataRef {
  return { kind: "data", id, value, unit, asOf, source };
}

export function createDerivedRef(id: string, value: number | string, unit: RefUnit, formulaId: string, inputRefIds: string[]): DerivedRef {
  return { kind: "derived", id, value, unit, formulaId, inputRefIds };
}

export function createConfigRef(id: string, value: number | string, unit: RefUnit): ConfigRef {
  return { kind: "config", id, value, unit };
}

export function createProfileRef(id: string, value: string, displayValue: string): ProfileRef {
  return { kind: "profile", id, value, displayValue };
}

export function formatRefValue(ref: Ref): string {
  if (ref.kind === "profile") return ref.displayValue;
  if (typeof ref.value === "string") return ref.value;
  switch (ref.unit) {
    case "price": return formatPrice(ref.value);
    case "percent": return formatPercent(ref.value);
    case "ratio": return formatRatio(ref.value);
    case "crore": return formatCrore(ref.value);
    case "times": return formatTimes(ref.value);
    case "score": return formatRatio(ref.value, 1);
    default: return String(ref.value);
  }
}
