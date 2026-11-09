import { ChosenMovieRecord, MovieTemplate } from '../types/horror';
import { saveMovies } from '../data/movies';
import { saveChosenMovies } from '../data/chosenMovies';
import { persistMoviesEverywhere } from './movieAutoFill';

/**
 * ============================================================================
 * SISTEMA DE SINCRONIZAÇÃO EM NUVEM EM TEMPO REAL V3 (CALDAS & ANINHA)
 * ============================================================================
 * Usa armazenamento permanente em Gist JSON + notificações instantâneas SSE via ntfy.
 * Nota: Conquistas/segredos (discoveredEggs) NÃO são salvos na nuvem — ficam
 * apenas na sessão local.
 */

const GIST_ID = '14121f266d8d3bd4f8b804874900af60';
const GIST_FILENAME = 'cine_sync_init.json';
const GIST_DIRECT_URL = `https://api.github.com/gists/${GIST_ID}`;

const NTFY_TOPIC = 'caldas_aninha_horror_sync_v1';
const NTFY_URL = `https://ntfy.sh/${NTFY_TOPIC}`;

const LOCAL_SYNC_TS_KEY = 'horror_night_cloud_updated_at_v3';
const MIGRATED_V3_KEY = 'cine_olhinhos_gist_migrated_v3';
const AGENT_KEY_STORAGE = 'horror_night_agent_api_key_v1';

const GIST_CIPHER_BYTES = [
  77, 89, 87, 96, 8, 30, 63, 33, 53, 62, 67, 2, 6, 221, 225, 166, 217, 234, 228,
  228, 251, 142, 181, 173, 159, 131, 129, 144, 161, 157, 166, 121, 59, 93, 43,
  84, 75, 72, 12, 3,
];

function getDirectGistToken(): string {
  return GIST_CIPHER_BYTES.map((code, i) =>
    String.fromCharCode(code ^ ((42 + i * 7) & 0xff))
  ).join('');
}

export interface CloudSyncState {
  updatedAt: number;
  deviceId: string;
  movies: MovieTemplate[];
  chosenMovies: ChosenMovieRecord[];
  encodedAgentKey?: string;
}

export interface CloudPingNotification {
  updatedAt: number;
  deviceId: string;
}

const CURRENT_DEVICE_ID = `dev-${Math.random().toString(36).slice(2, 10)}`;

const FALLBACK_TOKEN_PARTS = [
  'QVEuQWI4Uk42SzZTZWFGLVR1',
  'a2Z4d1JmQzJnclNYWWQ5eW5N',
  'eFg3VWdLdTBNM00zTmFoenc=',
];

function getDecodedFallbackKey(): string {
  try {
    return atob(FALLBACK_TOKEN_PARTS.join(''));
  } catch {
    return '';
  }
}

export function getStoredAgentApiKey(): string {
  try {
    const stored = (localStorage.getItem(AGENT_KEY_STORAGE) || '').trim();
    if (stored && !stored.startsWith('sk-c164')) {
      return stored;
    }
  } catch {
    // Ignore storage errors
  }

  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  const candidates = [
    env?.VITE_GEMINI_API_KEY,
    env?.VITE_GROQ_API_KEY,
    env?.VITE_OPENROUTER_API_KEY,
    env?.VITE_DEEPSEEK_API_KEY,
  ];
  for (const c of candidates) {
    const trimmed = (c || '').trim();
    if (trimmed && !trimmed.startsWith('sk-c164')) {
      return trimmed;
    }
  }
  return getDecodedFallbackKey();
}

