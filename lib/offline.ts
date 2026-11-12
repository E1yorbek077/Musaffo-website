import { useSyncExternalStore } from "react";

/**
 * Offline and install state for the whole site.
 * The service worker itself is generated at build time (scripts/build-sw.mjs).
 */

type BeforeInstallPrompt = Event & {
  prompt: () => Promise<unknown>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type OfflineState = {
  supported: boolean;
  canInstall: boolean;
  ios: boolean;
  standalone: boolean;
  phase: "idle" | "saving" | "saved" | "failed";
  done: number;
  total: number;
  bytes: number | null;
};

type Manifest = { version: string; cache: string; bytes: number; files: string[] };

const SAVED_FLAG = "musaffo-offline-version";
const SERVER_STATE: OfflineState = { supported: false, canInstall: false, ios: false, standalone: false, phase: "idle", done: 0, total: 0, bytes: null };

let state = SERVER_STATE;
let installEvent: BeforeInstallPrompt | null = null;
let manifest: Manifest | null = null;
let started = false;
const listeners = new Set<() => void>();

function update(patch: Partial<OfflineState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

const readFlag = () => {
  try {
    return window.localStorage.getItem(SAVED_FLAG);
  } catch {
    return null;
  }
};
const writeFlag = (version: string) => {
  try {
    window.localStorage.setItem(SAVED_FLAG, version);
  } catch {
    // Without storage the catalog is still saved; only the "saved" badge is lost on reload.
  }
};
const dataSaverOn = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

/** Downloads every page and pack image into the worker's cache. Files already saved are skipped, so it can resume. */
export async function saveCatalog() {
  if (state.phase === "saving") return;
  update({ phase: "saving", done: 0 });
  try {
    if (!manifest) manifest = (await (await fetch("/offline-manifest.json", { cache: "no-store" })).json()) as Manifest;
    const { files, cache: cacheName, version } = manifest;
    update({ total: files.length, bytes: manifest.bytes });
    const cache = await caches.open(cacheName);
    let next = 0;
    let done = 0;
    let failed = 0;
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        while (next < files.length) {
          const url = files[next++];
          try {
            if (!(await cache.match(url))) {
              const response = await fetch(url);
              if (!response.ok) throw new Error(String(response.status));
              await cache.put(url, response);
            }
          } catch {
            failed++;
          }
          update({ done: ++done });
        }
      }),
    );
    if (failed > 0) {
      update({ phase: "failed" });
      return;
    }
    writeFlag(version);
    update({ phase: "saved" });
    // Ask the browser not to clear the catalog when storage runs low.
    void navigator.storage?.persist?.();
  } catch {
    update({ phase: "failed" });
  }
}

export async function promptInstall() {
  if (!installEvent) return;
  const event = installEvent;
  await event.prompt();
  const { outcome } = await event.userChoice;
  installEvent = null;
  update({ canInstall: false });
  // Installing is a clear yes to having the catalog on the phone.
  if (outcome === "accepted") void saveCatalog();
}

/** Runs once per page load. Production only: a worker would get in the way of `next dev`. */
export function startOffline() {
  if (started || process.env.NODE_ENV !== "production") return;
  started = true;
  if (!("serviceWorker" in navigator) || !("caches" in window)) return;

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  update({ supported: true, standalone, ios: /iPad|iPhone|iPod/.test(navigator.userAgent) });

  const register = () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
    void navigator.serviceWorker.ready.then((registration) => {
      const urls = [
        window.location.pathname,
        ...performance
          .getEntriesByType("resource")
          .map((entry) => new URL(entry.name))
          .filter((url) => url.origin === window.location.origin && /^\/(_next\/static|products|brand)\//.test(url.pathname))
          .map((url) => url.pathname),
      ];
      registration.active?.postMessage({ type: "cache-visited", urls });
    });
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });

  void (async () => {
    const flag = readFlag();
    try {
      manifest = (await (await fetch("/offline-manifest.json", { cache: "no-store" })).json()) as Manifest;
    } catch {
      if (flag) update({ phase: "saved" });
      return;
    }
    update({ bytes: manifest.bytes, total: manifest.files.length });
    if (flag === manifest.version) update({ phase: "saved" });
    // Someone who saved before gets the new version; so does an installed app. Others are only ever asked.
    else if ((flag || standalone) && !dataSaverOn()) void saveCatalog();
  })();
}

if (typeof window !== "undefined") {
  // Module scope, because the browser can fire this before React has finished starting.
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installEvent = event as BeforeInstallPrompt;
    update({ canInstall: true });
  });
  window.addEventListener("appinstalled", () => {
    installEvent = null;
    update({ canInstall: false });
  });
}

export function useOfflineState(): OfflineState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => SERVER_STATE,
  );
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    (listener) => {
      window.addEventListener("online", listener);
      window.addEventListener("offline", listener);
      return () => {
        window.removeEventListener("online", listener);
        window.removeEventListener("offline", listener);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}
