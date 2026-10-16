import { memoryBackend } from '../src/services/storage/backends';
import { createPersistence } from '../src/services/storage/persistence';
import { completeLesson, emptyData } from '../src/services/progress';
import { matchPath, parseHash } from '../src/utils/route';

describe('persistence', () => {
  it('saves and reloads learner data (progress survives a restart)', async () => {
    const backend = memoryBackend();
    const p1 = createPersistence(backend, 0);
    const d = completeLesson(emptyData(), { id: 'L1', vocab: ['hello'] }, 9, 10);
    p1.schedule(d);
    await p1.flush();
    const p2 = createPersistence(backend, 0);
    const loaded = await p2.load();
    expect(loaded.lessons.L1.status).toBe('completed');
    expect(Object.keys(loaded.vocab)).toEqual(['hello']);
  });
  it('loads fresh data when nothing is stored', async () => {
    const loaded = await createPersistence(memoryBackend()).load();
    expect(loaded.profile).toBeNull();
    expect(loaded.attempts).toHaveLength(0);
  });
  it('recovers from corrupt stored data instead of crashing', async () => {
    const loaded = await createPersistence(memoryBackend('not an object')).load();
    expect(loaded.lessons).toEqual({});
  });
  it('reports a failing backend without throwing', async () => {
    const bad = { name: 'memory' as const, load: async () => null, save: async () => { throw new Error('quota'); }, clear: async () => {} };
    const p = createPersistence(bad, 0);
    p.schedule(emptyData());
    await p.flush();
    expect(p.lastError).toBe('quota');
  });
  it('clears data on reset', async () => {
    const backend = memoryBackend();
    const p = createPersistence(backend, 0);
    p.schedule(completeLesson(emptyData(), { id: 'L1' }, 1, 1));
    await p.flush();
    await p.reset();
    expect((await createPersistence(backend).load()).lessons).toEqual({});
  });
});

describe('route helpers', () => {
  it('parses hashes with and without queries', () => {
    expect(parseHash('').path).toBe('/');
    expect(parseHash('#/learn').path).toBe('/learn');
    const r = parseHash('#/tutor?scenario=phone-call&mode=roleplay');
    expect(r.path).toBe('/tutor');
    expect(r.query.get('scenario')).toBe('phone-call');
  });
  it('matches parameterised patterns', () => {
    expect(matchPath('/lesson/p1-to-be', '/lesson/:id')).toEqual({ id: 'p1-to-be' });
    expect(matchPath('/lesson', '/lesson/:id')).toBeNull();
    expect(matchPath('/lesson/a/b', '/lesson/:id')).toBeNull();
    expect(matchPath('/quiz/skill-reading', '/quiz/:key')).toEqual({ key: 'skill-reading' });
    expect(matchPath('/x/%E0%A4%85', '/x/:id')).toEqual({ id: 'अ' });
    expect(matchPath('/x/%E0%A4%A', '/x/:id')).toBeNull();
  });
});
