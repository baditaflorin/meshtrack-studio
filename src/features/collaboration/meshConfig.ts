/**
 * Self-hosted WebRTC mesh configuration.
 *
 *  signaling-server:   wss://turn.0docker.com/ws
 *  turn-token-server:  https://turn.0docker.com/credentials (HMAC, 1h TTL)
 *  coturn relay:       turn:turn.0docker.com:3479
 *
 * Background:
 *  • https://github.com/baditaflorin/signaling-server
 *  • https://github.com/baditaflorin/turn-token-server
 *  • https://github.com/baditaflorin/coturn-hetzner
 *
 * The y-webrtc default `wss://signaling.yjs.dev` is a dead Heroku app whose
 * DNS no longer resolves. `wss://y-webrtc-eu.fly.dev` is alive but rate-limited
 * and shared with the whole y-webrtc community. Either way, the recommended
 * pattern is to self-host. We provide `turn.0docker.com` as a default; override
 * with VITE_WEBRTC_SIGNALING / VITE_TURN_TOKEN_URL at build time, or with
 * localStorage at runtime.
 */

const DEFAULT_SIGNALING_URL = "wss://turn.0docker.com/ws";
const DEFAULT_TURN_TOKEN_URL = "https://turn.0docker.com/credentials";

const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// Old library defaults that we auto-clear from localStorage on first encounter.
const DEAD_SIGNALING_URLS = new Set([
  "wss://signaling.yjs.dev",
  "ws://signaling.yjs.dev",
  "wss://y-webrtc-signaling-eu.herokuapp.com",
]);

const SIGNALING_KEY = "mesh:signalingUrl";
const TOKEN_URL_KEY = "mesh:turnTokenUrl";
const ICE_KEY       = "mesh:iceServers";

export type IceServer = {
  urls: string;
  username?: string;
  credential?: string;
};

type TurnCredentialResponse = {
  username: string;
  password: string;
  ttl: number;
  uris: string[];
};

export function loadSignalingUrls(): string[] {
  if (typeof localStorage === "undefined") return [DEFAULT_SIGNALING_URL];
  const stored = localStorage.getItem(SIGNALING_KEY) ?? "";
  if (stored && DEAD_SIGNALING_URLS.has(stored)) {
    localStorage.removeItem(SIGNALING_KEY);
  } else if (stored) {
    return [stored];
  }
  const envUrl =
    (import.meta.env?.VITE_WEBRTC_SIGNALING as string | undefined) ??
    DEFAULT_SIGNALING_URL;
  return [envUrl];
}

function loadTurnTokenUrl(): string {
  if (typeof localStorage === "undefined") return DEFAULT_TURN_TOKEN_URL;
  return (
    localStorage.getItem(TOKEN_URL_KEY) ??
    (import.meta.env?.VITE_TURN_TOKEN_URL as string | undefined) ??
    DEFAULT_TURN_TOKEN_URL
  );
}

export function loadCachedIceServers(): IceServer[] {
  if (typeof localStorage === "undefined") return STUN_SERVERS;
  try {
    const raw = localStorage.getItem(ICE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as IceServer[];
    }
  } catch {
    // ignore parse errors
  }
  return STUN_SERVERS;
}

/**
 * Fetches fresh time-limited TURN credentials from the token server and
 * persists the resulting ICE-server list to localStorage. Silently falls back
 * to whatever is already cached on any error — the caller can still try to
 * connect with stale credentials or STUN-only.
 */
export async function refreshTurnCredentials(): Promise<IceServer[]> {
  const tokenUrl = loadTurnTokenUrl();
  if (!tokenUrl) return loadCachedIceServers();
  try {
    const res = await fetch(tokenUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cred = (await res.json()) as TurnCredentialResponse;
    if (!Array.isArray(cred.uris) || cred.uris.length === 0) {
      throw new Error("token server returned no TURN URIs");
    }
    const servers: IceServer[] = [
      ...STUN_SERVERS,
      ...cred.uris.map((u) => ({
        urls: u,
        username: cred.username,
        credential: cred.password,
      })),
    ];
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ICE_KEY, JSON.stringify(servers));
    }
    return servers;
  } catch (err) {
    console.warn("[mesh] TURN credential fetch failed, using cached servers:", err);
    return loadCachedIceServers();
  }
}
