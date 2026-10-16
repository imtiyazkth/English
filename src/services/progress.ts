import {
  AppData,
  Attempt,
  AttemptContext,
  AssessmentResult,
  DATA_VERSION,
  Lesson,
  Profile,
  Skill,
  Settings,
  TutorPrefs,
  VocabState,
  ExerciseType,
} from '../types';
import { dateKey } from '../utils/dates';
import { Grade, newVocabState, schedule } from '../utils/srs';

export const DEFAULT_SETTINGS: Settings = {
  speechRate: 0.9,
  largeText: false,
  reduceMotion: false,
  showTranscripts: true,
  voiceURI: null,
};

export const DEFAULT_TUTOR_PREFS: TutorPrefs = { oneQuestionAtATime: true, slowEnglish: false };

const MAX_ATTEMPTS = 3000;
const MAX_ASSESSMENTS = 300;
const MAX_SECONDS_PER_DAY = 6 * 3600;

export function emptyData(now: Date = new Date()): AppData {
  return {
    version: DATA_VERSION,
    profile: null,
    lessons: {},
    attempts: [],
    assessments: [],
    vocab: {},
    activity: {},
    missed: [],
    achievements: {},
    settings: { ...DEFAULT_SETTINGS },
    tutorPrefs: { ...DEFAULT_TUTOR_PREFS },
    savedGrammar: [],
    updatedAt: now.toISOString(),
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * Tolerant loader: fills missing fields with defaults and drops malformed records instead of
 * crashing. Anything that is not an object yields a fresh data set.
 */
export function migrate(raw: unknown, now: Date = new Date()): AppData {
  const base = emptyData(now);
  if (!isObj(raw)) return base;
  const out: AppData = { ...base };
  if (isObj(raw.profile) && typeof raw.profile.level === 'string') out.profile = raw.profile as unknown as Profile;
  if (isObj(raw.lessons)) {
    for (const [k, v] of Object.entries(raw.lessons)) {
      if (isObj(v) && typeof v.id === 'string') out.lessons[k] = v as unknown as AppData['lessons'][string];
    }
  }
  if (Array.isArray(raw.attempts)) {
    out.attempts = raw.attempts.filter(
      (a): a is Attempt => isObj(a) && typeof a.exerciseId === 'string' && typeof a.dateKey === 'string' && typeof a.correct === 'boolean',
    );
  }
  if (Array.isArray(raw.assessments)) {
    out.assessments = raw.assessments.filter(
      (a): a is AssessmentResult => isObj(a) && typeof a.id === 'string' && typeof a.total === 'number' && typeof a.correct === 'number',
    );
  }
  if (isObj(raw.vocab)) {
    for (const [k, v] of Object.entries(raw.vocab)) {
      if (isObj(v) && typeof v.id === 'string' && typeof v.due === 'string') out.vocab[k] = v as unknown as VocabState;
    }
  }
  if (isObj(raw.activity)) {
    for (const [k, v] of Object.entries(raw.activity)) {
      if (isObj(v) && typeof v.dateKey === 'string') {
        out.activity[k] = {
          dateKey: v.dateKey,
          seconds: Number(v.seconds) || 0,
          tasks: Number(v.tasks) || 0,
          correct: Number(v.correct) || 0,
          total: Number(v.total) || 0,
          dailySteps: Array.isArray(v.dailySteps) ? v.dailySteps.filter((s): s is string => typeof s === 'string') : [],
        };
      }
    }
  }
  if (Array.isArray(raw.missed)) out.missed = raw.missed.filter((s): s is string => typeof s === 'string');
  if (isObj(raw.achievements)) {
    for (const [k, v] of Object.entries(raw.achievements)) if (typeof v === 'string') out.achievements[k] = v;
  }
  if (isObj(raw.settings)) out.settings = { ...DEFAULT_SETTINGS, ...(raw.settings as Partial<Settings>) };
  if (isObj(raw.tutorPrefs)) out.tutorPrefs = { ...DEFAULT_TUTOR_PREFS, ...(raw.tutorPrefs as Partial<TutorPrefs>) };
  if (Array.isArray(raw.savedGrammar)) out.savedGrammar = raw.savedGrammar.filter((s): s is string => typeof s === 'string');
  if (typeof raw.updatedAt === 'string') out.updatedAt = raw.updatedAt;
  out.version = DATA_VERSION;
  return out;
}

// ---------- Export / import ----------
export const EXPORT_APP = 'english-saathi';
export interface ExportFile {
  app: typeof EXPORT_APP;
  exportVersion: number;
  exportedAt: string;
  data: AppData;
}

export function buildExport(data: AppData, now: Date = new Date()): ExportFile {
  return { app: EXPORT_APP, exportVersion: 1, exportedAt: now.toISOString(), data };
}

export type ImportResult = { ok: true; data: AppData } | { ok: false; error: string };

export function validateImport(raw: unknown): ImportResult {
  if (!isObj(raw)) return { ok: false, error: 'This file is not a valid English Saathi backup.' };
  if (raw.app !== EXPORT_APP) return { ok: false, error: 'This file was not exported by English Saathi.' };
  if (typeof raw.exportVersion !== 'number' || raw.exportVersion > 1) {
    return { ok: false, error: 'This backup was made by a newer version of the app. Please update first.' };
  }
  if (!isObj(raw.data)) return { ok: false, error: 'The backup file has no learning data.' };
  const v = raw.data.version;
  if (typeof v === 'number' && v > DATA_VERSION) {
    return { ok: false, error: 'The learning data is from a newer version of the app.' };
  }
  return { ok: true, data: migrate(raw.data) };
}

// ---------- Reducers (pure) ----------
function bumpDay(d: AppData, now: Date, f: (a: AppData['activity'][string]) => AppData['activity'][string]): AppData {
  const key = dateKey(now);
  const cur = d.activity[key] ?? { dateKey: key, seconds: 0, tasks: 0, correct: 0, total: 0, dailySteps: [] };
  return { ...d, activity: { ...d.activity, [key]: f(cur) }, updatedAt: now.toISOString() };
}

export interface AnswerInput {
  context: AttemptContext;
  contextId: string;
  exerciseId: string;
  skill: Skill;
  type: ExerciseType | 'flashcard';
  correct: boolean;
  ms: number;
  targeted?: boolean;
}

let attemptCounter = 0;

export function recordAnswer(d: AppData, a: AnswerInput, now: Date = new Date()): AppData {
  const attempt: Attempt = {
    id: `${now.getTime()}-${++attemptCounter}`,
    at: now.toISOString(),
    dateKey: dateKey(now),
    context: a.context,
    contextId: a.contextId,
    exerciseId: a.exerciseId,
    skill: a.skill,
    type: a.type,
    correct: a.correct,
    ms: Math.max(0, Math.round(a.ms)),
    targeted: a.targeted,
  };
  const attempts = [...d.attempts, attempt].slice(-MAX_ATTEMPTS);
  let missed = d.missed;
  if (a.type !== 'flashcard') {
    if (!a.correct && !missed.includes(a.exerciseId)) missed = [...missed, a.exerciseId];
    if (a.correct && missed.includes(a.exerciseId)) missed = missed.filter((m) => m !== a.exerciseId);
  }
  const next = bumpDay({ ...d, attempts, missed }, now, (day) => ({
    ...day,
    tasks: day.tasks + 1,
    total: day.total + 1,
    correct: day.correct + (a.correct ? 1 : 0),
  }));
  return next;
}

export function addSeconds(d: AppData, seconds: number, now: Date = new Date()): AppData {
  if (seconds <= 0) return d;
  return bumpDay(d, now, (day) => ({ ...day, seconds: Math.min(MAX_SECONDS_PER_DAY, day.seconds + seconds) }));
}

export function recordAssessment(d: AppData, r: AssessmentResult): AppData {
  return { ...d, assessments: [...d.assessments, r].slice(-MAX_ASSESSMENTS), updatedAt: r.at };
}

export function addVocabIds(d: AppData, ids: string[], now: Date = new Date()): AppData {
  const today = dateKey(now);
  const vocab = { ...d.vocab };
  let changed = false;
  for (const id of ids) {
    if (!vocab[id]) {
      vocab[id] = newVocabState(id, today, now);
      changed = true;
    }
  }
  return changed ? { ...d, vocab, updatedAt: now.toISOString() } : d;
}

export function addCustomVocab(
  d: AppData,
  item: { en: string; hi: string; example?: string },
  now: Date = new Date(),
): { data: AppData; id: string } {
  const slug = item.en.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'word';
  const id = `custom-${slug}`;
  if (d.vocab[id]) return { data: d, id };
  const st = newVocabState(id, dateKey(now), now);
  st.custom = { en: item.en.trim(), hi: item.hi.trim(), example: item.example?.trim() || undefined };
  return { data: { ...d, vocab: { ...d.vocab, [id]: st }, updatedAt: now.toISOString() }, id };
}

export function reviewVocab(d: AppData, id: string, grade: Grade, now: Date = new Date()): AppData {
  const st = d.vocab[id];
  if (!st) return d;
  const updated = schedule(st, grade, dateKey(now));
  const withVocab = { ...d, vocab: { ...d.vocab, [id]: updated } };
  return recordAnswer(
    withVocab,
    {
      context: 'review',
      contextId: 'flashcards',
      exerciseId: `vocab:${id}`,
      skill: 'vocabulary',
      type: 'flashcard',
      correct: grade === 'good' || grade === 'easy',
      ms: 0,
    },
    now,
  );
}

export function toggleFavourite(d: AppData, id: string): AppData {
  const st = d.vocab[id];
  if (!st) return d;
  return { ...d, vocab: { ...d.vocab, [id]: { ...st, favourite: !st.favourite } } };
}

export function removeVocab(d: AppData, id: string): AppData {
  if (!d.vocab[id]) return d;
  const vocab = { ...d.vocab };
  delete vocab[id];
  return { ...d, vocab };
}

export function completeLesson(
  d: AppData,
  lesson: Pick<Lesson, 'id' | 'vocab'>,
  correct: number,
  total: number,
  now: Date = new Date(),
): AppData {
  const score = total ? correct / total : 0;
  const prev = d.lessons[lesson.id];
  const best = Math.max(prev?.bestScore ?? 0, score);
  const progress = {
    id: lesson.id,
    status: 'completed' as const,
    bestScore: best,
    lastScore: score,
    attempts: (prev?.attempts ?? 0) + 1,
    mastered: best >= 0.8,
    lastAt: now.toISOString(),
  };
  const withLesson = { ...d, lessons: { ...d.lessons, [lesson.id]: progress }, updatedAt: now.toISOString() };
  return lesson.vocab?.length ? addVocabIds(withLesson, lesson.vocab, now) : withLesson;
}

export function markDailyStep(d: AppData, step: string, now: Date = new Date()): AppData {
  return bumpDay(d, now, (day) => (day.dailySteps.includes(step) ? day : { ...day, dailySteps: [...day.dailySteps, step] }));
}

export function setProfile(d: AppData, profile: Profile): AppData {
  return { ...d, profile, updatedAt: new Date().toISOString() };
}

export function updateSettings(d: AppData, patch: Partial<Settings>): AppData {
  return { ...d, settings: { ...d.settings, ...patch } };
}

export function updateTutorPrefs(d: AppData, patch: Partial<TutorPrefs>): AppData {
  return { ...d, tutorPrefs: { ...d.tutorPrefs, ...patch } };
}

export function toggleSavedGrammar(d: AppData, id: string): AppData {
  const has = d.savedGrammar.includes(id);
  return { ...d, savedGrammar: has ? d.savedGrammar.filter((x) => x !== id) : [...d.savedGrammar, id] };
}

export function grantAchievements(d: AppData, ids: string[], now: Date = new Date()): AppData {
  const fresh = ids.filter((id) => !d.achievements[id]);
  if (!fresh.length) return d;
  const achievements = { ...d.achievements };
  for (const id of fresh) achievements[id] = now.toISOString();
  return { ...d, achievements };
}
