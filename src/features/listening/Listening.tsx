import { useCallback, useMemo, useState } from 'react';
import { Banner, Button, Card, Chip, Empty, LinkButton, PageHeader, AudioButton } from '../../components/ui';
import { ExerciseRunner, RunSummary } from '../../components/ExerciseRunner';
import { ResultCard } from '../../components/ResultCard';
import { Link } from '../../app/router';
import { useStore } from '../../app/store';
import { useSpeech } from '../../hooks/useSpeech';
import { DICTATION_SETS, LISTENING, MINIMAL_PAIRS } from '../../data/listening';
import { STAGE_BY_ID } from '../../data/stages';
import { recordAnswer } from '../../services/progress';
import { stagesUpTo } from '../../services/selectors';
import { shuffle } from '../../utils/text';
import type { DictationEx } from '../../types';

type Tab = 'passages' | 'pairs' | 'dictation';

export function ListeningHome() {
  const { data } = useStore();
  const sp = useSpeech();
  const [tab, setTab] = useState<Tab>('passages');
  return (
    <div className="stack">
      <PageHeader title="Listening" titleHi="सुनना" back="/practise" />
      {!sp.supported && <Banner tone="warn">Audio is not available in this browser, so listening exercises show the text instead. Try Chrome on Android for voice support.</Banner>}
      <div className="tabs" role="tablist" aria-label="Listening sections">
        {([['passages', 'Passages'], ['pairs', 'Sound pairs'], ['dictation', 'Dictation']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'passages' && (
        <ul className="lesson-list">
          {LISTENING.map((l) => {
            const done = data.attempts.some((a) => a.contextId === l.id && a.context === 'practice');
            return (
              <li key={l.id}>
                <Link to={`/listening/${l.id}`} className="lesson-item">
                  <span className="lesson-body">
                    <strong>{l.title}</strong>
                    <span className="hi muted block" lang="hi">{l.titleHi}</span>
                    <span className="muted small">{STAGE_BY_ID[l.stage].label}</span>
                  </span>
                  {done && <Chip tone="info">Practised</Chip>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {tab === 'pairs' && <MinimalPairs />}
      {tab === 'dictation' && <DictationPractice />}
    </div>
  );
}

const SPEEDS = [
  { label: 'Slow', rate: 0.6 },
  { label: 'Normal', rate: 0.9 },
  { label: 'Natural', rate: 1.1 },
];

export function ListeningPlayer({ id }: { id: string }) {
  const item = LISTENING.find((l) => l.id === id);
  const sp = useSpeech();
  const [rate, setRate] = useState(0.9);
  const [showText, setShowText] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [phase, setPhase] = useState<'listen' | 'questions' | 'done'>('listen');
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const onFinish = useCallback((s: RunSummary) => {
    setSummary(s);
    setPhase('done');
    setShowText(true);
  }, []);

  if (!item) {
    return (
      <div className="stack">
        <PageHeader title="Not found" back="/listening" />
        <Empty title="We could not find that listening item." action={<LinkButton to="/listening">Back</LinkButton>} />
      </div>
    );
  }
  const textVisible = showText || !sp.supported || phase === 'done';
  return (
    <div className="stack">
      <PageHeader title={item.title} titleHi={item.titleHi} back="/listening" />
      <Card className="stack">
        <div className="row wrap" role="group" aria-label="Playback speed">
          {SPEEDS.map((s) => (
            <Button key={s.label} variant={rate === s.rate ? 'primary' : 'secondary'} size="sm" aria-pressed={rate === s.rate} onClick={() => setRate(s.rate)}>
              {s.label}
            </Button>
          ))}
        </div>
        <div className="row wrap">
          {sp.supported && (
            <>
              <Button variant="primary" size="lg" onClick={() => (sp.speaking ? (sp.stop(), setNow(null)) : sp.playLines(item.lines.map((l) => l.text), { rate, onLine: setNow }))}>
                {sp.speaking ? 'Stop' : 'Play'}
              </Button>
              <Button variant="ghost" onClick={() => setShowText((s) => !s)}>
                {textVisible ? 'Hide transcript' : 'Show transcript'}
              </Button>
            </>
          )}
        </div>
        {sp.error && <p className="muted small" role="status">{sp.error}</p>}
        {textVisible ? (
          <div className="transcript-box">
            {item.lines.map((l, i) => (
              <p key={i} className={now === i ? 'now' : ''}>
                {l.speaker && <strong>{l.speaker}: </strong>}
                {l.text}
              </p>
            ))}
          </div>
        ) : (
          <p className="muted">Listen first, then answer the questions. The transcript is hidden so you practise real listening.</p>
        )}
        {phase === 'listen' && (
          <Button variant="primary" onClick={() => { sp.stop(); setPhase('questions'); }}>
            Answer the questions
          </Button>
        )}
      </Card>
      {phase === 'questions' && (
        <Card className="stack">
          <p className="small muted">You can replay the audio above at any time.</p>
          <ExerciseRunner exercises={item.questions} context="practice" contextId={item.id} onFinish={onFinish} finishLabel="See results" />
        </Card>
      )}
      {phase === 'done' && summary && (
        <ResultCard title="Listening results" summary={summary}>
          <div className="row wrap">
            <Button variant="secondary" onClick={() => { setSummary(null); setPhase('questions'); }}>
              Try again
            </Button>
            <LinkButton to="/listening" variant="primary">
              More listening
            </LinkButton>
          </div>
        </ResultCard>
      )}
    </div>
  );
}

function MinimalPairs() {
  const { update } = useStore();
  const sp = useSpeech();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [picked, setPicked] = useState<string | null>(null);
  const q = useMemo(() => {
    const pair = MINIMAL_PAIRS[Math.floor(Math.random() * MINIMAL_PAIRS.length)];
    const target = Math.random() < 0.5 ? pair.a : pair.b;
    return { pair, target };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  function choose(word: string) {
    if (picked) return;
    setPicked(word);
    const ok = word === q.target;
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
    update((d) =>
      recordAnswer(d, {
        context: 'practice',
        contextId: 'minimal-pairs',
        exerciseId: `pair:${q.pair.a}-${q.pair.b}`,
        skill: 'listening',
        type: 'mcq',
        correct: ok,
        ms: 0,
      }),
    );
  }

  return (
    <Card className="stack">
      <h2>Which word did you hear?</h2>
      <p className="hi muted" lang="hi">दो मिलती-जुलती आवाज़ों में फ़र्क़ पहचानने का अभ्यास।</p>
      {sp.supported ? (
        <div className="row wrap">
          <Button variant="primary" size="lg" onClick={() => sp.play(q.target, { slow: true })}>
            Play the word
          </Button>
        </div>
      ) : (
        <Banner tone="warn">Audio is not available here, so this exercise cannot be done on this device.</Banner>
      )}
      <div className="row wrap" role="group" aria-label="Choose the word you heard">
        {[q.pair.a, q.pair.b].map((w) => (
          <Button key={w} variant="secondary" size="lg" disabled={!!picked || !sp.supported} onClick={() => choose(w)}>
            {w}
          </Button>
        ))}
      </div>
      {picked && (
        <div className={`feedback ${picked === q.target ? 'ok' : 'bad'}`} role="status">
          <p className="feedback-title">{picked === q.target ? 'Correct! सही!' : `Not quite — it was “${q.target}”.`}</p>
          <p className="hi" lang="hi">{q.pair.noteHi}</p>
          <div className="row wrap">
            <AudioButton text={q.pair.a} label={q.pair.a} showSlow={false} compact />
            <AudioButton text={q.pair.b} label={q.pair.b} showSlow={false} compact />
          </div>
          <Button variant="primary" onClick={() => { setPicked(null); setRound((r) => r + 1); }}>
            Next pair
          </Button>
        </div>
      )}
      <p className="muted small">This session: {score.right}/{score.total}</p>
    </Card>
  );
}

function DictationPractice() {
  const { data } = useStore();
  const [run, setRun] = useState(0);
  const [started, setStarted] = useState(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const onFinish = useCallback((s: RunSummary) => setSummary(s), []);
  const exercises = useMemo<DictationEx[]>(() => {
    const stages = stagesUpTo(data.profile?.level ?? 'pre-a1');
    const pool = DICTATION_SETS.filter((d) => (stages as string[]).includes(d.stage));
    return shuffle(pool.length ? pool : DICTATION_SETS)
      .slice(0, 5)
      .map((d) => ({
        id: `dict-${d.id}`,
        type: 'dictation' as const,
        skill: 'listening' as const,
        audioText: d.text,
        answers: [d.text],
        explanationHi: `${d.text} = ${d.hi}`,
        prompt: 'Type the sentence you hear.',
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  if (!started) {
    return (
      <Card className="stack">
        <h2>Dictation</h2>
        <p>Listen to a sentence and type it. 5 sentences for your level. Spelling and punctuation are forgiving; capital letters do not matter here.</p>
        <Button variant="primary" size="lg" onClick={() => setStarted(true)}>Start dictation</Button>
      </Card>
    );
  }
  if (summary) {
    return (
      <ResultCard title="Dictation results" summary={summary}>
        <Button variant="primary" onClick={() => { setSummary(null); setRun((r) => r + 1); }}>
          New set
        </Button>
      </ResultCard>
    );
  }
  return (
    <Card>
      <ExerciseRunner key={run} exercises={exercises} context="practice" contextId="dictation" onFinish={onFinish} finishLabel="See results" />
    </Card>
  );
}
