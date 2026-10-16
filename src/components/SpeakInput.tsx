import { useEffect, useRef, useState } from 'react';
import { Mic, Square, RotateCcw } from 'lucide-react';
import { Button, Banner } from './ui';
import { useStore } from '../app/store';
import { describeSttError, Recognizer, startRecognition, sttSupported, SttErrorCode } from '../services/speech/stt';

/**
 * Collects a spoken answer as TEXT (via the browser's speech recognition when available) or a typed answer.
 * No audio is stored by this app. Where recognition is unavailable the learner types instead.
 */
export function SpeakInput({ onSubmit, disabled, placeholder }: { onSubmit: (text: string) => void; disabled?: boolean; placeholder?: string }) {
  const { data } = useStore();
  const supported = sttSupported();
  const lang = data.profile?.accent ?? 'en-IN';
  const [state, setState] = useState<'idle' | 'listening'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [heard, setHeard] = useState('');
  const [err, setErr] = useState<SttErrorCode | null>(null);
  const [typed, setTyped] = useState('');
  const [mode, setMode] = useState<'voice' | 'type'>(supported ? 'voice' : 'type');
  const rec = useRef<Recognizer | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(
    () => () => {
      rec.current?.cancel();
      clearTimer();
    },
    [],
  );

  function start() {
    setErr(null);
    setHeard('');
    setSeconds(0);
    setState('listening');
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    rec.current = startRecognition(lang, {
      onInterim: (t) => setHeard(t),
      onFinal: (t) => {
        setHeard(t);
        clearTimer();
        setState('idle');
        onSubmit(t);
      },
      onError: (code) => {
        clearTimer();
        setState('idle');
        if (code !== 'aborted') setErr(code);
        if (code === 'not-supported') setMode('type');
      },
      onEnd: () => {
        clearTimer();
        setState('idle');
      },
    });
    if (!rec.current) {
      clearTimer();
      setState('idle');
    }
  }
  function stop() {
    rec.current?.stop();
  }
  function cancel() {
    rec.current?.cancel();
    clearTimer();
    setState('idle');
    setHeard('');
  }

  const errText = err ? describeSttError(err) : null;

  return (
    <div className="stack">
      {mode === 'voice' && supported && (
        <div className="stack">
          <p className="muted small">
            Your browser may send your voice to its speech service to turn it into text. This app does not record or keep your audio. आपकी आवाज़ ऐप में सेव नहीं होती।
          </p>
          {state === 'listening' ? (
            <div className="recording" role="status" aria-live="polite">
              <span className="rec-dot" aria-hidden /> Listening… {seconds}s
              {heard && <span className="heard">“{heard}”</span>}
              <div className="row">
                <Button variant="primary" onClick={stop}>
                  <Square size={16} aria-hidden /> Done
                </Button>
                <Button variant="ghost" onClick={cancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="row">
              <Button variant="primary" size="lg" onClick={start} disabled={disabled}>
                <Mic size={18} aria-hidden /> {heard || err ? 'Record again' : 'Tap to speak'}
              </Button>
              <Button variant="ghost" onClick={() => setMode('type')}>
                Type instead
              </Button>
            </div>
          )}
          {heard && state === 'idle' && <p className="heard">We heard: “{heard}”</p>}
        </div>
      )}
      {mode === 'type' && (
        <div className="stack">
          {!supported && (
            <Banner tone="info">
              Voice answers are not available in this browser, so please type your answer. Speech recognition depends on the browser and device.
              <span className="hi" lang="hi"> इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं; कृपया जवाब टाइप करें।</span>
            </Banner>
          )}
          <label className="field">
            <span className="field-label">Type what you would say</span>
            <textarea className="textarea" rows={2} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={placeholder ?? 'Type your answer in English'} disabled={disabled} />
          </label>
          <div className="row">
            <Button variant="primary" disabled={disabled || !typed.trim()} onClick={() => onSubmit(typed.trim())}>
              Check
            </Button>
            {supported && (
              <Button variant="ghost" onClick={() => setMode('voice')}>
                <Mic size={16} aria-hidden /> Use microphone
              </Button>
            )}
          </div>
        </div>
      )}
      {errText && (
        <Banner tone="warn">
          {errText.en}
          <span className="hi" lang="hi"> {errText.hi}</span>
          {err === 'no-speech' || err === 'network' || err === 'other' ? (
            <span>
              {' '}
              <Button variant="ghost" size="sm" onClick={start}>
                <RotateCcw size={14} aria-hidden /> Retry
              </Button>
            </span>
          ) : null}
        </Banner>
      )}
    </div>
  );
}
