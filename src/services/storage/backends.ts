/**
 * Storage backends. All learner data lives in ONE versioned object under a single key so that
 * the shape can evolve through `migrate()` in services/progress.ts.
 */
export type BackendName = 'indexeddb' | 'localstorage' | 'memory';

export interface StorageBackend {
  name: BackendName;
  load(): Promise<unknown | null>;
  save(value: unknown): Promise<void>;
  clear(): Promise<void>;
}

const DB_NAME = 'english-saathi';
const STORE = 'kv';
const KEY = 'appdata';
const LS_KEY = 'english-saathi:appdata';

export function memoryBackend(initial: unknown | null = null): StorageBackend {
  let value = initial;
  return {
    name: 'memory',
    async load() {
      return value === null ? null : JSON.parse(JSON.stringify(value));
    },
    async save(v) {
      value = JSON.parse(JSON.stringify(v));
    },
    async clear() {
      value = null;
    },
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB is not available'));
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, 1);
    } catch (e) {
      return reject(e);
    }
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
    req.onblocked = () => reject(new Error('IndexedDB open blocked'));
  });
}

function tx<T>(db: IDBDatabase, mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = f(t.objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    t.onabort = () => reject(t.error ?? new Error('IndexedDB transaction aborted'));
  });
}

export async function indexedDbBackend(): Promise<StorageBackend> {
  const db = await openDb();
  return {
    name: 'indexeddb',
    async load() {
      const v = await tx<unknown>(db, 'readonly', (s) => s.get(KEY));
      return v === undefined ? null : v;
    },
    async save(v) {
      await tx(db, 'readwrite', (s) => s.put(v, KEY));
    },
    async clear() {
      await tx(db, 'readwrite', (s) => s.delete(KEY));
    },
  };
}

export function localStorageBackend(): StorageBackend {
  // Throws if storage is blocked; the caller falls back to memory.
  const probe = '__es_probe__';
  window.localStorage.setItem(probe, '1');
  window.localStorage.removeItem(probe);
  return {
    name: 'localstorage',
    async load() {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    async save(v) {
      window.localStorage.setItem(LS_KEY, JSON.stringify(v));
    },
    async clear() {
      window.localStorage.removeItem(LS_KEY);
    },
  };
}

/** Picks the best available backend: IndexedDB, then localStorage, then in-memory (not persistent). */
export async function createBackend(): Promise<StorageBackend> {
  try {
    return await indexedDbBackend();
  } catch {
    /* fall through */
  }
  try {
    return localStorageBackend();
  } catch {
    /* fall through */
  }
  return memoryBackend();
}

export const BACKEND_LABELS: Record<BackendName, { en: string; hi: string; persistent: boolean }> = {
  indexeddb: { en: "Saved on this device in the browser's database (IndexedDB).", hi: 'इस डिवाइस के ब्राउज़र के डेटाबेस (IndexedDB) में सेव हो रहा है।', persistent: true },
  localstorage: { en: "Saved on this device in the browser's local storage.", hi: 'इस डिवाइस के ब्राउज़र की लोकल स्टोरेज में सेव हो रहा है।', persistent: true },
  memory: {
    en: 'Temporary only. Your browser blocked storage, so progress will be lost when you close this tab. Use Settings > Export to back up.',
    hi: 'सिर्फ़ अस्थायी। ब्राउज़र ने स्टोरेज रोक रखा है, इसलिए टैब बंद करने पर प्रगति मिट जाएगी। Settings > Export से बैकअप लें।',
    persistent: false,
  },
};
