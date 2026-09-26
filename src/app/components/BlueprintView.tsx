import { useMemo, useState } from 'react';
import type { Answers, Blueprint, ScoredProfile } from '../../domain/types';
import { profileToCode6, type ShareIntent } from '../../domain/share';
import Icon from './icons';
import type { IconName } from './icons';
import { useTheme } from './theme';
import ShareOut from './ShareOut';

interface Props {
  blueprint: Blueprint;
  profile: ScoredProfile;
  /** Present when viewing SOMEONE ELSE's blueprint (arrived via a share link). */
  visitor?: { name: string | null; intent: ShareIntent };
  /** The owner's display name (link building + document phrasing). */
  myName?: string | null;
  onExport?: () => void;
  /** Copy the document as markdown to the clipboard (Downloads menu). */
  onCopyMarkdown?: () => void;
  /** Raw answers for the session-code export (absent for visitors). */
  answers?: Answers;
  /** The run's presentation-order seed (session code + export need it to restore). */
  seed?: number;
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
  onCopyMarkdown,
  answers,
  seed = 0,
  onStartCompare,
  onStartTest,
  onRetake,
  onStartUpgrade,
  unansweredCount = 0,
  onOpenReview,
}: Props) {
  const { theme, toggle } = useTheme();
  // Restarting from the blueprint wipes the saved run — the same
  // "are you sure?" gate the quiz dock uses before it does that.
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Encoding throws while any dimension is unmeasured (e.g. a run made before
  // the newer questions existed) — catch it so the page renders and the
  // upgrade section explains the path instead of crashing.
  const code = useMemo(() => {
    try {
      return profileToCode6(profile);
    } catch {
      return null;
    }
  }, [profile]);

  const isVisitor = !!visitor;
  const vName = visitor?.name ?? null;

  return (
    <main className="screen blueprint">
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
            how they love — this document is built entirely from their choices.{' '}
            {visitor?.intent === 'invite'
              ? "You're invited to take it yourself: your answers stay on your device, and the two blueprints compare side by side."
              : 'Shared to be seen, not to measure yourself against.'}
          </p>
          <p className="bp__visitor-body bp__visitor-body--soft">
            In the document below, “you” means {vName ?? 'them'}.
          </p>
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
              <span className="bp__band-label" title={b.label}>{b.shortLabel ?? b.label}</span>
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
          <section className="bp__section">
            <h2>
              <Icon name="tension" size={19} className="bp__secicon" />
              <span>Where the tension sits</span>
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

      {/* Bottom bar at every size: one primary text action, icon circles for
         the rest — circles expand to full text on wide windows. Visitors get
         the two actions that matter to them: take the test (primary) and back
         to start. */}
      <footer className="bp__footer">
        <div className="bp__footer-actions">
          {isVisitor ? (
            <>
              <button className="btn btn--primary" onClick={onStartTest}>
                <Icon name="feather" size={16} />
                <span className="bp__fbtn-label">
                  {visitor?.intent === 'invite' ? 'Take the test' : 'Take it yourself'}
                </span>
                <span className="bp__fbtn-mini">Take the test</span>
              </button>
              <button
                className="btn btn--ghost bp__fbtn-round"
                onClick={onRetake}
                title="Back to start"
                aria-label="Back to start"
              >
                <Icon name="loop" size={16} />
                <span className="bp__fbtn-label">Back to start</span>
                <span className="bp__fbtn-mini">Back</span>
              </button>
              <button
                className="btn btn--ghost bp__fbtn-round"
                onClick={toggle}
                title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
                aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              >
                <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
              </button>
            </>
          ) : confirmingReset ? (
            <>
              <span className="bp__confirm">Clear this run and return to the start?</span>
              <button className="btn btn--danger btn--small" onClick={onRetake}>
                Yes, start over
              </button>
              <button className="btn btn--ghost btn--small" onClick={() => setConfirmingReset(false)}>
                Keep going
              </button>
            </>
          ) : (
            <>
              {onOpenReview && (
                <button className="btn btn--primary" onClick={onOpenReview}>
                  <Icon name="feather" size={16} />
                  <span className="bp__fbtn-label">Review my answers</span>
                  <span className="bp__fbtn-mini">Review</span>
                </button>
              )}
              {onStartCompare && (
                <button className="btn btn--ghost bp__fbtn-round" onClick={onStartCompare} title="Compare with another blueprint" aria-label="Compare">
                  <Icon name="tension" size={16} />
                  <span className="bp__fbtn-label">Compare</span>
                  <span className="bp__fbtn-mini">Compare</span>
                </button>
              )}
              <ShareOut
                profile={profile}
                myName={myName}
                answers={answers}
                seed={seed}
                onExport={onExport}
                onCopyMarkdown={onCopyMarkdown}
              />
              <button
                className="btn btn--ghost bp__fbtn-round"
                onClick={toggle}
                title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
                aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              >
                <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
              </button>
              <button
                className="btn btn--ghost bp__fbtn-round"
                onClick={() => setConfirmingReset(true)}
                title="Start over"
                aria-label="Start over"
              >
                <Icon name="loop" size={16} />
                <span className="bp__fbtn-label">Start over</span>
                <span className="bp__fbtn-mini">Restart</span>
              </button>
            </>
          )}
        </div>
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
