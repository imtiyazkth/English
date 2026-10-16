import { Check, Circle, Clock } from 'lucide-react';
import { LESSONS, lessonsOfStage } from '../../data/curriculum';
import { STAGES, CEFR_NOTE_HI } from '../../data/stages';
import { STAGE_ORDER, SKILL_LABELS } from '../../types';
import { Card, Chip, LinkButton, PageHeader } from '../../components/ui';
import { Link } from '../../app/router';
import { useStore } from '../../app/store';
import { nextLesson } from '../../services/selectors';

export function Learn() {
  const { data } = useStore();
  const next = nextLesson(data);
  const current = data.profile?.level ?? 'pre-a1';

  return (
    <div className="stack">
      <PageHeader title="Learning path" titleHi="सीखने का रास्ता" />
      <p className="hi muted small" lang="hi">{CEFR_NOTE_HI}</p>
      {next && (
        <Card className="stack accent-card">
          <p className="eyebrow">Next lesson</p>
          <h2>{next.title}</h2>
          <p className="hi" lang="hi">{next.titleHi}</p>
          <p className="muted small">{next.minutes} min · {next.skills.map((s) => SKILL_LABELS[s].en).join(', ')}</p>
          <LinkButton to={`/lesson/${next.id}`} variant="primary" size="lg">
            Start lesson
          </LinkButton>
        </Card>
      )}
      {STAGES.map((stage) => {
        const lessons = lessonsOfStage(stage.id);
        const done = lessons.filter((l) => data.lessons[l.id]?.status === 'completed').length;
        return (
          <details key={stage.id} className="stage" open={stage.id === current}>
            <summary>
              <span className="stage-title">
                {stage.label} <span className="hi muted" lang="hi">· {stage.labelHi}</span>
              </span>
              <Chip tone={done === lessons.length && lessons.length ? 'good' : 'neutral'}>
                {done}/{lessons.length}
              </Chip>
            </summary>
            <p className="hi" lang="hi">{stage.descriptionHi}</p>
            {lessons.length === 0 && <p className="muted">No lessons here yet.</p>}
            <ul className="lesson-list">
              {lessons.map((l) => {
                const p = data.lessons[l.id];
                return (
                  <li key={l.id}>
                    <Link to={`/lesson/${l.id}`} className="lesson-item">
                      <span className="lesson-status" aria-hidden>
                        {p?.status === 'completed' ? <Check size={18} /> : <Circle size={18} />}
                      </span>
                      <span className="lesson-body">
                        <strong>{l.title}</strong>
                        <span className="hi muted block" lang="hi">{l.titleHi}</span>
                        <span className="muted small">
                          <Clock size={12} aria-hidden /> {l.minutes} min · {l.module}
                        </span>
                      </span>
                      <span className="lesson-tags">
                        {p?.mastered ? <Chip tone="good">Mastered {Math.round(p.bestScore * 100)}%</Chip> : p?.status === 'completed' ? <Chip tone="info">Done {Math.round(p.bestScore * 100)}%</Chip> : <Chip>New</Chip>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {done > 0 && (
              <LinkButton to={`/quiz/unit-${stage.id}`} variant="secondary" size="sm">
                End-of-unit test
              </LinkButton>
            )}
          </details>
        );
      })}
      <p className="muted small">{LESSONS.length} complete lessons are included across {STAGE_ORDER.length} levels. More can be added in <code>src/data</code>.</p>
    </div>
  );
}
