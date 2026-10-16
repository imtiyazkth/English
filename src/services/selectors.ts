import { AppData, Attempt, DayActivity, Exercise, Skill, SKILLS_ALL, StageId, STAGE_ORDER, VocabItem } from '../types';
import { LESSONS, IndexedExercise } from '../data/curriculum';
import { VOCAB_BY_ID } from '../data/vocab';
import { addDays, computeStreak, lastNDays, StreakInfo } from '../utils/dates';
import { isDue } from '../utils/srs';
import { shuffle } from '../utils/text';

export const emptyDay = (key: string): DayActivity => ({ dateKey: key, seconds: 0, tasks: 0, correct: 0, total: 0, dailySteps: [] });

export const todayActivity = (d: AppData, today: string): DayActivity => d.activity[today] ?? emptyDay(today);

export function activeDays(d: AppData): string[] {
  return Object.values(d.activity)
    .filter((a) => a.tasks > 0)
    .map((a) => a.dateKey);
}

export function streakInfo(d: AppData, today: string): StreakInfo {
  return computeStreak(activeDays(d), today);
}

// ---------- Skill scores ----------
export interface SkillStat {
  skill: Skill;
  correct: number;
  total: number;
  /** 0..100 or null when there is no data yet. */
  pct: number | null;
}

const WINDOW = 100;

/**
 * Score per skill = correct answers / answers over the most recent 100 attempts of that skill.
 * Speaking attempts that had a target text also count toward Pronunciation/Clarity (this only
 * shows whether a speech recogniser understood you; it is not a pronunciation grade).
 * Skills are never merged into one "fluency" number.
 */
export function skillStats(attempts: Attempt[]): Record<Skill, SkillStat> {
  const out = {} as Record<Skill, SkillStat>;
  for (const skill of SKILLS_ALL) {
    const rel = attempts.filter((a) => a.skill === skill || (skill === 'pronunciation' && a.skill === 'speaking' && a.targeted));
    const recent = rel.slice(-WINDOW);
    const correct = recent.filter((a) => a.correct).length;
    out[skill] = { skill, correct, total: recent.length, pct: recent.length ? Math.round((correct / recent.length) * 100) : null };
  }
  return out;
}

export function weakestSkill(d: AppData, minAnswers = 4): Skill | null {
  const stats = skillStats(d.attempts);
  const cands = (['reading', 'writing', 'listening', 'speaking', 'grammar', 'vocabulary'] as Skill[])
    .map((s) => stats[s])
    .filter((s) => s.total >= minAnswers && s.pct !== null);
  if (!cands.length) return null;
  return cands.sort((a, b) => (a.pct as number) - (b.pct as number))[0].skill;
}

// ---------- Activity ----------
export function weekSeries(d: AppData, today: string): { dateKey: string; minutes: number; tasks: number }[] {
  return lastNDays(today, 7).map((k) => {
    const a = d.activity[k];
    return { dateKey: k, minutes: a ? Math.round((a.seconds / 60) * 10) / 10 : 0, tasks: a?.tasks ?? 0 };
  });
}

export function totalMinutes(d: AppData): number {
  return Math.round(Object.values(d.activity).reduce((s, a) => s + a.seconds, 0) / 60);
}

// ---------- Vocabulary ----------
export interface VocabView extends Pick<VocabItem, 'id' | 'en' | 'hi'> {
  hint?: string;
  example?: { en: string; hi: string };
  theme: string;
  stage?: StageId;
  custom: boolean;
}

export function vocabView(id: string, d: AppData): VocabView | null {
  const st = d.vocab[id];
  const base = VOCAB_BY_ID[id];
  if (base) return { id, en: base.en, hi: base.hi, hint: base.hint, example: base.example, theme: base.theme, stage: base.stage, custom: false };
  if (st?.custom) {
    return {
      id,
      en: st.custom.en,
      hi: st.custom.hi,
      example: st.custom.example ? { en: st.custom.example, hi: '' } : undefined,
      theme: 'My words',
      custom: true,
    };
  }
  return null;
}

export interface VocabCounts {
  total: number;
  new: number;
  learning: number;
  due: number;
  mastered: number;
}

export function vocabCounts(d: AppData, today: string): VocabCounts {
  const c: VocabCounts = { total: 0, new: 0, learning: 0, due: 0, mastered: 0 };
  for (const st of Object.values(d.vocab)) {
    c.total++;
    if (st.status === 'new') c.new++;
    else if (st.status === 'mastered') c.mastered++;
    else c.learning++;
    if (isDue(st, today)) c.due++;
  }
  return c;
}

