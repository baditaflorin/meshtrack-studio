import { openDB, type DBSchema } from "idb";
import { cloneProject, type StudioProject } from "../studio/project";
import {
  importProjectBytes,
  importProjectCandidate,
  importProjectText,
  type ImportFailure,
  type ImportResult,
} from "./projectImport";

const DB_NAME = "meshtrack-studio";
const DB_VERSION = 1;
const STORE_NAME = "projects";
const CURRENT_PROJECT_KEY = "current";

interface MeshtrackDB extends DBSchema {
  projects: {
    key: string;
    value: unknown;
  };
}

export type LoadProjectResult = {
  project: StudioProject | null;
  recoveryIssue?: ImportFailure;
};

export async function loadCurrentProject(): Promise<LoadProjectResult> {
  if (!supportsIndexedDB()) {
    return { project: null };
  }

  const db = await getDatabase();
  const stored = await db.get(STORE_NAME, CURRENT_PROJECT_KEY);

  if (stored === undefined) {
    return { project: null };
  }

  const imported = importProjectCandidate(stored, "storage");
  if (imported.ok) {
    return { project: imported.project };
  }

  return {
    project: null,
    recoveryIssue: imported,
  };
}

export async function saveCurrentProject(
  project: StudioProject,
): Promise<void> {
  if (!supportsIndexedDB()) {
    return;
  }

  const db = await getDatabase();
  await db.put(STORE_NAME, cloneProject(project), CURRENT_PROJECT_KEY);
}

export async function clearCurrentProject(): Promise<void> {
  if (!supportsIndexedDB()) {
    return;
  }

  const db = await getDatabase();
  await db.delete(STORE_NAME, CURRENT_PROJECT_KEY);
}

export function exportProject(project: StudioProject): string {
  return JSON.stringify(sortJsonValue(cloneProject(project)), null, 2);
}

export function importProject(rawJson: string): StudioProject {
  const result = importProjectText(rawJson, "file");
  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.project;
}

export function importProjectTextInput(
  rawJson: string,
  source: "pasted" | "clipboard" | "share",
): ImportResult {
  return importProjectText(rawJson, source);
}

export async function importProjectFile(file: File): Promise<ImportResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return importProjectBytes(bytes, "file");
}

function supportsIndexedDB(): boolean {
  return typeof indexedDB !== "undefined";
}

function getDatabase() {
  return openDB<MeshtrackDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortJsonValue(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, sortJsonValue(nested)]),
  );
}
