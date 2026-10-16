import { emptyData, recordAnswer, setProfile, addVocabIds, completeLesson } from '../src/services/progress';
import { buildDailyPath, nextLesson, pickQuestions, skillStats, studyQueue, vocabCounts, weakestSkill, weekSeries } from '../src/services/selectors';
import { buildQuiz } from '../src/services/quizBuilder';
import { QUIZ_POOL, EXERCISE_BY_ID } from '../src/data/curriculum';
import type { AppData, Profile, Skill } from '../src/types';

const now = new Date(2026, 9, 14, 10, 0, 0);
const today = '2026-10-14';
const profile = (level: Profile['level']): Profile => ({ name: '', level, goal: 'conversation', dailyMinutes: 10, support: 'hindi', accent: 'en-IN', comfort: 'okay', createdAt: now.toISOString() });
const seeded = () => {
  let s = 12345;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

function withAnswers(d: AppData, skill: Skill, correct: number, wrong: number): AppData {
  let n = d;
  for (let i = 0; i < correct + wrong; i++) {
    n = recordAnswer(n, { context: 'practice', contextId: 'c', exerciseId: `${skill}-${i}`, skill, type: 'mcq', correct: i < correct, ms: 500 }, now);
  }
  return n;
}

describe('skill scores', () => {
  it('has no percentage when there is no data (no fabricated numbers)', () => {
    const s = skillStats([]);
    expect(s.reading.pct).toBeNull();
    expect(s.reading.total).toBe(0);
  });
  it('computes accuracy per skill separately', () => {
    let d = withAnswers(emptyData(now), 'listening', 4, 1);
    d = withAnswers(d, 'reading', 1, 3);
    const s = skillStats(d.attempts);
    expect(s.listening.pct).toBe(80);
    expect(s.reading.pct).toBe(25);
    expect(s.grammar.pct).toBeNull();
  });
  it('counts targeted speaking toward pronunciation/clarity only', () => {
    let d = emptyData(now);
    d = recordAnswer(d, { context: 'practice', contextId: 'c', exerciseId: 's1', skill: 'speaking', type: 'speak', correct: true, ms: 1, targeted: true }, now);
    d = recordAnswer(d, { context: 'practice', contextId: 'c', exerciseId: 's2', skill: 'speaking', type: 'speak', correct: false, ms: 1 }, now);
    const s = skillStats(d.attempts);
    expect(s.speaking.total).toBe(2);
    expect(s.pronunciation.total).toBe(1);
    expect(s.pronunciation.pct).toBe(100);
  });
  it('finds the weakest skill once there is enough data', () => {
    let d = withAnswers(emptyData(now), 'listening', 5, 0);
    expect(weakestSkill(d)).toBe('listening');
    d = withAnswers(d, 'grammar', 1, 4);
    expect(weakestSkill(d)).toBe('grammar');
    expect(weakestSkill(emptyData(now))).toBeNull();
  });
});

describe('daily path and lesson navigation', () => {
  it('starts a brand new learner on the first lesson', () => {
    const d = setProfile(emptyData(now), profile('pre-a1'));
    const l = nextLesson(d);
    expect(l?.id).toBe('p1-letters-a-m');
    const path = buildDailyPath(d, today);
    expect(path.map((s) => s.id)).toEqual(['review', 'lesson', 'skill', 'check']);
    expect(path[0].skipped).toBe(true);
    expect(path[1].route).toBe('/lesson/p1-letters-a-m');
    expect(path[2].route).toBe('/quiz/skill-reading');
    expect(path[3].route).toBe('/quiz/daily-check');
    expect(path.every((s) => !s.done || s.id === 'review')).toBe(true);
  });
  it('respects the chosen level', () => {
    const d = setProfile(emptyData(now), profile('a1'));
    expect(nextLesson(d)?.stage).toBe('a1');
  });
  it('skips completed lessons', () => {
    let d = setProfile(emptyData(now), profile('pre-a1'));
    d = completeLesson(d, { id: 'p1-letters-a-m' }, 8, 8, now);
    expect(nextLesson(d)?.id).toBe('p1-letters-n-z');
  });
  it('offers a review step when words are available', () => {
    let d = setProfile(emptyData(now), profile('pre-a1'));
    d = addVocabIds(d, ['hello', 'yes'], now);
    const step = buildDailyPath(d, today)[0];
    expect(step.skipped).toBe(false);
    expect(step.done).toBe(false);
    expect(step.detail).toContain('2 words');
  });
});

describe('vocabulary queue', () => {
  it('lists due words before new words and counts states', () => {
    let d = addVocabIds(emptyData(now), ['hello', 'yes', 'no'], now);
    d = { ...d, vocab: { ...d.vocab, yes: { ...d.vocab.yes, status: 'review', due: '2026-10-10', interval: 2, reps: 2 } } };
    const q = studyQueue(d, today, 10);
    expect(q[0]).toBe('yes');
    expect(q).toHaveLength(3);
    const c = vocabCounts(d, today);
    expect(c.total).toBe(3);
    expect(c.new).toBe(2);
    expect(c.due).toBe(1);
  });
  it('does not treat future words as due', () => {
    let d = addVocabIds(emptyData(now), ['yes'], now);
    d = { ...d, vocab: { yes: { ...d.vocab.yes, status: 'review', due: '2026-10-20', interval: 6, reps: 3 } } };
    expect(vocabCounts(d, today).due).toBe(0);
    expect(studyQueue(d, today)).toEqual([]);
  });
});

describe('weekly series', () => {
  it('returns seven days with zeros when there is no activity', () => {
    const w = weekSeries(emptyData(now), today);
    expect(w).toHaveLength(7);
    expect(w[6].dateKey).toBe(today);
    expect(w.every((x) => x.minutes === 0 && x.tasks === 0)).toBe(true);
  });
});

describe('question picking', () => {
  it('never repeats a question and respects the requested count', () => {
    const picked = pickQuestions(QUIZ_POOL, 15, { rng: seeded() });
    expect(picked).toHaveLength(15);
    expect(new Set(picked.map((p) => p.id)).size).toBe(15);
  });
  it('prefers the least recently seen questions', () => {
    const pool = QUIZ_POOL.slice(0, 10);
    const lastSeen: Record<string, number> = {};
    pool.forEach((p, i) => (lastSeen[p.ex.id] = i < 5 ? 1000 + i : 0));
    const picked = pickQuestions(pool, 5, { lastSeen, rng: seeded(), mixSkills: false });
    const unseen = new Set(pool.slice(5).map((p) => p.ex.id));
    expect(picked.every((p) => unseen.has(p.id))).toBe(true);
  });
  it('honours exclusions', () => {
    const exclude = new Set(QUIZ_POOL.slice(0, 5).map((p) => p.ex.id));
    const picked = pickQuestions(QUIZ_POOL, 10, { exclude, rng: seeded() });
    expect(picked.every((p) => !exclude.has(p.id))).toBe(true);
  });
});

describe('quiz builder', () => {
  const d = setProfile(emptyData(now), profile('a2'));
  it('builds a 5-question daily check without duplicates', () => {
    const q = buildQuiz('daily-check', d, seeded());
    expect(q?.kind).toBe('daily');
    expect(q?.exercises).toHaveLength(5);
    expect(new Set(q?.exercises.map((e) => e.id)).size).toBe(5);
  });
  it('builds a timed quiz with a limit', () => {
    const q = buildQuiz('timed', d, seeded());
    expect(q?.timeLimitSec).toBe(300);
    expect(q?.exercises).toHaveLength(10);
  });
  it('builds weekly and unit tests', () => {
    expect(buildQuiz('weekly', d, seeded())?.exercises.length).toBeGreaterThan(5);
    const unit = buildQuiz('unit-pre-a1', d, seeded());
    expect(unit?.exercises.length).toBeGreaterThan(5);
    expect(unit?.exercises.every((e) => EXERCISE_BY_ID[e.id].stage === 'pre-a1')).toBe(true);
  });
  it('builds single-skill practice', () => {
    const q = buildQuiz('skill-listening', d, seeded());
    expect(q?.exercises.length).toBeGreaterThan(0);
    expect(q?.exercises.every((e) => e.skill === 'listening')).toBe(true);
  });
  it('replays only real missed questions', () => {
    const real = QUIZ_POOL[0].ex.id;
    const q = buildQuiz('missed', { ...d, missed: [real, 'does-not-exist'] });
    expect(q?.exercises.map((e) => e.id)).toEqual([real]);
    expect(buildQuiz('missed', d)?.exercises).toHaveLength(0);
  });
  it('returns null for unknown quiz keys', () => {
    expect(buildQuiz('nonsense', d)).toBeNull();
    expect(buildQuiz('unit-zzz', d)).toBeNull();
  });
});