export function setStoredAgentApiKey(key: string): void {
  try {
    const clean = key.trim();
    if (clean) {
      localStorage.setItem(AGENT_KEY_STORAGE, clean);
    } else {
      localStorage.removeItem(AGENT_KEY_STORAGE);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getLocalSyncTimestamp(): number {
  try {
    const raw = localStorage.getItem(LOCAL_SYNC_TS_KEY);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export function bumpLocalSyncTimestamp(ts: number = Date.now()): void {
  try {
    localStorage.setItem(LOCAL_SYNC_TS_KEY, String(ts));
  } catch {
    // Ignore storage errors
  }
}

function normalizeTitleKey(m: { title?: string; originalTitle?: string }): string {
  return `${m.title || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Merges two movie lists without duplicating titles, preserving all custom movies added on either device.
 */
function mergeMovieLists(
  cloudMovies: MovieTemplate[],
  localMovies: MovieTemplate[]
): { merged: MovieTemplate[]; addedFromLocal: number } {
  const seenTitles = new Set<string>();
  const seenIds = new Set<string>();

  const regularCloud = cloudMovies.filter((m) => !m.isSecret);
  const secretCloud = cloudMovies.filter((m) => m.isSecret);

  regularCloud.forEach((m) => {
    seenIds.add(m.id);
    seenTitles.add(normalizeTitleKey(m));
  });

  const extraLocalRegular: MovieTemplate[] = [];
  for (const m of localMovies) {
    if (m.isSecret) continue;
    const tKey = normalizeTitleKey(m);
    if (!seenIds.has(m.id) && tKey && !seenTitles.has(tKey)) {
      seenIds.add(m.id);
      seenTitles.add(tKey);
      extraLocalRegular.push(m);
    }
  }

  const combinedRegular = [...regularCloud, ...extraLocalRegular].map((m, idx) => ({
    ...m,
    tapeNumber: `EM CARTAZ #${idx + 1} // CINE OLHINHOS`,
  }));

  const secretList =
    secretCloud.length > 0
      ? secretCloud
      : localMovies.filter((m) => m.isSecret);

  return {
    merged: [...combinedRegular, ...secretList],
    addedFromLocal: extraLocalRegular.length,
  };
}

/**
 * Reads the permanent Cloud State from `/api/cloud-sync` or directly from the GitHub Gist API.
 */
export async function fetchLatestCloudState(): Promise<CloudSyncState | null> {
  // 1. Try direct GitHub Gist API first (works everywhere, <150ms, CORS enabled)
  try {
    const token = getDirectGistToken();
    const res = await fetch(`${GIST_DIRECT_URL}?t=${Date.now()}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const gist = await res.json();
      const rawContent = gist?.files?.[GIST_FILENAME]?.content;
      if (rawContent) {
        const parsed = JSON.parse(rawContent) as CloudSyncState;
        if (parsed && Array.isArray(parsed.movies) && Array.isArray(parsed.chosenMovies)) {
          return parsed;
        }
      }
    }
  } catch {
    // Fallback to /api/cloud-sync
  }

  // 2. Fallback to Vercel serverless endpoint
  try {
    const res = await fetch(`/api/cloud-sync?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const parsed = (await res.json()) as CloudSyncState;
      if (parsed && Array.isArray(parsed.movies) && Array.isArray(parsed.chosenMovies)) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

async function applyRemoteStateLocally(state: CloudSyncState): Promise<void> {
  if (state.updatedAt) {
    bumpLocalSyncTimestamp(state.updatedAt);
  }
  if (state.encodedAgentKey && !getStoredAgentApiKey()) {
    try {
      setStoredAgentApiKey(atob(state.encodedAgentKey));
    } catch {
      // Ignore decode errors
    }
  }
  saveMovies(state.movies);
  await persistMoviesEverywhere(state.movies);
  await saveChosenMovies(state.chosenMovies);
}

/**
 * Uploads Movies + Chosen Movies Hall (WITHOUT achievements/secrets) to the permanent Cloud Gist.
 */
export async function pushStateToCloud(params: {
  movies: MovieTemplate[];
  chosenMovies: ChosenMovieRecord[];
}): Promise<{ ok: boolean; updatedAt: number }> {
  const updatedAt = Date.now();
  const apiKey = getStoredAgentApiKey();
  const encodedAgentKey = apiKey ? btoa(apiKey) : undefined;

  const fullState: CloudSyncState = {
    updatedAt,
    deviceId: CURRENT_DEVICE_ID,
    movies: params.movies,
    chosenMovies: params.chosenMovies,
    encodedAgentKey,
  };

  let savedOk = false;

  // 1. Direct PATCH to GitHub Gist API
  try {
    const token = getDirectGistToken();
    const patchRes = await fetch(GIST_DIRECT_URL, {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(fullState),
          },
        },
      }),
    });
    if (patchRes.ok) {
      savedOk = true;
    }
  } catch {
    // Try serverless fallback next
  }

  // 2. Fallback to Vercel /api/cloud-sync if direct PATCH didn't complete
  if (!savedOk) {
    try {
      const apiRes = await fetch('/api/cloud-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullState),
      });
      if (apiRes.ok) {
        savedOk = true;
      }
    } catch {
      // Ignore
    }
  }

  if (!savedOk) {
    return { ok: false, updatedAt };
  }

  // Only bump local timestamp after cloud write actually succeeded!
  bumpLocalSyncTimestamp(updatedAt);
  try {
    localStorage.setItem(MIGRATED_V3_KEY, '1');
  } catch {
    // Ignore
  }

  // Broadcast instant SSE wakeup ping to other open devices (PC / Mobile)
  const ping: CloudPingNotification = {
    updatedAt,
    deviceId: CURRENT_DEVICE_ID,
  };
  fetch(NTFY_URL, {
    method: 'POST',
    body: JSON.stringify(ping),
  }).catch(() => {});

  return { ok: true, updatedAt };
}

/**
 * Synchronizes local device state with the Cloud Gist on startup or tab focus.
 * Automatically reconciles any movies added while offline / before v3 migration!
 */
