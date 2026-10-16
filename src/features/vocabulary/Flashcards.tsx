import { useMemo, useState } from 'react';
import { Banner, Button, Card, Empty, LinkButton, PageHeader, AudioButton, ProgressBar, HiNote } from '../../components/ui';
import { useStore } from '../../app/store';
import { markDailyStep, reviewVocab } from '../../services/progress';
import { studyQueue, vocabView } from '../../services/selectors';
import { Grade, schedule } from '../../utils/srs';

const GRADES: { id: Grade; label: string; hi: string }[] = [
  { id: 'again', label: 'Again', hi: 'फिर से' },
  { id: 'hard', label: 'Hard', hi: 'मुश्किल' },
  { id: 'good', label: 'Good', hi: 'ठीक' },
  { id: 'easy', label: 'Easy', hi: 'आसान' },
];

function intervalText(days: number): string {
  if (days <= 0) return 'today';
  return days === 1 ? '1 day' : `${days} days`;
}

export function Flashcards() {
  const { data, update, today } = useStore();
  // Freeze the queue at the start so cards do not reshuffle mid-session.
  const queue = useMemo(() => studyQueue(data, today, 15), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);
  const [counts, setCounts] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  if (queue.length === 0) {
    return (
      <div className="stack">
        <PageHeader title="Flashcards" titleHi="फ़्लैशकार्ड" back="/practise" />
        <Empty
          title="No words to review right now."
          body="Add a word pack or finish a lesson to get new words, or come back when reviews are due."
          action={<LinkButton to="/vocab" variant="primary">Open vocabulary</LinkButton>}
        />
      </div>
    );
  }

  if (idx >= queue.length) {
    return (
      <div className="stack">
        <PageHeader title="Flashcards" titleHi="फ़्लैशकार्ड" back="/practise" />
        <Card className="stack">
          <h2>Session complete</h2>
          <p>
            You reviewed {queue.length} word{queue.length === 1 ? '' : 's'}: Again {counts.again} · Hard {counts.hard} · Good {counts.good} · Easy {counts.easy}.
          </p>
          <p className="hi" lang="hi">बहुत बढ़िया! हर दोहराव याददाश्त पक्की करता है।</p>
          <div className="row wrap">
            <LinkButton to="/vocab" variant="secondary">Vocabulary</LinkButton>
            <LinkButton to="/" variant="primary">Home</LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  const id = queue[idx];
  const v = vocabView(id, data);
  const st = data.vocab[id];
  if (!v || !st) {
    // A word disappeared (for example it was removed); skip it.
    setTimeout(() => setIdx((i) => i + 1), 0);
    return null;
  }

  function grade(g: Grade) {
    update((d) => {
      let n = reviewVocab(d, id, g);
      if (idx + 1 >= queue.length) n = markDailyStep(n, 'review');
      return n;
    });
    setCounts((c) => ({ ...c, [g]: c[g] + 1 }));
    setShown(false);
    setIdx((i) => i + 1);
  }

  return (
    <div className="stack">
      <PageHeader title="Flashcards" titleHi="फ़्लैशकार्ड" back="/practise" />
      <ProgressBar value={idx} max={queue.length} label="Flashcard progress" />
      <p className="muted small">Card {idx + 1} of {queue.length}</p>
      <Card className="stack flashcard">
        <p className="flash-word">{v.en}</p>
        <AudioButton text={v.en} />
        {!shown ? (
          <Button variant="primary" size="lg" onClick={() => setShown(true)}>
            Show meaning
          </Button>
        ) : (
          <div className="stack">
            <p className="flash-hi hi" lang="hi">{v.hi}</p>
            {v.hint && <p className="hi muted small" lang="hi">उच्चारण-सहारा: {v.hint} (सिर्फ़ याद रखने के लिए; ऑडियो सुनें)</p>}
            {v.example && (
              <p>
                {v.example.en} {v.example.hi && <span className="hi" lang="hi">— {v.example.hi}</span>}
              </p>
            )}
            <p className="small">How well did you remember it?</p>
            <div className="grade-grid">
              {GRADES.map((g) => (
                <Button key={g.id} variant={g.id === 'again' ? 'secondary' : g.id === 'good' ? 'primary' : 'secondary'} onClick={() => grade(g.id)} aria-label={`${g.label}: next review ${intervalText(schedule(st, g.id, today).interval)}`}>
                  <span className="grade-label">{g.label}</span>
                  <span className="muted small">{intervalText(schedule(st, g.id, today).interval)}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>
      <Banner tone="info">
        <HiNote label="How reviews work">
          “Again” = आज ही दोबारा, “Good/Easy” = अगली बार ज़्यादा दिन बाद। नीचे हर बटन पर अगली समीक्षा का समय दिखता है।
        </HiNote>
      </Banner>
    </div>
  );
}
