import { describe, expect, it } from "vitest";
import { importProjectBytes, importProjectText } from "./projectImport";

describe("synthetic import edge cases", () => {
  it("recovers a top-level track array", () => {
    const result = importProjectText(
      JSON.stringify([
        {
          id: "kick",
          name: "Kick",
          type: "drum",
          steps: [1, 0, 0, 1, 1, 0, 0, 1],
        },
      ]),
      "fixture",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.title).toBe("Imported track list");
      expect(
        result.project.importAnalysis?.issues.map((issue) => issue.code),
      ).toContain("wrapped-track-array");
    }
  });

  it("parses string patterns", () => {
    const result = importProjectText(
      JSON.stringify({
        title: "String Pattern",
        tracks: [
          {
            name: "Lead",
            instrument: "lead",
            pattern: "x---x---x---x---",
          },
        ],
      }),
      "fixture",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.tracks[0].pattern.filter(Boolean)).toHaveLength(4);
      expect(
        result.project.importAnalysis?.issues.map((issue) => issue.code),
      ).toContain("parsed-string-pattern");
    }
  });

  it("downsamples 32-step sequences", () => {
    const result = importProjectText(
      JSON.stringify({
        title: "Dense Pattern",
        tracks: [
          {
            name: "Dense Kick",
            instrument: "drum",
            pattern: Array.from({ length: 32 }, (_, index) => index % 2 === 0),
          },
        ],
      }),
      "fixture",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.tracks[0].pattern).toHaveLength(16);
      expect(
        result.project.importAnalysis?.issues.map((issue) => issue.code),
      ).toContain("downsampled-pattern-32-to-16");
    }
  });

  it("decodes a Windows-1252 payload when UTF-8 is not healthy", () => {
    const payload = Buffer.from(
      '{"title":"Caf\xe9 Session","tracks":[{"name":"Kick","instrument":"drum","pattern":[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]}]}',
      "binary",
    );
    const result = importProjectBytes(new Uint8Array(payload), "fixture");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.title).toBe("Café Session");
      expect(
        result.project.importAnalysis?.issues.map((issue) => issue.code),
      ).toContain("decoded-windows-1252");
    }
  });

  it("fails clearly on empty input", () => {
    const result = importProjectText("", "fixture");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("empty-input");
    }
  });
});
