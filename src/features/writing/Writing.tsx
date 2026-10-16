import { useCallback, useState } from 'react';
import { Banner, Card, Chip, Empty, HiNote, LinkButton, PageHeader } from '../../components/ui';
import { ExerciseRunner, RunSummary } from '../../components/ExerciseRunner';
import { Link } from '../../app/router';
import { useStore } from '../../app/store';
import { WRITING } from '../../data/writing';
import { STAGE_BY_ID } from '../../data/stages';

export function WritingHome() {
  const { data } = useStore();
  return (
    <div className="stack">
      <PageHeader title="Writing" titleHi="लिखना" back="/practise" />
      <p className="muted">Guided writing from your first sentences to formal emails. You get an instant rule-based check, a model answer and one retry.</p>
      <ul className="lesson-list">
        {WRITING.map((w) => {
          const done = data.attempts.some((a) => a.contextId === w.id && a.context === 'practice');
          return (
            <li key={w.id}>
              <Link to={`/writing/${w.id}`} className="lesson-item">
                <span className="lesson-body">
                  <strong>{w.title}</strong>
                  <span className="hi muted block" lang="hi">{w.titleHi}</span>
                  <span className="muted small">{STAGE_BY_ID[w.stage].label}</span>
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

export function WritingTaskPage({ id }: { id: string }) {
  const task = WRITING.find((w) => w.id === id);
  const [done, setDone] = useState<RunSummary | null>(null);
  const onFinish = useCallback((s: RunSummary) => setDone(s), []);
  if (!task) {
    return (
      <div className="stack">
        <PageHeader title="Not found" back="/writing" />
        <Empty title="We could not find that task." action={<LinkButton to="/writing">Back</LinkButton>} />
      </div>
    );
  }
  return (
    <div className="stack">
      <PageHeader title={task.title} titleHi={task.titleHi} back="/writing" />
      <Card className="stack">
        <HiNote label="Rule to remember">{task.ruleHi}</HiNote>
      </Card>
      <Card>
        <ExerciseRunner exercises={[task.exercise]} context="practice" contextId={task.id} onFinish={onFinish} finishLabel="Finish" />
      </Card>
      {done && (
        <Card className="stack">
          <Banner tone="info">
            Saved. For deeper feedback on grammar, word choice and style, paste your writing into Saathi AI Tutor (needs the tutor to be set up).
          </Banner>
          <div className="row wrap">
            <LinkButton to="/tutor?mode=correct" variant="secondary">
              Ask Saathi AI to correct my writing
            </LinkButton>
            <LinkButton to="/writing" variant="primary">
              More writing
            </LinkButton>
          </div>
        </Card>
      )}
    </div>
  );
}
