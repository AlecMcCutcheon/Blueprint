import { useState } from 'react';
import { QUESTIONS, BONUS_POOL } from '../../domain/questions';
import Icon from './icons';
import { useTheme } from './theme';

interface Props {
  hasProgress: boolean;
  answeredCount: number;
  /** Begin the questionnaire — lands on the name step first. */
  onStart: () => void;
  onContinue: () => void;
  /**
   * The one import path: a share link, a bare blueprint code (BP1–6), or a
   * full-session code (BPS). The prefix decides — links/codes open that
   * person's blueprint, session codes restore your own run. Returns an error
   * string on failure.
   */
  onImportCode: (code: string) => string | null;
}

export default function Intro({
  hasProgress,
  answeredCount,
  onStart,
  onContinue,
  onImportCode,
}: Props) {
  const { theme, toggle } = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  // One box, any kind of code or a full link — what it is decides what
  // happens, so there's nothing to choose between before pasting.
  const tryCode = () => {
    const c = code.trim();
    if (!c) return;
    setError(null);
    const err = onImportCode(c);
    if (err) setError(err);
  };

  return (
    <main className="screen intro">
      <button
        className="theme-toggle"
        onClick={toggle}
        aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} />
      </button>

      <div className="intro__inner">
        <p className="intro__kicker">
          <Icon name="compass" size={14} /> A different kind of relationship questionnaire
        </p>
        <h1 className="intro__title">Blueprint</h1>
        <p className="intro__lede">
          Not “how important is communication to you?” — you already know what the good answers
          sound like. Instead: small situations, competing demands, and choices between things
          that are all reasonable. What you do when you don't know what's being measured.
        </p>

        <div className="intro__meta">
          {/* 133 scored core questions + 3 clarifying questions that close the run —
              presented as part of the normal flow, so the count is honest. */}
          <span className="chip">{QUESTIONS.length + BONUS_POOL.length} questions</span>
          <span className="chip">25–40 minutes</span>
          <span className="chip">browser-only, nothing uploaded</span>
        </div>

        <div className="intro__actions intro__actions--hero">
          <button className="btn btn--primary" onClick={onStart}>
            Begin
          </button>
          {hasProgress && (
            <button className="btn btn--ghost" onClick={onContinue}>
              Continue — {answeredCount} of {QUESTIONS.length} answered
            </button>
          )}
          <button
            className="btn btn--ghost"
            onClick={() => setShowImport((s) => !s)}
            aria-expanded={showImport}
          >
            <Icon name="import" size={15} /> Have a code or link?
          </button>
        </div>

        {showImport && (
          <div className="import-box">
            <label className="import-box__label" htmlFor="importcode">
              Paste anything you were sent: a <em>share link</em> or a blueprint code (starts
              with <code>BP</code>) opens that person's blueprint; a session code (starts with{' '}
              <code>BPS</code>) restores your own saved run, answers and all.
            </label>
            <div className="import-box__row">
              <input
                id="importcode"
                className="import-box__input"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && tryCode()}
                placeholder="Paste a link, BP…, or BPS… code"
                spellCheck={false}
                autoComplete="off"
              />
              <button className="btn btn--primary" onClick={tryCode} disabled={!code.trim()}>
                Open
              </button>
            </div>
            {error && <p className="import-box__error">{error}</p>}
            <p className="import-box__note">
              Blueprint codes carry derived scores only — never the individual answers. Their
              answers stay theirs.
            </p>
          </div>
        )}

        <div className="intro__grid">
          <section className="intro__card">
            <h2><Icon name="feather" size={15} /> How to answer</h2>
            <ul>
              <li>Go fast. First instinct, not best answer.</li>
              <li>Answer as you are, not as you intend to be.</li>
              <li>Every option is a real way of loving. None of them is the “good partner” answer.</li>
              <li>A few scenarios come back later wearing different clothes. That's the point.</li>
            </ul>
          </section>
          <section className="intro__card">
            <h2><Icon name="sparkle" size={15} /> What you'll get</h2>
            <p>
              A narrative document — <em>your</em> blueprint — built from your pattern of choices:
              how you interpret, reassure, care, receive, repair, and stay yourself inside a
              relationship. Where your answers agree with themselves, it says so. Where they pull
              against each other, it names that too.
            </p>
            <p className="intro__fine">
              No compatibility scores, no “types,” no diagnosis — a mirror with decent lighting.
              At the end you can export your session, download the document, or share a link or a
              short code — with your name, if you want — to compare with a partner, each on your
              own device.
            </p>
          </section>
        </div>

        <p className="intro__footnote">
          Everything stays in this browser: answers, results, and codes live in local storage and
          files you export. There is no server.
        </p>
      </div>
    </main>
  );
}
