import type { AppData } from '../../types';
import { migrate } from '../progress';
import type { StorageBackend } from './backends';

export interface Persistence {
  backend: StorageBackend;
  load(): Promise<AppData>;
  /** Debounced save. */
  schedule(data: AppData): void;
  /** Save immediately (used when the page is hidden/closed). */
  flush(): Promise<void>;
  reset(): Promise<void>;
  lastError: string | null;
}

export function createPersistence(backend: StorageBackend, delayMs = 400): Persistence {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: AppData | null = null;
  const p: Persistence = {
    backend,
    lastError: null,
    async load() {
      try {
        return migrate(await backend.load());
      } catch (e) {
        p.lastError = e instanceof Error ? e.message : 'Could not read saved data';
        return migrate(null);
      }
    },
    schedule(data) {
      pending = data;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void p.flush(), delayMs);
    },
    async flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (!pending) return;
      const toSave = pending;
      pending = null;
      try {
        await backend.save(toSave);
        p.lastError = null;
      } catch (e) {
        p.lastError = e instanceof Error ? e.message : 'Could not save';
      }
    },
    async reset() {
      pending = null;
      if (timer) clearTimeout(timer);
      timer = null;
      await backend.clear();
    },
  };
  return p;
}
