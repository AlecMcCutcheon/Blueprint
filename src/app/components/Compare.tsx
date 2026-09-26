import { useMemo, useRef, useState } from 'react';
import type { ScoredProfile } from '../../domain/types';
import { DIMENSION_LABELS } from '../../domain/types';
import { CHANNEL_LABELS } from '../../domain/scoring';
import { decodeProfile, compareProfiles } from '../../domain/share';
import { importSessionJson } from '../../domain/session';
import { scoreProfile } from '../../domain/scoring';
import Icon from './icons';
import { useTheme } from './theme';

interface Props {
  ownProfile: ScoredProfile;
  /** Directory of blueprints opened on this device — choose whom to compare with. */
  others?: { code: string; name: string | null; profile: ScoredProfile }[];
  /** Return to the blueprint the user came from. */
  onBack: () => void;
  onDone: () => void;
  /** Add a code to the saved directory (upsert; existing names stick). */
  onRememberPerson?: (code: string, name: string | null) => void;
  onRenamePerson?: (code: string, name: string | null) => void;
  onRemovePerson?: (code: string) => void;
}

export default function Compare({
  ownProfile,
  others = [],
  onBack,
  onDone,
  onRememberPerson,
  onRenamePerson,
  onRemovePerson,
}: Props) {
  const { theme, toggle } = useTheme();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<ScoredProfile | null>(null);
  const [dirName, setDirName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Whose blueprint is on the right side of the comparison. Named links and
  // directory entries (which can be renamed) win over the anonymous "them".
  const who = dirName ?? 'them';

  const result = useMemo(
    () => (partner ? compareProfiles(ownProfile, partner) : null),
    [partner, ownProfile],
  );

  const tryCode = () => {
    const decoded = decodeProfile(code);
    if (!decoded) {
      setError("That code doesn't parse — check for missing characters.");
      return;
    }
    setError(null);
    onRememberPerson?.(code.trim(), null);
    setDirName(null);
    setPartner(decoded);
  };

  const readSessionFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      // Compared LOCALLY, never adopted: someone else's session file is only
      // read for its scores — your own session stays exactly as it is.
      const r = importSessionJson(text);
      if (Object.keys(r.answers).length === 0) {
        setError('That file contains no answers this version can read.');
        return;
      }
      setDirName(r.name);
      setPartner(scoreProfile(r.answers));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That file could not be read.');
    }
  };

  const answeredEnough = ownProfile.answered >= 20;
  const backToEntry = () => {
    setPartner(null);
    setDirName(null);
  };

  return (
    <main className="screen compare">
      <button
        className="theme-toggle"
        onClick={toggle}
        aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} />
      </button>

      <header className="compare__header">
        <button className="btn btn--ghost btn--small compare__back" onClick={onBack}>
          ← Back to my blueprint
        </button>
        <p className="bp__kicker">Two blueprints, one conversation</p>
        <h1>Compare</h1>
        <p className="compare__lede">
          {partner
            ? `Your blueprint and ${who === 'them' ? 'theirs' : `${who}'s`}, side by side. The comparison happens entirely on this device.`
            : "Choose whose blueprint to compare with — someone you've opened before, a share code, or a session file. Everything happens on this device."}
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
              Their share code (BP1–BP6) — or just open a link they sent you
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
                placeholder="BP6…"
                spellCheck={false}
                autoComplete="off"
              />
              <button className="btn btn--primary" onClick={tryCode} disabled={!code.trim()}>
                Compare
              </button>
            </div>
            {error && <p className="import-box__error">{error}</p>}
            <p className="import-box__note">
              Codes carry derived scores only — never their individual answers. If they sent you a
              session file instead, you can open that:
            </p>
            <input
              ref={fileRef}
              className="import-box__file"
              type="file"
              accept=".json,application/json"
              aria-label="Their session file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readSessionFile(f);
                e.target.value = '';
              }}
            />
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
            </section>
          </div>

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

          <div className="compare__footer">
            <button className="btn btn--primary" onClick={onDone}>
              Done
            </button>
          </div>
          <div className="compare__footer compare__footer--secondary">
            <button className="btn btn--ghost btn--small" onClick={onBack}>
              ← Back to my blueprint
            </button>
          </div>
        </div>
      )}
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
