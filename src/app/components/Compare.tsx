import { useMemo, useState } from 'react';
import type { Answers, ScoredProfile } from '../../domain/types';
import { DIMENSION_LABELS } from '../../domain/types';
import { CHANNEL_LABELS } from '../../domain/scoring';
import { tierOf, TIER_LABELS } from '../../domain/dimensions';
import { decodeProfile, decodeFullSession, compareProfiles, parseShareUrl } from '../../domain/share';
import { scoreProfile } from '../../domain/scoring';
import Icon from './icons';
import { useTheme } from './theme';
import ShareOut from './ShareOut';

interface Props {
  ownProfile: ScoredProfile;
  /** Directory of blueprints opened on this device — choose whom to compare with. */
  others?: { code: string; name: string | null; profile: ScoredProfile }[];
  /** Return to the blueprint the user came from. */
  onBack: () => void;
  /** Same share/download payload the blueprint page hosts — identical panel. */
  answers?: Answers;
  seed?: number;
  onExport?: () => void;
  onCopyMarkdown?: () => void;
  /** Open the answers review; returning lands back on compare. */
  onOpenReview?: () => void;
  /** Start over (same as the blueprint bar's Restart). */
  onRetake?: () => void;
  /** Add a code to the saved directory (upsert; existing names stick). */
  onRememberPerson?: (code: string, name: string | null) => void;
  onRenamePerson?: (code: string, name: string | null) => void;
  onRemovePerson?: (code: string) => void;
}

