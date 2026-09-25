import { useEffect, useMemo, useState } from 'react';
import type { Blueprint, ScoredProfile } from '../../domain/types';
import { profileToCode5, buildShareLink, type ShareIntent } from '../../domain/share';
import Icon from './icons';
import type { IconName } from './icons';
import { useTheme } from './theme';

interface Props {
  blueprint: Blueprint;
  profile: ScoredProfile;
  /** Present when viewing SOMEONE ELSE's blueprint (arrived via a share link). */
  visitor?: { name: string | null; intent: ShareIntent };
  /** The owner's display name (link building + document phrasing). */
  myName?: string | null;
  onExport?: () => void;
  onExportSession?: () => void;
  onSaveName?: (name: string | null) => void;
  onStartCompare?: () => void;
  /** Visitor: begin the questionnaire themselves. */
  onStartTest?: () => void;
  onRetake: () => void;
  /** Present when any dimension is unmeasured: jump back into the questionnaire. */
  onStartUpgrade?: () => void;
  /** Core questions this session never answered (the bank grew after the run began). */
  unansweredCount?: number;
  /** Present when the user's own answers exist: open the answers-summary (Review) page. */
  onOpenReview?: () => void;
}

const SECTION_ICONS: Record<string, IconName> = {
  understanding: 'compass',
  communication: 'chat',
  safety: 'shield',
  reciprocity: 'heart',
  hard_days: 'umbrella',
  closeness: 'sparkle',
  independence: 'home',
  privacy: 'door',
  __crosscurrents: 'tension',
  __synthesis: 'loop',
};

