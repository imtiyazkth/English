import type { Exercise } from '../types';
import { compareTranscript, countWords, gradeTyped, keywordCoverage, normalizeText } from './text';
import { checkWriting } from './writing';

export interface Grade {
  correct: boolean;
  /** Typed answer was close to a correct one (spelling slip). */
  near?: boolean;
  /** Text to show as the correct answer. */
  expected: string;
  /** Extra, honest detail for speaking/writing feedback. */
  detail?: string;
}

/**
 * Grades one response.
 *  mcq: response = chosen option index (number)
 *  match: response = number of mistakes (number)
 *  everything else: response = text (typed answer, joined tiles, transcript, written text)
 */
export function gradeExercise(ex: Exercise, response: string | number): Grade {
  switch (ex.type) {
    case 'mcq':
      return { correct: response === ex.answer, expected: ex.options[ex.answer] };
    case 'match':
      return { correct: response === 0, expected: ex.pairs.map(([a, b]) => `${a} = ${b}`).join(', ') };
    case 'fill': {
      const g = gradeTyped(String(response), ex.answers, { caseSensitive: ex.caseSensitive });
      return { correct: g.correct, near: g.near, expected: ex.answers[0] };
    }
    case 'translate':
    case 'arrange':
    case 'dictation':
    case 'correct': {
      const g = gradeTyped(String(response), ex.answers);
      return { correct: g.correct, near: g.near, expected: ex.answers[0] };
    }
    case 'speak': {
      const heard = String(response);
      if (ex.targetText) {
        const c = compareTranscript(ex.targetText, heard);
        return {
          correct: c.ratio >= 0.7,
          expected: ex.targetText,
          detail: `Recognised ${c.matched.length} of ${c.matched.length + c.missing.length} target words (${Math.round(c.ratio * 100)}%).`,
        };
      }
      if (ex.keywords && ex.keywords.length) {
        const k = keywordCoverage(heard, ex.keywords);
        const enough = countWords(heard) >= 2;
        return {
          correct: enough && k.ratio >= 0.5,
          expected: ex.modelAnswer,
          detail: `Used ${k.hits.length} of ${ex.keywords.length} useful words/phrases.`,
        };
      }
      return { correct: countWords(heard) >= 3, expected: ex.modelAnswer };
    }
    case 'write': {
      const r = checkWriting(String(response), ex);
      return { correct: r.passed, expected: ex.modelAnswer, detail: `${r.words} words` };
    }
  }
}

/** Human-friendly text of the correct answer for the feedback panel. */
export function expectedText(ex: Exercise): string {
  switch (ex.type) {
    case 'mcq':
      return ex.options[ex.answer];
    case 'match':
      return ex.pairs.map(([a, b]) => `${a} → ${b}`).join('  ·  ');
    case 'speak':
      return ex.targetText ?? ex.modelAnswer;
    case 'write':
      return ex.modelAnswer;
    default:
      return ex.answers[0];
  }
}

export { normalizeText };
