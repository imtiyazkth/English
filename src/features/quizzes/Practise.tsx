import { BookOpen, Headphones, Languages, Layers, Mic, PenLine, Sparkles, Timer, ListChecks, RotateCcw, CalendarCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, PageHeader, Chip } from '../../components/ui';
import { Link } from '../../app/router';
import { useStore } from '../../app/store';
import { SKILL_LABELS, Skill } from '../../types';
import { vocabCounts } from '../../services/selectors';

function Tile({ to, icon, title, hi, note }: { to: string; icon: ReactNode; title: string; hi: string; note?: string }) {
  return (
    <Link to={to} className="tile-link">
      <span className="tile-icon" aria-hidden>{icon}</span>
      <span>
        <strong>{title}</strong>
        <span className="hi muted block" lang="hi">{hi}</span>
        {note && <span className="muted small block">{note}</span>}
      </span>
    </Link>
  );
}

export function Practise() {
  const { data, today } = useStore();
  const counts = vocabCounts(data, today);
  const skills: Skill[] = ['reading', 'writing', 'listening', 'speaking', 'grammar', 'vocabulary'];
  return (
    <div className="stack">
      <PageHeader title="Practise" titleHi="अभ्यास" />

      <section className="stack" aria-labelledby="tests-h">
        <h2 id="tests-h">Quizzes and tests</h2>
        <div className="grid-2">
          <Tile to="/quiz/daily-check" icon={<CalendarCheck size={22} />} title="Daily exit check" hi="आज की जाँच" note="5 questions" />
          <Tile to="/quiz/timed" icon={<Timer size={22} />} title="Timed mixed quiz" hi="समय-सीमा वाला क्विज़" note="10 questions · 5 min" />
          <Tile to="/quiz/weekly" icon={<ListChecks size={22} />} title="Weekly mock test" hi="साप्ताहिक टेस्ट" note="15 questions" />
          <Tile to="/quiz/missed" icon={<RotateCcw size={22} />} title="Missed questions" hi="छूटे सवाल" note={data.missed.length ? `${data.missed.length} waiting` : 'None yet'} />
        </div>
      </section>

      <section className="stack" aria-labelledby="skills-h">
        <h2 id="skills-h">Practise one skill</h2>
        <div className="row wrap">
          {skills.map((s) => (
            <Link key={s} to={`/quiz/skill-${s}`} className="btn btn-secondary btn-md">
              {SKILL_LABELS[s].en} <span className="hi" lang="hi">{SKILL_LABELS[s].hi}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="stack" aria-labelledby="tools-h">
        <h2 id="tools-h">Learning tools</h2>
        <div className="grid-2">
          <Tile to="/reading" icon={<BookOpen size={22} />} title="Reading" hi="पढ़ना" note="Tap any word for help" />
          <Tile to="/listening" icon={<Headphones size={22} />} title="Listening" hi="सुनना" note="Passages, sounds, dictation" />
          <Tile to="/speaking" icon={<Mic size={22} />} title="Speaking" hi="बोलना" note="Repeat, read aloud, role-play" />
          <Tile to="/writing" icon={<PenLine size={22} />} title="Writing" hi="लिखना" note="Guided tasks and checks" />
          <Tile to="/grammar" icon={<Languages size={22} />} title="Grammar library" hi="व्याकरण" />
          <Tile to="/vocab" icon={<Layers size={22} />} title="Vocabulary" hi="शब्द-भंडार" note={`${counts.total} words · ${counts.due} due`} />
          <Tile to="/flashcards" icon={<Sparkles size={22} />} title="Flashcards" hi="फ़्लैशकार्ड" note={counts.due + counts.new ? `${counts.due + counts.new} ready` : 'Nothing due'} />
          <Tile to="/pronunciation" icon={<Mic size={22} />} title="Pronunciation" hi="उच्चारण" note="Sounds, stress, rhythm" />
        </div>
      </section>
      {data.missed.length > 0 && (
        <Card>
          <Chip tone="warn">{data.missed.length} questions to review</Chip>
        </Card>
      )}
    </div>
  );
}