export default function BlueprintView({
  blueprint,
  profile,
  visitor,
  myName,
  onExport,
  onExportSession,
  onSaveName,
  onStartCompare,
  onStartTest,
  onRetake,
  onStartUpgrade,
  unansweredCount = 0,
  onOpenReview,
}: Props) {
  const { theme, toggle } = useTheme();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [nameDraft, setNameDraft] = useState(myName ?? '');
  const [intent, setIntent] = useState<ShareIntent>('show');

  useEffect(() => setNameDraft(myName ?? ''), [myName]);

  // Encoding throws while any dimension is unmeasured (e.g. a run made before
  // the newer questions existed) — catch it so the page renders and the share
  // box explains the upgrade path instead of crashing.
  const code = useMemo(() => {
    try {
      return profileToCode5(profile);
    } catch {
      return null;
    }
  }, [profile]);

  // The link rebuilds live as the name/intent change — the name lives in the
  // URL, never in the code, so a bare code shared some other way stays name-free.
  const link = useMemo(
    () => (code ? buildShareLink(code, { name: nameDraft.trim() || null, intent }) : null),
    [code, nameDraft, intent],
  );

  const copyTo = async (text: string | null, mark: (v: boolean) => void) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard blocked — user can still select the text manually
    }
    mark(true);
    window.setTimeout(() => mark(false), 2000);
  };

  const commitName = () => onSaveName?.(nameDraft.trim() || null);

  const isVisitor = !!visitor;
  const vName = visitor?.name ?? null;

  return (
    <main className="screen blueprint">
      <button
        className="theme-toggle"
        onClick={toggle}
        aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} />
      </button>

      {isVisitor ? (
        <header className="bp__visitor" role="note">
          <p className="bp__kicker">
            <Icon name="heart" size={14} /> Shared with you
          </p>
          <h1 className="bp__visitor-title">
            {vName ? `This is ${vName}'s relationship blueprint` : 'A shared relationship blueprint'}
          </h1>
          <p className="bp__epigraph" style={{ fontSize: '1.1rem', fontStyle: 'italic', margin: '0 0 0.75rem' }}>{blueprint.epigraph}</p>
          <p className="bp__visitor-body">
            {vName ? `${vName} answered` : 'Someone answered'} {profile.answered} questions about
            how they love, and this document is the result — built entirely from their pattern of
            choices.
            {visitor?.intent === 'invite' ? (
              <> They've invited you to take the test yourself, so the two of you can compare
              blueprints side by side — on your device, in this browser, with nothing uploaded.</>
            ) : (
              <> They shared it so you could see how they currently love — not as a standard
              anyone is measured against.</>
            )}
          </p>
          <p className="bp__visitor-body bp__visitor-body--soft">
            The document below speaks to them — its “you” means {vName ?? 'them'}. If you'd like a
            comparison of your own, you can take the same test here; it's 25–40 minutes and
            entirely yours.
          </p>
          <div className="bp__visitor-actions">
            <button className="btn btn--primary" onClick={onStartTest}>
              {visitor?.intent === 'invite' ? 'Take the test →' : 'Take it yourself (optional) →'}
            </button>
            <button className="btn btn--ghost" onClick={onRetake}>
              Back to start
            </button>
          </div>
        </header>
      ) : (
        <header className="bp__header">
          <p className="bp__kicker">
            {myName ? `${myName}'s relationship blueprint` : 'Your relationship blueprint'}
          </p>
          <h1 className="bp__epigraph">{blueprint.epigraph}</h1>
          <p className="bp__meta">
            {`Built from ${profile.answered} answers · `}
            answers agreed with themselves {profile.consistencyIndex}% of the time · not a
            diagnosis, a mirror.
            {unansweredCount > 0 && ` · ${unansweredCount} newer questions unanswered.`}
          </p>
        </header>
      )}

      <section className="bp__bands" aria-label="Dimension scores">
        {blueprint.bands.map((b) => (
          <div key={b.id} className={`bp__band${b.unmeasured ? ' bp__band--unmeasured' : ''}`}>
            <div className="bp__band-head">
              <span>{b.label}</span>
              <span className="bp__band-score">{b.unmeasured ? '·' : b.score}</span>
            </div>
            {!b.unmeasured && b.tierLabel && (
              <div className="bp__band-tier">{b.tierLabel}</div>
            )}
            <div className="bp__band-track" aria-hidden>
              <div
                className={`bp__band-fill band-${b.score < 40 ? 'low' : b.score > 60 ? 'high' : 'mid'}`}
                style={{ width: b.unmeasured ? 0 : `${b.score}%` }}
              />
            </div>
          </div>
        ))}
      </section>

      <article className="bp__doc">
        {blueprint.sections.map((s) => (
          <section key={s.id} className="bp__section">
            <h2>
              {SECTION_ICONS[s.id] && <Icon name={SECTION_ICONS[s.id]} size={19} className="bp__secicon" />}
              <span>{s.heading}</span>
            </h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: inlineBold(p) }} />
            ))}
          </section>
        ))}

        {blueprint.tensions.length > 0 && (
          <section className="bp__section bp__section--tension">
            <h2>
              <Icon name="tension" size={19} className="bp__secicon" />
              <span>Where your answers suggest some tension</span>
            </h2>
            {blueprint.tensions.map((t, i) => (
              <div key={i} className="bp__tension">
                <h3>{t.title}</h3>
                <p dangerouslySetInnerHTML={{ __html: inlineBold(t.body) }} />
              </div>
            ))}
          </section>
        )}

      </article>

      {!isVisitor && (code === null || unansweredCount > 0) && onStartUpgrade && (
        <section className="bp__upgrade">
          <h2>
            <Icon name="door" size={17} className="bp__secicon" />
            <span>A few newer questions are waiting for you</span>
          </h2>
          {code === null ? (
            <p>
              One section of this document is empty — the questions about what stays between two
              people were added after your run began. It's five questions; everything you've already
              answered is kept, and the document completes itself when you're done.
            </p>
          ) : (
            <p>
              The questionnaire has grown since your run began — {unansweredCount}{' '}
              questions you were never asked. Nothing here is wrong: this document is complete for
              what you answered. But those questions sharpen the traits they measure, and answering
              them keeps everything you've already done — the new ones come first, then you're back
              here.
            </p>
          )}
          <button className="btn btn--primary btn--small" onClick={onStartUpgrade}>
            Finish the newer questions →
          </button>
        </section>
      )}

      {!isVisitor && (
        <section className="bp__sharebox">
          <h2>
            <Icon name="heart" size={17} className="bp__secicon" />
            <span>The partner part</span>
          </h2>
          <p>
            This document describes how {myName ?? 'you'} currently {myName ? 'loves' : 'love'} —
            not a standard for anyone to be measured against. Share it as a link (optionally with
            a name and an invitation), or as a bare code. Links and codes carry the derived
            blueprint only — never the individual answers.
          </p>
          {code === null ? (
            <p className="bp__code-upgrade">
              This run predates a few newer questions, so there's nothing to share yet — a share
              link needs every dimension measured. Answering the remaining questions (your answers
              are all kept) completes it and unlocks comparing.
            </p>
          ) : !showShare ? (
            <div className="bp__codebtns">
              <button className="btn btn--primary btn--small" onClick={() => setShowShare(true)}>
                <Icon name="import" size={14} /> Create a share link
              </button>
            </div>
          ) : (
            <div className="bp__sharepanel">
              <label className="bp__sharelabel" htmlFor="sharename">
                The name it should arrive with (optional, lives in the link — never in the code)
              </label>
              <div className="bp__sharerow">
                <input
                  id="sharename"
                  className="bp__nameinput"
                  value={nameDraft}
                  maxLength={40}
                  placeholder={myName ?? 'e.g. Maya'}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => e.key === 'Enter' && commitName()}
                />
              </div>
              <fieldset className="bp__intent">
                <legend className="bp__sharelabel">Why you're sharing</legend>
                <label className={`bp__intentopt${intent === 'show' ? ' is-active' : ''}`}>
                  <input
                    type="radio"
                    name="shareintent"
                    checked={intent === 'show'}
                    onChange={() => setIntent('show')}
                  />
                  <span>
                    <strong>Show them my blueprint</strong>
                    <em>They read yours — no test required.</em>
                  </span>
                </label>
                <label className={`bp__intentopt${intent === 'invite' ? ' is-active' : ''}`}>
                  <input
                    type="radio"
                    name="shareintent"
                    checked={intent === 'invite'}
                    onChange={() => setIntent('invite')}
                  />
                  <span>
                    <strong>Invite them to test &amp; compare</strong>
                    <em>They take the questionnaire, then the two blueprints are compared.</em>
                  </span>
                </label>
              </fieldset>
              {link && (
                <div className="bp__linkbox">
                  <code className="bp__link" aria-label="Your share link">{link}</code>
                  <div className="bp__codebtns">
                    <button className="btn btn--primary btn--small" onClick={() => copyTo(link, setCopiedLink)}>
                      <Icon name={copiedLink ? 'check' : 'copy'} size={14} />
                      {copiedLink ? 'Copied' : 'Copy link'}
                    </button>
                    {onStartCompare && (
                      <button className="btn btn--ghost btn--small" onClick={onStartCompare}>
                        Compare with another code
                      </button>
                    )}
                  </div>
                </div>
              )}
              {showCode && code ? (
                <div className="bp__codebox">
                  <code className="bp__code" aria-label="Your share code">{code}</code>
                  <div className="bp__codebtns">
                    <button className="btn btn--ghost btn--small" onClick={() => copyTo(code, setCopiedCode)}>
                      <Icon name={copiedCode ? 'check' : 'copy'} size={14} />
                      {copiedCode ? 'Copied' : 'Copy code'}
                    </button>
                    <button className="btn btn--ghost btn--small" onClick={() => setShowCode(false)}>
                      Hide code
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn btn--ghost btn--small" onClick={() => setShowCode(true)}>
                  Prefer a bare code? Show it
                </button>
              )}
            </div>
          )}
        </section>
      )}

      <footer className="bp__footer">
        {!isVisitor && onExport && (
          <button className="btn btn--primary" onClick={onExport}>
            Download as Markdown
          </button>
        )}
        {!isVisitor && onExportSession && (
          <button className="btn btn--ghost" onClick={onExportSession} title="A JSON file of your raw answers — restores this exact session anywhere">
            Export session file
          </button>
        )}
        {!isVisitor && onOpenReview && (
          <button className="btn btn--ghost" onClick={onOpenReview}>
            Review my answers
          </button>
        )}
        <button className="btn btn--ghost" onClick={onRetake}>
          {isVisitor ? 'Back to start' : 'Start over'}
        </button>
        {!isVisitor && (
          <p className="bp__share">
            If you share this with a partner, share it as <em>your</em> blueprint — a description of
            how you currently love, not a standard anyone is being measured against. Then ask for
            theirs. The two documents are the conversation.
          </p>
        )}
      </footer>
    </main>
  );
}

/** Minimal **bold** renderer — the closing lines use it, nothing else does. */
function inlineBold(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
