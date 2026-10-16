import { Flame } from 'lucide-react';
import { Banner, Card, Chip, Empty, LinkButton, ProgressBar, Stat } from '../../components/ui';
import { WeekChart } from '../progress/Progress';
import { useStore } from '../../app/store';
import { SKILL_LABELS, SKILLS_MAIN } from '../../types';
import { buildDailyPath, nextLesson, skillStats, streakInfo, todayActivity, vocabCounts, weakestSkill, weekSeries } from '../../services/selectors';
import { STAGE_BY_ID } from '../../data/stages';
import { ACHIEVEMENTS } from '../../services/achievements';
import { pctOf } from '../../components/ResultCard';

function greeting(): { en: string; hi: string } {
  const h = new Date().getHours();
  if (h < 12) return { en: 'Good morning', hi: 'सुप्रभात' };
  if (h < 17) return { en: 'Good afternoon', hi: 'नमस्कार' };
  return { en: 'Good evening', hi: 'शुभ संध्या' };
}

export function Home() {
  const { data, today } = useStore();
  const p = data.profile!;
  const g = greeting();
  const act = todayActivity(data, today);
  const streak = streakInfo(data, today);
  const stats = skillStats(data.attempts);
  const weak = weakestSkill(data);
  const counts = vocabCounts(data, today);
  const next = nextLesson(data);
  const path = buildDailyPath(data, today);
  const firstOpen = path.find((s) => !s.done);
  const minutes = act.seconds / 60;
  const goalTasks = p.dailyMinutes; // about one exercise per minute
  const hasHistory = data.attempts.length > 0 || Object.keys(data.lessons).length > 0;
  const earned = ACHIEVEMENTS.filter((a) => data.achievements[a.id]);

  return (
    <div className="stack">
      <header className="home-hero">
        <p className="eyebrow">{STAGE_BY_ID[p.level].label}</p>
        <h1 className="page-title">
          {g.en}{p.name ? `, ${p.name}` : ''}!
        </h1>
        <p className="hi muted" lang="hi">{g.hi}{p.name ? `, ${p.name}` : ''}!</p>
        <LinkButton to={firstOpen?.route ?? '/practise'} variant="primary" size="lg" block>
          {hasHistory ? 'Continue today’s lesson' : 'Start your first lesson'}
        </LinkButton>
      </header>

      {streak.daysSinceLast !== null && streak.daysSinceLast > 1 && (
        <Banner tone="info">
          Welcome back! You were away for {streak.daysSinceLast} days. That is okay: one short session today starts a new streak. <span className="hi" lang="hi">वापस आने पर स्वागत है! आज बस 5 मिनट काफ़ी हैं।</span>
        </Banner>
      )}
      {streak.atRisk && (
        <Banner tone="info">Your {streak.current}-day streak continues if you practise today.</Banner>
      )}

      <Card className="stack">
        <div className="row between">
          <h2>Today’s goal</h2>
          <span className="streak" aria-label={`${streak.current} day streak`}>
            <Flame size={18} aria-hidden /> {streak.current} day{streak.current === 1 ? '' : 's'}
          </span>
        </div>
        <div className="goal-row">
          <div>
            <p className="small">Minutes: {minutes.toFixed(minutes < 10 ? 1 : 0)} / {p.dailyMinutes}</p>
            <ProgressBar value={minutes} max={p.dailyMinutes} label="Minutes today" />
          </div>
          <div>
            <p className="small">Exercises: {act.tasks} / {goalTasks}</p>
            <ProgressBar value={act.tasks} max={goalTasks} label="Exercises today" />
          </div>
        </div>
        <ol className="daily-path">
          {path.map((s) => (
            <li key={s.id} className={s.done ? 'done' : ''}>
              <a href={`#${s.route}`} className="daily-step">
                <span className="step-state" aria-hidden>{s.done ? '✓' : '○'}</span>
                <span>
                  <strong>{s.title}</strong> <span className="hi muted" lang="hi">{s.titleHi}</span>
                  <span className="muted small block">{s.done ? (s.skipped ? 'Nothing to do today' : 'Done today') : s.detail}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </Card>

      {!hasHistory ? (
        <Empty title="Your progress will appear here." body="Do your first lesson and this page fills with your real scores, streak and review reminders." action={next && <LinkButton to={`/lesson/${next.id}`} variant="primary">Open: {next.title}</LinkButton>} />
      ) : (
        <>
          <Card className="stack">
            <h2>This week</h2>
            <WeekChart days={weekSeries(data, today)} />
          </Card>

          <Card className="stack">
            <h2>Your skills</h2>
            <div className="grid-2">
              {SKILLS_MAIN.map((s) => {
                const st = stats[s];
                return (
                  <div key={s} className="skill-card">
                    <p className="small">{SKILL_LABELS[s].en} <span className="hi muted" lang="hi">{SKILL_LABELS[s].hi}</span></p>
                    <p className="skill-pct">{st.pct === null ? '—' : `${st.pct}%`}</p>
                    <ProgressBar value={st.pct ?? 0} label={`${SKILL_LABELS[s].en} score`} />
                    <p className="muted small">{st.total ? `${st.total} answers` : 'No answers yet'}</p>
                  </div>
                );
              })}
            </div>
            <LinkButton to="/progress" variant="ghost" size="sm">How scores are calculated</LinkButton>
          </Card>

          {weak && (
            <Card className="stack">
              <h2>Practise your weakest skill</h2>
              <p>
                Your lowest score so far is <strong>{SKILL_LABELS[weak].en}</strong> ({stats[weak].pct}%). A short set will help.
              </p>
              <LinkButton to={`/quiz/skill-${weak}`} variant="secondary">Practise {SKILL_LABELS[weak].en.toLowerCase()}</LinkButton>
            </Card>
          )}

          <Card className="stack">
            <h2>Reviews and recent results</h2>
            <div className="stat-row">
              <Stat label="Words due" value={counts.due} />
              <Stat label="New words" value={counts.new} />
              <Stat label="To retry" value={data.missed.length} hint="missed questions" />
            </div>
            <div className="row wrap">
              {counts.due + counts.new > 0 && <LinkButton to="/flashcards" variant="secondary">Review words</LinkButton>}
              {data.missed.length > 0 && <LinkButton to="/quiz/missed" variant="secondary">Retry missed</LinkButton>}
            </div>
            {data.assessments.length > 0 && (
              <ul className="plain-list">
                {[...data.assessments].reverse().slice(0, 3).map((a) => (
                  <li key={a.id} className="row between">
                    <span>{a.title}</span>
                    <Chip tone={pctOf(a.correct, a.total) >= 80 ? 'good' : 'neutral'}>{pctOf(a.correct, a.total)}%</Chip>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {next && (
            <Card className="stack">
              <p className="eyebrow">Next lesson</p>
              <h2>{next.title}</h2>
              <p className="hi" lang="hi">{next.titleHi}</p>
              <LinkButton to={`/lesson/${next.id}`} variant="secondary">Open lesson</LinkButton>
            </Card>
          )}

          {earned.length > 0 && (
            <Card className="stack">
              <h2>Achievements</h2>
              <div className="row wrap">
                {earned.slice(-4).map((a) => <Chip key={a.id} tone="good">{a.title}</Chip>)}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
