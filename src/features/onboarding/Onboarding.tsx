import { ReactNode, useState } from 'react';
import { Check } from 'lucide-react';
import type { Accent, Goal, Profile, StageId, SupportLang } from '../../types';
import { Button, Card, ProgressBar, Banner } from '../../components/ui';
import { ExerciseRunner } from '../../components/ExerciseRunner';
import { useStore } from '../../app/store';
import { setProfile } from '../../services/progress';
import { PLACEMENT, suggestStage } from '../../data/placement';
import { STAGE_BY_ID, CEFR_NOTE_HI } from '../../data/stages';
import { BACKEND_LABELS } from '../../services/storage/backends';
import { navigate } from '../../app/router';

type Ability = { id: string; en: string; hi: string; level: StageId };
const ABILITIES: Ability[] = [
  { id: 'none', en: 'I know no English', hi: 'मुझे अंग्रेज़ी बिल्कुल नहीं आती', level: 'pre-a1' },
  { id: 'alphabet', en: 'I know the alphabet', hi: 'मुझे वर्णमाला आती है', level: 'pre-a1' },
  { id: 'words', en: 'I know a few words', hi: 'मुझे कुछ शब्द आते हैं', level: 'pre-a1' },
  { id: 'sentences', en: 'I can make simple sentences', hi: 'मैं आसान वाक्य बना सकता/सकती हूँ', level: 'a1' },
  { id: 'understand', en: 'I can understand some English', hi: 'मैं कुछ अंग्रेज़ी समझ लेता/लेती हूँ', level: 'a2' },
  { id: 'advanced', en: 'I am intermediate or advanced', hi: 'मैं मध्यम या उन्नत स्तर का हूँ', level: 'b1' },
];

const GOALS: { id: Goal; en: string; hi: string }[] = [
  { id: 'conversation', en: 'Daily conversation', hi: 'रोज़ की बातचीत' },
  { id: 'work', en: 'Job / workplace English', hi: 'नौकरी / कार्यस्थल' },
  { id: 'interview', en: 'Interview preparation', hi: 'इंटरव्यू की तैयारी' },
  { id: 'exams', en: 'Study / exams', hi: 'पढ़ाई / परीक्षा' },
  { id: 'travel', en: 'Travel', hi: 'यात्रा' },
  { id: 'customer', en: 'Customer service', hi: 'ग्राहक सेवा' },
  { id: 'professional', en: 'Professional communication', hi: 'पेशेवर संवाद' },
];

const MINUTES: Profile['dailyMinutes'][] = [5, 10, 15, 20, 30];
const SUPPORTS: { id: SupportLang; en: string; hi: string }[] = [
  { id: 'hindi', en: 'Hindi support (recommended for beginners)', hi: 'हिंदी में समझाएँ' },
  { id: 'mixed', en: 'Mix of Hindi and English', hi: 'हिंदी और अंग्रेज़ी मिलाकर' },
  { id: 'english', en: 'English only (Hindi hidden until I tap)', hi: 'सिर्फ़ अंग्रेज़ी (हिंदी टैप करने पर)' },
];
const ACCENTS: { id: Accent; en: string }[] = [
  { id: 'en-IN', en: 'Indian English' },
  { id: 'en-GB', en: 'British English' },
  { id: 'en-US', en: 'American English' },
];

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`choice${selected ? ' selected' : ''}`} aria-pressed={selected} onClick={onClick}>
      <span>{children}</span>
      {selected && <Check size={18} aria-label="selected" />}
    </button>
  );
}

