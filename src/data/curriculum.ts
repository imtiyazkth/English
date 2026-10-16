import type { Exercise, Lesson, StageId } from '../types';
import { LESSONS_PRE_A1 } from './lessons-pre-a1';
import { LESSONS_A1_A2 } from './lessons-a1-a2';
import { LESSONS_B_C } from './lessons-b-c';
import { GRAMMAR } from './grammar';
import { READING } from './reading';
import { LISTENING } from './listening';
import { SPEAKING } from './speaking';
import { WRITING } from './writing';
import { PLACEMENT } from './placement';

export const LESSONS: Lesson[] = [...LESSONS_PRE_A1, ...LESSONS_A1_A2, ...LESSONS_B_C];
export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

export interface IndexedExercise {
  ex: Exercise;
  stage: StageId;
  source: string; // e.g. "lesson:p1-to-be", "reading:r-ravi"
}

function buildIndex(): IndexedExercise[] {
  const out: IndexedExercise[] = [];
  for (const l of LESSONS) for (const ex of l.exercises) out.push({ ex, stage: l.stage, source: `lesson:${l.id}` });
  for (const g of GRAMMAR) for (const ex of g.quiz) out.push({ ex, stage: g.stage, source: `grammar:${g.id}` });
  for (const r of READING) for (const ex of r.questions) out.push({ ex, stage: r.stage, source: `reading:${r.id}` });
  for (const l of LISTENING) for (const ex of l.questions) out.push({ ex, stage: l.stage, source: `listening:${l.id}` });
  for (const s of SPEAKING) for (const ex of s.exercises) out.push({ ex, stage: s.stage, source: `speaking:${s.id}` });
  for (const w of WRITING) out.push({ ex: w.exercise, stage: w.stage, source: `writing:${w.id}` });
  for (const t of PLACEMENT) for (const ex of t.questions) out.push({ ex, stage: t.stage, source: 'placement' });
  return out;
}

export const EXERCISE_INDEX: IndexedExercise[] = buildIndex();
export const EXERCISE_BY_ID: Record<string, IndexedExercise> = Object.fromEntries(
  EXERCISE_INDEX.map((e) => [e.ex.id, e]),
);

/** Exercises that make sense in mixed quizzes (placement items are excluded). */
export const QUIZ_POOL: IndexedExercise[] = EXERCISE_INDEX.filter((e) => e.source !== 'placement');

export function lessonsOfStage(stage: StageId): Lesson[] {
  return LESSONS.filter((l) => l.stage === stage);
}
