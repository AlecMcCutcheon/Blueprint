import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Answers, ScoredProfile } from '../../domain/types';
import { profileToCode6, buildShareLink, encodeFullSession, type ShareIntent } from '../../domain/share';
import Icon from './icons';

interface Props {
  profile: ScoredProfile;
  /** The run's name — rides in the share link, never in the code. */
  myName?: string | null;
  /** Raw answers + seed for the portable session code (absent → no code row). */
  answers?: Answers;
  seed?: number;
  onExport?: () => void;
  onCopyMarkdown?: () => void;
}

/**
 * The Share-or-download slot, as ONE unit: the nav-bar button (share symbol;
 * X + accent highlight while open — press again to close) and the combined
 * panel it opens (share link/code first, downloads beneath). Every page that
 * hosts the bottom bar renders exactly this, so the share experience is
 * identical everywhere.
 */
export default function ShareOut({ profile, myName, answers, seed = 0, onExport, onCopyMarkdown }: Props) {
  const [open, setOpen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copiedWhat, setCopiedWhat] = useState<string | null>(null);
  // The panel's own copy of the intent — the link rebuilds live as it flips.
  const [intent, setIntent] = useState<ShareIntent>('show');

  const markCopied = (mark: string) => {
    setCopiedWhat(mark);
    window.setTimeout(() => setCopiedWhat((cur) => (cur === mark ? null : cur)), 2000);
  };

  const copyTo = async (text: string | null, mark: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard blocked — user can still select the text manually
    }
    markCopied(mark);
  };

  // Null means the run predates a bank change — the panel explains instead.
  const code = useMemo(() => {
    try {
      return profileToCode6(profile);
    } catch {
      return null;
    }
  }, [profile]);

  // Deterministic for a given answer set — computed once, no churn while read.
  const sessionCode = useMemo(() => {
    if (!answers) return null;
    try {
      return encodeFullSession(answers, seed, myName ?? null).code;
    } catch {
      return null;
    }
  }, [answers, seed, myName]);

  const link = useMemo(
    () => (code ? buildShareLink(code, { name: myName ?? null, intent }) : null),
    [code, myName, intent],
  );

  return (
    <>
      <button
        className={`btn btn--ghost bp__fbtn-round${open ? ' bp__fbtn-accent' : ''}`}
        onClick={() => setOpen((s) => !s)}
        title="Share or download your blueprint"
        aria-label="Share or download"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="share" size={16} />
        <span className="bp__fbtn-label">Share</span>
        <span className="bp__fbtn-mini">Share</span>
      </button>

      {/* The panel portals to document.body: rendering it inside the page
          tree made it subject to ancestor stacking contexts and scroll
          containers, which could strand it (and the bar with it). */}
      {open && createPortal(
        <div className="export-dlg export-dlg--share" role="dialog" aria-modal="true" aria-label="Share or download your blueprint" onClick={() => setOpen(false)}>
          <div className="export-dlg__panel" onClick={(e) => e.stopPropagation()}>
            <h2>
              <Icon name="share" size={16} /> Share
            </h2>
            {code === null ? (
              <p>
                This run predates a few newer questions, so there's no share link yet — one needs
                every dimension measured. Answering the remaining questions (your answers are all
                kept) completes it and unlocks comparing.
              </p>
            ) : (
              <div className="bp__sharepanel">
                <fieldset className="bp__intent">
                  <legend className="bp__sharelabel">Why you're sharing</legend>
                  <div className="bp__intentopts">
                    <label className={`bp__intentopt${intent === 'show' ? ' is-active' : ''}`}>
                      <input
                        type="radio"
                        name="shareintent"
                        checked={intent === 'show'}
                        onChange={() => setIntent('show')}
                      />
                      <span>Show</span>
                    </label>
                    <label className={`bp__intentopt${intent === 'invite' ? ' is-active' : ''}`}>
                      <input
                        type="radio"
                        name="shareintent"
                        checked={intent === 'invite'}
                        onChange={() => setIntent('invite')}
                      />
                      <span>Invite</span>
                    </label>
                  </div>
                </fieldset>
                {link && (
                  <div className="bp__linkbox">
                    <code className="bp__link" aria-label="Your share link">{link}</code>
                    <div className="bp__codebtns">
                      <button className="btn btn--primary btn--small" onClick={() => void copyTo(link, 'link')}>
                        <Icon name={copiedWhat === 'link' ? 'check' : 'copy'} size={14} />
                        {copiedWhat === 'link' ? 'Copied' : 'Copy link'}
                      </button>
                      <button
                        className={`btn btn--ghost btn--small bp__icontoggle${showCode ? ' is-active' : ''}`}
                        onClick={() => setShowCode((s) => !s)}
                        title={showCode ? 'Hide the bare code' : 'Show the bare code'}
                        aria-expanded={showCode}
                      >
                        <Icon name="code" size={15} />
                        {showCode ? 'Hide code' : 'Show code'}
                      </button>
                    </div>
                  </div>
                )}
                {showCode && code && (
                  <div className="bp__codebox">
                    <code className="bp__code" aria-label="Your share code">{code}</code>
                    <div className="bp__codebtns">
                      <button className="btn btn--ghost btn--small" onClick={() => void copyTo(code, 'bpcode')}>
                        <Icon name={copiedWhat === 'bpcode' ? 'check' : 'copy'} size={14} />
                        {copiedWhat === 'bpcode' ? 'Copied' : 'Copy code'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <h2 className="export-dlg__sub">
              <Icon name="download" size={16} /> Downloads
            </h2>
            <div className="dlrow dlrow--stack">
              <div className="dlrow__text">
                <strong>The document</strong>
                <span>A markdown file of your blueprint, for keeping or attaching.</span>
              </div>
              <div className="dlrow__btns">
                <button className="btn btn--ghost btn--small" onClick={onExport} title="Download the markdown file">
                  <Icon name="download" size={14} />
                  <span className="dlrow__blabel">Download</span>
                </button>
                <button
                  className="btn btn--ghost btn--small"
                  onClick={() => {
                    onCopyMarkdown?.();
                    markCopied('md');
                  }}
                  disabled={!onCopyMarkdown}
                  title="Copy the markdown to your clipboard"
                >
                  <Icon name={copiedWhat === 'md' ? 'check' : 'copy'} size={14} />
                  <span className="dlrow__blabel">{copiedWhat === 'md' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="dlrow dlrow--stack">
              <div className="dlrow__text">
                <strong>Your session code</strong>
                <span>
                  Restores this exact run — answers and question order — anywhere you paste it
                  into “Have a code or link?”.
                </span>
              </div>
              {sessionCode ? (
                <button className="btn btn--ghost btn--small" onClick={() => void copyTo(sessionCode, 'code')}>
                  <Icon name={copiedWhat === 'code' ? 'check' : 'copy'} size={14} />
                  {copiedWhat === 'code' ? 'Copied' : 'Copy code'}
                </button>
              ) : (
                <span className="dlrow__none">Unavailable — this run predates a bank change.</span>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
