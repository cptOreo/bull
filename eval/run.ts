import * as fs from "node:fs";
import * as path from "node:path";
import { snapshot } from "@/lib/data/snapshot";
import { handleTurn } from "@/lib/engine/answer";
import type { TurnInput } from "@/lib/engine/types";
import { GOLDEN_CASES } from "./cases";
import type { CaseLabel, CaseEvaluationResult } from "./gate";
import { computeGate, evaluateCase } from "./gate";
import { printTerminalReport, writeReports, type ReportMeta } from "./report";

const FIXED_NOW = "2026-11-10T18:30:00+05:30";
const ENGINE_VERSION = "0.1.0";

export async function runEvalSuite(): Promise<boolean> {
  // 1. Read static labels
  const labelsPath = path.resolve(process.cwd(), "eval", "labels.json");
  if (!fs.existsSync(labelsPath)) {
    console.error(`Error: Labels file not found at ${labelsPath}`);
    process.exit(1);
  }

  const labelsJson = JSON.parse(fs.readFileSync(labelsPath, "utf-8"));
  const labelsMap = new Map<string, CaseLabel>(
    labelsJson.labels.map((l: CaseLabel) => [l.caseId, l]),
  );

  const results: CaseEvaluationResult[] = [];

  // 2. Execute each golden case through handleTurn
  for (const goldenCase of GOLDEN_CASES) {
    const label = labelsMap.get(goldenCase.id);
    if (!label) {
      console.error(`Missing label for case ${goldenCase.id}`);
      process.exit(1);
    }

    const input: TurnInput = {
      message: goldenCase.query,
      profile: goldenCase.profile ?? null,
      locale: goldenCase.locale,
      now: FIXED_NOW,
      events: [],
    };

    const answer = handleTurn(input, { snapshot });
    const caseResult = evaluateCase(goldenCase, answer, label);
    results.push(caseResult);
  }

  // 3. Compute Gate
  const gateResult = computeGate(results);

  const meta: ReportMeta = {
    snapshotId: snapshot.snapshotId,
    engineVersion: ENGINE_VERSION,
    fixedNow: FIXED_NOW,
    evaluatedAt: new Date().toISOString(),
  };

  // 4. Output reports
  printTerminalReport(gateResult, meta);
  writeReports(gateResult, meta);

  return gateResult.passed;
}

// Run CLI when invoked directly
if (import.meta.url.startsWith("file:") && process.argv[1]?.includes("eval/run")) {
  runEvalSuite().then((passed) => {
    process.exit(passed ? 0 : 1);
  }).catch((err) => {
    console.error("Eval suite fatal error:", err);
    process.exit(1);
  });
}
