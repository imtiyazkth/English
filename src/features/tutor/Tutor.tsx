import { useEffect, useRef, useState } from 'react';
import { Mic, Send, RotateCcw, Square } from 'lucide-react';
import { Banner, Button, Card, PageHeader } from '../../components/ui';
import { useStore } from '../../app/store';
import { useRoute } from '../../app/router';
import { updateTutorPrefs } from '../../services/progress';
import { TUTOR_MESSAGES, TUTOR_SCENARIOS, tutorService, TutorMode, TutorStatus, TutorTurn } from '../../services/tutor/tutorService';
import { describeSttError, Recognizer, startRecognition, sttSupported } from '../../services/speech/stt';

interface Bubble {
  id: number;
  role: 'user' | 'assistant' | 'error';
  text: string;
  retry?: () => void;
}

const MODES: { id: TutorMode; label: string; hi: string }[] = [
  { id: 'chat', label: 'Ask anything', hi: 'कुछ भी पूछें' },
  { id: 'explain-hindi', label: 'Explain in Hindi', hi: 'हिंदी में समझाओ' },
  { id: 'beginner', label: 'Make it easier', hi: 'और आसान' },
  { id: 'hint', label: 'Give me a hint', hi: 'संकेत दो' },
  { id: 'correct', label: 'Correct my sentence', hi: 'मेरा वाक्य सुधारो' },
  { id: 'quiz', label: 'Make me a quiz', hi: 'क्विज़ बनाओ' },
  { id: 'roleplay', label: 'Role-play', hi: 'रोल-प्ले' },
];

const SUGGESTIONS: { mode: TutorMode; text: string }[] = [
  { mode: 'explain-hindi', text: 'Hindi mein samjhao: when do I use am, is and are?' },
  { mode: 'correct', text: 'Correct my sentence: I am go to market yesterday.' },
  { mode: 'quiz', text: 'Make a short quiz for my level.' },
  { mode: 'chat', text: 'What is the difference between "a" and "the"?' },
  { mode: 'beginner', text: 'Teach me five words I can use in a shop.' },
];

let nextId = 1;