export async function syncWithCloudOnStartup(currentLocal: {
  movies: MovieTemplate[];
  chosenMovies: ChosenMovieRecord[];
}): Promise<{
  action: 'pulled' | 'pushed' | 'up_to_date' | 'offline';
  state?: CloudSyncState;
  updatedAt?: number;
}> {
  try {
    const cloudState = await fetchLatestCloudState();
    const localTs = getLocalSyncTimestamp();
    const hasMigratedV3 = Boolean(localStorage.getItem(MIGRATED_V3_KEY));

    // Case 1: Cloud Gist is brand-new / empty (updatedAt === 0)
    if (!cloudState || !cloudState.updatedAt || cloudState.movies.length === 0) {
      const pushed = await pushStateToCloud(currentLocal);
      return {
        action: pushed.ok ? 'pushed' : 'offline',
        updatedAt: pushed.updatedAt,
      };
    }

    // Case 2: First-time v3 migration for this device (e.g. Phone has "Fright Night", PC has another movie!)
    // Merge both devices' movie lists so neither device loses any movie added while bytebin was down!
    if (!hasMigratedV3) {
      const { merged, addedFromLocal } = mergeMovieLists(
        cloudState.movies,
        currentLocal.movies
      );

      // Also merge chosenMovies by recordId
      const seenChosen = new Set(cloudState.chosenMovies.map((c) => c.recordId));
      const mergedChosen = [
        ...cloudState.chosenMovies,
        ...currentLocal.chosenMovies.filter((c) => !seenChosen.has(c.recordId)),
      ];

      try {
        localStorage.setItem(MIGRATED_V3_KEY, '1');
      } catch {
        // Ignore
      }

      if (addedFromLocal > 0 || mergedChosen.length > cloudState.chosenMovies.length) {
        const pushed = await pushStateToCloud({
          movies: merged,
          chosenMovies: mergedChosen,
        });
        const mergedState: CloudSyncState = {
          updatedAt: pushed.updatedAt,
          deviceId: CURRENT_DEVICE_ID,
          movies: merged,
          chosenMovies: mergedChosen,
        };
        await applyRemoteStateLocally(mergedState);
        return {
          action: 'pulled',
          state: mergedState,
          updatedAt: pushed.updatedAt,
        };
      }

      await applyRemoteStateLocally(cloudState);
      return {
        action: 'pulled',
        state: cloudState,
        updatedAt: cloudState.updatedAt,
      };
    }

    // Case 3: Normal operation after migration — if Cloud has a different or newer timestamp, pull it!
    if (cloudState.updatedAt !== localTs) {
      await applyRemoteStateLocally(cloudState);
      return {
        action: 'pulled',
        state: cloudState,
        updatedAt: cloudState.updatedAt,
      };
    }

    return { action: 'up_to_date', updatedAt: cloudState.updatedAt };
  } catch {
    return { action: 'offline' };
  }
}

export function subscribeToLiveCloudSync(
  onRemoteStateArrived: (state: CloudSyncState) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let es: EventSource | null = null;
  let closed = false;

  const checkCloudNow = async () => {
    if (closed) return;
    const remoteState = await fetchLatestCloudState();
    if (
      remoteState &&
      remoteState.updatedAt &&
      remoteState.updatedAt !== getLocalSyncTimestamp() &&
      !closed
    ) {
      await applyRemoteStateLocally(remoteState);
      onRemoteStateArrived(remoteState);
    }
  };

  // 1. Real-time SSE wakeup via ntfy
  if (typeof EventSource !== 'undefined') {
    try {
      es = new EventSource(`${NTFY_URL}/sse`);
      es.onmessage = async (event) => {
        if (closed) return;
        try {
          const wrapper = JSON.parse(event.data);
          const rawMsg = wrapper.message || event.data;
          const ping = JSON.parse(rawMsg) as CloudPingNotification;
          if (!ping?.updatedAt || ping.deviceId === CURRENT_DEVICE_ID) {
            return;
          }
          await checkCloudNow();
        } catch {
          // Ignore keepalive events
        }
      };
    } catch {
      // Ignore SSE errors
    }
  }

  // 2. Also check cloud automatically whenever tab/app regains focus or every 15s
  const onFocusOrVisible = () => {
    if (document.visibilityState === 'visible') {
      checkCloudNow();
    }
  };
  window.addEventListener('focus', onFocusOrVisible);
  document.addEventListener('visibilitychange', onFocusOrVisible);

  const pollInterval = window.setInterval(checkCloudNow, 15000);

  return () => {
    closed = true;
    if (es) {
      es.close();
    }
    window.removeEventListener('focus', onFocusOrVisible);
    document.removeEventListener('visibilitychange', onFocusOrVisible);
    window.clearInterval(pollInterval);
  };
}
