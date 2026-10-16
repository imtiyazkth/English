/** Text helpers used for answer checking and speech feedback. */

const CONTRACTIONS: [RegExp, string][] = [
  [/\bcan't\b/g, 'can not'],
  [/\bcannot\b/g, 'can not'],
  [/\bwon't\b/g, 'will not'],
  [/\bshan't\b/g, 'shall not'],
  [/\b(\w+)n't\b/g, '$1 not'],
  [/\bi'm\b/g, 'i am'],
  [/\b(\w+)'re\b/g, '$1 are'],
  [/\b(\w+)'ve\b/g, '$1 have'],
  [/\b(\w+)'ll\b/g, '$1 will'],
];

/** Normalises text for comparison: unicode, quotes, case, punctuation, spaces, contractions. */
export function normalizeText(input: string, opts: { keepCase?: boolean } = {}): string {
  let s = input
    .normalize('NFC')
    .replace(/[‘’´`]/g, "'")
    .replace(/[“”]/g, '"');
  if (!opts.keepCase) s = s.toLowerCase();
  if (!opts.keepCase) {
    for (const [re, rep] of CONTRACTIONS) s = s.replace(re, rep);
  } else {
    // keep case but still expand the most common contractions
    s = s.replace(/n't\b/gi, ' not').replace(/\bI'm\b/g, 'I am');
  }
  s = s.replace(/[.,!?;:"।()–—\-]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

export function wordsOf(input: string): string[] {
  const n = normalizeText(input);
  return n ? n.split(' ') : [];
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

export interface TypedGrade {
  correct: boolean;
  /** Wrong, but within a small spelling distance of an accepted answer. */
  near: boolean;
  expected: string;
}

export function gradeTyped(
  input: string,
  answers: string[],
  opts: { caseSensitive?: boolean } = {},
): TypedGrade {
  const keepCase = !!opts.caseSensitive;
  const norm = normalizeText(input, { keepCase });
  const accepted = answers.map((a) => normalizeText(a, { keepCase }));
  if (norm && accepted.includes(norm)) return { correct: true, near: false, expected: answers[0] };
  const maxDist = norm.length > 8 ? 2 : 1;
  const near = !!norm && accepted.some((a) => levenshtein(norm.toLowerCase(), a.toLowerCase()) <= maxDist);
  return { correct: false, near, expected: answers[0] };
}

export interface TranscriptComparison {
  matched: string[];
  missing: string[];
  extra: string[];
  ratio: number;
}

/**
 * Compares what a speech recogniser heard with the target text. This measures whether the
 * recogniser understood the intended words. It is NOT a pronunciation score.
 */
export function compareTranscript(target: string, heard: string): TranscriptComparison {
  const t = wordsOf(target);
  const pool = wordsOf(heard);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const w of t) {
    const idx = pool.indexOf(w);
    if (idx >= 0) {
      matched.push(w);
      pool.splice(idx, 1);
    } else missing.push(w);
  }
  return { matched, missing, extra: pool, ratio: t.length ? matched.length / t.length : 0 };
}

/** Fraction of keywords/phrases present in the text (whole-word match). */
export function keywordCoverage(text: string, keywords: string[]): { hits: string[]; misses: string[]; ratio: number } {
  const padded = ` ${normalizeText(text)} `;
  const hits: string[] = [];
  const misses: string[] = [];
  for (const k of keywords) {
    const nk = normalizeText(k);
    (padded.includes(` ${nk} `) ? hits : misses).push(k);
  }
  return { hits, misses, ratio: keywords.length ? hits.length / keywords.length : 1 };
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
