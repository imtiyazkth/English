import { useCallback, useState } from 'react';
import { Banner, Button, Card, Empty, LinkButton, PageHeader } from '../../components/ui';
import { ExerciseRunner, RunSummary } from '../../components/ExerciseRunner';
import { ResultCard } from '../../components/ResultCard';
import { useStore } from '../../app/store';
import { buildQuiz, QuizPlan } from '../../services/quizBuilder';
import { markDailyStep, recordAssessment } from '../../services/progress';

export function QuizPage({ quizKey }: { quizKey: string }) {
  const { data, update } = useStore();
  // The quiz is built once per visit so questions do not change under the learner.
  const [plan] = useState<QuizPlan | null>(() => buildQuiz(quizKey, data));
  const [started, setStarted] = useState(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);

  const onFinish = useCallback(
    (s: RunSummary) => {
      if (!plan) return;
      setSummary(s);
      const now = new Date();
      update((d) => {
        let n = recordAssessment(d, {
          id: `${plan.kind}-${now.getTime()}`,
          at: now.toISOString(),
          kind: plan.kind,
          title: plan.title,
          total: s.total,
          correct: s.correct,
          durationSec: s.durationSec,
          bySkill: s.bySkill,
          missedIds: s.missedIds,
        });
        if (plan.key === 'daily-check') n = markDailyStep(n, 'check', now);
        if (plan.key.startsWith('skill-')) n = markDailyStep(n, 'skill', now);
        return n;
      });
    },
    [plan, update],
  );

  if (!plan) {
    return (
      <div className="stack">
        <PageHeader title="Quiz not found" back="/practise" />
        <Empty title="We could not build that quiz." action={<LinkButton to="/practise">Back to Practise</LinkButton>} />
      </div>
    );
  }

  if (plan.exercises.length === 0) {
    return (
      <div className="stack">
        <PageHeader title={plan.title} titleHi={plan.titleHi} back="/practise" />
        <Empty
          title={plan.kind === 'missed' ? 'No missed questions right now.' : 'There are no questions for this test yet.'}
          body={plan.kind === 'missed' ? 'Questions you get wrong will appear here so you can try them again.' : 'Complete a lesson first, then come back.'}
          action={<LinkButton to="/learn" variant="primary">Go to lessons</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader title={plan.title} titleHi={plan.titleHi} back="/practise" />
      {!started && !summary && (
        <Card className="stack">
          <p>
            {plan.exercises.length} questions{plan.timeLimitSec ? ` · ${Math.round(plan.timeLimitSec / 60)} minute time limit` : ''}. Questions you saw least recently come first, and none repeat inside one test.
          </p>
          {plan.timeLimitSec && <Banner tone="info">Unanswered questions when time ends count as not correct.</Banner>}
          <Button variant="primary" size="lg" onClick={() => setStarted(true)}>
            Start
          </Button>
        </Card>
      )}
      {started && !summary && (
        <Card>
          <ExerciseRunner
            exercises={plan.exercises}
            context={plan.kind === 'daily' ? 'daily' : plan.kind === 'missed' ? 'review' : 'quiz'}
            contextId={plan.key}
            timeLimitSec={plan.timeLimitSec}
            onFinish={onFinish}
            finishLabel="See results"
          />
        </Card>
      )}
      {summary && (
        <ResultCard title="Results" summary={summary}>
          <div className="row wrap">
            {summary.missedIds.length > 0 && (
              <LinkButton to="/quiz/missed" variant="secondary">
                Review missed ({summary.missedIds.length})
              </LinkButton>
            )}
            <LinkButton to="/practise" variant="primary">
              More practice
            </LinkButton>
            <LinkButton to="/progress" variant="ghost">
              See progress
            </LinkButton>
          </div>
        </ResultCard>
      )}
    </div>
  );
}
