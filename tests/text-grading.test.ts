import { compareTranscript, countWords, gradeTyped, keywordCoverage, levenshtein, normalizeText, shuffle } from '../src/utils/text';
import { checkWriting } from '../src/utils/writing';
import { gradeExercise } from '../src/utils/grade';
import { arrange, fill, match, mcq, speak, write } from '../src/data/builders';

describe('text normalisation and typed answers', () => {
  it('expands contractions and strips punctuation', () => {
    expect(normalizeText("Don't  Go!")).toBe('do not go');
    expect(normalizeText("I'm happy.")).toBe('i am happy');
    expect(normalizeText("I can't")).toBe('i can not');
    expect(normalizeText('I cannot')).toBe('i can not');
    expect(normalizeText('It’s fine')).toBe('it’s fine'.replace('’', "'").replace("it's", "it's"));
  });
  it('treats curly and straight apostrophes the same', () => {
    expect(normalizeText('don’t')).toBe(normalizeText("don't"));
  });
  it('computes edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('same', 'same')).toBe(0);
  });
  it('accepts multiple correct answers and ignores case/punctuation', () => {
    expect(gradeTyped('She is my sister.', ['she is my sister']).correct).toBe(true);
    expect(gradeTyped('THANKS', ['thank you', 'thanks']).correct).toBe(true);
    expect(gradeTyped("I don't go", ['I do not go']).correct).toBe(true);
  });
  it('flags a close misspelling as near, not correct', () => {
    const g = gradeTyped('shee is my sister', ['she is my sister']);
    expect(g.correct).toBe(false);
    expect(g.near).toBe(true);
  });
  it('is not near for unrelated text and rejects empty', () => {
    expect(gradeTyped('banana', ['she is my sister']).near).toBe(false);
    expect(gradeTyped('', ['x']).correct).toBe(false);
  });
  it('can be case-sensitive when asked', () => {
    expect(gradeTyped('t', ['T'], { caseSensitive: true }).correct).toBe(false);
    expect(gradeTyped('T', ['T'], { caseSensitive: true }).correct).toBe(true);
  });
  it('compares Hindi word sequences', () => {
    expect(gradeTyped('आपसे मिलकर अच्छा लगा', ['आपसे मिलकर अच्छा लगा']).correct).toBe(true);
  });
  it('counts words and shuffles without losing items', () => {
    expect(countWords('  a b  c ')).toBe(3);
    expect(countWords('')).toBe(0);
    const s = shuffle([1, 2, 3, 4, 5], () => 0.3);
    expect([...s].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('speech transcript comparison (not a pronunciation score)', () => {
  it('matches identical text fully', () => {
    expect(compareTranscript('good morning', 'Good morning.').ratio).toBe(1);
  });
  it('reports missing words', () => {
    const c = compareTranscript('how are you', 'how you');
    expect(c.missing).toEqual(['are']);
    expect(c.ratio).toBeCloseTo(2 / 3, 5);
  });
  it('reports extra words', () => {
    const c = compareTranscript('hello', 'hello there');
    expect(c.extra).toEqual(['there']);
  });
  it('finds whole-word keyword phrases', () => {
    const k = keywordCoverage('I would like tea please', ['would like', 'please', 'water']);
    expect(k.hits).toEqual(['would like', 'please']);
    expect(k.misses).toEqual(['water']);
  });
  it('does not match a keyword inside another word', () => {
    expect(keywordCoverage('therefore', ['the']).hits).toEqual([]);
  });
});

describe('writing checks', () => {
  it('blocks answers that are too short', () => {
    expect(checkWriting('Hi.', { minWords: 5, keywords: [] }).passed).toBe(false);
  });
  it('flags capital letter, end punctuation and lower-case I without blocking', () => {
    const r = checkWriting('i am happy and i like tea', { minWords: 3, keywords: [] });
    const kinds = r.issues.map((i) => i.kind);
    expect(kinds).toContain('capital');
    expect(kinds).toContain('punctuation');
    expect(kinds).toContain('pronoun-i');
    expect(r.passed).toBe(true);
  });
  it('requires most keywords', () => {
    const r = checkWriting('This is a long enough sentence without them at all.', { minWords: 3, keywords: ['because', 'however'] });
    expect(r.passed).toBe(false);
    expect(r.keywordMisses).toEqual(['because', 'however']);
  });
  it('passes a clean answer with no issues', () => {
    const r = checkWriting('My name is Ravi. I am from India.', { minWords: 5, keywords: ['my name'] });
    expect(r.issues).toHaveLength(0);
    expect(r.passed).toBe(true);
  });
});

describe('gradeExercise', () => {
  it('grades multiple choice', () => {
    const ex = mcq('t1', 'grammar', 'q', ['a', 'b', 'c'], 1, 'x');
    expect(gradeExercise(ex, 1).correct).toBe(true);
    expect(gradeExercise(ex, 0).correct).toBe(false);
    expect(gradeExercise(ex, 1).expected).toBe('b');
  });
  it('grades fill-in-the-blank', () => {
    const ex = fill('t2', 'grammar', 'p', 'I ___ a student.', ['am'], 'x');
    expect(gradeExercise(ex, 'AM').correct).toBe(true);
    expect(gradeExercise(ex, 'is').correct).toBe(false);
  });
  it('grades arranged words', () => {
    const ex = arrange('t3', 'writing', 'p', ['is', 'My', 'name'], ['My name is'], 'x');
    expect(gradeExercise(ex, 'My name is').correct).toBe(true);
    expect(gradeExercise(ex, 'name My is').correct).toBe(false);
  });
  it('grades matching by number of mistakes', () => {
    const ex = match('t4', 'vocabulary', 'p', [['a', 'b'], ['c', 'd']], 'x');
    expect(gradeExercise(ex, 0).correct).toBe(true);
    expect(gradeExercise(ex, 2).correct).toBe(false);
  });
  it('grades read-aloud by recognised target words', () => {
    const ex = speak('t5', 'p', 'Good morning.', 'x', { targetText: 'Good morning' });
    expect(gradeExercise(ex, 'good morning').correct).toBe(true);
    expect(gradeExercise(ex, 'bad evening').correct).toBe(false);
    expect(gradeExercise(ex, 'good morning').detail).toContain('Recognised');
  });
  it('grades open speaking by useful words', () => {
    const ex = speak('t6', 'p', 'I would like tea, please.', 'x', { keywords: ['would like', 'please'] });
    expect(gradeExercise(ex, 'I would like tea please').correct).toBe(true);
    expect(gradeExercise(ex, 'tea').correct).toBe(false);
  });
  it('grades writing with the rule-based checker', () => {
    const ex = write('t7', 'p', 5, ['because'], 'm', 'x');
    expect(gradeExercise(ex, 'I stayed home because it was raining.').correct).toBe(true);
    expect(gradeExercise(ex, 'ok').correct).toBe(false);
  });
});