export function Onboarding() {
  const { update, backend, toast } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [ability, setAbility] = useState<string>('none');
  const [goal, setGoal] = useState<Goal>('conversation');
  const [minutes, setMinutes] = useState<Profile['dailyMinutes']>(10);
  const [support, setSupport] = useState<SupportLang>('hindi');
  const [accent, setAccent] = useState<Accent>('en-IN');
  const [comfort, setComfort] = useState<Profile['comfort']>('nervous');
  const [level, setLevel] = useState<StageId>('pre-a1');
  const [tier, setTier] = useState(0);
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({});
  const [suggested, setSuggested] = useState<StageId | null>(null);

  const total = 6;

  function finish(chosen: StageId) {
    const profile: Profile = {
      name: name.trim(),
      level: chosen,
      goal,
      dailyMinutes: minutes,
      support,
      accent,
      comfort,
      createdAt: new Date().toISOString(),
    };
    update((d) => setProfile(d, profile));
    toast(`Welcome! Starting at ${STAGE_BY_ID[chosen].label}.`);
    navigate('/');
  }

  const abilityLevel = ABILITIES.find((a) => a.id === ability)?.level ?? 'pre-a1';

  return (
    <main className="onboarding">
      <div className="onboarding-inner stack">
        <div className="brand">
          <span className="brand-mark" aria-hidden>ES</span>
          <div>
            <h1 className="page-title">English Saathi</h1>
            <p className="hi muted" lang="hi">अंग्रेज़ी का आपका साथी</p>
          </div>
        </div>
        {step > 0 && step < 6 && <ProgressBar value={step} max={total - 1} label="Setup progress" />}

        {step === 0 && (
          <Card className="stack">
            <h2>Learn English step by step, in Hindi</h2>
            <p className="hi" lang="hi">
              इंग्लिश साथी आपको बिल्कुल शुरू से सिखाता है — अक्षर, आवाज़ें, शब्द, वाक्य और बातचीत। पढ़ना, लिखना, सुनना और बोलना, चारों साथ-साथ।
            </p>
            <ul className="plain-list">
              <li>No sign-up. No email. Start right now.</li>
              <li>Short daily sessions of 5 to 30 minutes.</li>
              <li>{BACKEND_LABELS[backend].en}</li>
            </ul>
            <label className="field">
              <span className="field-label">What should we call you? (optional)</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="given-name" />
            </label>
            <Button variant="primary" size="lg" block onClick={() => setStep(1)}>
              Get started
            </Button>
            <Button variant="ghost" block onClick={() => finish('pre-a1')}>
              Start from zero — skip the questions
            </Button>
          </Card>
        )}

        {step === 1 && (
          <Card className="stack">
            <h2>How much English do you know?</h2>
            <p className="hi" lang="hi">अभी आपकी अंग्रेज़ी कैसी है?</p>
            <div className="stack" role="group" aria-label="Current ability">
              {ABILITIES.map((a) => (
                <Choice key={a.id} selected={ability === a.id} onClick={() => setAbility(a.id)}>
                  {a.en}
                  <span className="hi muted block" lang="hi">{a.hi}</span>
                </Choice>
              ))}
            </div>
            <Nav onBack={() => setStep(0)} onNext={() => { setLevel(abilityLevel); setStep(2); }} />
          </Card>
        )}

        {step === 2 && (
          <Card className="stack">
            <h2>What is your main goal?</h2>
            <div className="stack" role="group" aria-label="Main goal">
              {GOALS.map((g) => (
                <Choice key={g.id} selected={goal === g.id} onClick={() => setGoal(g.id)}>
                  {g.en} <span className="hi muted" lang="hi">· {g.hi}</span>
                </Choice>
              ))}
            </div>
            <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </Card>
        )}

        {step === 3 && (
          <Card className="stack">
            <h2>How long can you practise each day?</h2>
            <div className="row wrap" role="group" aria-label="Daily minutes">
              {MINUTES.map((m) => (
                <Button key={m} variant={minutes === m ? 'primary' : 'secondary'} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
                  {m} min
                </Button>
              ))}
            </div>
            <p className="muted small">10–15 minutes every day works better than one long session a week.</p>
            <Nav onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </Card>
        )}

        {step === 4 && (
          <Card className="stack">
            <h2>How should we help you?</h2>
            <div className="stack" role="group" aria-label="Support language">
              {SUPPORTS.map((s) => (
                <Choice key={s.id} selected={support === s.id} onClick={() => setSupport(s.id)}>
                  {s.en} <span className="hi muted block" lang="hi">{s.hi}</span>
                </Choice>
              ))}
            </div>
            <h3>English voice for audio (where your device has one)</h3>
            <div className="row wrap" role="group" aria-label="Accent">
              {ACCENTS.map((a) => (
                <Button key={a.id} variant={accent === a.id ? 'primary' : 'secondary'} aria-pressed={accent === a.id} onClick={() => setAccent(a.id)}>
                  {a.en}
                </Button>
              ))}
            </div>
            <p className="muted small">All of these are good English. Aim to be clear and confident; no accent is “better”.</p>
            <h3>How do you feel about speaking English?</h3>
            <div className="row wrap" role="group" aria-label="Speaking comfort">
              {([['nervous', 'Nervous'], ['okay', 'Okay'], ['confident', 'Confident']] as const).map(([id, label]) => (
                <Button key={id} variant={comfort === id ? 'primary' : 'secondary'} aria-pressed={comfort === id} onClick={() => setComfort(id)}>
                  {label}
                </Button>
              ))}
            </div>
            <Nav onBack={() => setStep(3)} onNext={() => setStep(5)} nextLabel="Next" />
          </Card>
        )}

        {step === 5 && (
          <Card className="stack">
            <h2>Where should you start?</h2>
            <p>
              Suggested start: <strong>{STAGE_BY_ID[level].label}</strong>
            </p>
            <p className="hi" lang="hi">{STAGE_BY_ID[level].descriptionHi}</p>
            <p className="muted small hi" lang="hi">{CEFR_NOTE_HI}</p>
            <Button variant="primary" size="lg" block onClick={() => finish(level)}>
              Start at {STAGE_BY_ID[level].label}
            </Button>
            {level !== 'pre-a1' && (
              <Button variant="secondary" block onClick={() => finish('pre-a1')}>
                I prefer to start from zero
              </Button>
            )}
            <Button variant="ghost" block onClick={() => { setTier(0); setCorrectMap({}); setSuggested(null); setStep(6); }}>
              Take a short placement check (about 3 minutes)
            </Button>
          </Card>
        )}

        {step === 6 && (
          <Card className="stack">
            <h2>Quick placement check</h2>
            <Banner tone="info">
              This is a short, rough check to suggest a starting point. It is not an official test or CEFR score. You can always change level later.
            </Banner>
            {suggested === null ? (
              <ExerciseRunner
                key={tier}
                exercises={PLACEMENT[tier].questions}
                context="placement"
                contextId={`tier-${PLACEMENT[tier].stage}`}
                finishLabel={tier < PLACEMENT.length - 1 ? 'Next level' : 'See result'}
                onFinish={(s) => {
                  const map = { ...correctMap };
                  for (const q of PLACEMENT[tier].questions) map[q.id] = !s.missedIds.includes(q.id);
                  setCorrectMap(map);
                  const passed = PLACEMENT[tier].questions.every((q) => map[q.id]);
                  if (passed && tier < PLACEMENT.length - 1) setTier(tier + 1);
                  else setSuggested(suggestStage(map));
                }}
              />
            ) : (
              <div className="stack">
                <p>
                  We suggest starting at <strong>{STAGE_BY_ID[suggested].label}</strong>.
                </p>
                <p className="hi" lang="hi">{STAGE_BY_ID[suggested].descriptionHi}</p>
                <Button variant="primary" size="lg" block onClick={() => finish(suggested)}>
                  Start at {STAGE_BY_ID[suggested].label}
                </Button>
                {suggested !== 'pre-a1' && (
                  <Button variant="secondary" block onClick={() => finish('pre-a1')}>
                    I prefer to start from zero
                  </Button>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}

function Nav({ onBack, onNext, nextLabel = 'Continue' }: { onBack: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <div className="row">
      <Button variant="ghost" onClick={onBack}>
        Back
      </Button>
      <Button variant="primary" size="lg" onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  );
}
