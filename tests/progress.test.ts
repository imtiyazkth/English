import {
  addCustomVocab,
  addSeconds,
  addVocabIds,
  buildExport,
  completeLesson,
  emptyData,
  grantAchievements,
  markDailyStep,
  migrate,
  recordAnswer,
  recordAssessment,
  reviewVocab,
  setProfile,
  validateImport,
} from '../src/services/progress';
import { earnedAchievementIds } from '../src/services/achievements';
import type { Profile } from '../src/types';

const now = new Date(2026, 9, 14, 10, 0, 0);
const profile: Profile = { name: 'T', level: 'pre-a1', goal: 'conversation', dailyMinutes: 10, support: 'hindi', accent: 'en-IN', comfort: 'okay', createdAt: now.toISOString() };
const ans = (correct: boolean, id = 'q1') => ({ context: 'practice' as const, contextId: 'c', exerciseId: id, skill: 'grammar' as const, type: 'mcq' as const, correct, ms: 1200 });

describe('learner data layer', () => {
  it('starts empty', () => {
    const d = emptyData(now);
    expect(d.profile).toBeNull();
    expect(d.attempts).toHaveLength(0);
    expect(d.version).toBe(1);
  });

  it('survives missing or malformed stored data', () => {
    expect(migrate(null, now).attempts).toHaveLength(0);
    expect(migrate('garbage', now).profile).toBeNull();
    const d = migrate(
      {
        lessons: { x: { id: 'x', status: 'completed' }, bad: 5 },
        attempts: [{ nope: 1 }, { exerciseId: 'e', dateKey: '2026-10-14', correct: true }],
        vocab: { v: { id: 'v', due: '2026-10-14' }, w: 'x' },
        settings: { speechRate: 1.1 },
      },
      now,
    );
    expect(Object.keys(d.lessons)).toEqual(['x']);
    expect(d.attempts).toHaveLength(1);
    expect(Object.keys(d.vocab)).toEqual(['v']);
    expect(d.settings.speechRate).toBe(1.1);
    expect(d.settings.showTranscripts).toBe(true);
  });

  it('records answers per local day and tracks missed questions', () => {
    let d = setProfile(emptyData(now), profile);
    d = recordAnswer(d, ans(false), now);
    expect(d.attempts).toHaveLength(1);
    expect(d.attempts[0].dateKey).toBe('2026-10-14');
    expect(d.missed).toEqual(['q1']);
    expect(d.activity['2026-10-14'].tasks).toBe(1);
    expect(d.activity['2026-10-14'].correct).toBe(0);
    d = recordAnswer(d, ans(true), now);
    expect(d.missed).toEqual([]);
    expect(d.activity['2026-10-14'].total).toBe(2);
    expect(d.activity['2026-10-14'].correct).toBe(1);
  });

  it('does not duplicate missed questions', () => {
    let d = emptyData(now);
    d = recordAnswer(d, ans(false), now);
    d = recordAnswer(d, ans(false), now);
    expect(d.missed).toEqual(['q1']);
  });

  it('adds active seconds and caps a day', () => {
    let d = addSeconds(emptyData(now), 30, now);
    expect(d.activity['2026-10-14'].seconds).toBe(30);
    d = addSeconds(d, 100000, now);
    expect(d.activity['2026-10-14'].seconds).toBe(6 * 3600);
    expect(addSeconds(d, 0, now)).toBe(d);
  });

  it('completes lessons, keeps the best score and adds lesson vocabulary', () => {
    let d = emptyData(now);
    d = completeLesson(d, { id: 'L1', vocab: ['hello', 'yes'] }, 17, 20, now);
    expect(d.lessons.L1.mastered).toBe(true);
    expect(d.lessons.L1.bestScore).toBeCloseTo(0.85, 5);
    expect(Object.keys(d.vocab).sort()).toEqual(['hello', 'yes']);
    d = completeLesson(d, { id: 'L1', vocab: ['hello', 'yes'] }, 10, 20, now);
    expect(d.lessons.L1.bestScore).toBeCloseTo(0.85, 5);
    expect(d.lessons.L1.lastScore).toBeCloseTo(0.5, 5);
    expect(d.lessons.L1.attempts).toBe(2);
    expect(d.lessons.L1.mastered).toBe(true);
  });

  it('marks a low-scoring lesson as completed but not mastered', () => {
    const d = completeLesson(emptyData(now), { id: 'L2' }, 5, 10, now);
    expect(d.lessons.L2.status).toBe('completed');
    expect(d.lessons.L2.mastered).toBe(false);
  });

  it('reviews vocabulary and logs a flashcard attempt without touching missed questions', () => {
    let d = addVocabIds(emptyData(now), ['hello'], now);
    d = reviewVocab(d, 'hello', 'good', now);
    expect(d.vocab.hello.status).toBe('review');
    expect(d.vocab.hello.due).toBe('2026-10-15');
    expect(d.attempts[0].type).toBe('flashcard');
    d = reviewVocab(d, 'hello', 'again', now);
    expect(d.vocab.hello.status).toBe('learning');
    expect(d.missed).toEqual([]);
  });

  it('saves custom words once', () => {
    const a = addCustomVocab(emptyData(now), { en: 'Good luck!', hi: 'शुभकामना' }, now);
    expect(a.id).toBe('custom-good-luck');
    const b = addCustomVocab(a.data, { en: 'good luck', hi: 'x' }, now);
    expect(Object.keys(b.data.vocab)).toHaveLength(1);
    expect(b.data.vocab[a.id].custom?.hi).toBe('शुभकामना');
  });

  it('records daily path steps once', () => {
    let d = markDailyStep(emptyData(now), 'lesson', now);
    d = markDailyStep(d, 'lesson', now);
    expect(d.activity['2026-10-14'].dailySteps).toEqual(['lesson']);
  });

  it('stores assessments', () => {
    const d = recordAssessment(emptyData(now), { id: 'a', at: now.toISOString(), kind: 'daily', title: 't', total: 5, correct: 4, durationSec: 60, bySkill: {}, missedIds: [] });
    expect(d.assessments).toHaveLength(1);
  });

  it('grants achievements only once', () => {
    let d = grantAchievements(emptyData(now), ['first-lesson'], now);
    const stamp = d.achievements['first-lesson'];
    d = grantAchievements(d, ['first-lesson'], new Date(2030, 0, 1));
    expect(d.achievements['first-lesson']).toBe(stamp);
  });

  it('derives achievements from real activity only', () => {
    expect(earnedAchievementIds(emptyData(now), '2026-10-14')).toEqual([]);
    const d = completeLesson(emptyData(now), { id: 'L1' }, 8, 10, now);
    expect(earnedAchievementIds(d, '2026-10-14')).toContain('first-lesson');
  });
});

describe('export and import', () => {
  it('round-trips a backup', () => {
    let d = setProfile(emptyData(now), profile);
    d = completeLesson(d, { id: 'L1', vocab: ['yes'] }, 9, 10, now);
    const file = JSON.parse(JSON.stringify(buildExport(d, now)));
    const res = validateImport(file);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.profile?.name).toBe('T');
      expect(Object.keys(res.data.lessons)).toEqual(['L1']);
      expect(Object.keys(res.data.vocab)).toEqual(['yes']);
    }
  });
  it('rejects files from other apps, newer versions and junk', () => {
    expect(validateImport({ app: 'other', exportVersion: 1, data: {} }).ok).toBe(false);
    expect(validateImport({ app: 'english-saathi', exportVersion: 99, data: {} }).ok).toBe(false);
    expect(validateImport({ app: 'english-saathi', exportVersion: 1, data: { version: 99 } }).ok).toBe(false);
    expect(validateImport({ app: 'english-saathi', exportVersion: 1 }).ok).toBe(false);
    expect(validateImport('nope').ok).toBe(false);
    expect(validateImport(null).ok).toBe(false);
  });
});
