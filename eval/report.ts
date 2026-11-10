import * as fs from "node:fs";
import * as path from "node:path";
import type { GateResult } from "./gate";

export interface ReportMeta {
  snapshotId: string;
  engineVersion: string;
  fixedNow: string;
  evaluatedAt: string;
}

/**
 * Formats markdown report string as specified in Spec §12.6.
 */
export function formatMarkdownReport(gate: GateResult, meta: ReportMeta): string {
  const lines: string[] = [];

  lines.push("# Bull v0 — Golden Set Evaluation & Ship Gate Report");
  lines.push("");
  lines.push(`- **Snapshot ID:** \`${meta.snapshotId}\``);
  lines.push(`- **Engine Version:** \`${meta.engineVersion}\``);
  lines.push(`- **Evaluation Timestamp (\`now\`):** \`${meta.fixedNow}\``);
  lines.push(`- **Generated At:** \`${meta.evaluatedAt}\``);
  lines.push(`- **Gate Status:** **${gate.passed ? "PASSED (READY TO SHIP)" : "FAILED"}**`);
  lines.push(`- **Zero-Regression Guarantee:** ${gate.regressionsCount === 0 ? "MET (0 regressions)" : `VIOLATED (${gate.regressionsCount} regressions)`}`);
  lines.push("");
  lines.push("## Summary Scorecard");
  lines.push("");
  lines.push(`| Metric | Value | Gate Threshold | Status |`);
  lines.push(`|---|---|---|---|`);
  lines.push(`| **Total Cases** | ${gate.totalCases} | 10 | PASS |`);
  lines.push(`| **Passed Cases** | ${gate.passedCases} / ${gate.totalCases} | 100% | ${gate.passedCases === gate.totalCases ? "PASS" : "FAIL"} |`);
  lines.push(`| **Criterion 1 (Grounded & Current)** | ${gate.criterion1Passed ? "10/10 PASS" : "FAIL"} | 100% Pass | ${gate.criterion1Passed ? "PASS" : "FAIL"} |`);
  lines.push(`| **Criterion 2 (Clear & Grounded Rationale)** | Average: ${gate.criterion2Average.toFixed(2)}/2.0 | >= 1.50 | ${gate.criterion2Passed ? "PASS" : "FAIL"} |`);
  lines.push(`| **Criterion 3 (Safe & In-bounds)** | ${gate.criterion3Passed ? "10/10 PASS" : "FAIL"} | 100% Pass | ${gate.criterion3Passed ? "PASS" : "FAIL"} |`);
  lines.push(`| **Safety Choke Point Violations** | ${gate.totalSafetyViolations} | 0 | ${gate.totalSafetyViolations === 0 ? "PASS" : "FAIL"} |`);
  lines.push("");
  lines.push("## Case-by-Case Audit");
  lines.push("");
  lines.push(`| Case | Type | Expected Route | Actual Route | Crit 1 (Grounded) | Crit 2 (Score) | Crit 3 (Safety) | Status |`);
  lines.push(`|---|---|---|---|---|---|---|---|`);

  for (const r of gate.results) {
    const expRoute = Array.isArray(r.expectedRoute) ? r.expectedRoute.join(" / ") : r.expectedRoute;
    const status = r.passed ? "PASS" : "FAIL";
    lines.push(
      `| **${r.caseId}** | \`${r.type}\` | \`${expRoute}\` | \`${r.actualRoute}\` | ${r.criterion1.toUpperCase()} | ${r.criterion2Score.toFixed(1)}/2.0 | ${r.criterion3.toUpperCase()} | **${status}** |`,
    );
  }

  lines.push("");
  lines.push("## Case Query Details & Notes");
  lines.push("");

  for (const r of gate.results) {
    lines.push(`### Case ${r.caseId} (${r.type.toUpperCase()})`);
    lines.push(`- **Query:** "${r.query}"`);
    lines.push(`- **Route:** Expected \`${Array.isArray(r.expectedRoute) ? r.expectedRoute.join(" | ") : r.expectedRoute}\`, Got \`${r.actualRoute}\` (${r.routeMatched ? "MATCHED" : "MISMATCH"})`);
    lines.push(`- **Notes:** ${r.notes}`);

    if (r.safetyViolations.length > 0) {
      lines.push(`- **Safety Violations:**`);
      for (const v of r.safetyViolations) {
        lines.push(`  - \`${v}\``);
      }
    } else {
      lines.push(`- **Safety Violations:** None (0 violations)`);
    }

    if (r.untracedTokens.length > 0) {
      lines.push(`- **Untraced Numeric Tokens:**`);
      for (const t of r.untracedTokens) {
        lines.push(`  - \`${t}\``);
      }
    }

    lines.push("");
  }

  lines.push("## Ship Gate Verdict");
  lines.push("");
  if (gate.passed) {
    lines.push("> [!NOTE]");
    lines.push("> **SHIP GATE PASSED:** All 10 golden test cases passed every deterministic machine assertion with zero safety violations and zero regressions. Meets Spec §12 rubric and ship requirements.");
  } else {
    lines.push("> [!CAUTION]");
    lines.push(`> **SHIP GATE FAILED:** ${gate.failedCases} cases failed validation: [${gate.failingCaseIds.join(", ")}].`);
  }
  lines.push("");

  return lines.join("\n");
}

