import { useCallback, useState } from 'react';
import { LESSON_BY_ID, LESSONS } from '../../data/curriculum';
import { VOCAB_BY_ID } from '../../data/vocab';
import { Banner, Button, Card, Chip, Empty, HiNote, LinkButton, PageHeader, AudioButton } from '../../components/ui';
import { ExerciseRunner, RunSummary } from '../../components/ExerciseRunner';
import { ResultCard, pctOf } from '../../components/ResultCard';
import { useStore } from '../../app/store';
import { completeLesson, markDailyStep, recordAssessment } from '../../services/progress';
import { PRONUNCIATION_NOTE_HI } from '../../data/pronunciation';
import { STAGE_BY_ID } from '../../data/stages';

type Phase = 'intro' | 'teach' | 'practice' | 'summary';

function englishPart(en: string): string {
  // "A a — apple" -> speak "apple"; "1 — one" -> "one"; otherwise speak the whole text.
  const parts = en.split('—');
  return (parts.length > 1 ? parts[parts.length - 1] : en).split('→')[0].trim();
}

export function LessonPlayer({ id }: { id: string }) {
  const lesson = LESSON_BY_ID[id];
  const { data, update } = useStore();
  const [phase, setPhase] = useState<Phase>('intro');
  const [summary, setSummary] = useState<RunSummary | null>(null);

  const onFinish = useCallback(
    (s: RunSummary) => {
      setSummary(s);
      setPhase('summary');
      const now = new Date();
      update((d) => {
        let n = completeLesson(d, lesson, s.correct, s.total, now);
        n = recordAssessment(n, {
          id: `lesson-${lesson.id}-${now.getTime()}`,
          at: now.toISOString(),
          kind: 'lesson',
          title: lesson.title,
          total: s.total,
          correct: s.correct,
          durationSec: s.durationSec,
          bySkill: s.bySkill,
          missedIds: s.missedIds,
        });
        return markDailyStep(n, 'lesson', now);
      });
    },
    [lesson, update],
  );

  if (!lesson) {
    return (
      <div className="stack">
        <PageHeader title="Lesson not found" back="/learn" />
        <Empty title="We could not find that lesson." action={<LinkButton to="/learn">Back to the learning path</LinkButton>} />
      </div>
    );
  }

  const idx = LESSONS.findIndex((l) => l.id === lesson.id);
  const nextL = LESSONS[idx + 1];
  const prereq = lesson.prerequisite ? LESSON_BY_ID[lesson.prerequisite] : null;
  const prereqDone = !prereq || data.lessons[prereq.id]?.status === 'completed';
  const prog = data.lessons[lesson.id];

  return (
    <div className="stack">
      <PageHeader title={lesson.title} titleHi={lesson.titleHi} back="/learn" />
      <div className="row wrap">
        <Chip tone="info">{STAGE_BY_ID[lesson.stage].label}</Chip>
        <Chip>{lesson.minutes} min</Chip>
        {prog?.mastered && <Chip tone="good">Mastered</Chip>}
      </div>

      {phase === 'intro' && (
        <Card className="stack">
          <h2>Understand it</h2>
          {!prereqDone && prereq && (
            <Banner tone="info">
              Recommended first: <a href={`#/lesson/${prereq.id}`}>{prereq.title}</a>. You can still continue.
            </Banner>
          )}
          <HiNote>
            {lesson.explanationHi.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </HiNote>
          <Button variant="primary" size="lg" onClick={() => setPhase('teach')}>
            See examples
          </Button>
        </Card>
      )}

      {phase === 'teach' && (
        <div className="stack">
          <Card className="stack">
            <h2>Examples</h2>
            <p className="muted small hi" lang="hi">{PRONUNCIATION_NOTE_HI.split('।')[0]}।</p>
            <ul className="teach-list">
              {lesson.teach.map((t, i) => (
                <li key={i} className="teach-item">
                  <div>
                    <p className="teach-en">{t.en}</p>
                    <p className="hi" lang="hi">{t.hi}</p>
                    {t.hint && <p className="hint hi muted" lang="hi">उच्चारण-सहारा: {t.hint}</p>}
                    {t.example && (
                      <p className="muted small">
                        e.g. {t.example.en} <span className="hi" lang="hi">— {t.example.hi}</span>
                      </p>
                    )}
                  </div>
                  <AudioButton text={englishPart(t.en)} compact />
                </li>
              ))}
            </ul>
          </Card>
          {lesson.mistakes && lesson.mistakes.length > 0 && (
            <Card className="stack">
              <h3>Common mistakes</h3>
              {lesson.mistakes.map((m, i) => (
                <div key={i} className="mistake">
                  <p>
                    <span className="wrong-mark">Not: </span>
                    {m.wrong}
                  </p>
                  <p>
                    <span className="right-mark">Say: </span>
                    {m.right}
                  </p>
                  <HiNote>{m.noteHi}</HiNote>
                </div>
              ))}
            </Card>
          )}
          <div className="row">
            <Button variant="ghost" onClick={() => setPhase('intro')}>
              Back
            </Button>
            <Button variant="primary" size="lg" onClick={() => setPhase('practice')}>
              Start practice ({lesson.exercises.length} questions)
            </Button>
          </div>
        </div>
      )}

      {phase === 'practice' && (
        <Card>
          <ExerciseRunner exercises={lesson.exercises} context="lesson" contextId={lesson.id} onFinish={onFinish} finishLabel="See results" />
        </Card>
      )}

      {phase === 'summary' && summary && (
        <div className="stack">
          <ResultCard title="Lesson complete" summary={summary}>
            {pctOf(summary.correct, summary.total) >= 80 ? (
              <Banner tone="info">Mastered: you scored 80% or more on your first tries.</Banner>
            ) : (
              <Banner tone="info">Completed, not yet mastered. Try the lesson again to reach 80%. Your best score is kept.</Banner>
            )}
            {summary.missedIds.length > 0 && <p className="small muted">{summary.missedIds.length} missed question(s) were added to your review queue (Practise → Missed questions).</p>}
            {lesson.vocab && lesson.vocab.length > 0 && (
              <div className="stack">
                <h3>Added to your vocabulary revision</h3>
                <div className="row wrap">
                  {lesson.vocab.map((v) => (
                    <Chip key={v}>{VOCAB_BY_ID[v]?.en ?? v}</Chip>
                  ))}
                </div>
              </div>
            )}
          </ResultCard>
          <div className="row wrap">
            <Button variant="secondary" onClick={() => { setSummary(null); setPhase('practice'); }}>
              Practise again
            </Button>
            {nextL ? (
              <LinkButton to={`/lesson/${nextL.id}`} variant="primary" size="lg">
                Next: {nextL.title}
              </LinkButton>
            ) : (
              <LinkButton to="/practise" variant="primary" size="lg">
                More practice
              </LinkButton>
            )}
            <LinkButton to="/" variant="ghost">
              Home
            </LinkButton>
          </div>
        </div>
      )}
    </div>
  );
}
