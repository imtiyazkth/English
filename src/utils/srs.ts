import type { VocabState } from '../types';
import { addDays } from './dates';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export function newVocabState(id: string, today: string, now: Date = new Date()): VocabState {
  return {
    id,
    status: 'new',
    ease: 2.5,
    interval: 0,
    reps: 0,
    lapses: 0,
    due: today,
    favourite: false,
    addedAt: now.toISOString(),
  };
}

/**
 * A simple SM-2-inspired schedule. This is a transparent heuristic, not a scientifically
 * calibrated model:
 *  - Again: back to the start, due today, ease drops.
 *  - Hard:  interval grows slowly (x1.2, at least 1 day), ease drops a little.
 *  - Good:  1 day, then 3 days, then interval x ease.
 *  - Easy:  3 days, then 6 days, then interval x ease x 1.3, ease rises.
 * A word is "mastered" once its interval reaches 21 days.
 */
export function schedule(state: VocabState, grade: Grade, today: string): VocabState {
  let { ease, interval, reps, lapses } = state;
  switch (grade) {
    case 'again':
      reps = 0;
      lapses += 1;
      interval = 0;
      ease = Math.max(1.3, ease - 0.2);
      break;
    case 'hard':
      reps += 1;
      interval = Math.max(1, Math.round(Math.max(interval, 1) * 1.2));
      ease = Math.max(1.3, ease - 0.15);
      break;
    case 'good':
      reps += 1;
      interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.max(1, Math.round(interval * ease));
      break;
    case 'easy':
      reps += 1;
      interval = reps === 1 ? 3 : reps === 2 ? 6 : Math.max(1, Math.round(interval * ease * 1.3));
      ease = ease + 0.15;
      break;
  }
  const status = interval >= 21 ? 'mastered' : interval >= 1 ? 'review' : 'learning';
  return { ...state, ease, interval, reps, lapses, status, due: addDays(today, interval) };
}

export function isDue(state: VocabState, today: string): boolean {
  return state.status !== 'new' && state.due <= today;
}

/** New words are studied as soon as they are added, so they count as available for study. */
export function isStudyable(state: VocabState, today: string): boolean {
  return state.status === 'new' || state.due <= today;
}
