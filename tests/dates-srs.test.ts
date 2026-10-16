import { addDays, computeStreak, dateKey, daysBetween, lastNDays, parseKey } from '../src/utils/dates';
import { isDue, newVocabState, schedule } from '../src/utils/srs';

describe('dates (local calendar days)', () => {
  it('formats a local date key', () => {
    expect(dateKey(new Date(2026, 9, 14, 23, 59))).toBe('2026-10-14');
    expect(dateKey(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
  });
  it('counts days between keys', () => {
    expect(daysBetween('2026-10-01', '2026-10-14')).toBe(13);
    expect(daysBetween('2026-10-14', '2026-10-14')).toBe(0);
  });
  it('lists the last n days oldest first', () => {
    expect(lastNDays('2026-10-14', 3)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14']);
  });
  it('parses keys back to local dates', () => {
    const d = parseKey('2026-10-14');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(14);
  });
});

describe('streaks', () => {
  const days = ['2026-10-12', '2026-10-13', '2026-10-14'];
  it('counts consecutive days including today', () => {
    const s = computeStreak(days, '2026-10-14');
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
    expect(s.activeToday).toBe(true);
    expect(s.atRisk).toBe(false);
  });
  it('keeps the streak alive (at risk) if today has no activity yet', () => {
    const s = computeStreak(days, '2026-10-15');
    expect(s.current).toBe(3);
    expect(s.activeToday).toBe(false);
    expect(s.atRisk).toBe(true);
    expect(s.daysSinceLast).toBe(1);
  });
  it('resets after a missed day but remembers the longest streak', () => {
    const s = computeStreak(days, '2026-10-17');
    expect(s.current).toBe(0);
    expect(s.longest).toBe(3);
    expect(s.atRisk).toBe(false);
    expect(s.daysSinceLast).toBe(3);
  });
  it('handles gaps and no activity', () => {
    const s = computeStreak(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10', '2026-10-11'], '2026-10-11');
    expect(s.current).toBe(2);
    expect(s.longest).toBe(3);
    const none = computeStreak([], '2026-10-11');
    expect(none.current).toBe(0);
    expect(none.daysSinceLast).toBeNull();
  });
});

describe('spaced repetition (SM-2-inspired)', () => {
  const today = '2026-10-14';
  it('starts new words due today but not "due" for review', () => {
    const w = newVocabState('a', today);
    expect(w.status).toBe('new');
    expect(w.due).toBe(today);
    expect(isDue(w, today)).toBe(false);
  });
  it('"good" steps: 1 day, 3 days, then interval x ease', () => {
    let w = newVocabState('a', today);
    w = schedule(w, 'good', today);
    expect(w.interval).toBe(1);
    expect(w.due).toBe('2026-10-15');
    expect(w.status).toBe('review');
    w = schedule(w, 'good', today);
    expect(w.interval).toBe(3);
    w = schedule(w, 'good', today);
    expect(w.interval).toBe(8);
  });
  it('"again" returns the word to today and lowers ease', () => {
    let w = schedule(newVocabState('a', today), 'good', today);
    w = schedule(w, 'again', today);
    expect(w.interval).toBe(0);
    expect(w.due).toBe(today);
    expect(w.status).toBe('learning');
    expect(w.lapses).toBe(1);
    expect(w.ease).toBeCloseTo(2.3, 5);
    expect(isDue(w, today)).toBe(true);
  });
  it('"easy" gives a longer first gap and raises ease', () => {
    const w = schedule(newVocabState('a', today), 'easy', today);
    expect(w.interval).toBe(3);
    expect(w.ease).toBeCloseTo(2.65, 5);
  });
  it('"hard" never gives a zero interval', () => {
    const w = schedule(newVocabState('a', today), 'hard', today);
    expect(w.interval).toBe(1);
  });
  it('marks a word mastered once its interval reaches 21 days', () => {
    const base = { ...newVocabState('a', today), reps: 3, interval: 10, ease: 2.5, status: 'review' as const };
    const w = schedule(base, 'good', today);
    expect(w.interval).toBe(25);
    expect(w.status).toBe('mastered');
  });
  it('never lets ease fall below 1.3', () => {
    let w = newVocabState('a', today);
    for (let i = 0; i < 20; i++) w = schedule(w, 'again', today);
    expect(w.ease).toBeCloseTo(1.3, 5);
  });
});
