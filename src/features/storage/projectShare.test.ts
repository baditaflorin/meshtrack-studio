import { describe, expect, it } from "vitest";
import { createDefaultProject } from "../studio/project";
import {
  buildProjectShareUrl,
  clearSharedProjectHash,
  readSharedProjectFromUrl,
} from "./projectShare";

describe("project share urls", () => {
  it("round-trips a project through a share url", () => {
    const project = createDefaultProject();
    const shareUrl = buildProjectShareUrl(
      project,
      "https://baditaflorin.github.io/meshtrack-studio/",
    );
    const result = readSharedProjectFromUrl(shareUrl);

    expect(result?.ok).toBe(true);
    if (!result || !result.ok) {
      return;
    }

    expect(result.project.title).toBe(project.title);
    expect(result.project.masterFx).toEqual(project.masterFx);
    expect(result.project.tracks).toHaveLength(project.tracks.length);
  });

  it("clears the project hash without touching the path", () => {
    const cleared = clearSharedProjectHash(
      "https://baditaflorin.github.io/meshtrack-studio/#project=abc123",
    );

    expect(cleared).toBe("https://baditaflorin.github.io/meshtrack-studio/");
  });
});
