import { ButtonHTMLAttributes, ReactNode, useEffect, useId, useRef } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Link } from '../app/router';
import { useStore } from '../app/store';
import { useSpeech } from '../hooks/useSpeech';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg' | 'sm';
  block?: boolean;
};

export function Button({ variant = 'secondary', size = 'md', block, className = '', type = 'button', ...rest }: BtnProps) {
  return <button type={type} className={`btn btn-${variant} btn-${size}${block ? ' btn-block' : ''} ${className}`} {...rest} />;
}

export function LinkButton({
  to,
  variant = 'secondary',
  size = 'md',
  block,
  children,
}: {
  to: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg' | 'sm';
  block?: boolean;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={`btn btn-${variant} btn-${size}${block ? ' btn-block' : ''}`}>
      {children}
    </Link>
  );
}

export function Card({ children, className = '', as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' }) {
  return <Tag className={`card ${className}`}>{children}</Tag>;
}

export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)}>
      <div className="progress-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'info' }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {body && <p className="muted">{body}</p>}
      {action}
    </div>
  );
}

export function Banner({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error'; children: ReactNode }) {
  return (
    <div className={`banner banner-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

/** Sets the document title and moves focus to the page heading on navigation. */
export function PageHeader({ title, titleHi, back, right }: { title: string; titleHi?: string; back?: string; right?: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = `${title} · English Saathi`;
    ref.current?.focus({ preventScroll: true });
  }, [title]);
  return (
    <header className="page-header">
      {back && (
        <Link to={back} className="icon-btn" aria-label="Go back">
          <ArrowLeft size={20} aria-hidden />
        </Link>
      )}
      <div className="page-header-text">
        <h1 ref={ref} tabIndex={-1} className="page-title">
          {title}
        </h1>
        {titleHi && (
          <p className="hi muted" lang="hi">
            {titleHi}
          </p>
        )}
      </div>
      {right}
    </header>
  );
}

/** Hindi explanation text. If the learner chose English-only support it is collapsed behind a toggle. */
export function HiNote({ children, label = 'Hindi explanation' }: { children: ReactNode; label?: string }) {
  const { data } = useStore();
  if (data.profile?.support === 'english') {
    return (
      <details className="hi-note">
        <summary>{label} (हिंदी)</summary>
        <div className="hi" lang="hi">
          {children}
        </div>
      </details>
    );
  }
  return (
    <div className="hi hi-block" lang="hi">
      {children}
    </div>
  );
}

/** Play / slow buttons for text-to-speech, with an honest fallback when audio is unavailable. */
export function AudioButton({ text, label = 'Listen', showSlow = true, compact = false }: { text: string; label?: string; showSlow?: boolean; compact?: boolean }) {
  const sp = useSpeech();
  const id = useId();
  if (!sp.supported) {
    return (
      <span className="audio-missing" id={id}>
        <VolumeX size={16} aria-hidden /> Audio is not available on this device — read the text.
      </span>
    );
  }
  return (
    <span className="audio-group">
      <button type="button" className={`btn btn-secondary ${compact ? 'btn-sm' : 'btn-md'}`} onClick={() => (sp.speaking ? sp.stop() : sp.play(text))} aria-label={`${label}: ${text}`}>
        <Volume2 size={16} aria-hidden /> {sp.speaking ? 'Stop' : label}
      </button>
      {showSlow && (
        <button type="button" className={`btn btn-ghost ${compact ? 'btn-sm' : 'btn-md'}`} onClick={() => sp.play(text, { slow: true })} aria-label={`${label} slowly: ${text}`}>
          Slow
        </button>
      )}
      {sp.error && (
        <span className="muted small" role="status">
          {sp.error}
        </span>
      )}
    </span>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <div className="stack">{body}</div>
        <div className="row row-end">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint && <div className="muted small">{hint}</div>}
    </div>
  );
}
