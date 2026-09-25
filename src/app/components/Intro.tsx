import { useRef, useState } from 'react';
import { QUESTIONS, BONUS_POOL } from '../../domain/questions';
import Icon from './icons';
import { useTheme } from './theme';

interface Props {
  hasProgress: boolean;
  answeredCount: number;
  onStart: () => void;
  onContinue: () => void;
  /** Restore a full session from a JSON export. Returns an error string on failure. */
  onImportJson: (text: string) => string | null;
  /** Restore a full session from a BPS code. Returns an error string on failure. */
  onImportSessionCode: (code: string) => string | null;
  /** Open someone else's blueprint from their metric code (visitor mode). */
  onOpenCode: (code: string) => string | null;
}

export default function Intro({
  hasProgress,
  answeredCount,
  onStart,
  onContinue,
  onImportJson,
  onImportSessionCode,
  onOpenCode,
}: Props) {
  const { theme, toggle } = useTheme();
  const [sessionCode, setSessionCode] = useState('');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [visitorCode, setVisitorCode] = useState('');
  const [visitorError, setVisitorError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // One code box per section, each strict about its own kind — with a pointer
  // to the right box when the wrong code lands there, so the organization on
  // screen matches what each section is for.
  const trySessionCode = () => {
    const c = sessionCode.trim();
    if (!c) return;
    setSessionError(null);
    if (/^BP[1-4]/i.test(c)) {
      setSessionError('That\'s a blueprint code, not a session code — paste it under "Open someone else\'s blueprint" instead.');
      return;
    }
    const err = onImportSessionCode(c);
    if (err) setSessionError(err);
  };

  const tryVisitorCode = () => {
    const c = visitorCode.trim();
    if (!c) return;
    setVisitorError(null);
    if (/^BPS/i.test(c)) {
      setVisitorError('That\'s a full-session code — restore it under "Restore your own session" instead.');
      return;
    }
    const err = onOpenCode(c);
    if (err) setVisitorError(err);
  };

  const readFile = async (file: File) => {
    setFileError(null);
    try {
      const text = await file.text();
      const err = onImportJson(text);
      if (err) setFileError(err);
    } catch {
      setFileError('That file could not be read.');
    }
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
          {/* 115 scored core questions + 3 clarifying questions that close the run —
              presented as part of the normal flow, so the count is honest. */}
          <span className="chip">{QUESTIONS.length + BONUS_POOL.length} questions</span>
          <span className="chip">20–30 minutes</span>
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
            <Icon name="import" size={15} /> Import a session or blueprint
          </button>
        </div>

        {showImport && (
          <div className="import-box">
            <div className="import-box__half">
              <h3 className="import-box__title">Restore your own session</h3>
              <label className="import-box__label" htmlFor="sessionfile">
                Load a session file (.json) you exported from this or another device — your
                actual answers, restored exactly.
              </label>
              <input
                ref={fileRef}
                id="sessionfile"
                className="import-box__file"
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void readFile(f);
                  e.target.value = '';
                }}
              />
              <label className="import-box__label" htmlFor="sessioncode">
                Or paste a full-session code (starts with <code>BPS</code>)
              </label>
              <div className="import-box__row">
                <input
                  id="sessioncode"
                  className="import-box__input"
                  value={sessionCode}
                  onChange={(e) => {
                    setSessionCode(e.target.value);
                    setSessionError(null);
                  }}
                  placeholder="BPS…"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button className="btn btn--ghost" onClick={trySessionCode} disabled={!sessionCode.trim()}>
                  Restore
                </button>
              </div>
              {fileError && <p className="import-box__error">{fileError}</p>}
              {sessionError && <p className="import-box__error">{sessionError}</p>}
            </div>
            <div className="import-box__half">
              <h3 className="import-box__title">Open someone else's blueprint</h3>
              <label className="import-box__label" htmlFor="visitorcode">
                If they sent you a <em>link</em>, just open it — nothing to paste here. Otherwise
                paste their bare blueprint code (starts with <code>BP</code>)
              </label>
              <div className="import-box__row">
                <input
                  id="visitorcode"
                  className="import-box__input"
                  value={visitorCode}
                  onChange={(e) => {
                    setVisitorCode(e.target.value);
                    setVisitorError(null);
                  }}
                  placeholder="BP4…"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button className="btn btn--ghost" onClick={tryVisitorCode} disabled={!visitorCode.trim()}>
                  Open blueprint
                </button>
              </div>
              {visitorError && <p className="import-box__error">{visitorError}</p>}
              <p className="import-box__note">
                Blueprint codes carry derived scores only — never the individual answers. Their
                answers stay theirs.
              </p>
            </div>
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
