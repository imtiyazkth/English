import { useEffect, useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { Banner, Button, Card, ConfirmDialog, PageHeader, AudioButton } from '../../components/ui';
import { useStore } from '../../app/store';
import { buildExport, updateSettings, validateImport, setProfile } from '../../services/progress';
import { BACKEND_LABELS } from '../../services/storage/backends';
import { loadVoices, ttsSupported } from '../../services/speech/tts';
import { sttSupported } from '../../services/speech/stt';
import { tutorService, TutorStatus } from '../../services/tutor/tutorService';
import { STAGES } from '../../data/stages';
import type { Accent, AppData, Goal, Profile, StageId, SupportLang } from '../../types';
import { dateKey } from '../../utils/dates';

export function Settings() {
  const { data, update, replaceAll, resetAll, backend, storageError, toast } = useStore();
  const p = data.profile;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [status, setStatus] = useState<TutorStatus | null>(null);
  const [pending, setPending] = useState<AppData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadVoices().then((v) => setVoices(v.filter((x) => x.lang.toLowerCase().startsWith('en'))));
    void tutorService.status().then(setStatus);
  }, []);

  function patchProfile(patch: Partial<Profile>) {
    if (!p) return;
    update((d) => setProfile(d, { ...p, ...patch }));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(buildExport(data), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-saathi-backup-${dateKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Backup file created. Keep it somewhere safe.');
  }

  async function onFile(file: File | undefined) {
    setImportError(null);
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return setImportError('That file is too large to be an English Saathi backup.');
    try {
      const raw: unknown = JSON.parse(await file.text());
      const res = validateImport(raw);
      if (!res.ok) return setImportError(res.error);
      setPending(res.data);
    } catch {
      setImportError('Could not read that file. Please choose a backup exported from English Saathi (.json).');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const label = BACKEND_LABELS[backend];

  return (
    <div className="stack">
      <PageHeader title="Settings" titleHi="सेटिंग्स" />

      {!label.persistent && <Banner tone="error">{label.en} <span className="hi" lang="hi">{label.hi}</span></Banner>}
      {storageError && <Banner tone="warn">Storage problem: {storageError}</Banner>}

      {p && (
        <Card className="stack">
          <h2>Your learning plan</h2>
          <label className="field">
            <span className="field-label">Name</span>
            <input className="input" value={p.name} maxLength={40} onChange={(e) => patchProfile({ name: e.target.value })} />
          </label>
          <label className="field">
            <span className="field-label">Level</span>
            <select className="select" value={p.level} onChange={(e) => patchProfile({ level: e.target.value as StageId })}>
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Main goal</span>
            <select className="select" value={p.goal} onChange={(e) => patchProfile({ goal: e.target.value as Goal })}>
              <option value="conversation">Daily conversation</option>
              <option value="work">Job / workplace English</option>
              <option value="interview">Interview preparation</option>
              <option value="exams">Study / exams</option>
              <option value="travel">Travel</option>
              <option value="customer">Customer service</option>
              <option value="professional">Professional communication</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Daily goal</span>
            <select className="select" value={p.dailyMinutes} onChange={(e) => patchProfile({ dailyMinutes: Number(e.target.value) as Profile['dailyMinutes'] })}>
              {[5, 10, 15, 20, 30].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Support language</span>
            <select className="select" value={p.support} onChange={(e) => patchProfile({ support: e.target.value as SupportLang })}>
              <option value="hindi">Hindi support</option>
              <option value="mixed">Hindi and English mixed</option>
              <option value="english">English only (Hindi on tap)</option>
            </select>
          </label>
        </Card>
      )}

      <Card className="stack">
        <h2>Audio and speaking</h2>
        <ul className="plain-list">
          <li>Audio playback: {ttsSupported() ? 'supported' : 'not supported in this browser'}</li>
          <li>Voice recognition: {sttSupported() ? 'supported (the browser may use an online service)' : 'not supported — you can type answers'}</li>
        </ul>
        {p && (
          <label className="field">
            <span className="field-label">English accent for audio</span>
            <select className="select" value={p.accent} onChange={(e) => patchProfile({ accent: e.target.value as Accent })}>
              <option value="en-IN">Indian English</option>
              <option value="en-GB">British English</option>
              <option value="en-US">American English</option>
            </select>
          </label>
        )}
        <label className="field">
          <span className="field-label">Voice</span>
          <select className="select" value={data.settings.voiceURI ?? ''} onChange={(e) => update((d) => updateSettings(d, { voiceURI: e.target.value || null }))}>
            <option value="">Automatic (best match for accent)</option>
            {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Speaking speed: {data.settings.speechRate.toFixed(1)}×</span>
          <input type="range" min={0.5} max={1.2} step={0.1} value={data.settings.speechRate} onChange={(e) => update((d) => updateSettings(d, { speechRate: Number(e.target.value) }))} />
        </label>
        <AudioButton text="Hello! This is how I sound. Nice to meet you." label="Test voice" />
      </Card>

      <Card className="stack">
        <h2>Display and accessibility</h2>
        <label className="check">
          <input type="checkbox" checked={data.settings.largeText} onChange={(e) => update((d) => updateSettings(d, { largeText: e.target.checked }))} />
          <span>Larger text</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={data.settings.reduceMotion} onChange={(e) => update((d) => updateSettings(d, { reduceMotion: e.target.checked }))} />
          <span>Reduce motion (your device setting is also respected)</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={data.settings.showTranscripts} onChange={(e) => update((d) => updateSettings(d, { showTranscripts: e.target.checked }))} />
          <span>Allow “Show text” on listening questions</span>
        </label>
        <p className="muted small">Reminders: this web app cannot send reliable notifications on its own, so there is no reminder setting. Add an alarm on your phone for your study time.</p>
      </Card>

      <Card className="stack">
        <h2>Your data</h2>
        <p>{label.en} <span className="hi" lang="hi">{label.hi}</span></p>
        <p className="muted small">Progress stays in this browser on this device. It does not sync to other devices. Clearing the browser's site data deletes it, so export a backup now and then.</p>
        <div className="row wrap">
          <Button variant="secondary" onClick={exportData}>
            <Download size={16} aria-hidden /> Export backup
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={16} aria-hidden /> Import backup
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Choose a backup file" onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
        {importError && <Banner tone="error">{importError}</Banner>}
        <hr />
        <Button variant="danger" onClick={() => setConfirmReset(true)}>
          <Trash2 size={16} aria-hidden /> Delete all my progress
        </Button>
      </Card>

      <Card className="stack">
        <h2>Saathi AI Tutor status</h2>
        {status === null ? (
          <p className="muted">Checking…</p>
        ) : status.available ? (
          <p>Connected{status.model ? ` (model: ${status.model})` : ''}. Free-tier usage limits may apply.</p>
        ) : (
          <p>
            Not available: {status.reason === 'offline' ? 'you are offline' : status.reason === 'not-configured' ? 'the server has no API key configured' : 'the tutor backend is not deployed here'}. The rest of the app works normally.
          </p>
        )}
        <p className="muted small">The API key is stored only as an encrypted server secret. It is never inside this app's code or your browser.</p>
      </Card>

      <Card className="stack">
        <h2>Privacy summary</h2>
        <ul className="plain-list small">
          <li>No account, email or sign-up is needed.</li>
          <li>Lessons, scores and words are stored on this device only.</li>
          <li>Your voice is not stored by this app. Your browser may send it to its own speech service to convert it to text.</li>
          <li>AI tutor messages are sent to Google's Gemini API via this site's server. Chats are not saved by this app.</li>
        </ul>
      </Card>

      <ConfirmDialog
        open={pending !== null}
        title="Replace your progress with this backup?"
        body={
          pending && (
            <>
              <p>
                The backup has {Object.keys(pending.lessons).length} lessons, {Object.keys(pending.vocab).length} words and {pending.attempts.length} answers (last saved {new Date(pending.updatedAt).toLocaleString()}).
              </p>
              <p><strong>Your current progress on this device will be replaced.</strong> Export a backup first if you want to keep it.</p>
            </>
          )
        }
        confirmLabel="Replace my progress"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) replaceAll(pending);
          setPending(null);
          toast('Backup restored.');
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Delete all progress?"
        body={<p>This removes your profile, lessons, scores and words from this device. It cannot be undone unless you have an exported backup.</p>}
        confirmLabel="Delete everything"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          void resetAll().then(() => toast('All progress deleted.'));
        }}
      />
    </div>
  );
}
