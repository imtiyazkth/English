import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AppData } from '../types';
import { addSeconds, emptyData, grantAchievements } from '../services/progress';
import { BackendName, createBackend } from '../services/storage/backends';
import { createPersistence, Persistence } from '../services/storage/persistence';
import { ACHIEVEMENTS, earnedAchievementIds } from '../services/achievements';
import { dateKey } from '../utils/dates';

interface Store {
  ready: boolean;
  data: AppData;
  today: string;
  backend: BackendName;
  storageError: string | null;
  update: (fn: (d: AppData) => AppData) => void;
  replaceAll: (d: AppData) => void;
  resetAll: () => Promise<void>;
  toast: (message: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside <AppProvider>');
  return s;
}

const TICK_SECONDS = 5;
const IDLE_LIMIT_MS = 45_000;

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => emptyData());
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState(() => dateKey());
  const [backend, setBackend] = useState<BackendName>('memory');
  const [storageError, setStorageError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const persistence = useRef<Persistence | null>(null);
  const lastInteraction = useRef(Date.now());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved data once.
  useEffect(() => {
    let alive = true;
    (async () => {
      const b = await createBackend();
      const p = createPersistence(b);
      persistence.current = p;
      const loaded = await p.load();
      if (!alive) return;
      setBackend(b.name);
      setStorageError(p.lastError);
      setData(loaded);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Save (debounced) whenever data changes after the first load.
  useEffect(() => {
    if (!ready || !persistence.current) return;
    persistence.current.schedule(data);
  }, [data, ready]);

  // Flush when the page is hidden or closed so nothing is lost on reopen.
  useEffect(() => {
    const flush = () => void persistence.current?.flush();
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush();
      else setToday(dateKey());
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Local-midnight rollover.
  useEffect(() => {
    const id = setInterval(() => setToday(dateKey()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Active learning time: counts only while the page is visible and the learner interacted recently.
  useEffect(() => {
    const mark = () => {
      lastInteraction.current = Date.now();
    };
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastInteraction.current > IDLE_LIMIT_MS) return;
      setData((d) => (d.profile ? addSeconds(d, TICK_SECONDS) : d));
    }, TICK_SECONDS * 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, mark));
      clearInterval(id);
    };
  }, []);

  // Display settings.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.large = data.settings.largeText ? 'true' : 'false';
    root.dataset.motion = data.settings.reduceMotion ? 'reduce' : 'auto';
  }, [data.settings.largeText, data.settings.reduceMotion]);

  const toast = useCallback((m: string) => {
    setMessage(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setMessage(''), 4500);
  }, []);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);

  // Achievements are computed from real stored activity.
  useEffect(() => {
    if (!ready || !data.profile) return;
    const earned = earnedAchievementIds(data, today);
    const fresh = earned.filter((id) => !data.achievements[id]);
    if (!fresh.length) return;
    setData((d) => grantAchievements(d, fresh));
    const first = ACHIEVEMENTS.find((a) => a.id === fresh[0]);
    if (first) toast(`Achievement unlocked: ${first.titleHi} (${first.title})`);
  }, [data, ready, today, toast]);

  const replaceAll = useCallback((d: AppData) => setData(d), []);
  const resetAll = useCallback(async () => {
    await persistence.current?.reset();
    setData(emptyData());
  }, []);

  const value = useMemo<Store>(
    () => ({ ready, data, today, backend, storageError, update, replaceAll, resetAll, toast }),
    [ready, data, today, backend, storageError, update, replaceAll, resetAll, toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {message && <div className="toast">{message}</div>}
      </div>
    </Ctx.Provider>
  );
}