export default function Compare({
  ownProfile,
  others = [],
  onBack,
  answers,
  seed,
  onExport,
  onCopyMarkdown,
  onOpenReview,
  onRetake,
  onRememberPerson,
  onRenamePerson,
  onRemovePerson,
}: Props) {
  const { theme, toggle } = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<ScoredProfile | null>(null);
  const [dirName, setDirName] = useState<string | null>(null);

  // Whose blueprint is on the right side of the comparison. Named links and
  // directory entries (which can be renamed) win over the anonymous "them".
  const who = dirName ?? 'them';

  const result = useMemo(
    () => (partner ? compareProfiles(ownProfile, partner) : null),
    [partner, ownProfile],
  );

  // Domains sorted tightest-first — powers the prose in the whole-picture lede.
  const domainsByFit = useMemo(
    () => (result ? [...result.domains].sort((x, y) => x.meanDelta - y.meanDelta) : []),
    [result],
  );

  // One input, any carrier: share link, blueprint code (BP1–6), or a
  // full-session code (BPS). Compared LOCALLY, never adopted — someone
  // else's answers are only read for their scores; your own session stays
  // exactly as it is.
  const tryCode = () => {
    const input = code.trim();
    if (!input) return;
    if (/^https?:\/\/|\?bp=/i.test(input)) {
      const parsed = parseShareUrl(input);
      if (!parsed) {
        setError("That link doesn't carry a readable Blueprint code — check it and try again.");
        return;
      }
      const decoded = decodeProfile(parsed.code);
      if (!decoded) {
        setError("That link's blueprint code doesn't parse — it may be from an older version.");
        return;
      }
      setError(null);
      onRememberPerson?.(parsed.code, parsed.name);
      setDirName(parsed.name);
      setPartner(decoded);
      return;
    }
    if (/^BPS/i.test(input)) {
      const decoded = decodeFullSession(input);
      if (!decoded) {
        setError("That session code doesn't parse — check for missing characters.");
        return;
      }
      if (Object.keys(decoded.answers).length === 0) {
        setError('That code encodes an empty session.');
        return;
      }
      setError(null);
      setDirName(decoded.name);
      setPartner(scoreProfile(decoded.answers));
      return;
    }
    const decoded = decodeProfile(input);
    if (!decoded) {
      setError("That code doesn't parse — check for missing characters.");
      return;
    }
    setError(null);
    onRememberPerson?.(input.trim(), null);
    setDirName(null);
    setPartner(decoded);
  };

  const answeredEnough = ownProfile.answered >= 20;
  const backToEntry = () => {
    setPartner(null);
    setDirName(null);
  };

  return (
    <main className="screen compare">
      <header className="compare__header">
        <p className="bp__kicker">Two blueprints, one conversation</p>
        <h1>Compare</h1>
        <p className="compare__lede">
          {partner
            ? `Your blueprint and ${who === 'them' ? 'theirs' : `${who}'s`}, side by side. The comparison happens entirely on this device.`
            : "Choose whose blueprint to compare with — someone you've opened before, a share code, or a session code. Everything happens on this device."}
        </p>
      </header>

      {!partner && (
        <div className="compare__entry">
          {ownProfile.answered > 0 && !answeredEnough && (
            <p className="compare__warn">
              Heads up: you've answered {ownProfile.answered} of your own questions so far, so
              your side of the comparison is built on partial data.
            </p>
          )}

          {others.length > 0 && (
            <section className="compare__people">
              <h2>
                <Icon name="heart" size={16} /> People on this device
              </h2>
              <p className="compare__people-note">
                Blueprints you've opened before. Pick one to compare with, set a name for the
                unnamed ones, or remove entries you no longer need.
              </p>
              {others.map((o) => (
                <PersonRow
                  key={o.code}
                  person={o}
                  onSelect={() => {
                    setDirName(o.name);
                    setPartner(o.profile);
                  }}
                  onRename={(name) => {
                    onRenamePerson?.(o.code, name);
                    setDirName((cur) => (cur !== null || o.name !== null ? name : cur));
                  }}
                  onRemove={() => {
                    onRemovePerson?.(o.code);
                    setDirName((cur) => (cur && o.name === cur ? null : cur));
                  }}
                />
              ))}
              <p className="import-box__note compare__people-note--after">
                Adding someone new below also saves them here.
              </p>
            </section>
          )}

          <section className="compare__add">
            <h2>
              <Icon name="import" size={16} /> Add someone new
            </h2>
            <label className="import-box__label" htmlFor="comparecode">
              A share link, their blueprint code (BP1–6), or their session code (BPS)
            </label>
            <div className="import-box__row">
              <input
                id="comparecode"
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
                Compare
              </button>
            </div>
            {error && <p className="import-box__error">{error}</p>}
            <p className="import-box__note">
              Codes carry derived scores only — never their individual answers. A session code
              (BPS) does carry answers, but it is only ever read here on your device, never saved.
            </p>
          </section>
        </div>
      )}

      {partner && result && (
        <div className="compare__results">
          <section className="compare__score">
            <div className="compare__score-num">{result.alignmentIndex}</div>
            <div className="compare__score-expl">
              <strong>alignment index</strong>
              <p>
                How closely your two blueprints travel together across the measured dimensions.
                High isn't "better" — two identical people would make a boring team. What matters
                is whether the differences below are ones you can build around.
              </p>
              <p className="compare__score-context">
                {result.measuredCount} of 29 dimensions measured
                {result.unmeasuredCount > 0
                  ? ` · ${result.unmeasuredCount} not carried by this share code`
                  : ''}{' '}· {result.sameTierCount} sit in the same tier band
              </p>
            </div>
            <button className="btn btn--ghost btn--small" onClick={backToEntry}>
              Choose someone else
            </button>
          </section>

          <div className="compare__cols">
            <section className="compare__col">
              <h2>
                <Icon name="check" size={16} /> Where you match
              </h2>
              {result.matches.map((m) => (
                <MatchRow key={m.dimension} label={DIMENSION_LABELS[m.dimension]} a={m.a} b={m.b} theirName={who} />
              ))}
              {result.tierGaps.length === 0 && (
                <p className="compare__col-note">
                  Not one of your {result.measuredCount} shared dimensions crosses a tier boundary —
                  two documents would tell the same story about you both.
                </p>
              )}
            </section>
            <section className="compare__col">
              <h2>
                <Icon name="tension" size={16} /> Where the translation is needed
              </h2>
              {result.gaps.map((g) => (
                <GapRow
                  key={g.dimension}
                  label={DIMENSION_LABELS[g.dimension]}
                  a={g.a}
                  b={g.b}
                  delta={g.delta}
                  theirName={who}
                />
              ))}
              {result.tierGaps.length > 0 && (
                <p className="compare__col-note">
                  The largest deltas first. Gaps that cross a tier boundary are marked below —
                  that's where two documents would disagree about the reading, not just the number.
                </p>
              )}
            </section>
          </div>

          {result.tierGaps.length > 0 && (
            <section className="compare__tiergaps">
              <h2>
                <Icon name="tension" size={16} /> Where the band changes
              </h2>
              <p className="compare__channels-lede">
                These cross a tier boundary — the same language your own document uses, from
                "middle ground" to "a defining channel." One of you would be described in a
                different register than the other here, which is worth a conversation before it's
                worth a fix.
              </p>
              {result.tierGaps.slice(0, 6).map((g) => {
                const tierA = tierOf(g.a);
                const tierB = tierOf(g.b);
                return (
                  <div key={g.dimension} className="compare__row">
                    <span className="compare__rowlabel">{DIMENSION_LABELS[g.dimension]}</span>
                    <span className="compare__rownums">{g.a} · {g.b}</span>
                    <div className="compare__bars">
                      <div className="compare__bar">
                        <div className="compare__barfill is-you" style={{ width: `${g.a}%` }} />
                      </div>
                      <div className="compare__bar">
                        <div className="compare__barfill is-them" style={{ width: `${g.b}%` }} />
                      </div>
                    </div>
                    <span className="compare__bands">
                      you: {TIER_LABELS[tierA].toLowerCase()} · {who === 'them' ? 'them' : who}:{' '}
                      {TIER_LABELS[tierB].toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </section>
          )}

          <section className="compare__domains">
            <h2>
              <Icon name="check" size={16} /> The whole picture, domain by domain
            </h2>
            <p className="compare__channels-lede">
              Every measured dimension, in the same grouping your own blueprint uses. You and{' '}
              {who === 'them' ? 'they' : who} travel closest together in{' '}
              <strong>{domainsByFit[0]?.label.toLowerCase()}</strong>
              {domainsByFit.length > 1 && (
                <>
                  ; the widest stretch is{' '}<strong>{domainsByFit[domainsByFit.length - 1].label.toLowerCase()}</strong>
                </>
              )}
              .
            </p>
            {result.domains.map((dom) => (
              <div key={dom.domain} className="compare__domain">
                <h3>
                  {dom.label}
                  <span className="compare__domain-delta">Δ{dom.meanDelta} average</span>
                </h3>
                {dom.rows.map((r) => {
                  const tierA = tierOf(r.a);
                  const tierB = tierOf(r.b);
                  return (
                    <div
                      key={r.dimension}
                      className={`compare__row${r.tierGap ? ' is-tiergap' : r.delta <= 5 ? ' is-tight' : ''}`}
                      title={`You ${r.a} (${TIER_LABELS[tierA].toLowerCase()}) · ${who} ${r.b} (${TIER_LABELS[tierB].toLowerCase()})`}
                    >
                      <span className="compare__rowlabel">{DIMENSION_LABELS[r.dimension]}</span>
                      <span className="compare__rownums">{r.a} · {r.b}</span>
                      <div className="compare__bars">
                        <div className="compare__bar">
                          <div className="compare__barfill is-you" style={{ width: `${r.a}%` }} />
                        </div>
                        <div className="compare__bar">
                          <div className="compare__barfill is-them" style={{ width: `${r.b}%` }} />
                        </div>
                      </div>
                      {r.tierGap && <span className="compare__flag">band shifts</span>}
                    </div>
                  );
                })}
                {dom.rows.length === 0 && (
                  <p className="compare__domain-none">No measured dimensions in this domain.</p>
                )}
              </div>
            ))}
            {result.unmeasuredCount > 0 && (
              <p className="compare__channels-note">
                {result.unmeasuredCount} dimension{result.unmeasuredCount === 1 ? '' : 's'}{' '}
                {result.unmeasuredCount === 1 ? 'is' : 'are'} missing from the comparison because
                this share code predates the dimensions — a code never guesses what it can't
                measure.
              </p>
            )}
          </section>

          <section className="compare__channels">
            <h2>
              <Icon name="heart" size={16} /> The cross-check
            </h2>
            <p className="compare__channels-lede">
              Each person's natural giving channel, checked against the channel the other person
              actually hears best. This is where mismatches hide in otherwise happy relationships.
            </p>
            {result.crossChannels.map((c, i) => (
              <div key={i} className={`compare__xrow${c.state === 'match' ? ' is-match' : c.state === 'gap' ? ' is-gap' : ' is-unspecified'}`}>
                <span className="compare__xwho">
                  {i === 0 ? 'You give' : `${who === 'them' ? 'They' : who} give${who === 'them' ? '' : 's'}`}{' '}
                  <strong>{c.youGive ? CHANNEL_LABELS[c.youGive] : 'no single channel'}</strong>
                </span>
                <span className="compare__xarrow" aria-hidden>→</span>
                <span className="compare__xwho">
                  {i === 0
                    ? `${who === 'them' ? 'they' : who} hear${who === 'them' ? '' : 's'}`
                    : 'you hear'}{' '}
                  <strong>{c.theyHear ? CHANNEL_LABELS[c.theyHear] : 'in any channel'}</strong>
                </span>
                <span className={`compare__xverdict ${c.state === 'match' ? 'is-match' : c.state === 'gap' ? 'is-gap' : 'is-unspecified'}`}>
                  {c.state === 'match' ? 'lands' : c.state === 'gap' ? 'translation needed' : 'dictionary varies'}
                </span>
              </div>
            ))}
            <p className="compare__channels-note">
              "Translation needed" isn't a verdict — it's a to-do. Tell each other what lands.
              Then believe the answer. A missing channel isn't a gap either: "no single channel" means
              no flagship way of giving, and "in any channel" means a wide receiving dictionary —
              care lands wherever it's aimed.
            </p>
          </section>

        </div>
      )}

      {/* The SAME bar as the blueprint page — same slots, same order. The
          Compare slot is the toggle: highlighted because compare is open;
          pressing it again returns to the blueprint. No extra buttons. */}
      <footer className="bp__footer">
        <div className="bp__footer-actions">
          {onOpenReview && (
            <button className="btn btn--primary" onClick={onOpenReview}>
              <Icon name="feather" size={16} />
              <span className="bp__fbtn-label">Review my answers</span>
              <span className="bp__fbtn-mini">Review</span>
            </button>
          )}
          <button
            className="btn btn--ghost bp__fbtn-round bp__fbtn-accent"
            onClick={onBack}
            title="Close compare — back to my blueprint"
            aria-label="Close compare"
            aria-pressed="true"
          >
            <Icon name="tension" size={16} />
            <span className="bp__fbtn-label">Compare</span>
            <span className="bp__fbtn-mini">Compare</span>
          </button>
          <ShareOut
            profile={ownProfile}
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
          {onRetake && (
            <button className="btn btn--ghost bp__fbtn-round" onClick={onRetake} title="Start over" aria-label="Start over">
              <Icon name="loop" size={16} />
              <span className="bp__fbtn-label">Start over</span>
              <span className="bp__fbtn-mini">Restart</span>
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}

/** One saved blueprint: click to compare, rename inline, or remove. */
function PersonRow({
  person,
  onSelect,
  onRename,
  onRemove,
}: {
  person: { code: string; name: string | null };
  onSelect: () => void;
  onRename: (name: string | null) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(person.name ?? '');

  if (editing) {
    return (
      <div className="compare__person compare__person--editing">
        <input
          className="import-box__input compare__person-input"
          value={draft}
          maxLength={40}
          placeholder="Their name (optional)"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onRename(draft.trim() || null);
              setEditing(false);
            }
          }}
        />
        <button
          className="btn btn--primary btn--small"
          onClick={() => {
            onRename(draft.trim() || null);
            setEditing(false);
          }}
        >
          Save
        </button>
        <button className="btn btn--ghost btn--small" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="compare__person">
      <button className="compare__person-main" onClick={onSelect} title="Compare with this blueprint">
        <strong>{person.name ?? 'Unnamed blueprint'}</strong>
        <span className="compare__person-code">{person.code.slice(0, 16)}…</span>
      </button>
      <button
        className="btn btn--ghost btn--small"
        onClick={() => {
          setDraft(person.name ?? '');
          setEditing(true);
        }}
      >
        Rename
      </button>
      <button className="btn btn--ghost btn--small" onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

function MatchRow({ label, a, b, theirName }: { label: string; a: number; b: number; theirName: string }) {
  return (
    <div className="compare__row" title={`You ${a} · ${theirName} ${b}`}>
      <span className="compare__rowlabel">{label}</span>
      <span className="compare__rownums">{a} · {b}</span>
      <div className="compare__bars">
        <div className="compare__bar"><div className="compare__barfill is-you" style={{ width: `${a}%` }} /></div>
        <div className="compare__bar"><div className="compare__barfill is-them" style={{ width: `${b}%` }} /></div>
      </div>
    </div>
  );
}

function GapRow({ label, a, b, delta, theirName }: { label: string; a: number; b: number; delta: number; theirName: string }) {
  return (
    <div className="compare__row" title={`You ${a} · ${theirName} ${b}`}>
      <span className="compare__rowlabel">{label}</span>
      <span className="compare__rownums">{a} · {b}</span>
      <div className="compare__bars">
        <div className="compare__bar"><div className="compare__barfill is-you" style={{ width: `${a}%` }} /></div>
        <div className="compare__bar"><div className="compare__barfill is-them" style={{ width: `${b}%` }} /></div>
      </div>
      <span className="compare__delta">Δ{delta}</span>
    </div>
  );
}
