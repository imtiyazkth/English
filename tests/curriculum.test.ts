import { EXERCISE_INDEX, LESSONS, LESSON_BY_ID } from '../src/data/curriculum';
import { VOCAB, VOCAB_BY_ID } from '../src/data/vocab';
import { GRAMMAR } from '../src/data/grammar';
import { READING } from '../src/data/reading';
import { LISTENING } from '../src/data/listening';
import { SPEAKING } from '../src/data/speaking';
import { WRITING } from '../src/data/writing';
import { PRONUNCIATION } from '../src/data/pronunciation';
import { PLACEMENT, suggestStage } from '../src/data/placement';
import { STAGE_ORDER, SKILLS_ALL } from '../src/types';
import type { Exercise } from '../src/types';
import { gradeExercise } from '../src/utils/grade';

/** The response a perfect learner would give. */
function perfect(ex: Exercise): string | number {
  switch (ex.type) {
    case 'mcq':
      return ex.answer;
    case 'match':
      return 0;
    case 'speak':
      return ex.targetText ?? ex.modelAnswer;
    case 'write':
      return ex.modelAnswer;
    default:
      return ex.answers[0];
  }
}

describe('curriculum data integrity', () => {
  it('covers every level from Zero English to C1', () => {
    const stages = new Set(LESSONS.map((l) => l.stage));
    for (const s of STAGE_ORDER) expect(stages.has(s)).toBe(true);
  });
  it('has unique lesson ids with valid prerequisites and vocabulary links', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const l of LESSONS) {
      if (l.prerequisite) expect(LESSON_BY_ID[l.prerequisite]).toBeTruthy();
      for (const v of l.vocab ?? []) expect(VOCAB_BY_ID[v]).toBeTruthy();
      expect(l.exercises.length).toBeGreaterThanOrEqual(6);
      expect(l.teach.length).toBeGreaterThan(0);
      expect(l.explanationHi.length).toBeGreaterThan(0);
      expect(STAGE_ORDER.includes(l.stage)).toBe(true);
    }
  });
  it('has unique exercise ids everywhere', () => {
    const ids = EXERCISE_INDEX.map((e) => e.ex.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });
  it('has unique vocabulary ids', () => {
    expect(new Set(VOCAB.map((v) => v.id)).size).toBe(VOCAB.length);
  });
  it('gives every skill at least a few exercises', () => {
    for (const s of SKILLS_ALL.filter((x) => x !== 'pronunciation')) {
      expect(EXERCISE_INDEX.filter((e) => e.ex.skill === s).length).toBeGreaterThanOrEqual(4);
    }
  });
  it('has well-formed exercises of every type', () => {
    const seenTypes = new Set<string>();
    for (const { ex } of EXERCISE_INDEX) {
      seenTypes.add(ex.type);
      expect(ex.explanationHi.length).toBeGreaterThan(3);
      if (ex.type === 'mcq') {
        expect(ex.options.length).toBeGreaterThanOrEqual(2);
        expect(ex.answer).toBeGreaterThanOrEqual(0);
        expect(ex.answer).toBeLessThan(ex.options.length);
        expect(new Set(ex.options).size).toBe(ex.options.length);
      }
      if (ex.type === 'fill') {
        expect(ex.sentence).toContain('___');
        expect(ex.answers.length).toBeGreaterThan(0);
      }
      if (ex.type === 'arrange') {
        expect([...ex.answers[0].split(' ')].sort()).toEqual([...ex.words].sort());
      }
      if (ex.type === 'match') {
        expect(ex.pairs.length).toBeGreaterThanOrEqual(2);
        expect(new Set(ex.pairs.map((p) => p[0])).size).toBe(ex.pairs.length);
        expect(new Set(ex.pairs.map((p) => p[1])).size).toBe(ex.pairs.length);
      }
      if (ex.type === 'translate' && ex.direction === 'en-hi') {
        for (const w of ex.answers[0].split(' ')) expect(ex.bank).toContain(w);
      }
    }
    for (const t of ['mcq', 'fill', 'translate', 'arrange', 'match', 'dictation', 'correct', 'speak', 'write']) {
      expect(seenTypes.has(t)).toBe(true);
    }
  });
  it('every exercise accepts its own model answer (no impossible questions)', () => {
    const failures: string[] = [];
    for (const { ex } of EXERCISE_INDEX) {
      if (!gradeExercise(ex, perfect(ex)).correct) failures.push(ex.id);
    }
    expect(failures).toEqual([]);
  });
  it('rejects an obviously wrong answer for typed exercises', () => {
    for (const { ex } of EXERCISE_INDEX) {
      if (ex.type === 'fill' || ex.type === 'arrange' || ex.type === 'dictation' || ex.type === 'correct' || ex.type === 'translate') {
        expect(gradeExercise(ex, 'zzz qqq').correct).toBe(false);
      }
    }
  });
  it('has reading and listening items with valid questions', () => {
    for (const p of READING) {
      expect(p.questions.length).toBeGreaterThan(0);
      expect(Object.keys(p.glossary).every((k) => k === k.toLowerCase())).toBe(true);
    }
    for (const l of LISTENING) expect(l.lines.length).toBeGreaterThan(0);
    expect(SPEAKING.length).toBeGreaterThan(3);
    expect(WRITING.length).toBeGreaterThan(3);
    expect(PRONUNCIATION.length).toBeGreaterThan(5);
  });
  it('links grammar topics to real lessons', () => {
    expect(new Set(GRAMMAR.map((g) => g.id)).size).toBe(GRAMMAR.length);
    for (const g of GRAMMAR) {
      if (g.lessonId) expect(LESSON_BY_ID[g.lessonId]).toBeTruthy();
      expect(g.quiz.length).toBeGreaterThan(0);
    }
  });
  it('includes role-plays that the AI tutor understands', () => {
    const known = ['ordering-food', 'asking-directions', 'phone-call', 'job-interview', 'customer-service'];
    for (const t of SPEAKING.filter((s) => s.kind === 'role-play')) expect(known.includes(t.scenario ?? '')).toBe(true);
  });
});

describe('placement', () => {
  it('suggests zero English when the first level is failed', () => {
    expect(suggestStage({})).toBe('pre-a1');
    expect(suggestStage({ 'pl-1': true, 'pl-2': false })).toBe('pre-a1');
  });
  it('moves up one level past the last tier that was passed', () => {
    const map: Record<string, boolean> = {};
    for (const q of PLACEMENT[0].questions) map[q.id] = true;
    expect(suggestStage(map)).toBe('a1');
    for (const q of PLACEMENT[1].questions) map[q.id] = true;
    expect(suggestStage(map)).toBe('a2');
  });
  it('caps at the top level', () => {
    const map: Record<string, boolean> = {};
    for (const t of PLACEMENT) for (const q of t.questions) map[q.id] = true;
    expect(suggestStage(map)).toBe('c1');
  });
});
