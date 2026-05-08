import { openDB, type DBSchema } from "idb";
import {
  cloneProject,
  safeParseProject,
  type StudioProject,
} from "../studio/project";

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

export async function loadCurrentProject(): Promise<StudioProject | null> {
  if (!supportsIndexedDB()) {
    return null;
  }

  const db = await getDatabase();
  const stored = await db.get(STORE_NAME, CURRENT_PROJECT_KEY);
  return safeParseProject(stored);
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

export function exportProject(project: StudioProject): string {
  return JSON.stringify(cloneProject(project), null, 2);
}

export function importProject(rawJson: string): StudioProject {
  return safeParseProject(JSON.parse(rawJson)) ?? failInvalidProject();
}

function failInvalidProject(): never {
  throw new Error("That file is not a Meshtrack Studio v1 project.");
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
