import { AppData, AssessmentKind, Exercise, ExerciseType, Skill, StageId, STAGE_ORDER } from '../types';
import { EXERCISE_BY_ID, IndexedExercise, LESSONS, QUIZ_POOL } from '../data/curriculum';
import { lastSeenMap, pickQuestions, stageIndex, stagesUpTo } from './selectors';

export interface QuizPlan {
  kind: AssessmentKind;
  /** Route key, e.g. "daily-check", "timed", "skill-reading". */
  key: string;
  title: string;
  titleHi: string;
  exercises: Exercise[];
  timeLimitSec?: number;
}

/** Types that can be scored automatically and quickly in a mixed quiz. */
const QUIZ_TYPES: ExerciseType[] = ['mcq', 'fill', 'translate', 'arrange', 'match', 'dictation', 'correct'];

const levelOf = (d: AppData): StageId => d.profile?.level ?? 'pre-a1';

function typedPool(pool: IndexedExercise[]): IndexedExercise[] {
  return pool.filter((p) => QUIZ_TYPES.includes(p.ex.type));
}

function poolForLevel(d: AppData): IndexedExercise[] {
  const stages = stagesUpTo(levelOf(d));
  const forLevel = typedPool(QUIZ_POOL).filter((p) => stages.includes(p.stage));
  return forLevel.length >= 8 ? forLevel : typedPool(QUIZ_POOL);
}

/** Builds a quiz without repeating a question inside it; least recently seen questions come first. */
export function buildQuiz(key: string, d: AppData, rng: () => number = Math.random): QuizPlan | null {
  const lastSeen = lastSeenMap(d.attempts);

  if (key === 'daily-check') {
    const pool = poolForLevel(d);
    const completedSources = new Set(Object.keys(d.lessons).map((id) => `lesson:${id}`));
    const done = pool.filter((p) => completedSources.has(p.source));
    const chosen = pickQuestions(done.length >= 5 ? done : pool, 5, { lastSeen, rng });
    return { kind: 'daily', key, title: 'Daily exit check', titleHi: 'आज की आख़िरी जाँच', exercises: chosen };
  }

  if (key === 'timed') {
    return {
      kind: 'timed',
      key,
      title: 'Timed mixed quiz (5 minutes)',
      titleHi: 'समय-सीमा वाला मिश्रित क्विज़',
      exercises: pickQuestions(poolForLevel(d), 10, { lastSeen, rng }),
      timeLimitSec: 300,
    };
  }

  if (key === 'weekly') {
    const weekAgo = Date.now() - 7 * 86_400_000;
    const recentLessonIds = new Set(
      d.attempts
        .filter((a) => Date.parse(a.at) >= weekAgo && a.contextId && EXERCISE_BY_ID[a.exerciseId]?.source.startsWith('lesson:'))
        .map((a) => EXERCISE_BY_ID[a.exerciseId].source),
    );
    const base = poolForLevel(d);
    const recent = base.filter((p) => recentLessonIds.has(p.source));
    const pool = recent.length >= 8 ? recent : base;
    return {
      kind: 'weekly',
      key,
      title: 'Weekly revision mock test',
      titleHi: 'साप्ताहिक दोहराव टेस्ट',
      exercises: pickQuestions(pool, 15, { lastSeen, rng }),
    };
  }

  if (key === 'missed') {
    const exercises = d.missed.map((id) => EXERCISE_BY_ID[id]?.ex).filter((e): e is Exercise => !!e);
    return { kind: 'missed', key, title: 'Review missed questions', titleHi: 'छूटे हुए सवाल दोबारा', exercises };
  }

  if (key.startsWith('unit-')) {
    const stage = key.slice(5) as StageId;
    if (!STAGE_ORDER.includes(stage)) return null;
    const pool = typedPool(QUIZ_POOL).filter((p) => p.stage === stage && p.source.startsWith('lesson:'));
    return {
      kind: 'unit',
      key,
      title: `End-of-unit test: ${stage.toUpperCase()}`,
      titleHi: 'इकाई के अंत का टेस्ट',
      exercises: pickQuestions(pool, 12, { lastSeen, rng }),
    };
  }

  if (key.startsWith('skill-')) {
    const skill = key.slice(6) as Skill;
    const stages = stagesUpTo(levelOf(d));
    let pool = QUIZ_POOL.filter((p) => p.ex.skill === skill && stages.includes(p.stage));
    if (pool.length < 4) pool = QUIZ_POOL.filter((p) => p.ex.skill === skill);
    return {
      kind: 'skill',
      key,
      title: `Practice: ${skill}`,
      titleHi: 'कौशल का अभ्यास',
      exercises: pickQuestions(pool, 6, { lastSeen, rng, mixSkills: false }),
    };
  }
  return null;
}

export { stageIndex };
