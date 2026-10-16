/**
 * Speech recognition through the browser's Web Speech API (where available).
 * Many Android browsers send the audio to an online service to transcribe it, so a network
 * connection is usually required. We never store the audio.
 */

interface RecognitionResultItem {
  transcript: string;
}
interface RecognitionEventLike {
  results: ArrayLike<ArrayLike<RecognitionResultItem> & { isFinal: boolean }>;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function ctor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function sttSupported(): boolean {
  return ctor() !== null;
}

export type SttErrorCode =
  | 'not-supported'
  | 'permission-denied'
  | 'no-microphone'
  | 'no-speech'
  | 'network'
  | 'aborted'
  | 'other';

export function describeSttError(code: SttErrorCode): { en: string; hi: string } {
  switch (code) {
    case 'not-supported':
      return {
        en: 'Speech recognition is not available in this browser. You can type your answer instead.',
        hi: 'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। आप जवाब टाइप कर सकते हैं।',
      };
    case 'permission-denied':
      return {
        en: 'Microphone permission was denied. Allow the microphone in your browser site settings, or type your answer.',
        hi: 'माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र की साइट सेटिंग में माइक्रोफ़ोन की अनुमति दें, या जवाब टाइप करें।',
      };
    case 'no-microphone':
      return { en: 'No microphone was found on this device.', hi: 'इस डिवाइस में माइक्रोफ़ोन नहीं मिला।' };
    case 'no-speech':
      return { en: 'We did not hear anything. Try again, a little closer to the microphone.', hi: 'कुछ सुनाई नहीं दिया। माइक्रोफ़ोन के थोड़ा पास आकर फिर कोशिश करें।' };
    case 'network':
      return {
        en: 'The speech service could not be reached. Check your internet connection and try again, or type your answer.',
        hi: 'आवाज़ पहचान सेवा तक नहीं पहुँच सके। इंटरनेट जाँचकर फिर कोशिश करें, या जवाब टाइप करें।',
      };
    case 'aborted':
      return { en: 'Recording cancelled.', hi: 'रिकॉर्डिंग रद्द हुई।' };
    default:
      return { en: 'Speech recognition stopped because of an error. You can try again or type your answer.', hi: 'आवाज़ पहचान में त्रुटि हुई। फिर कोशिश करें या जवाब टाइप करें।' };
  }
}

function mapError(e: string): SttErrorCode {
  switch (e) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'permission-denied';
    case 'audio-capture':
      return 'no-microphone';
    case 'no-speech':
      return 'no-speech';
    case 'network':
      return 'network';
    case 'aborted':
      return 'aborted';
    default:
      return 'other';
  }
}

export interface Recognizer {
  stop(): void;
  cancel(): void;
}

export interface RecognizeCallbacks {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (code: SttErrorCode) => void;
  onEnd?: () => void;
}

/** Starts one recognition session. Returns null (and reports an error) if unsupported. */
export function startRecognition(lang: string, cb: RecognizeCallbacks): Recognizer | null {
  const C = ctor();
  if (!C) {
    cb.onError('not-supported');
    return null;
  }
  const rec = new C();
  rec.lang = lang;
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  let finalText = '';
  let errored = false;
  let cancelled = false;
  rec.onresult = (e) => {
    let interim = '';
    for (let i = 0; i < e.results.length; i++) {
      const r = e.results[i];
      const t = r[0]?.transcript ?? '';
      if (r.isFinal) finalText = `${finalText} ${t}`.trim();
      else interim += t;
    }
    if (interim) cb.onInterim?.(`${finalText} ${interim}`.trim());
  };
  rec.onerror = (e) => {
    errored = true;
    cb.onError(mapError(e.error));
  };
  rec.onend = () => {
    if (!errored && !cancelled) {
      if (finalText.trim()) cb.onFinal(finalText.trim());
      else cb.onError('no-speech');
    }
    cb.onEnd?.();
  };
  try {
    rec.start();
  } catch {
    cb.onError('other');
    return null;
  }
  return {
    stop: () => rec.stop(),
    cancel: () => {
      cancelled = true;
      rec.abort();
    },
  };
}
