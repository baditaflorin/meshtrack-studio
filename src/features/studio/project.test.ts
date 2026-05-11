import { describe, expect, it } from "vitest";
import {
  STEP_COUNT,
  clearPattern,
  createDefaultProject,
  createTemplateProject,
  projectSchema,
  randomizePattern,
  setMasterFxFilterType,
  setMasterFxReverb,
  setProjectBpm,
  setTrackVolume,
  templateKinds,
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

  it("stores master fx settings in project state", () => {
    const project = createDefaultProject();
    const updated = setMasterFxFilterType(
      setMasterFxReverb(project, 0.42),
      "bandpass",
    );

    expect(updated.masterFx.reverbWet).toBe(0.42);
    expect(updated.masterFx.filterType).toBe("bandpass");
    expect(projectSchema.safeParse(updated).success).toBe(true);
  });

  it("ships every template as a valid project with four 16-step tracks", () => {
    for (const kind of templateKinds) {
      const project = createTemplateProject(kind);
      expect(projectSchema.safeParse(project).success).toBe(true);
      expect(project.tracks).toHaveLength(4);
      expect(
        project.tracks.every((track) => track.pattern.length === STEP_COUNT),
      ).toBe(true);
    }
  });

  it("gives each non-default template a genre-appropriate BPM and scale", () => {
    const lofi = createTemplateProject("lofi");
    expect(lofi.bpm).toBeLessThan(100);
    expect(lofi.scaleMode).toBe("minor");

    const techno = createTemplateProject("techno");
    expect(techno.bpm).toBeGreaterThan(120);
    // Techno template should have a four-on-the-floor kick: hits on 1, 5, 9, 13.
    const kick = techno.tracks[0];
    expect(kick.pattern[0]).toBe(true);
    expect(kick.pattern[4]).toBe(true);
    expect(kick.pattern[8]).toBe(true);
    expect(kick.pattern[12]).toBe(true);

    const dnb = createTemplateProject("drum-and-bass");
    expect(dnb.bpm).toBeGreaterThan(160);
    expect(dnb.bpm).toBeLessThan(190);

    const ambient = createTemplateProject("ambient");
    expect(ambient.bpm).toBeLessThan(70);
  });

  it("stamps the source template in provenance for non-default templates", () => {
    const lofi = createTemplateProject("lofi");
    expect(lofi.provenance?.sourceKind).toBe("local-template:lofi");
    const def = createTemplateProject("default");
    expect(def.provenance?.sourceKind).toBe("local-default-project");
  });
});
