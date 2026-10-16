import { useCallback, useState } from 'react';
import { Banner, Button, Card, Chip, Empty, LinkButton, PageHeader } from '../../components/ui';
import { ExerciseRunner, RunSummary } from '../../components/ExerciseRunner';
import { ResultCard } from '../../components/ResultCard';
import { Link } from '../../app/router';
import { useStore } from '../../app/store';
import { SPEAKING } from '../../data/speaking';
import { STAGE_BY_ID } from '../../data/stages';
import { sttSupported } from '../../services/speech/stt';
import { ttsSupported } from '../../services/speech/tts';

const KIND_LABEL = { repeat: 'Listen and repeat', 'read-aloud': 'Read aloud', intro: 'Self-introduction', 'role-play': 'Role-play' } as const;

export function SpeakingHome() {
  const { data } = useStore();
  const stt = sttSupported();
  const tts = ttsSupported();
  return (
    <div className="stack">
      <PageHeader title="Speaking" titleHi="बोलना" back="/practise" />
      <Card className="stack">
        <h2>How speaking practice works here</h2>
        <ul className="plain-list">
          <li>Voice recognition: {stt ? 'available in this browser.' : 'not available in this browser — you will type your answers instead.'}</li>
          <li>Model audio: {tts ? 'available.' : 'not available on this device — read the model text.'}</li>
          <li>We compare the words your browser <em>heard</em> with the words expected. This shows whether you were understood. It is not a pronunciation score, and it cannot judge individual sounds.</li>
          <li className="hi" lang="hi">आपकी आवाज़ इस ऐप में सेव नहीं होती।</li>
        </ul>
      </Card>
      <ul className="lesson-list">
        {SPEAKING.map((t) => {
          const done = data.attempts.some((a) => a.contextId === t.id && a.context === 'practice');
          return (
            <li key={t.id}>
              <Link to={`/speaking/${t.id}`} className="lesson-item">
                <span className="lesson-body">
                  <strong>{t.title}</strong>
                  <span className="hi muted block" lang="hi">{t.titleHi}</span>
                  <span className="muted small">{KIND_LABEL[t.kind]} · {STAGE_BY_ID[t.stage].label}</span>
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

export function SpeakingTask({ id }: { id: string }) {
  const task = SPEAKING.find((t) => t.id === id);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [run, setRun] = useState(0);
  const onFinish = useCallback((s: RunSummary) => setSummary(s), []);
  if (!task) {
    return (
      <div className="stack">
        <PageHeader title="Not found" back="/speaking" />
        <Empty title="We could not find that task." action={<LinkButton to="/speaking">Back</LinkButton>} />
      </div>
    );
  }
  return (
    <div className="stack">
      <PageHeader title={task.title} titleHi={task.titleHi} back="/speaking" />
      {!summary ? (
        <Card>
          <ExerciseRunner key={run} exercises={task.exercises} context="practice" contextId={task.id} onFinish={onFinish} finishLabel="See results" />
        </Card>
      ) : (
        <ResultCard title="Speaking results" summary={summary}>
          <Banner tone="info">Feedback is approximate: it is based on the text your device recognised, not on a full analysis of your sounds.</Banner>
          <div className="row wrap">
            <Button variant="secondary" onClick={() => { setSummary(null); setRun((r) => r + 1); }}>
              Practise again
            </Button>
            {task.scenario && (
              <LinkButton to={`/tutor?scenario=${task.scenario}`} variant="primary">
                Open role-play with Saathi AI
              </LinkButton>
            )}
            <LinkButton to="/speaking" variant="ghost">
              More speaking
            </LinkButton>
          </div>
        </ResultCard>
      )}
    </div>
  );
}