export function Tutor() {
  const { data, update } = useStore();
  const route = useRoute();
  const profile = data.profile;
  const [turns, setTurns] = useState<TutorTurn[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const initialMode = (MODES.find((m) => m.id === route.query.get('mode'))?.id ?? (route.query.get('scenario') ? 'roleplay' : 'chat')) as TutorMode;
  const [mode, setMode] = useState<TutorMode>(initialMode);
  const [scenario, setScenario] = useState<string>(route.query.get('scenario') ?? TUTOR_SCENARIOS[0].id);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TutorStatus | null>(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognizer | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const sttOk = sttSupported();

  function checkStatus() {
    setStatus(null);
    void tutorService.status().then(setStatus);
  }
  useEffect(checkStatus, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [bubbles, loading]);
  useEffect(() => () => recRef.current?.cancel(), []);

  async function send(text: string, forMode: TutorMode = mode, history: TutorTurn[] = turns) {
    const clean = text.trim();
    if (!clean || loading || !profile) return;
    const userTurn: TutorTurn = { role: 'user', text: clean };
    const nextTurns: TutorTurn[] = [...history, userTurn].slice(-10);
    setTurns(nextTurns);
    setBubbles((b) => [...b.filter((x) => x.role !== 'error'), { id: nextId++, role: 'user', text: clean }]);
    setInput('');
    setLoading(true);
    const res = await tutorService.send({
      turns: nextTurns,
      mode: forMode,
      level: profile.level,
      support: profile.support,
      scenario: forMode === 'roleplay' ? scenario : undefined,
      oneQuestionAtATime: data.tutorPrefs.oneQuestionAtATime,
      slowEnglish: data.tutorPrefs.slowEnglish,
    });
    setLoading(false);
    if (res.ok) {
      const botTurn: TutorTurn = { role: 'assistant', text: res.reply };
      setTurns((t) => [...t, botTurn].slice(-10));
      setBubbles((b) => [...b, { id: nextId++, role: 'assistant', text: res.reply }]);
    } else {
      // Drop the unanswered user turn so a retry does not duplicate it.
      setTurns(history);
      setBubbles((b) => [...b, { id: nextId++, role: 'error', text: res.message, retry: () => void send(clean, forMode, history) }]);
      if (res.code === 'not-configured' || res.code === 'unavailable' || res.code === 'network') checkStatus();
    }
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    setListening(true);
    recRef.current = startRecognition(profile?.accent ?? 'en-IN', {
      onInterim: (t) => setInput(t),
      onFinal: (t) => setInput(t),
      onError: (c) => {
        setListening(false);
        if (c !== 'aborted') setBubbles((b) => [...b, { id: nextId++, role: 'error', text: `${describeSttError(c).hi}\n${describeSttError(c).en}` }]);
      },
      onEnd: () => setListening(false),
    });
    if (!recRef.current) setListening(false);
  }

  function reset() {
    setTurns([]);
    setBubbles([]);
  }

  const unavailable = status && !status.available;
  const reasonMsg =
    status?.reason === 'offline'
      ? { en: 'You are offline. The tutor needs an internet connection. Lessons and quizzes still work.', hi: 'आप ऑफ़लाइन हैं। ट्यूटर को इंटरनेट चाहिए। पाठ और क्विज़ चलते रहेंगे।' }
      : status?.reason === 'not-deployed'
        ? { en: 'The tutor backend is not reachable. It only works on the deployed site (Cloudflare Pages), not on a plain static host. Everything else still works.', hi: 'ट्यूटर बैकएंड नहीं मिल रहा। यह सिर्फ़ डिप्लॉय की गई साइट (Cloudflare Pages) पर चलता है।' }
        : TUTOR_MESSAGES['not-configured'];

  return (
    <div className="stack tutor">
      <PageHeader title="Saathi AI Tutor" titleHi="साथी AI ट्यूटर" />
      {status === null && <Banner tone="info">Checking the tutor…</Banner>}
      {unavailable && (
        <Banner tone="warn">
          {reasonMsg.en} <span className="hi" lang="hi">{reasonMsg.hi}</span>{' '}
          <Button variant="ghost" size="sm" onClick={checkStatus}>
            <RotateCcw size={14} aria-hidden /> Check again
          </Button>
        </Banner>
      )}

      <div className="row wrap" role="group" aria-label="Tutor mode">
        {MODES.map((m) => (
          <Button key={m.id} variant={mode === m.id ? 'primary' : 'secondary'} size="sm" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
            {m.label}
          </Button>
        ))}
      </div>

      {mode === 'roleplay' && (
        <Card className="stack">
          <label className="field">
            <span className="field-label">Scenario</span>
            <select className="select" value={scenario} onChange={(e) => { setScenario(e.target.value); reset(); }}>
              {TUTOR_SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>{s.title} — {s.titleHi}</option>
              ))}
            </select>
          </label>
          {turns.length === 0 && (
            <div>
              <Button variant="primary" disabled={!!unavailable || loading} onClick={() => void send('Please start the role-play.', 'roleplay', [])}>
                Start role-play
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="chat" aria-label="Conversation" role="log" aria-live="polite">
        {bubbles.length === 0 && (
          <div className="stack">
            <p className="muted">Hello! I am Saathi. Ask me about English in Hindi or English. Try one of these:</p>
            <div className="stack">
              {SUGGESTIONS.map((s) => (
                <button key={s.text} className="suggestion" disabled={!!unavailable || loading} onClick={() => { setMode(s.mode); void send(s.text, s.mode, []); }}>
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}
        {bubbles.map((b) => (
          <div key={b.id} className={`bubble bubble-${b.role}`}>
            <p className="bubble-text">{b.text}</p>
            {b.role === 'error' && b.retry && (
              <Button variant="secondary" size="sm" onClick={b.retry}>
                <RotateCcw size={14} aria-hidden /> Retry
              </Button>
            )}
          </div>
        ))}
        {loading && <div className="bubble bubble-assistant" role="status">Saathi is thinking…</div>}
        <div ref={endRef} />
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <label className="sr-only" htmlFor="tutor-input">Your message</label>
        <textarea id="tutor-input" className="textarea" rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === 'correct' ? 'Type or paste your sentence…' : 'Type your message in English or Hindi…'} maxLength={1000} />
        <div className="row">
          {sttOk && (
            <Button variant="secondary" onClick={toggleMic} aria-pressed={listening} aria-label={listening ? 'Stop dictation' : 'Speak your message'}>
              {listening ? <Square size={16} aria-hidden /> : <Mic size={16} aria-hidden />} {listening ? 'Stop' : 'Speak'}
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={loading || !input.trim() || !!unavailable}>
            <Send size={16} aria-hidden /> Send
          </Button>
          {bubbles.length > 0 && (
            <Button variant="ghost" onClick={reset}>
              New chat
            </Button>
          )}
        </div>
      </form>

      <Card className="stack">
        <h3>Tutor preferences</h3>
        <label className="check">
          <input type="checkbox" checked={data.tutorPrefs.oneQuestionAtATime} onChange={(e) => update((d) => updateTutorPrefs(d, { oneQuestionAtATime: e.target.checked }))} />
          <span>Ask me one question at a time</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={data.tutorPrefs.slowEnglish} onChange={(e) => update((d) => updateTutorPrefs(d, { slowEnglish: e.target.checked }))} />
          <span>Use slow, simple English</span>
        </label>
        <p className="muted small">
          Conversations are not saved: they disappear when you leave this page. Only these preferences are saved on your device. Your messages are sent through this site's server to Google's Gemini API to get a reply, so please do not share passwords or private details. The tutor can make mistakes; check important things.
        </p>
      </Card>
    </div>
  );
}
