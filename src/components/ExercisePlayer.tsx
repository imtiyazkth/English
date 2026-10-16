import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Lightbulb } from 'lucide-react';
import type { ArrangeEx, DictationEx, Exercise, FillEx, MatchEx, McqEx, SpeakEx, TranslateEx, WriteEx } from '../types';
import { Button, AudioButton, HiNote } from './ui';
import { SpeakInput } from './SpeakInput';
import { expectedText, Grade, gradeExercise } from '../utils/grade';
import { checkWriting } from '../utils/writing';
import { countWords, shuffle } from '../utils/text';
import { useStore } from '../app/store';
import { ttsSupported } from '../services/speech/tts';

export interface ExerciseOutcome {
  /** Correct on the FIRST try (a retry is for learning and does not change the record). */
  correct: boolean;
  response: string | number;
  ms: number;
  targeted: boolean;
}

const TYPE_LABEL: Record<Exercise['type'], string> = {
  mcq: 'Choose the answer',
  fill: 'Fill in the blank',
  translate: 'Translate',
  arrange: 'Put the words in order',
  match: 'Match the pairs',
  dictation: 'Listen and type',
  correct: 'Correct the mistake',
  speak: 'Speaking',
  write: 'Writing',
};

interface InputProps<T extends Exercise> {
  ex: T;
  locked: boolean;
  graded: Grade | null;
  onSubmit: (response: string | number) => void;
}

