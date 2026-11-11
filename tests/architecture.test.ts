import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

function findFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findFiles(full, ext));
    } else if (entry.name.endsWith(ext)) {
      files.push(full);
    }
  }
  return files;
}

describe("engine purity contract", () => {
  it("lib/engine never imports React, Next, fs, fetch, process.env, or lib/llm", () => {
    const files = findFiles(path.resolve("lib/engine"), ".ts");
    const forbidden = ["react", "next/", "node:fs", "node:fetch", "process.env", "lib/llm", "@/lib/llm"];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        expect(content, `${path.basename(file)} imports ${pattern}`).not.toContain(pattern);
      }
    }
  }, 15000);

  it("components never import narrative.ts, metrics.ts, or score.ts directly", () => {
    const files = [...findFiles(path.resolve("components"), ".tsx"), ...findFiles(path.resolve("components"), ".ts")];
    const forbidden = ["narrative", "metrics", "score"];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        const importRegex = new RegExp(`from\\s+['"].*lib/engine/${pattern}['"]`);
        expect(importRegex.test(content), `${path.basename(file)} directly imports ${pattern}`).toBe(false);
      }
    }
  }, 15000);
});
