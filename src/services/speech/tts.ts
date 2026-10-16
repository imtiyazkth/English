/** Text-to-speech through the browser's speech synthesis, with honest capability detection. */

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/** Voices become available asynchronously on some browsers; resolves after they load or a short timeout. */
export function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!ttsSupported()) return resolve([]);
    const now = window.speechSynthesis.getVoices();
    if (now.length) return resolve(now);
    const done = () => resolve(window.speechSynthesis.getVoices());
    const t = setTimeout(done, timeoutMs);
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        clearTimeout(t);
        done();
      },
      { once: true },
    );
  });
}

export function pickVoice(lang: string, voiceURI: string | null): SpeechSynthesisVoice | null {
  const voices = listVoices();
  if (voiceURI) {
    const exact = voices.find((v) => v.voiceURI === voiceURI);
    if (exact) return exact;
  }
  const exactLang = voices.find((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
  if (exactLang) return exactLang;
  const prefix = lang.split('-')[0].toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ?? null;
}

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  voiceURI?: string | null;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

export function stopSpeaking(): void {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

/** Speaks text. Returns false if speech is not available (so the UI can show the text fallback). */
export function speak(text: string, opts: SpeakOptions = {}): boolean {
  if (!ttsSupported() || !text.trim()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const lang = opts.lang ?? 'en-IN';
  u.lang = lang;
  u.rate = Math.min(1.5, Math.max(0.4, opts.rate ?? 0.9));
  const voice = pickVoice(lang, opts.voiceURI ?? null);
  if (voice) u.voice = voice;
  u.onend = () => opts.onEnd?.();
  u.onerror = (e) => {
    // "canceled"/"interrupted" are normal when we stop speech ourselves.
    if (e.error === 'canceled' || e.error === 'interrupted') return;
    opts.onError?.(e.error || 'speech error');
  };
  synth.speak(u);
  return true;
}

/** Speaks lines one after another (dialogues). */
export function speakSequence(
  lines: string[],
  opts: SpeakOptions & { onLine?: (index: number) => void },
): { cancel: () => void } {
  let cancelled = false;
  const run = (i: number) => {
    if (cancelled) return;
    if (i >= lines.length) return opts.onEnd?.();
    opts.onLine?.(i);
    const ok = speak(lines[i], {
      ...opts,
      onEnd: () => run(i + 1),
      onError: opts.onError,
    });
    if (!ok) opts.onError?.('Speech is not available on this device.');
  };
  run(0);
  return {
    cancel() {
      cancelled = true;
      stopSpeaking();
    },
  };
}
