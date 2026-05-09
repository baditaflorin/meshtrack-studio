import { exportProject, importProjectTextInput } from "./projectStorage";
import type { ImportResult } from "./projectImport";
import type { StudioProject } from "../studio/project";

const PROJECT_HASH_KEY = "project";

export function buildProjectShareUrl(
  project: StudioProject,
  currentHref: string,
): string {
  const url = new URL(currentHref);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  hashParams.set(PROJECT_HASH_KEY, encodeText(exportProject(project)));
  url.hash = hashParams.toString();
  return url.toString();
}

export function readSharedProjectFromUrl(
  currentHref: string,
): ImportResult | null {
  const url = new URL(currentHref);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const encoded = hashParams.get(PROJECT_HASH_KEY);

  if (!encoded) {
    return null;
  }

  try {
    return importProjectTextInput(decodeText(encoded), "share");
  } catch {
    return {
      ok: false,
      code: "invalid-project-shape",
      message: "This shared project link is not readable.",
      why: "The URL hash does not decode into a valid project document.",
      nextStep:
        "Ask for a fresh project link or import the JSON file directly.",
      issues: [],
    };
  }
}

export function clearSharedProjectHash(currentHref: string): string {
  const url = new URL(currentHref);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  hashParams.delete(PROJECT_HASH_KEY);
  url.hash = hashParams.toString();
  return url.toString();
}

function encodeText(value: string): string {
  return toBase64Url(new TextEncoder().encode(value));
}

function decodeText(value: string): string {
  return new TextDecoder().decode(fromBase64Url(value));
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(value.length + ((4 - (value.length % 4 || 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
