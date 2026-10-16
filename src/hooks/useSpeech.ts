import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../app/store';
import { speak, speakSequence, stopSpeaking, ttsSupported } from '../services/speech/tts';

/** Text-to-speech bound to the learner's settings (accent, speed, voice). */
export function useSpeech() {
  const { data } = useStore();
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef<{ cancel: () => void } | null>(null);
  const supported = ttsSupported();
  const lang = data.profile?.accent ?? 'en-IN';
  const baseRate = data.settings.speechRate;
  const voiceURI = data.settings.voiceURI;

  useEffect(
    () => () => {
      seq.current?.cancel();
      stopSpeaking();
    },
    [],
  );

  const stop = useCallback(() => {
    seq.current?.cancel();
    seq.current = null;
    stopSpeaking();
    setSpeaking(false);
  }, []);

  const play = useCallback(
    (text: string, opts: { slow?: boolean; rate?: number } = {}) => {
      seq.current?.cancel();
      setError(null);
      const rate = opts.rate ?? (opts.slow ? Math.min(baseRate, 0.6) : baseRate);
      setSpeaking(true);
      const ok = speak(text, {
        lang,
        rate,
        voiceURI,
        onEnd: () => setSpeaking(false),
        onError: (m) => {
          setSpeaking(false);
          setError(m);
        },
      });
      if (!ok) {
        setSpeaking(false);
        setError('Audio is not available on this device. Read the text instead.');
      }
      return ok;
    },
    [lang, baseRate, voiceURI],
  );

  const playLines = useCallback(
    (lines: string[], opts: { rate?: number; onLine?: (i: number) => void } = {}) => {
      seq.current?.cancel();
      setError(null);
      setSpeaking(true);
      seq.current = speakSequence(lines, {
        lang,
        rate: opts.rate ?? baseRate,
        voiceURI,
        onLine: opts.onLine,
        onEnd: () => setSpeaking(false),
        onError: (m) => {
          setSpeaking(false);
          setError(m);
        },
      });
    },
    [lang, baseRate, voiceURI],
  );

  return { supported, speaking, error, play, playLines, stop };
}
