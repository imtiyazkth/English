import type { ReactNode } from 'react';
import { SKILL_LABELS, Skill } from '../types';
import type { RunSummary } from './ExerciseRunner';
import { Card, Chip, ProgressBar } from './ui';

export function pctOf(correct: number, total: number): number {
  return total ? Math.round((correct / total) * 100) : 0;
}

export function verdict(pct: number): { en: string; hi: string } {
  if (pct >= 80) return { en: 'Strong result — you have this.', hi: 'शानदार! आपको यह अच्छे से आता है।' };
  if (pct >= 50) return { en: 'Good progress — a little more practice will make it stick.', hi: 'अच्छी प्रगति — थोड़ा और अभ्यास से यह पक्का हो जाएगा।' };
  return { en: 'This is hard at first. Review the lesson and try again — mistakes are how we learn.', hi: 'शुरू में यह मुश्किल लगता है। पाठ दोबारा देखें और फिर कोशिश करें — गलतियों से ही सीखते हैं।' };
}

export function ResultCard({ title, summary, children }: { title: string; summary: RunSummary; children?: ReactNode }) {
  const pct = pctOf(summary.correct, summary.total);
  const v = verdict(pct);
  const skills = Object.entries(summary.bySkill) as [Skill, { correct: number; total: number }][];
  return (
    <Card className="stack">
      <h2>{title}</h2>
      <div className="score-big" aria-label={`Score ${pct} percent`}>
        {summary.correct}/{summary.total} <span className="muted">· {pct}%</span>
      </div>
      <ProgressBar value={pct} label="Score" />
      <p>
        {v.en}
        <br />
        <span className="hi" lang="hi">{v.hi}</span>
      </p>
      {summary.timedOut && <Chip tone="warn">Time ran out — unanswered questions count as not correct</Chip>}
      {summary.answered < summary.total && !summary.timedOut && <Chip tone="info">{summary.total - summary.answered} not answered</Chip>}
      {skills.length > 0 && (
        <div className="stack">
          <h3>By skill</h3>
          {skills.map(([s, v2]) => (
            <div key={s} className="skill-line">
              <span>
                {SKILL_LABELS[s].en} <span className="hi muted" lang="hi">{SKILL_LABELS[s].hi}</span>
              </span>
              <span>
                {v2.correct}/{v2.total}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="muted small">Time: {Math.floor(summary.durationSec / 60)}m {summary.durationSec % 60}s. Scores count your first try at each question.</p>
      {children}
    </Card>
  );
}
