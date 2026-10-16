import { useCallback, useEffect, useRef, useState } from 'react';
import type { AttemptContext, Exercise, Skill } from '../types';
import { ExercisePlayer } from './ExercisePlayer';
import { ProgressBar } from './ui';
import { useStore } from '../app/store';
import { recordAnswer } from '../services/progress';

export interface RunSummary {
  correct: number;
  total: number;
  answered: number;
  bySkill: Partial<Record<Skill, { correct: number; total: number }>>;
  missedIds: string[];
  durationSec: number;
  timedOut: boolean;
}

export function ExerciseRunner({
  exercises,
  context,
  contextId,
  onFinish,
  timeLimitSec,
  finishLabel = 'Finish',
}: {
  exercises: Exercise[];
  context: AttemptContext;
  contextId: string;
  onFinish: (s: RunSummary) => void;
  timeLimitSec?: number;
  finishLabel?: string;
}) {
  const { update } = useStore();
  const [idx, setIdx] = useState(0);
  const results = useRef<{ id: string; skill: Skill; correct: boolean }[]>([]);
  const startedAt = useRef(Date.now());
  const finished = useRef(false);
  const [left, setLeft] = useState(timeLimitSec ?? 0);

  const finish = useCallback(
    (timedOut: boolean) => {
      if (finished.current) return;
      finished.current = true;
      const bySkill: RunSummary['bySkill'] = {};
      const missedIds: string[] = [];
      let correct = 0;
      for (const r of results.current) {
        const s = bySkill[r.skill] ?? { correct: 0, total: 0 };
        s.total++;
        if (r.correct) {
          s.correct++;
          correct++;
        } else missedIds.push(r.id);
        bySkill[r.skill] = s;
      }
      onFinish({
        correct,
        total: exercises.length,
        answered: results.current.length,
        bySkill,
        missedIds,
        durationSec: Math.round((Date.now() - startedAt.current) / 1000),
        timedOut,
      });
    },
    [exercises.length, onFinish],
  );

  useEffect(() => {
    if (!timeLimitSec) return;
    const id = setInterval(() => {
      const remaining = timeLimitSec - Math.floor((Date.now() - startedAt.current) / 1000);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(id);
        finish(true);
      }
    }, 500);
    return () => clearInterval(id);
  }, [timeLimitSec, finish]);

  if (exercises.length === 0) return null;
  const ex = exercises[Math.min(idx, exercises.length - 1)];
  const last = idx >= exercises.length - 1;
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="stack">
      <div className="runner-head">
        <span className="small muted">
          Question {Math.min(idx + 1, exercises.length)} of {exercises.length}
        </span>
        {timeLimitSec ? (
          <span className="chip chip-warn" role="timer" aria-label={`Time left ${mm} minutes ${ss} seconds`}>
            {mm}:{ss}
          </span>
        ) : null}
      </div>
      <ProgressBar value={idx} max={exercises.length} label="Progress" />
      <ExercisePlayer
        key={`${ex.id}-${idx}`}
        ex={ex}
        doneLabel={last ? finishLabel : 'Next'}
        onDone={(o) => {
          results.current.push({ id: ex.id, skill: ex.skill, correct: o.correct });
          update((d) =>
            recordAnswer(d, {
              context,
              contextId,
              exerciseId: ex.id,
              skill: ex.skill,
              type: ex.type,
              correct: o.correct,
              ms: o.ms,
              targeted: o.targeted,
            }),
          );
          if (last) finish(false);
          else setIdx((i) => i + 1);
        }}
      />
    </div>
  );
}
