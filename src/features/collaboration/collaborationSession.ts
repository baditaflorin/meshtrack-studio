import { cloneProject, type StudioProject } from "../studio/project";
import { importProjectCandidate } from "../storage/projectImport";

type CollaborationStatus = "idle" | "connecting" | "connected" | "error";

export type PeerPresence = {
  clientId: string;
  name: string;
};

export type CollaborationCallbacks = {
  onProject(project: StudioProject): void;
  onPeers(peers: PeerPresence[]): void;
  onStatus(status: CollaborationStatus, message: string): void;
};

type Awareness = {
  setLocalStateField(field: string, value: unknown): void;
  getStates(): Map<number, unknown>;
  on(eventName: "change", callback: () => void): void;
  off(eventName: "change", callback: () => void): void;
};

type Provider = {
  awareness: Awareness;
  destroy(): void;
};

type SharedSnapshot = {
  clientId: string;
  project: StudioProject;
};

const SIGNALING_SERVERS = [
  "wss://y-webrtc-eu.fly.dev",
  "wss://signaling.yjs.dev",
];

export class CollaborationSession {
  private readonly clientId = createClientId();
  private provider: Provider | null = null;
  private doc: import("yjs").Doc | null = null;
  private projectMap: import("yjs").Map<unknown> | null = null;
  private readonly callbacks: CollaborationCallbacks;
  private readonly roomName: string;

  private constructor(roomName: string, callbacks: CollaborationCallbacks) {
    this.roomName = roomName;
    this.callbacks = callbacks;
  }

  static async connect(
    roomName: string,
    project: StudioProject,
    callbacks: CollaborationCallbacks,
  ): Promise<CollaborationSession> {
    const session = new CollaborationSession(roomName, callbacks);
    await session.open(project);
    return session;
  }

  publish(project: StudioProject): void {
    this.projectMap?.set(
      "snapshot",
      JSON.stringify({
        clientId: this.clientId,
        project: cloneProject(project),
      } satisfies SharedSnapshot),
    );
  }

  disconnect(): void {
    if (this.projectMap) {
      this.projectMap.unobserve(this.handleProjectChange);
    }

    this.provider?.awareness.off("change", this.handleAwarenessChange);
    this.provider?.destroy();
    this.doc?.destroy();
    this.provider = null;
    this.doc = null;
    this.projectMap = null;
    this.callbacks.onStatus("idle", "Collaboration stopped.");
    this.callbacks.onPeers([]);
  }

  getRoomName(): string {
    return this.roomName;
  }

  private async open(project: StudioProject): Promise<void> {
    this.callbacks.onStatus("connecting", "Opening WebRTC mesh...");

    const Y = await import("yjs");
    const { WebrtcProvider } = await import("y-webrtc");
    const doc = new Y.Doc();
    const projectMap = doc.getMap<unknown>("studio");
    const provider = new WebrtcProvider(this.roomName, doc, {
      signaling: SIGNALING_SERVERS,
    }) as Provider;

    this.doc = doc;
    this.projectMap = projectMap;
    this.provider = provider;

    provider.awareness.setLocalStateField("peer", {
      clientId: this.clientId,
      name: createPeerName(),
    });

    projectMap.observe(this.handleProjectChange);
    provider.awareness.on("change", this.handleAwarenessChange);

    if (projectMap.has("snapshot")) {
      this.applySnapshot(projectMap.get("snapshot"));
    } else {
      this.publish(project);
    }

    this.handleAwarenessChange();
    this.callbacks.onStatus("connected", `Room "${this.roomName}" is ready.`);
  }

  private readonly handleProjectChange = (): void => {
    this.applySnapshot(this.projectMap?.get("snapshot"));
  };

  private readonly handleAwarenessChange = (): void => {
    const states = this.provider?.awareness.getStates();
    if (!states) {
      this.callbacks.onPeers([]);
      return;
    }

    const peers = Array.from(states.values())
      .map(readPresence)
      .filter((peer): peer is PeerPresence => Boolean(peer))
      .filter((peer) => peer.clientId !== this.clientId);

    this.callbacks.onPeers(peers);
  };

  private applySnapshot(rawSnapshot: unknown): void {
    if (typeof rawSnapshot !== "string") {
      return;
    }

    const parsedSnapshot = safeJsonParse(rawSnapshot);
    if (
      !isSharedSnapshot(parsedSnapshot) ||
      parsedSnapshot.clientId === this.clientId
    ) {
      return;
    }

    const normalized = importProjectCandidate(
      parsedSnapshot.project,
      "collaboration",
    );
    if (!normalized.ok) {
      this.callbacks.onStatus(
        "error",
        `A peer update could not be normalized: ${normalized.message}`,
      );
      return;
    }

    this.callbacks.onProject(normalized.project);
  }
}

function isSharedSnapshot(candidate: unknown): candidate is SharedSnapshot {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  const snapshot = candidate as { clientId?: unknown; project?: unknown };
  return typeof snapshot.clientId === "string";
}

function readPresence(candidate: unknown): PeerPresence | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const state = candidate as { peer?: { clientId?: unknown; name?: unknown } };

  if (
    typeof state.peer?.clientId !== "string" ||
    typeof state.peer.name !== "string"
  ) {
    return null;
  }

  return {
    clientId: state.peer.clientId,
    name: state.peer.name,
  };
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function createClientId(): string {
  if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function createPeerName(): string {
  const suffix = createClientId().slice(0, 4).toUpperCase();
  return `Peer ${suffix}`;
}
