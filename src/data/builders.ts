import type {
  ArrangeEx,
  CorrectEx,
  DictationEx,
  FillEx,
  MatchEx,
  McqEx,
  SpeakEx,
  Skill,
  TranslateEx,
  WriteEx,
} from '../types';

/** Small constructors that keep the curriculum data files compact and typed. */

export const mcq = (
  id: string,
  skill: Skill,
  prompt: string,
  options: string[],
  answer: number,
  explanationHi: string,
  extra: Partial<Pick<McqEx, 'passage' | 'audioText' | 'hintHi'>> = {},
): McqEx => ({ id, type: 'mcq', skill, prompt, options, answer, explanationHi, ...extra });

export const fill = (
  id: string,
  skill: Skill,
  prompt: string,
  sentence: string,
  answers: string[],
  explanationHi: string,
  extra: Partial<Pick<FillEx, 'caseSensitive' | 'hintHi'>> = {},
): FillEx => ({ id, type: 'fill', skill, prompt, sentence, answers, explanationHi, ...extra });

export const hiEn = (
  id: string,
  skill: Skill,
  source: string,
  answers: string[],
  explanationHi: string,
): TranslateEx => ({ id, type: 'translate', skill, direction: 'hi-en', source, answers, explanationHi });

export const enHi = (
  id: string,
  skill: Skill,
  source: string,
  bank: string[],
  answers: string[],
  explanationHi: string,
): TranslateEx => ({ id, type: 'translate', skill, direction: 'en-hi', source, bank, answers, explanationHi });

export const arrange = (
  id: string,
  skill: Skill,
  prompt: string,
  words: string[],
  answers: string[],
  explanationHi: string,
): ArrangeEx => ({ id, type: 'arrange', skill, prompt, words, answers, explanationHi });

export const match = (
  id: string,
  skill: Skill,
  prompt: string,
  pairs: [string, string][],
  explanationHi: string,
): MatchEx => ({ id, type: 'match', skill, prompt, pairs, explanationHi });

export const dictation = (
  id: string,
  audioText: string,
  answers: string[],
  explanationHi: string,
  prompt?: string,
): DictationEx => ({ id, type: 'dictation', skill: 'listening', audioText, answers, explanationHi, prompt });

export const correct = (
  id: string,
  skill: Skill,
  wrong: string,
  answers: string[],
  explanationHi: string,
): CorrectEx => ({ id, type: 'correct', skill, wrong, answers, explanationHi });

export const speak = (
  id: string,
  prompt: string,
  modelAnswer: string,
  explanationHi: string,
  extra: Partial<Pick<SpeakEx, 'targetText' | 'keywords' | 'partnerLine'>> = {},
): SpeakEx => ({ id, type: 'speak', skill: 'speaking', prompt, modelAnswer, explanationHi, ...extra });

export const write = (
  id: string,
  prompt: string,
  minWords: number,
  keywords: string[],
  modelAnswer: string,
  explanationHi: string,
): WriteEx => ({ id, type: 'write', skill: 'writing', prompt, minWords, keywords, modelAnswer, explanationHi });
