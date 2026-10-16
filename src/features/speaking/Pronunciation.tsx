import { Banner, Card, Chip, PageHeader, AudioButton, LinkButton } from '../../components/ui';
import { PRONUNCIATION, PRONUNCIATION_NOTE_HI } from '../../data/pronunciation';
import { STAGE_BY_ID } from '../../data/stages';

export function PronunciationPage() {
  return (
    <div className="stack">
      <PageHeader title="Pronunciation" titleHi="उच्चारण" back="/practise" />
      <Banner tone="info">
        <span className="hi" lang="hi">{PRONUNCIATION_NOTE_HI}</span>
      </Banner>
      <p className="muted small">The audio uses your device's voice, which may sound different from other devices. Practise with the Slow button, then at normal speed.</p>
      <LinkButton to="/listening" variant="secondary">
        Train your ear with sound pairs
      </LinkButton>
      {PRONUNCIATION.map((t) => (
        <details key={t.id} className="stage">
          <summary>
            <span className="stage-title">
              {t.title} <span className="hi muted" lang="hi">· {t.titleHi}</span>
            </span>
            <Chip>{STAGE_BY_ID[t.stage].cefr}</Chip>
          </summary>
          <Card className="stack">
            {t.bodyHi.map((p, i) => (
              <p key={i} className="hi" lang="hi">{p}</p>
            ))}
            <div className="stack">
              {t.examples.map((e) => (
                <div key={e.en} className="teach-item">
                  <div>
                    <p className="teach-en">{e.en}</p>
                    {e.hint && <p className="hi muted small" lang="hi">{e.hint}</p>}
                  </div>
                  <AudioButton text={e.en} compact />
                </div>
              ))}
            </div>
            {t.pairs && (
              <div className="stack">
                <h3>Minimal pairs</h3>
                {t.pairs.map(([a, b]) => (
                  <div key={a + b} className="row wrap pair-row">
                    <AudioButton text={a} label={a} showSlow={false} compact />
                    <span className="muted">vs</span>
                    <AudioButton text={b} label={b} showSlow={false} compact />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </details>
      ))}
    </div>
  );
}
