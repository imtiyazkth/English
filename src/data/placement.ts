import type { McqEx, StageId } from '../types';
import { mcq } from './builders';

export interface PlacementTier {
  stage: StageId;
  questions: McqEx[];
}

/**
 * A short, rough placement check (2 questions per level). It only SUGGESTS a starting level.
 * It is not a certified assessment and does not produce a CEFR score.
 */
export const PLACEMENT: PlacementTier[] = [
  {
    stage: 'pre-a1',
    questions: [
      mcq('pl-1', 'vocabulary', 'What do you say in the morning?', ['Good night', 'Good morning', 'Sorry'], 1, 'सुबह: Good morning।'),
      mcq('pl-2', 'grammar', 'I ___ a student.', ['am', 'is', 'are'], 0, 'I के साथ am।'),
    ],
  },
  {
    stage: 'a1',
    questions: [
      mcq('pl-3', 'grammar', 'She ___ in a bank.', ['work', 'works', 'working'], 1, 'She के साथ works।'),
      mcq('pl-4', 'grammar', 'I saw ___ elephant.', ['a', 'an', 'the'], 1, 'स्वर की आवाज़ से पहले an।'),
    ],
  },
  {
    stage: 'a2',
    questions: [
      mcq('pl-5', 'grammar', 'Yesterday we ___ to the market.', ['go', 'went', 'gone'], 1, 'बीते कल: went।'),
      mcq('pl-6', 'grammar', 'You have a fever. You ___ rest.', ['should', 'am', 'does'], 0, 'सलाह: should।'),
    ],
  },
  {
    stage: 'b1',
    questions: [
      mcq('pl-7', 'grammar', 'I ___ never ___ sushi.', ['have / eaten', 'did / ate', 'am / eat'], 0, 'Present perfect: have never eaten।'),
      mcq('pl-8', 'grammar', 'It is cheap. ___, it is slow.', ['However', 'Because', 'Or'], 0, 'विरोध: However।'),
    ],
  },
  {
    stage: 'b2',
    questions: [
      mcq('pl-9', 'grammar', 'If I ___ more time, I would learn French.', ['have', 'had', 'will have'], 1, 'Second conditional: If + past।'),
      mcq('pl-10', 'grammar', 'The letter ___ yesterday.', ['sent', 'was sent', 'sends'], 1, 'Passive: was sent।'),
    ],
  },
  {
    stage: 'c1',
    questions: [
      mcq(
        'pl-11',
        'reading',
        'Which sentence is the most cautious?',
        ['The data prove the theory.', 'The data seem to support the theory.', 'The data are the theory.'],
        1,
        'seem to support = सावधान दावा।',
      ),
      mcq(
        'pl-12',
        'writing',
        'Choose the most formal request.',
        ['Send me the file.', 'Could you send the file?', 'I would be grateful if you could send me the file.'],
        2,
        'सबसे औपचारिक: I would be grateful if you could...',
      ),
    ],
  },
];

/** Suggest a stage: the last stage in order where the learner answered both questions correctly, stopping at the first failed tier. */
export function suggestStage(correctByQuestion: Record<string, boolean>): StageId {
  let level: StageId = 'pre-a1';
  let passedAny = false;
  for (const tier of PLACEMENT) {
    const ok = tier.questions.every((q) => correctByQuestion[q.id]);
    if (!ok) break;
    level = tier.stage;
    passedAny = true;
  }
  if (!passedAny) return 'pre-a1';
  // Passing a tier means they are at ease at that level; suggest the next one when it exists.
  const order: StageId[] = PLACEMENT.map((t) => t.stage);
  const idx = order.indexOf(level);
  return order[Math.min(idx + 1, order.length - 1)];
}