/** Words to study now: due words first (oldest due date first), then new words. */
export function studyQueue(d: AppData, today: string, limit = 10): string[] {
  const all = Object.values(d.vocab);
  const due = all.filter((s) => s.status !== 'new' && s.due <= today).sort((a, b) => a.due.localeCompare(b.due));
  const fresh = all.filter((s) => s.status === 'new').sort((a, b) => a.addedAt.localeCompare(b.addedAt));
  return [...due, ...fresh].slice(0, limit).map((s) => s.id);
}

// ---------- Curriculum navigation ----------
export function stageIndex(s: StageId): number {
  return STAGE_ORDER.indexOf(s);
}

export function nextLesson(d: AppData) {
  const startIdx = d.profile ? stageIndex(d.profile.level) : 0;
  const notDone = LESSONS.filter((l) => d.lessons[l.id]?.status !== 'completed');
  return notDone.find((l) => stageIndex(l.stage) >= startIdx) ?? notDone[0] ?? null;
}

export interface DailyStep {
  id: 'review' | 'lesson' | 'skill' | 'check';
  title: string;
  titleHi: string;
  detail: string;
  route: string;
  done: boolean;
  /** Nothing to do for this step today (counts as complete). */
  skipped?: boolean;
}

export function buildDailyPath(d: AppData, today: string): DailyStep[] {
  const done = new Set(todayActivity(d, today).dailySteps);
  const queue = studyQueue(d, today, 8);
  const lesson = nextLesson(d);
  const weak = weakestSkill(d) ?? 'reading';
  return [
    {
      id: 'review',
      title: 'Quick review',
      titleHi: 'जल्दी दोहराव',
      detail: queue.length ? `${queue.length} word${queue.length === 1 ? '' : 's'} to review` : 'No words to review today',
      route: '/flashcards',
      done: done.has('review') || queue.length === 0,
      skipped: queue.length === 0,
    },
    {
      id: 'lesson',
      title: 'New micro-lesson',
      titleHi: 'नया छोटा पाठ',
      detail: lesson ? lesson.title : 'You have finished every lesson — try extra practice',
      route: lesson ? `/lesson/${lesson.id}` : '/practise',
      done: done.has('lesson') || !lesson,
      skipped: !lesson,
    },
    {
      id: 'skill',
      title: `Practise your ${weak} skill`,
      titleHi: 'कमज़ोर कौशल का अभ्यास',
      detail: weakestSkill(d) ? `Your lowest score so far is ${weak}` : 'A mixed practice set',
      route: `/quiz/skill-${weak}`,
      done: done.has('skill'),
    },
    {
      id: 'check',
      title: 'Exit check',
      titleHi: 'आख़िरी जाँच',
      detail: '5 quick questions',
      route: '/quiz/daily-check',
      done: done.has('check'),
    },
  ];
}

// ---------- Question picking ----------
export function lastSeenMap(attempts: Attempt[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const a of attempts) m[a.exerciseId] = Math.max(m[a.exerciseId] ?? 0, Date.parse(a.at) || 0);
  return m;
}

export function pickQuestions(
  pool: IndexedExercise[],
  n: number,
  opts: { exclude?: Set<string>; lastSeen?: Record<string, number>; rng?: () => number; mixSkills?: boolean } = {},
): Exercise[] {
  const { exclude, lastSeen = {}, rng = Math.random, mixSkills = true } = opts;
  const seenIds = new Set<string>();
  const unique = pool.filter((p) => {
    if (seenIds.has(p.ex.id) || exclude?.has(p.ex.id)) return false;
    seenIds.add(p.ex.id);
    return true;
  });
  // Least recently seen first; ties broken randomly.
  const ordered = shuffle(unique, rng).sort((a, b) => (lastSeen[a.ex.id] ?? 0) - (lastSeen[b.ex.id] ?? 0));
  if (!mixSkills) return ordered.slice(0, n).map((p) => p.ex);
  const bySkill = new Map<string, IndexedExercise[]>();
  for (const p of ordered) {
    const arr = bySkill.get(p.ex.skill) ?? [];
    arr.push(p);
    bySkill.set(p.ex.skill, arr);
  }
  const out: Exercise[] = [];
  const queues = [...bySkill.values()];
  while (out.length < n && queues.some((q) => q.length)) {
    for (const q of queues) {
      const next = q.shift();
      if (next && out.length < n) out.push(next.ex);
    }
  }
  return out;
}

export function stagesUpTo(level: StageId): StageId[] {
  return STAGE_ORDER.slice(0, stageIndex(level) + 1);
}

export { addDays };
