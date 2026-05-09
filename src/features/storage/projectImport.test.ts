import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  type ConfidenceLevel,
  CANONICAL_SCHEMA_VERSION,
} from "../studio/project";
import { exportProject } from "./projectStorage";
import { importProjectBytes } from "./projectImport";

const fixturesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../test/fixtures/realdata",
);

type ExpectedFixture = {
  shouldImport: boolean;
  minConfidence?: ConfidenceLevel;
  title?: string;
  bpm?: number;
  trackCount?: number;
  issueCodes?: string[];
  errorCode?: string;
};

describe("real-data import fixtures", () => {
  const fixtureNames = readdirSync(fixturesDir)
    .filter((name: string) => !name.endsWith(".expected.json"))
    .sort();

  for (const fixtureName of fixtureNames) {
    it(`handles ${fixtureName}`, () => {
      const fixtureBytes = readFileSync(path.join(fixturesDir, fixtureName));
      const expected = JSON.parse(
        readFileSync(
          path.join(
            fixturesDir,
            fixtureName.replace(/\.[^.]+$/, ".expected.json"),
          ),
          "utf8",
        ),
      ) as ExpectedFixture;

      const result = importProjectBytes(fixtureBytes, "fixture");

      if (!expected.shouldImport) {
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.code).toBe(expected.errorCode);
        }
        return;
      }

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      expect(result.project.schemaVersion).toBe(CANONICAL_SCHEMA_VERSION);
      expect(result.project.title).toBe(expected.title);
      expect(result.project.bpm).toBe(expected.bpm);
      expect(result.project.tracks).toHaveLength(expected.trackCount ?? 0);
      expect(result.project.importAnalysis?.confidence).toSatisfy(
        (confidence: ConfidenceLevel) =>
          compareConfidence(confidence, expected.minConfidence ?? "high") >= 0,
      );
      expect(
        result.project.importAnalysis?.issues.map((issue) => issue.code),
      ).toEqual(expect.arrayContaining(expected.issueCodes ?? []));

      const trackIds = result.project.tracks.map((track) => track.id);
      expect(new Set(trackIds).size).toBe(trackIds.length);

      const firstExport = exportProject(result.project);
      const secondExport = exportProject(result.project);
      expect(firstExport).toBe(secondExport);

      const roundTrip = importProjectBytes(
        new TextEncoder().encode(firstExport),
        "fixture",
      );
      expect(roundTrip.ok).toBe(true);
      if (roundTrip.ok) {
        expect(exportProject(roundTrip.project)).toBe(firstExport);
      }
    });
  }
});

function compareConfidence(
  actual: ConfidenceLevel,
  expectedMinimum: ConfidenceLevel,
): number {
  const order = ["low", "medium", "high"];
  return order.indexOf(actual) - order.indexOf(expectedMinimum);
}
