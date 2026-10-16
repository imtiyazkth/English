import { useCallback, useMemo, useState } from 'react';
import { Banner, Button, Card, Chip, Empty, LinkButton, PageHeader, AudioButton } from '../../components/ui';
import { ExerciseRunner, RunSummary } from '../../components/ExerciseRunner';
import { ResultCard } from '../../components/ResultCard';
import { Link } from '../../app/router';
import { useStore } from '../../app/store';
import { READING } from '../../data/reading';
import { VOCAB } from '../../data/vocab';
import { STAGE_BY_ID } from '../../data/stages';
import { addCustomVocab, addVocabIds } from '../../services/progress';

export function ReadingList() {
  const { data } = useStore();
  return (
    <div className="stack">
      <PageHeader title="Reading" titleHi="पढ़ना" back="/practise" />
      <p className="muted">Short passages from first words to formal English. Tap any word while reading to see its meaning, hear it, and save it.</p>
      <ul className="lesson-list">
        {READING.map((p) => {
          const done = data.attempts.some((a) => a.contextId === p.id && a.context === 'practice');
          return (
            <li key={p.id}>
              <Link to={`/reading/${p.id}`} className="lesson-item">
                <span className="lesson-body">
                  <strong>{p.title}</strong>
                  <span className="hi muted block" lang="hi">{p.titleHi}</span>
                  <span className="muted small">{p.kind} · {STAGE_BY_ID[p.stage].label}</span>
                </span>
                {done && <Chip tone="info">Practised</Chip>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface Token {
  text: string;
  word: boolean;
}

function tokenize(text: string): Token[] {
  const out: Token[] = [];
  const re = /([A-Za-z]+(?:['’][A-Za-z]+)?)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), word: false });
    out.push({ text: m[0], word: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), word: false });
  return out;
}

export function ReadingPlayer({ id }: { id: string }) {
  const passage = READING.find((p) => p.id === id);
  const { data, update, toast } = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [customHi, setCustomHi] = useState('');
  const [phase, setPhase] = useState<'read' | 'questions' | 'done'>('read');
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const tokens = useMemo(() => (passage ? tokenize(passage.text) : []), [passage]);
  const onFinish = useCallback((s: RunSummary) => {
    setSummary(s);
    setPhase('done');
  }, []);

  if (!passage) {
    return (
      <div className="stack">
        <PageHeader title="Passage not found" back="/reading" />
        <Empty title="We could not find that passage." action={<LinkButton to="/reading">Back to Reading</LinkButton>} />
      </div>
    );
  }

  const key = sel ? sel.toLowerCase().replace(/['’]s$/, '') : null;
  const entry = key ? (passage.glossary[key] ?? passage.glossary[sel!.toLowerCase()]) : undefined;
  const vocabHit = key ? VOCAB.find((v) => v.en === key) : undefined;
  const hindi = entry?.hi ?? vocabHit?.hi;
  const already = key ? !!data.vocab[vocabHit?.id ?? `custom-${key}`] : false;

  function save() {
    if (!key) return;
    if (vocabHit) {
      update((d) => addVocabIds(d, [vocabHit.id]));
      toast(`Saved “${key}” to your vocabulary.`);
    } else {
      const meaning = (entry?.hi ?? customHi).trim();
      if (!meaning) return;
      update((d) => addCustomVocab(d, { en: key, hi: meaning, example: entry?.example }).data);
      toast(`Saved “${key}” to your vocabulary.`);
      setCustomHi('');
    }
  }

  return (
    <div className="stack">
      <PageHeader title={passage.title} titleHi={passage.titleHi} back="/reading" />
      <Card className="stack">
        <div className="row wrap">
          <Chip tone="info">{STAGE_BY_ID[passage.stage].label}</Chip>
          <Chip>{passage.kind}</Chip>
          <AudioButton text={passage.text.replace(/\n/g, ' ')} label="Listen to passage" />
        </div>
        <div className="passage reading-text" lang="en">
          {tokens.map((t, i) =>
            t.word ? (
              <button key={i} type="button" className={`word-btn${sel && t.text.toLowerCase() === sel.toLowerCase() ? ' on' : ''}`} onClick={() => { setSel(t.text); setCustomHi(''); }} aria-label={`Word: ${t.text}. Tap for meaning`}>
                {t.text}
              </button>
            ) : (
              <span key={i}>{t.text}</span>
            ),
          )}
        </div>
        {sel && key && (
          <div className="word-panel stack" role="region" aria-label="Word help" aria-live="polite">
            <div className="row between">
              <strong className="word-title">{sel}</strong>
              <Button variant="ghost" size="sm" onClick={() => setSel(null)}>
                Close
              </Button>
            </div>
            <AudioButton text={sel} compact />
            {hindi ? (
              <p className="hi" lang="hi">{hindi}</p>
            ) : (
              <p className="muted">There is no built-in meaning for this word yet. You can type your own Hindi meaning to save it.</p>
            )}
            {(entry?.example ?? vocabHit?.example?.en) && <p className="muted small">e.g. {entry?.example ?? vocabHit?.example?.en}</p>}
            {!hindi && (
              <label className="field">
                <span className="field-label">Your Hindi meaning</span>
                <input className="input" value={customHi} onChange={(e) => setCustomHi(e.target.value)} lang="hi" maxLength={80} />
              </label>
            )}
            <div>
              <Button variant="secondary" onClick={save} disabled={already || (!hindi && !customHi.trim())}>
                {already ? 'Saved' : 'Save to vocabulary'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {phase === 'read' && (
        <Button variant="primary" size="lg" onClick={() => setPhase('questions')}>
          I have read it — answer questions
        </Button>
      )}
      {phase === 'questions' && (
        <Card>
          <ExerciseRunner exercises={passage.questions} context="practice" contextId={passage.id} onFinish={onFinish} finishLabel="See results" />
        </Card>
      )}
      {phase === 'done' && summary && (
        <ResultCard title="Comprehension results" summary={summary}>
          <div className="row wrap">
            <Button variant="secondary" onClick={() => { setSummary(null); setPhase('questions'); }}>
              Try the questions again
            </Button>
            <LinkButton to="/reading" variant="primary">
              Another passage
            </LinkButton>
          </div>
        </ResultCard>
      )}
      <Banner tone="info">Meanings are short Hindi glosses to help you understand this passage. A word can mean different things in other sentences.</Banner>
    </div>
  );
}
