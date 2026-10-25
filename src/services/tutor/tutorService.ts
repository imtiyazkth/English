import type { StageId, SupportLang } from '../../types';

export type TutorMode =
  | 'chat'
  | 'explain-hindi'
  | 'beginner'
  | 'hint'
  | 'correct'
  | 'quiz'
  | 'roleplay';

export type TutorErrorCode =
  | 'not-configured'
  | 'unavailable'
  | 'quota'
  | 'timeout'
  | 'network'
  | 'blocked'
  | 'bad-response'
  | 'too-long'
  | 'rate-limited';

export interface TutorTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface TutorRequest {
  turns: TutorTurn[];
  mode: TutorMode;
  level: StageId;
  support: SupportLang;
  scenario?: string;
  oneQuestionAtATime?: boolean;
  slowEnglish?: boolean;
}

export type TutorResult = { ok: true; reply: string } | { ok: false; code: TutorErrorCode; message: string };

export interface TutorStatus {
  /** The tutor endpoint answered and is configured on the server. */
  available: boolean;
  reason?: 'not-deployed' | 'not-configured' | 'offline';
  model?: string;
}

/** The front end only depends on this interface, so the model/provider can change without UI edits. */
export interface TutorService {
  status(): Promise<TutorStatus>;
  send(req: TutorRequest): Promise<TutorResult>;
}

export const TUTOR_MESSAGES: Record<TutorErrorCode, { en: string; hi: string }> = {
  'not-configured': {
    en: 'The AI tutor is not set up on this site yet. Lessons, quizzes and flashcards still work.',
    hi: 'AI ट्यूटर अभी इस साइट पर चालू नहीं है। पाठ, क्विज़ और फ़्लैशकार्ड पहले की तरह चलते रहेंगे।',
  },
  unavailable: {
    en: 'The AI tutor is not available right now. Please try again later.',
    hi: 'AI ट्यूटर अभी उपलब्ध नहीं है। थोड़ी देर बाद फिर कोशिश करें।',
  },
  quota: {
    en: 'The tutor has reached its usage limit for now. Please try again later; everything else in the app still works.',
    hi: 'ट्यूटर की इस्तेमाल सीमा फ़िलहाल पूरी हो गई है। बाद में फिर कोशिश करें; बाक़ी ऐप चलता रहेगा।',
  },
  timeout: { en: 'The tutor took too long to answer. Please try again.', hi: 'ट्यूटर ने जवाब देने में बहुत समय लिया। फिर कोशिश करें।' },
  network: { en: 'No connection to the tutor. Check your internet and try again.', hi: 'ट्यूटर से कनेक्शन नहीं हो पाया। इंटरनेट जाँचकर फिर कोशिश करें।' },
  blocked: {
    en: 'The tutor could not answer that message. Try rewording it.',
    hi: 'ट्यूटर इस संदेश का जवाब नहीं दे सका। इसे दूसरे शब्दों में लिखकर देखें।',
  },
  'bad-response': { en: 'The tutor sent an unreadable answer. Please try again.', hi: 'ट्यूटर का जवाब पढ़ा नहीं जा सका। फिर कोशिश करें।' },
  'too-long': { en: 'Your message is too long. Please shorten it.', hi: 'आपका संदेश बहुत लंबा है। उसे छोटा करें।' },
  'rate-limited': {
    en: 'You are sending messages too quickly. Wait a moment and try again.',
    hi: 'आप बहुत जल्दी-जल्दी संदेश भेज रहे हैं। थोड़ा रुककर फिर कोशिश करें।',
  },
};

function fail(code: TutorErrorCode): TutorResult {
  const m = TUTOR_MESSAGES[code];
  return { ok: false, code, message: `${m.hi}\n${m.en}` };
}

const CLIENT_TIMEOUT_MS = 30_000;

export class HttpTutorService implements TutorService {
  constructor(private base: string = '') {}

  async status(): Promise<TutorStatus> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return { available: false, reason: 'offline' };
    try {
      const res = await fetch(`${this.base}/api/health`, { headers: { Accept: 'application/json' } });
      const type = res.headers.get('content-type') ?? '';
      // A static host (or the dev server) answers with HTML for unknown routes: no backend deployed.
      if (!res.ok || !type.includes('application/json')) return { available: false, reason: 'not-deployed' };
      const j = (await res.json()) as { tutorConfigured?: boolean; model?: string };
      return j.tutorConfigured
        ? { available: true, model: j.model }
        : { available: false, reason: 'not-configured', model: j.model };
    } catch {
      return { available: false, reason: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'not-deployed' };
    }
  }

  async send(req: TutorRequest): Promise<TutorResult> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch(`${this.base}/api/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: ctrl.signal,
      });
      const type = res.headers.get('content-type') ?? '';
      if (!type.includes('application/json')) return fail('not-configured');
      const j = (await res.json()) as { ok?: boolean; reply?: string; code?: TutorErrorCode };
      if (j.ok && typeof j.reply === 'string' && j.reply.trim()) return { ok: true, reply: j.reply };
      if (j.code && j.code in TUTOR_MESSAGES) return fail(j.code);
      return fail(res.status === 429 ? 'quota' : 'bad-response');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return fail('timeout');
      return fail('network');
    } finally {
      clearTimeout(timer);
    }
  }
}


export const TUTOR_SCENARIOS: { id: string; title: string; titleHi: string }[] = [
  { id: 'meeting-someone', title: 'Meeting someone new', titleHi: 'किसी नए व्यक्ति से मिलना' },
  { id: 'ordering-food', title: 'Ordering food', titleHi: 'खाना ऑर्डर करना' },
  { id: 'asking-directions', title: 'Asking directions', titleHi: 'रास्ता पूछना' },
  { id: 'customer-service', title: 'Helping a customer', titleHi: 'ग्राहक की मदद' },
  { id: 'talking-to-manager', title: 'Talking to a manager', titleHi: 'मैनेजर से बात' },
  { id: 'job-interview', title: 'Job interview', titleHi: 'नौकरी का इंटरव्यू' },
  { id: 'doctor-reception', title: "Doctor's reception", titleHi: 'डॉक्टर का रिसेप्शन' },
  { id: 'phone-call', title: 'Making a phone call', titleHi: 'फ़ोन कॉल करना' },
];

// Same-origin by default. Set VITE_API_BASE at build time to call a backend on another origin (e.g. Supabase).
const API_BASE: string = ((import.meta.env?.VITE_API_BASE as string | undefined) ?? '').replace(/\/+$/, '');
export const tutorService: TutorService = new HttpTutorService(API_BASE);
