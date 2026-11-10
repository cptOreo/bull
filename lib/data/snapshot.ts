import rawSnapshot from "../../data/snapshot.json";
import { snapshotSchema, type Snapshot } from "./schema";

/** Recursively freeze a value graph. Exported so the freeze itself is testable. */
export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return value;
}

function formatIssues(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>): string {
  return issues
    .slice(0, 10)
    .map((issue) => `${issue.path.length > 0 ? issue.path.join(".") : "(root)"}: ${issue.message}`)
    .join("\n");
}

const parsed = snapshotSchema.safeParse(rawSnapshot);

if (!parsed.success) {
  throw new Error(
    `The data file failed validation.\n${formatIssues(parsed.error.issues)}\nRun: npm run data:check`,
  );
}

/** Validated once at module load and deep-frozen. There is no other data source. */
export const snapshot: Snapshot = deepFreeze(parsed.data);

export const snapshotId: string = snapshot.snapshotId;
