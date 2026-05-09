import { performance } from "node:perf_hooks";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportProject } from "../src/features/storage/projectStorage";
import { importProjectBytes } from "../src/features/storage/projectImport";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const fixturesDir = path.join(rootDir, "test/fixtures/realdata");

const fixtureNames = readdirSync(fixturesDir)
  .filter((name) => !name.endsWith(".expected.json"))
  .sort();

const samples = fixtureNames.map((fixtureName) => {
  const bytes = readFileSync(path.join(fixturesDir, fixtureName));
  const startedAt = performance.now();
  const result = importProjectBytes(bytes, "fixture");
  const importMs = performance.now() - startedAt;

  let exportMs = 0;
  let trackCount = 0;
  if (result.ok) {
    trackCount = result.project.tracks.length;
    const exportStartedAt = performance.now();
    exportProject(result.project);
    exportMs = performance.now() - exportStartedAt;
  }

  return {
    fixtureName,
    ok: result.ok,
    importMs,
    exportMs,
    trackCount,
  };
});

const importTimes = samples
  .map((sample) => sample.importMs)
  .sort((left, right) => left - right);
const exportTimes = samples
  .filter((sample) => sample.ok)
  .map((sample) => sample.exportMs)
  .sort((left, right) => left - right);

console.log("# Phase 2 Import Performance");
console.log("");
console.log("| Fixture | Import ms | Export ms | Tracks | Result |");
console.log("| --- | ---: | ---: | ---: | --- |");
for (const sample of samples) {
  console.log(
    `| ${sample.fixtureName} | ${sample.importMs.toFixed(2)} | ${sample.ok ? sample.exportMs.toFixed(2) : "-"} | ${sample.trackCount} | ${sample.ok ? "ok" : "failed"} |`,
  );
}
console.log("");
console.log(`Median import ms: ${median(importTimes).toFixed(2)}`);
console.log(`Worst import ms: ${Math.max(...importTimes).toFixed(2)}`);
console.log(`Median export ms: ${median(exportTimes).toFixed(2)}`);
console.log(`Worst export ms: ${Math.max(...exportTimes).toFixed(2)}`);

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const middle = Math.floor(values.length / 2);
  if (values.length % 2 === 1) {
    return values[middle];
  }

  return (values[middle - 1] + values[middle]) / 2;
}
