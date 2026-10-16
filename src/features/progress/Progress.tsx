import { Award, Lock } from 'lucide-react';
import { Banner, Card, Chip, Empty, LinkButton, PageHeader, ProgressBar, Stat } from '../../components/ui';
import { useStore } from '../../app/store';
import { SKILL_LABELS, SKILLS_ALL } from '../../types';
import { skillStats, streakInfo, totalMinutes, vocabCounts, weekSeries } from '../../services/selectors';
import { ACHIEVEMENTS } from '../../services/achievements';
import { LESSONS } from '../../data/curriculum';
import { pctOf } from '../../components/ResultCard';

const SKILL_HELP: Record<string, string> = {
  reading: 'Share of reading-question answers that were right on the first try (last 100).',
  writing: 'Share of writing, spelling and translation-to-English answers that were right (last 100).',
  listening: 'Share of listening answers that were right (last 100).',
  speaking: 'Share of speaking answers where your recognised words matched what was expected (last 100). Approximate.',
  grammar: 'Share of grammar-question answers that were right (last 100).',
  vocabulary: 'Share of vocabulary answers, including flashcards rated Good or Easy (last 100).',
  pronunciation: 'Only counts read-aloud/repeat tasks: how often the speech recogniser understood your words. This is NOT a pronunciation score.',
};

export function WeekChart({ days }: { days: { dateKey: string; minutes: number; tasks: number }[] }) {
  const max = Math.max(5, ...days.map((d) => d.minutes));
  const labels = days.map((d) => new Date(`${d.dateKey}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }));
  return (
    <figure className="chart">
      <div className="bars" role="img" aria-label={`Minutes studied in the last 7 days: ${days.map((d, i) => `${labels[i]} ${d.minutes}`).join(', ')}`}>
        {days.map((d, i) => (
          <div key={d.dateKey} className="bar-col">
            <span className="bar-val">{d.minutes > 0 ? Math.round(d.minutes) : ''}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ height: `${(d.minutes / max) * 100}%` }} />
            </div>
            <span className="bar-label">{labels[i]}</span>
          </div>
        ))}
      </div>
      <figcaption className="muted small">Minutes of active learning per day (last 7 days)</figcaption>
    </figure>
  );
}

export function Progress() {
  const { data, today } = useStore();
  const stats = skillStats(data.attempts);
  const streak = streakInfo(data, today);
  const counts = vocabCounts(data, today);
  const week = weekSeries(data, today);
  const completed = Object.values(data.lessons).filter((l) => l.status === 'completed');
  const mastered = completed.filter((l) => l.mastered).length;
  const empty = data.attempts.length === 0 && data.assessments.length === 0;

  return (
    <div className="stack">
      <PageHeader title="Progress" titleHi="प्रगति" />
      {empty && (
        <Empty title="Nothing to show yet." body="Your numbers appear here after your first lesson or quiz. Nothing on this page is made up." action={<LinkButton to="/learn" variant="primary">Start a lesson</LinkButton>} />
      )}

      <Card className="stack">
        <h2>Overview</h2>
        <div className="stat-row">
          <Stat label="Day streak" value={streak.current} hint={`best ${streak.longest}`} />
          <Stat label="Minutes" value={totalMinutes(data)} hint="active time" />
          <Stat label="Lessons" value={`${completed.length}/${LESSONS.length}`} hint={`${mastered} mastered`} />
          <Stat label="Words" value={counts.total} hint={`${counts.mastered} mastered`} />
        </div>
        <WeekChart days={week} />
      </Card>

      <Card className="stack">
        <h2>Skills</h2>
        <p className="muted small">Each skill has its own score. They are never merged into one “fluency” number, because being good at reading does not mean being good at speaking.</p>
        {SKILLS_ALL.map((s) => {
          const st = stats[s];
          return (
            <div key={s} className="skill-row">
              <div className="row between">
                <strong>
                  {SKILL_LABELS[s].en} <span className="hi muted" lang="hi">{SKILL_LABELS[s].hi}</span>
                </strong>
                <span>{st.pct === null ? 'No data yet' : `${st.pct}%`}</span>
              </div>
              <ProgressBar value={st.pct ?? 0} label={`${SKILL_LABELS[s].en} score`} />
              <p className="muted small">{st.total} answer{st.total === 1 ? '' : 's'} counted. {SKILL_HELP[s]}</p>
            </div>
          );
        })}
      </Card>

      <Card className="stack">
        <h2>Recent tests and lessons</h2>
        {data.assessments.length === 0 ? (
          <p className="muted">No results yet.</p>
        ) : (
          <ul className="plain-list">
            {[...data.assessments].reverse().slice(0, 10).map((a) => (
              <li key={a.id} className="row between">
                <span>
                  <strong>{a.title}</strong>
                  <span className="muted small block">{new Date(a.at).toLocaleDateString()} · {Math.floor(a.durationSec / 60)}m {a.durationSec % 60}s</span>
                </span>
                <Chip tone={pctOf(a.correct, a.total) >= 80 ? 'good' : 'neutral'}>
                  {a.correct}/{a.total} · {pctOf(a.correct, a.total)}%
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="stack">
        <h2>Vocabulary memory</h2>
        <div className="stat-row">
          <Stat label="New" value={counts.new} />
          <Stat label="Learning" value={counts.learning} />
          <Stat label="Due now" value={counts.due} />
          <Stat label="Mastered" value={counts.mastered} />
        </div>
        {counts.due > 0 && <LinkButton to="/flashcards" variant="primary">Review {counts.due} due</LinkButton>}
      </Card>

      <Card className="stack">
        <h2>Achievements</h2>
        <p className="muted small">Earned only from real practice: lessons, streaks, tests, speaking and review.</p>
        <ul className="achievements">
          {ACHIEVEMENTS.map((a) => {
            const at = data.achievements[a.id];
            return (
              <li key={a.id} className={`achievement${at ? ' earned' : ''}`}>
                <span aria-hidden>{at ? <Award size={20} /> : <Lock size={20} />}</span>
                <span>
                  <strong>{a.title}</strong> <span className="hi" lang="hi">{a.titleHi}</span>
                  <span className="muted small block">{at ? `Earned ${new Date(at).toLocaleDateString()}` : a.descHi}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
      <Banner tone="info">Streaks and daily totals use your device's local calendar day (midnight in your phone's time zone). Progress is stored on this device; use Settings → Export to back it up.</Banner>
    </div>
  );
}