export function ExercisePlayer({ ex, onDone, doneLabel = 'Continue' }: { ex: Exercise; onDone: (o: ExerciseOutcome) => void; doneLabel?: string }) {
  const [grade, setGrade] = useState<Grade | null>(null);
  const [tries, setTries] = useState(0);
  const [first, setFirst] = useState<boolean | null>(null);
  const [response, setResponse] = useState<string | number>('');
  const [attempt, setAttempt] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const started = useRef(Date.now());

  function submit(r: string | number) {
    if (grade) return;
    const g = gradeExercise(ex, r);
    setGrade(g);
    setResponse(r);
    setTries((t) => t + 1);
    setFirst((f) => (f === null ? g.correct : f));
  }

  const canRetry = !!grade && !grade.correct && tries < 2 && ex.type !== 'mcq' && ex.type !== 'match';

  function retry() {
    setGrade(null);
    setAttempt((a) => a + 1);
  }

  function next() {
    onDone({
      correct: first ?? false,
      response,
      ms: Date.now() - started.current,
      targeted: ex.type === 'speak' && !!ex.targetText,
    });
  }

  const common = { locked: !!grade, graded: grade, onSubmit: submit };

  return (
    <div className="exercise stack" key={`${ex.id}-${attempt}`}>
      <p className="eyebrow">{TYPE_LABEL[ex.type]}</p>
      {ex.type === 'mcq' && <McqInput ex={ex} {...common} />}
      {ex.type === 'fill' && <FillInput ex={ex} {...common} />}
      {ex.type === 'translate' && (ex.direction === 'hi-en' ? <TextInput ex={ex} {...common} /> : <TilesInput ex={ex} {...common} />)}
      {ex.type === 'arrange' && <TilesInput ex={ex} {...common} />}
      {ex.type === 'match' && <MatchInput ex={ex} {...common} />}
      {ex.type === 'dictation' && <DictationInput ex={ex} {...common} />}
      {ex.type === 'correct' && <CorrectInput ex={ex} {...common} />}
      {ex.type === 'speak' && <SpeakExercise ex={ex} {...common} />}
      {ex.type === 'write' && <WriteInput ex={ex} {...common} />}

      {!grade && ex.hintHi && (
        <div>
          {hintOpen ? (
            <HiNote label="Hint">
              <Lightbulb size={14} aria-hidden /> {ex.hintHi}
            </HiNote>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setHintOpen(true)}>
              <Lightbulb size={14} aria-hidden /> Hint
            </Button>
          )}
        </div>
      )}

      {grade && <Feedback ex={ex} grade={grade} response={response} retryAvailable={canRetry} />}
      {grade && (
        <div className="row">
          {canRetry && (
            <Button variant="secondary" onClick={retry}>
              <RotateCcw size={16} aria-hidden /> Try again
            </Button>
          )}
          <Button variant="primary" size="lg" onClick={next}>
            {doneLabel} <ArrowRight size={18} aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- feedback
function Feedback({ ex, grade, response, retryAvailable }: { ex: Exercise; grade: Grade; response: string | number; retryAvailable: boolean }) {
  const report = ex.type === 'write' ? checkWriting(String(response), ex) : null;
  return (
    <div className={`feedback ${grade.correct ? 'ok' : 'bad'}`} role="status" aria-live="polite">
      <p className="feedback-title">
        {grade.correct ? <CheckCircle2 size={20} aria-hidden /> : <XCircle size={20} aria-hidden />}
        {grade.correct ? ' Correct! सही!' : grade.near ? ' Very close — check your spelling. बहुत क़रीब!' : retryAvailable ? ' Not yet. अभी नहीं।' : ' Not quite. कोई बात नहीं।'}
      </p>
      {ex.type !== 'speak' && ex.type !== 'write' && (!grade.correct || ex.type === 'translate') && (
        <p>
          <strong>Answer:</strong> {expectedText(ex)}
        </p>
      )}
      {ex.type === 'speak' && (
        <>
          {grade.detail && <p>{grade.detail}</p>}
          <p>
            <strong>Model answer:</strong> {ex.targetText ?? ex.modelAnswer}
          </p>
          <p className="muted small">
            This only compares the words the speech recogniser understood with the words expected. It is approximate and cannot grade your pronunciation of individual sounds.
          </p>
        </>
      )}
      {ex.type === 'write' && report && (
        <div className="stack">
          <p className="muted small">Rule-based check only (length, key words, capital letters, punctuation). It does not judge your meaning or full grammar; ask Saathi AI Tutor for deeper feedback.</p>
          {report.issues.length === 0 ? (
            <p>Nice work: no basic problems found.</p>
          ) : (
            <ul className="plain-list">
              {report.issues.map((i) => (
                <li key={i.kind}>
                  {i.en} <span className="hi" lang="hi">{i.hi}</span>
                </li>
              ))}
            </ul>
          )}
          <p>
            <strong>Example answer:</strong>
          </p>
          <p className="quote">{ex.modelAnswer}</p>
        </div>
      )}
      <HiNote>{ex.explanationHi}</HiNote>
    </div>
  );
}

// ---------------------------------------------------------------- mcq
function McqInput({ ex, locked, graded, onSubmit }: InputProps<McqEx>) {
  const { data } = useStore();
  const [picked, setPicked] = useState<number | null>(null);
  const audioOk = ttsSupported();
  const [showText, setShowText] = useState(false);
  const transcriptVisible = !!ex.audioText && (showText || !!graded || !audioOk);
  return (
    <div className="stack">
      {ex.passage && <div className="passage">{ex.passage}</div>}
      <p className="question">{ex.prompt}</p>
      {ex.audioText && (
        <div className="stack">
          <AudioButton text={ex.audioText} />
          {audioOk && !graded && data.settings.showTranscripts && (
            <Button variant="ghost" size="sm" onClick={() => setShowText((s) => !s)}>
              {showText ? 'Hide text' : 'Show text'}
            </Button>
          )}
          {transcriptVisible && <p className="transcript">“{ex.audioText}”</p>}
        </div>
      )}
      <div className="options" role="group" aria-label="Answer options">
        {ex.options.map((o, i) => {
          const isRight = !!graded && i === ex.answer;
          const isWrong = !!graded && picked === i && i !== ex.answer;
          return (
            <button
              key={i}
              type="button"
              className={`option${picked === i ? ' picked' : ''}${isRight ? ' right' : ''}${isWrong ? ' wrong' : ''}`}
              disabled={locked}
              aria-pressed={picked === i}
              onClick={() => {
                setPicked(i);
                onSubmit(i);
              }}
            >
              <span>{o}</span>
              {isRight && <CheckCircle2 size={18} aria-label="Correct answer" />}
              {isWrong && <XCircle size={18} aria-label="Your answer was wrong" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- fill
function FillInput({ ex, locked, onSubmit }: InputProps<FillEx>) {
  const [v, setV] = useState('');
  const parts = ex.sentence.split('___');
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim() && !locked) onSubmit(v);
      }}
    >
      <p className="question">{ex.prompt}</p>
      <p className="sentence">
        {parts[0]}
        <input
          className="inline-input"
          value={v}
          onChange={(e) => setV(e.target.value)}
          disabled={locked}
          aria-label="Your answer"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          size={Math.max(6, Math.min(16, v.length + 2))}
        />
        {parts.slice(1).join('___')}
      </p>
      <div>
        <Button type="submit" variant="primary" disabled={locked || !v.trim()}>
          Check
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- typed text (translate hi->en, correct)
function TextInput({ ex, locked, onSubmit }: InputProps<TranslateEx>) {
  const [v, setV] = useState('');
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim() && !locked) onSubmit(v);
      }}
    >
      <p className="question">
        Translate into English: <span className="hi" lang="hi">{ex.source}</span>
      </p>
      <label className="field">
        <span className="field-label">Your English answer</span>
        <textarea className="textarea" rows={2} value={v} onChange={(e) => setV(e.target.value)} disabled={locked} autoCapitalize="sentences" spellCheck={false} />
      </label>
      <div>
        <Button type="submit" variant="primary" disabled={locked || !v.trim()}>
          Check
        </Button>
      </div>
    </form>
  );
}

function CorrectInput({ ex, locked, onSubmit }: InputProps<import('../types').CorrectEx>) {
  const [v, setV] = useState(ex.wrong);
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim() && !locked) onSubmit(v);
      }}
    >
      <p className="question">Find the mistake and write the correct sentence.</p>
      <p className="quote wrong-quote">{ex.wrong}</p>
      <label className="field">
        <span className="field-label">Correct sentence</span>
        <textarea className="textarea" rows={2} value={v} onChange={(e) => setV(e.target.value)} disabled={locked} spellCheck={false} />
      </label>
      <div>
        <Button type="submit" variant="primary" disabled={locked || !v.trim()}>
          Check
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- tiles (arrange, translate en->hi)
function TilesInput({ ex, locked, onSubmit }: InputProps<ArrangeEx | TranslateEx>) {
  const words = useMemo(() => {
    const base = ex.type === 'arrange' ? ex.words : (ex.bank ?? []);
    return shuffle(base.map((w, i) => ({ w, id: i })));
  }, [ex]);
  const [chosen, setChosen] = useState<number[]>([]);
  const byId = (id: number) => words.find((x) => x.id === id)!.w;
  const isHindiTarget = ex.type === 'translate';
  return (
    <div className="stack">
      <p className="question">
        {ex.type === 'arrange' ? ex.prompt : (
          <>
            Translate into Hindi: <strong>{ex.source}</strong>
          </>
        )}
      </p>
      <div className="answer-tray" aria-label="Your answer" aria-live="polite">
        {chosen.length === 0 && <span className="muted">Tap the words below to build your answer</span>}
        {chosen.map((id, idx) => (
          <button key={`${id}-${idx}`} type="button" className="tile tile-chosen" disabled={locked} onClick={() => setChosen((c) => c.filter((_, i) => i !== idx))} aria-label={`Remove ${byId(id)}`}>
            <span lang={isHindiTarget ? 'hi' : 'en'}>{byId(id)}</span>
          </button>
        ))}
      </div>
      <div className="tile-bank" role="group" aria-label="Word bank">
        {words.map(({ w, id }) => (
          <button key={id} type="button" className="tile" disabled={locked || chosen.includes(id)} onClick={() => setChosen((c) => [...c, id])}>
            <span lang={isHindiTarget ? 'hi' : 'en'}>{w}</span>
          </button>
        ))}
      </div>
      <div className="row">
        <Button variant="primary" disabled={locked || chosen.length === 0} onClick={() => onSubmit(chosen.map(byId).join(' '))}>
          Check
        </Button>
        <Button variant="ghost" disabled={locked || chosen.length === 0} onClick={() => setChosen([])}>
          Reset
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- match
function MatchInput({ ex, locked, onSubmit }: InputProps<MatchEx>) {
  const rights = useMemo(() => shuffle(ex.pairs.map((p, i) => ({ text: p[1], i }))), [ex]);
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);

  function pickRight(i: number) {
    if (sel === null || locked || done.includes(i)) return;
    if (i === sel) {
      const nd = [...done, i];
      setDone(nd);
      setSel(null);
      if (nd.length === ex.pairs.length) onSubmit(mistakes);
    } else {
      setMistakes((m) => m + 1);
      setFlash(i);
      setTimeout(() => setFlash(null), 600);
    }
  }
  return (
    <div className="stack">
      <p className="question">{ex.prompt}</p>
      <p className="muted small">Tap one item on the left, then its match on the right.</p>
      <div className="match-grid">
        <div className="stack">
          {ex.pairs.map((p, i) => (
            <button key={i} type="button" className={`tile${sel === i ? ' tile-selected' : ''}${done.includes(i) ? ' tile-done' : ''}`} disabled={locked || done.includes(i)} aria-pressed={sel === i} onClick={() => setSel(i)}>
              {p[0]} {done.includes(i) && <CheckCircle2 size={14} aria-label="matched" />}
            </button>
          ))}
        </div>
        <div className="stack">
          {rights.map((r) => (
            <button key={r.i} type="button" className={`tile${done.includes(r.i) ? ' tile-done' : ''}${flash === r.i ? ' tile-wrong' : ''}`} disabled={locked || done.includes(r.i) || sel === null} onClick={() => pickRight(r.i)}>
              {r.text} {done.includes(r.i) && <CheckCircle2 size={14} aria-label="matched" />}
              {flash === r.i && <XCircle size={14} aria-label="not a match" />}
            </button>
          ))}
        </div>
      </div>
      <p className="muted small" role="status">
        Matched {done.length} of {ex.pairs.length} · mistakes: {mistakes}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- dictation
function DictationInput({ ex, locked, onSubmit }: InputProps<DictationEx>) {
  const [v, setV] = useState('');
  const audioOk = ttsSupported();
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim() && !locked) onSubmit(v);
      }}
    >
      <p className="question">{ex.prompt ?? 'Type what you hear.'}</p>
      <AudioButton text={ex.audioText} />
      {!audioOk && <p className="transcript">“{ex.audioText}” — audio is unavailable, so copy the text.</p>}
      <label className="field">
        <span className="field-label">What did you hear?</span>
        <input className="input" value={v} onChange={(e) => setV(e.target.value)} disabled={locked} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      </label>
      <div>
        <Button type="submit" variant="primary" disabled={locked || !v.trim()}>
          Check
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- speak
function SpeakExercise({ ex, locked, graded, onSubmit }: InputProps<SpeakEx>) {
  const [said, setSaid] = useState('');
  return (
    <div className="stack">
      <p className="question">{ex.prompt}</p>
      {ex.partnerLine && (
        <div className="stack">
          <p className="quote">
            <strong>They say:</strong> “{ex.partnerLine}”
          </p>
          <AudioButton text={ex.partnerLine} label="Listen" />
        </div>
      )}
      {ex.targetText && (
        <div className="stack">
          <p className="quote">{ex.modelAnswer}</p>
          <AudioButton text={ex.modelAnswer} label="Listen to the model" />
        </div>
      )}
      {!graded && (
        <SpeakInput
          disabled={locked}
          onSubmit={(t) => {
            setSaid(t);
            onSubmit(t);
          }}
        />
      )}
      {graded && said && <p className="heard">You said: “{said}”</p>}
    </div>
  );
}

// ---------------------------------------------------------------- write
function WriteInput({ ex, locked, onSubmit }: InputProps<WriteEx>) {
  const [v, setV] = useState('');
  const words = countWords(v);
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim() && !locked) onSubmit(v);
      }}
    >
      <p className="question">{ex.prompt}</p>
      <label className="field">
        <span className="field-label">Your writing</span>
        <textarea className="textarea" rows={6} value={v} onChange={(e) => setV(e.target.value)} disabled={locked} spellCheck />
      </label>
      <p className="muted small" role="status">
        {words} word{words === 1 ? '' : 's'} · aim for at least {ex.minWords}
      </p>
      <div>
        <Button type="submit" variant="primary" disabled={locked || !v.trim()}>
          Check my writing
        </Button>
      </div>
    </form>
  );
}
