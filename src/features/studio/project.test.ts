import { describe, expect, it } from "vitest";
import {
  STEP_COUNT,
  clearPattern,
  createDefaultProject,
  projectSchema,
  randomizePattern,
  setProjectBpm,
  setTrackVolume,
  toggleStep,
} from "./project";

describe("studio project model", () => {
  it("creates a valid default project with four tracks", () => {
    const project = createDefaultProject();

    expect(projectSchema.safeParse(project).success).toBe(true);
    expect(project.tracks).toHaveLength(4);
    expect(
      project.tracks.every((track) => track.pattern.length === STEP_COUNT),
    ).toBe(true);
  });

  it("toggles a step without mutating the original project", () => {
    const project = createDefaultProject();
    const track = project.tracks[0];
    const originalValue = track.pattern[1];

    const nextProject = toggleStep(project, track.id, 1);

    expect(nextProject.tracks[0].pattern[1]).toBe(!originalValue);
    expect(project.tracks[0].pattern[1]).toBe(originalValue);
  });

  it("clamps tempo and track volume to supported ranges", () => {
    const project = createDefaultProject();
    const track = project.tracks[0];

    expect(setProjectBpm(project, 260).bpm).toBe(180);
    expect(setProjectBpm(project, 20).bpm).toBe(60);
    expect(setTrackVolume(project, track.id, 20).tracks[0].volume).toBe(6);
    expect(setTrackVolume(project, track.id, -99).tracks[0].volume).toBe(-48);
  });

  it("clears and randomizes pattern data", () => {
    const project = createDefaultProject();
    const cleared = clearPattern(project);
    const randomized = randomizePattern(cleared);

    expect(
      cleared.tracks.flatMap((track) => track.pattern).every((step) => !step),
    ).toBe(true);
    expect(
      randomized.tracks.every((track) => track.pattern.length === STEP_COUNT),
    ).toBe(true);
  });
});
