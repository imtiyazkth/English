import { useCallback, useMemo, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Banner, Button, Card, Chip, Empty, HiNote, LinkButton, PageHeader, AudioButton } from '../../components/ui';
import { ExerciseRunner, RunSummary } from '../../components/ExerciseRunner';
import { ResultCard } from '../../components/ResultCard';
import { Link } from '../../app/router';
import { useStore } from '../../app/store';
import { GRAMMAR } from '../../data/grammar';
import { STAGES, STAGE_BY_ID } from '../../data/stages';
import { toggleSavedGrammar } from '../../services/progress';
import type { StageId } from '../../types';

export function GrammarHome() {
  const { data } = useStore();
  const [q, setQ] = useState('');
  const [stage, setStage] = useState<'all' | StageId | 'saved'>('all');
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GRAMMAR.filter((g) => {
      if (stage === 'saved' && !data.savedGrammar.includes(g.id)) return false;
      if (stage !== 'all' && stage !== 'saved' && g.stage !== stage) return false;
      return !needle || g.title.toLowerCase().includes(needle) || g.titleHi.includes(needle) || g.summaryHi.includes(needle);
    });
  }, [q, stage, data.savedGrammar]);
  return (
    <div className="stack">
      <PageHeader title="Grammar library" titleHi="व्याकरण" back="/practise" />
      <div className="row wrap">
        <label className="field grow">
          <span className="sr-only">Search grammar</span>
          <input className="input" placeholder="Search grammar topics" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="field">
          <span className="sr-only">Level</span>
          <select className="select" value={stage} onChange={(e) => setStage(e.target.value as typeof stage)}>
            <option value="all">All levels</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
            <option value="saved">Saved</option>
          </select>
        </label>
      </div>
      {rows.length === 0 ? (
        <Empty title="No grammar topics match." />
      ) : (
        <ul className="lesson-list">
          {rows.map((g) => (
            <li key={g.id}>
              <Link to={`/grammar/${g.id}`} className="lesson-item">
                <span className="lesson-body">
                  <strong>{g.title}</strong>
                  <span className="hi muted block" lang="hi">{g.titleHi}</span>
                </span>
                <span className="lesson-tags">
                  <Chip>{STAGE_BY_ID[g.stage].cefr}</Chip>
                  {data.savedGrammar.includes(g.id) && <Bookmark size={16} aria-label="Saved" />}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GrammarTopic({ id }: { id: string }) {
  const topic = GRAMMAR.find((g) => g.id === id);
  const { data, update } = useStore();
  const [practising, setPractising] = useState(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const onFinish = useCallback((s: RunSummary) => setSummary(s), []);

  if (!topic) {
    return (
      <div className="stack">
        <PageHeader title="Not found" back="/grammar" />
        <Empty title="We could not find that topic." action={<LinkButton to="/grammar">Back</LinkButton>} />
      </div>
    );
  }
  const saved = data.savedGrammar.includes(topic.id);
  return (
    <div className="stack">
      <PageHeader title={topic.title} titleHi={topic.titleHi} back="/grammar" />
      <Card className="stack">
        <div className="row wrap">
          <Chip tone="info">{STAGE_BY_ID[topic.stage].label}</Chip>
          <Button variant={saved ? 'primary' : 'secondary'} size="sm" aria-pressed={saved} onClick={() => update((d) => toggleSavedGrammar(d, topic.id))}>
            <Bookmark size={14} aria-hidden /> {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
        <HiNote>
          <p>{topic.summaryHi}</p>
          <ul className="plain-list">
            {topic.rulesHi.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </HiNote>
      </Card>
      <Card className="stack">
        <h3>Examples</h3>
        <ul className="teach-list">
          {topic.examples.map((e, i) => (
            <li key={i} className="teach-item">
              <div>
                <p className="teach-en">{e.en}</p>
                <p className="hi" lang="hi">{e.hi}</p>
              </div>
              <AudioButton text={e.en.split('—')[0].replace(/\(.*?\)/g, '')} compact />
            </li>
          ))}
        </ul>
      </Card>
      {topic.lessonId && (
        <LinkButton to={`/lesson/${topic.lessonId}`} variant="secondary">
          Full lesson on this topic
        </LinkButton>
      )}
      {!practising && !summary && (
        <Button variant="primary" size="lg" onClick={() => setPractising(true)}>
          Quick quiz ({topic.quiz.length})
        </Button>
      )}
      {practising && !summary && (
        <Card>
          <ExerciseRunner exercises={topic.quiz} context="practice" contextId={`grammar-${topic.id}`} onFinish={onFinish} finishLabel="See results" />
        </Card>
      )}
      {summary && (
        <ResultCard title="Quiz results" summary={summary}>
          <Button variant="secondary" onClick={() => { setSummary(null); setPractising(true); }}>
            Try again
          </Button>
        </ResultCard>
      )}
      <Banner tone="info">Grammar rules describe common standard usage. Spoken and regional English can differ and is not automatically wrong.</Banner>
    </div>
  );
}
