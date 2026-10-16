import { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { BarChart3, BookOpen, Dumbbell, Home as HomeIcon, MessageCircle, Settings as SettingsIcon, WifiOff } from 'lucide-react';
import { Link, match, useRoute } from './router';
import { useStore } from './store';
import { Onboarding } from '../features/onboarding/Onboarding';
import { Home } from '../features/dashboard/Home';
import { Learn } from '../features/curriculum/Learn';
import { LessonPlayer } from '../features/curriculum/LessonPlayer';
import { Practise } from '../features/quizzes/Practise';
import { QuizPage } from '../features/quizzes/QuizPage';
import { Vocabulary } from '../features/vocabulary/Vocabulary';
import { Flashcards } from '../features/vocabulary/Flashcards';
import { ReadingList, ReadingPlayer } from '../features/reading/Reading';
import { ListeningHome, ListeningPlayer } from '../features/listening/Listening';
import { SpeakingHome, SpeakingTask } from '../features/speaking/Speaking';
import { PronunciationPage } from '../features/speaking/Pronunciation';
import { WritingHome, WritingTaskPage } from '../features/writing/Writing';
import { GrammarHome, GrammarTopic } from '../features/grammar/Grammar';
import { Tutor } from '../features/tutor/Tutor';
import { Progress } from '../features/progress/Progress';
import { Settings } from '../features/settings/Settings';
import { Empty, LinkButton } from '../components/ui';

const NAV = [
  { to: '/', label: 'Home', hi: 'होम', icon: HomeIcon, prefixes: [] as string[] },
  { to: '/learn', label: 'Learn', hi: 'सीखें', icon: BookOpen, prefixes: ['/learn', '/lesson'] },
  {
    to: '/practise',
    label: 'Practise',
    hi: 'अभ्यास',
    icon: Dumbbell,
    prefixes: ['/practise', '/quiz', '/reading', '/listening', '/speaking', '/writing', '/grammar', '/vocab', '/flashcards', '/pronunciation'],
  },
  { to: '/tutor', label: 'Tutor', hi: 'ट्यूटर', icon: MessageCircle, prefixes: ['/tutor'] },
  { to: '/progress', label: 'Progress', hi: 'प्रगति', icon: BarChart3, prefixes: ['/progress'] },
];

function renderRoute(path: string): ReactNode {
  if (path === '/') return <Home />;
  if (path === '/learn') return <Learn />;
  let m = match(path, '/lesson/:id');
  if (m) return <LessonPlayer key={m.id} id={m.id} />;
  if (path === '/practise') return <Practise />;
  m = match(path, '/quiz/:key');
  if (m) return <QuizPage key={m.key} quizKey={m.key} />;
  if (path === '/vocab') return <Vocabulary />;
  if (path === '/flashcards') return <Flashcards />;
  if (path === '/reading') return <ReadingList />;
  m = match(path, '/reading/:id');
  if (m) return <ReadingPlayer key={m.id} id={m.id} />;
  if (path === '/listening') return <ListeningHome />;
  m = match(path, '/listening/:id');
  if (m) return <ListeningPlayer key={m.id} id={m.id} />;
  if (path === '/speaking') return <SpeakingHome />;
  m = match(path, '/speaking/:id');
  if (m) return <SpeakingTask key={m.id} id={m.id} />;
  if (path === '/pronunciation') return <PronunciationPage />;
  if (path === '/writing') return <WritingHome />;
  m = match(path, '/writing/:id');
  if (m) return <WritingTaskPage key={m.id} id={m.id} />;
  if (path === '/grammar') return <GrammarHome />;
  m = match(path, '/grammar/:id');
  if (m) return <GrammarTopic key={m.id} id={m.id} />;
  if (path === '/tutor') return <Tutor />;
  if (path === '/progress') return <Progress />;
  if (path === '/settings') return <Settings />;
  return <Empty title="Page not found" body="That page does not exist." action={<LinkButton to="/" variant="primary">Go home</LinkButton>} />;
}

function isActive(path: string, item: (typeof NAV)[number]): boolean {
  if (item.to === '/') return path === '/';
  return item.prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

export function App() {
  const { ready, data } = useStore();
  const route = useRoute();
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.path]);

  if (!ready) {
    return (
      <div className="splash" role="status">
        <span className="brand-mark" aria-hidden>ES</span>
        <p>Loading English Saathi…</p>
      </div>
    );
  }
  if (!data.profile) return <Onboarding />;

  return (
    <div className="app">
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <header className="app-header">
        <Link to="/" className="brand-link" aria-label="English Saathi home">
          <span className="brand-mark" aria-hidden>ES</span>
          <span className="brand-name">English Saathi</span>
        </Link>
        <Link to="/settings" className="icon-btn" aria-label="Settings">
          <SettingsIcon size={20} aria-hidden />
        </Link>
      </header>
      {!online && (
        <div className="offline-bar" role="status">
          <WifiOff size={16} aria-hidden /> You are offline. Lessons and progress still work; the AI tutor and cloud features need internet.
        </div>
      )}
      <main id="main" tabIndex={-1} className="app-main">
        {renderRoute(route.path)}
      </main>
      <nav className="bottom-nav" aria-label="Main">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = isActive(route.path, n);
          return (
            <Link key={n.to} to={n.to} className={`nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon size={22} aria-hidden />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('English Saathi crashed', error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="splash stack" role="alert">
        <h1>Something went wrong</h1>
        <p>The app hit an unexpected problem. Your saved progress is not deleted. Please reload the page.</p>
        <p className="hi" lang="hi">कुछ गड़बड़ हुई। आपकी सेव की हुई प्रगति नहीं मिटी है। पेज दोबारा खोलें।</p>
        <button className="btn btn-primary btn-lg" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
