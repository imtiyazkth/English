import type { WriteEx } from '../types';
import { countWords, keywordCoverage } from './text';

export interface WritingIssue {
  kind: 'capital' | 'punctuation' | 'pronoun-i' | 'spacing' | 'length' | 'keywords';
  en: string;
  hi: string;
  /** Blocking issues make the answer "needs another try". */
  blocking: boolean;
}

export interface WritingReport {
  words: number;
  issues: WritingIssue[];
  keywordHits: string[];
  keywordMisses: string[];
  passed: boolean;
}

/**
 * Rule-based checks only (length, required words, capital letter, end punctuation, "I", spaces).
 * It does not understand meaning or grammar in general; deeper feedback needs the AI tutor.
 */
export function checkWriting(text: string, ex: Pick<WriteEx, 'minWords' | 'keywords'>): WritingReport {
  const issues: WritingIssue[] = [];
  const trimmed = text.trim();
  const words = countWords(trimmed);

  if (words < ex.minWords) {
    issues.push({
      kind: 'length',
      en: `Write at least ${ex.minWords} words (you wrote ${words}).`,
      hi: `कम से कम ${ex.minWords} शब्द लिखें (आपने ${words} लिखे)।`,
      blocking: true,
    });
  }
  const kw = keywordCoverage(trimmed, ex.keywords);
  if (kw.misses.length) {
    issues.push({
      kind: 'keywords',
      en: `Try to use: ${kw.misses.join(', ')}.`,
      hi: `इन शब्दों का इस्तेमाल करने की कोशिश करें: ${kw.misses.join(', ')}।`,
      blocking: kw.ratio < 0.5,
    });
  }
  if (trimmed && !/^[A-Z]/.test(trimmed)) {
    issues.push({
      kind: 'capital',
      en: 'Start the first sentence with a capital letter.',
      hi: 'पहला वाक्य बड़े अक्षर (Capital letter) से शुरू करें।',
      blocking: false,
    });
  }
  if (trimmed && !/[.!?]["')]?$/.test(trimmed)) {
    issues.push({
      kind: 'punctuation',
      en: 'End the last sentence with . ! or ?',
      hi: 'आख़िरी वाक्य के अंत में . ! या ? लगाएँ।',
      blocking: false,
    });
  }
  if (/(^|[\s"'(])i([\s,.!?']|$)/.test(trimmed)) {
    issues.push({
      kind: 'pronoun-i',
      en: 'The word "I" is always a capital letter.',
      hi: 'अंग्रेज़ी में "I" (मैं) हमेशा बड़े अक्षर में लिखा जाता है।',
      blocking: false,
    });
  }
  if (/ {2,}/.test(trimmed)) {
    issues.push({
      kind: 'spacing',
      en: 'There is a double space between words.',
      hi: 'शब्दों के बीच दो स्पेस हैं; एक ही रखें।',
      blocking: false,
    });
  }
  return {
    words,
    issues,
    keywordHits: kw.hits,
    keywordMisses: kw.misses,
    passed: !issues.some((i) => i.blocking),
  };
}