/**
 * Prints formatted color report to stdout.
 */
export function printTerminalReport(gate: GateResult, meta: ReportMeta): void {
  const RESET = "\x1b[0m";
  const BOLD = "\x1b[1m";
  const GREEN = "\x1b[32m";
  const RED = "\x1b[31m";
  const CYAN = "\x1b[36m";
  const DIM = "\x1b[2m";

  console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${CYAN}  BULL v0 — GOLDEN SET EVALUATION & SHIP GATE HARNESS (§12)                   ${RESET}`);
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${DIM}Snapshot: ${meta.snapshotId} | Engine: v${meta.engineVersion} | Fixed Now: ${meta.fixedNow}${RESET}\n`);

  console.log(`${BOLD}┌──────┬─────────────┬──────────────────────────┬──────────────────────────┬────────┬────────┐${RESET}`);
  console.log(`${BOLD}│ Case │ Type        │ Expected Route           │ Actual Route             │ Crit 1 │ Result │${RESET}`);
  console.log(`${BOLD}├──────┼─────────────┼──────────────────────────┼──────────────────────────┼────────┼────────┤${RESET}`);

  for (const r of gate.results) {
    const caseId = r.caseId.padEnd(4);
    const type = r.type.padEnd(11);
    const expRaw = Array.isArray(r.expectedRoute) ? r.expectedRoute.join("|") : r.expectedRoute;
    const expRoute = expRaw.slice(0, 24).padEnd(24);
    const actRoute = r.actualRoute.slice(0, 24).padEnd(24);
    const c1 = r.criterion1 === "pass" ? `${GREEN}PASS${RESET}  ` : `${RED}FAIL${RESET}  `;
    const res = r.passed ? `${GREEN}${BOLD}PASS${RESET}` : `${RED}${BOLD}FAIL${RESET}`;

    console.log(`│ ${BOLD}${caseId}${RESET} │ ${type} │ ${expRoute} │ ${actRoute} │ ${c1} │ ${res}   │`);
  }

  console.log(`${BOLD}└──────┴─────────────┴──────────────────────────┴──────────────────────────┴────────┴────────┘${RESET}\n`);

  console.log(`${BOLD}Evaluation Metrics:${RESET}`);
  console.log(` • Total Cases:            ${BOLD}${gate.totalCases}${RESET}`);
  console.log(` • Passing Cases:          ${gate.passedCases === gate.totalCases ? GREEN : RED}${BOLD}${gate.passedCases} / ${gate.totalCases}${RESET}`);
  console.log(` • Criterion 1 (Grounded): ${gate.criterion1Passed ? GREEN : RED}${BOLD}${gate.criterion1Passed ? "10/10 PASS" : "FAIL"}${RESET}`);
  console.log(` • Criterion 2 (Human):    ${gate.criterion2Passed ? GREEN : RED}${BOLD}${gate.criterion2Average.toFixed(2)} / 2.00 (Anchor: >= 1.5)${RESET}`);
  console.log(` • Criterion 3 (Safe):     ${gate.criterion3Passed ? GREEN : RED}${BOLD}${gate.criterion3Passed ? "10/10 PASS" : "FAIL"}${RESET}`);
  console.log(` • Safety Violations:      ${gate.totalSafetyViolations === 0 ? GREEN : RED}${BOLD}${gate.totalSafetyViolations}${RESET}`);
  console.log(` • Total Regressions:      ${gate.regressionsCount === 0 ? GREEN : RED}${BOLD}${gate.regressionsCount}${RESET}\n`);

  if (gate.passed) {
    console.log(`${BOLD}${GREEN}✔ SHIP GATE PASSED — 100% Deterministic Verification Clean (0 Regressions)${RESET}\n`);
  } else {
    console.log(`${BOLD}${RED}✖ SHIP GATE FAILED — Failing Cases: ${gate.failingCaseIds.join(", ")}${RESET}\n`);
  }
}

/**
 * Writes markdown report to eval/results/<snapshotId>/report.md and docs/eval-report.md
 */
export function writeReports(gate: GateResult, meta: ReportMeta): void {
  const mdContent = formatMarkdownReport(gate, meta);

  // 1. eval/results/<snapshotId>/report.md
  const resultsDir = path.resolve(process.cwd(), "eval", "results", meta.snapshotId);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(resultsDir, "report.md"), mdContent, "utf-8");

  // 2. docs/eval-report.md
  const docsDir = path.resolve(process.cwd(), "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(docsDir, "eval-report.md"), mdContent, "utf-8");
}
