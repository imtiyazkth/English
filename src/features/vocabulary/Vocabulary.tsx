import { useMemo, useState } from 'react';
import { Heart, Plus, Trash2 } from 'lucide-react';
import { Banner, Button, Card, Chip, Empty, LinkButton, PageHeader, AudioButton, ConfirmDialog } from '../../components/ui';
import { useStore } from '../../app/store';
import { VOCAB, VOCAB_THEMES } from '../../data/vocab';
import { addCustomVocab, addVocabIds, removeVocab, toggleFavourite } from '../../services/progress';
import { vocabCounts, vocabView } from '../../services/selectors';
import type { VocabStatus } from '../../types';

type Tab = 'mine' | 'packs' | 'add';
const STATUS_LABEL: Record<VocabStatus, string> = { new: 'New', learning: 'Learning', review: 'Review', mastered: 'Mastered' };

export function Vocabulary() {
  const { data, update, today, toast } = useStore();
  const [tab, setTab] = useState<Tab>('mine');
  const [filter, setFilter] = useState<'all' | VocabStatus | 'due' | 'fav'>('all');
  const [q, setQ] = useState('');
  const [en, setEn] = useState('');
  const [hi, setHi] = useState('');
  const [ex, setEx] = useState('');
  const [toRemove, setToRemove] = useState<string | null>(null);
  const counts = vocabCounts(data, today);

  const rows = useMemo(() => {
    return Object.values(data.vocab)
      .map((st) => ({ st, v: vocabView(st.id, data) }))
      .filter((r) => r.v)
      .filter(({ st, v }) => {
        if (filter === 'due') return st.status !== 'new' && st.due <= today;
        if (filter === 'fav') return st.favourite;
        if (filter !== 'all' && st.status !== filter) return false;
        const needle = q.trim().toLowerCase();
        return !needle || v!.en.toLowerCase().includes(needle) || v!.hi.includes(needle);
      })
      .sort((a, b) => a.v!.en.localeCompare(b.v!.en));
  }, [data, filter, q, today]);

  function addPack(theme: string) {
    const ids = VOCAB.filter((v) => v.theme === theme).map((v) => v.id);
    update((d) => addVocabIds(d, ids));
    toast(`Added “${theme}” words to your revision list.`);
  }

  return (
    <div className="stack">
      <PageHeader title="Vocabulary" titleHi="शब्द-भंडार" back="/practise" />
      <Card className="stack">
        <div className="stat-row">
          <div className="stat"><div className="stat-value">{counts.total}</div><div className="stat-label">Words</div></div>
          <div className="stat"><div className="stat-value">{counts.new}</div><div className="stat-label">New</div></div>
          <div className="stat"><div className="stat-value">{counts.learning}</div><div className="stat-label">Learning</div></div>
          <div className="stat"><div className="stat-value">{counts.due}</div><div className="stat-label">Due</div></div>
          <div className="stat"><div className="stat-value">{counts.mastered}</div><div className="stat-label">Mastered</div></div>
        </div>
        <LinkButton to="/flashcards" variant="primary" size="lg">
          Review flashcards
        </LinkButton>
        <p className="muted small">
          Review schedule: a simple SM-2-inspired heuristic. “Again” brings a word back today; “Good” and “Easy” space it out further. A word is “Mastered” once it is scheduled 21+ days ahead. This is a practical rule of thumb, not a scientifically exact model.
        </p>
      </Card>

      <div className="tabs" role="tablist" aria-label="Vocabulary sections">
        {([['mine', 'My words'], ['packs', 'Word packs'], ['add', 'Add a word']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'mine' && (
        <div className="stack">
          <div className="row wrap">
            <label className="field grow">
              <span className="sr-only">Search words</span>
              <input className="input" placeholder="Search words" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <label className="field">
              <span className="sr-only">Filter</span>
              <select className="select" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
                <option value="all">All</option>
                <option value="due">Due now</option>
                <option value="new">New</option>
                <option value="learning">Learning</option>
                <option value="review">Review</option>
                <option value="mastered">Mastered</option>
                <option value="fav">Favourites</option>
              </select>
            </label>
          </div>
          {counts.total === 0 ? (
            <Empty title="Your word list is empty." body="Add a word pack, or complete a lesson — its words are added automatically." action={<Button variant="primary" onClick={() => setTab('packs')}>Browse word packs</Button>} />
          ) : rows.length === 0 ? (
            <Empty title="No words match." />
          ) : (
            <ul className="word-list">
              {rows.map(({ st, v }) => (
                <li key={st.id} className="word-row">
                  <div className="word-main">
                    <strong>{v!.en}</strong> <span className="hi" lang="hi">{v!.hi}</span>
                    {v!.hint && <span className="hi muted block small" lang="hi">उच्चारण-सहारा: {v!.hint}</span>}
                    {v!.example && (
                      <span className="muted block small">
                        {v!.example.en} {v!.example.hi && <span className="hi" lang="hi">— {v!.example.hi}</span>}
                      </span>
                    )}
                    <span className="row wrap small">
                      <Chip tone={st.status === 'mastered' ? 'good' : st.status === 'new' ? 'neutral' : 'info'}>{STATUS_LABEL[st.status]}</Chip>
                      {st.status !== 'new' && <span className="muted">next: {st.due <= today ? 'today' : st.due}</span>}
                    </span>
                  </div>
                  <div className="word-actions">
                    <AudioButton text={v!.en} compact showSlow={false} label="Say" />
                    <button className={`icon-btn${st.favourite ? ' on' : ''}`} aria-pressed={st.favourite} aria-label={st.favourite ? `Unfavourite ${v!.en}` : `Favourite ${v!.en}`} onClick={() => update((d) => toggleFavourite(d, st.id))}>
                      <Heart size={18} aria-hidden />
                    </button>
                    <button className="icon-btn" aria-label={`Remove ${v!.en}`} onClick={() => setToRemove(st.id)}>
                      <Trash2 size={18} aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'packs' && (
        <div className="stack">
          {VOCAB_THEMES.map((theme) => {
            const items = VOCAB.filter((v) => v.theme === theme);
            const inList = items.filter((v) => data.vocab[v.id]).length;
            return (
              <Card key={theme} className="stack">
                <div className="row between">
                  <h3>{theme}</h3>
                  <Chip>{inList}/{items.length} added</Chip>
                </div>
                <p className="muted small">{items.slice(0, 6).map((i) => i.en).join(', ')}{items.length > 6 ? '…' : ''}</p>
                <div>
                  <Button variant="secondary" disabled={inList === items.length} onClick={() => addPack(theme)}>
                    <Plus size={16} aria-hidden /> {inList === items.length ? 'All added' : 'Add pack'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'add' && (
        <Card className="stack">
          <h3>Add your own word</h3>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (!en.trim() || !hi.trim()) return;
              update((d) => addCustomVocab(d, { en, hi, example: ex }).data);
              toast(`Saved “${en.trim()}”.`);
              setEn('');
              setHi('');
              setEx('');
            }}
          >
            <label className="field">
              <span className="field-label">English word or phrase</span>
              <input className="input" value={en} onChange={(e) => setEn(e.target.value)} maxLength={60} required />
            </label>
            <label className="field">
              <span className="field-label">Meaning in Hindi</span>
              <input className="input" value={hi} onChange={(e) => setHi(e.target.value)} maxLength={80} required lang="hi" />
            </label>
            <label className="field">
              <span className="field-label">Example sentence (optional)</span>
              <input className="input" value={ex} onChange={(e) => setEx(e.target.value)} maxLength={140} />
            </label>
            <div>
              <Button type="submit" variant="primary" disabled={!en.trim() || !hi.trim()}>
                Save word
              </Button>
            </div>
          </form>
          <Banner tone="info">Custom words are stored only on this device.</Banner>
        </Card>
      )}

      <ConfirmDialog
        open={toRemove !== null}
        title="Remove this word?"
        body={<p>It will be removed from your revision list. You can add it again later.</p>}
        confirmLabel="Remove"
        danger
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) update((d) => removeVocab(d, toRemove));
          setToRemove(null);
        }}
      />
    </div>
  );
}
