import { useMemo, useState } from 'react';
import type { Answers, Question } from '../../domain/types';
import { QUESTION_BY_ID, QUESTIONS } from '../../domain/questions';
import { scoreProfile, CHANNEL_LABELS } from '../../domain/scoring';
import { DIMENSIONS, TIER_LABELS, tierOf } from '../../domain/dimensions';
import { DIMENSION_LABELS, DOMAIN_LABELS, DOMAIN_DIMENSIONS } from '../../domain/types';
import type { DimensionId, DomainId } from '../../domain/types';

interface Props {
  answers: Answers;
  /** The run's presentation order — review follows the order actually experienced. */
  order: string[];
  onBack: () => void;
  onFinish: () => void;
  /** True when revisiting from the blueprint — the blueprint already exists. */
  hideFinish?: boolean;
}

const LAYER_NAMES: Record<number, string> = {
  1: 'Instinct',
  2: 'Preference',
  3: 'Tradeoff',
  4: 'Self-reflection',
  5: 'Behavior',
  6: 'Deep pattern',
};

export default function Review({ answers, order, onBack, onFinish, hideFinish = false }: Props) {
  const [tab, setTab] = useState<'answers' | 'measures'>('answers');
  const profile = useMemo(() => scoreProfile(answers), [answers]);

  const ordered = order.map((id) => QUESTION_BY_ID[id]).filter(Boolean);
  const answeredQs = ordered.filter((q) => answers[q.id] !== undefined);

  return (
    <main className="screen review">
      <header className="review__header">
        <h1>{hideFinish ? 'Your answers, as given' : 'Before you read your blueprint'}</h1>
        <p className="review__lede">
          The honesty part of the deal: here's what each choice revealed, and what the other
          choices would have revealed instead. The meaning of your answers lives in this contrast.
        </p>
        <div className="review__tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'answers'}
            className={`review__tab${tab === 'answers' ? ' is-active' : ''}`}
            onClick={() => setTab('answers')}
          >
            What each answer revealed
          </button>
          <button
            role="tab"
            aria-selected={tab === 'measures'}
            className={`review__tab${tab === 'measures' ? ' is-active' : ''}`}
            onClick={() => setTab('measures')}
          >
            What was actually measured
          </button>
        </div>
      </header>

      {tab === 'answers' && (
        <div className="review__answers">
          {answeredQs.map((q, i) => (
            <AnswerCard key={q.id} q={q} number={i + 1} answers={answers} />
          ))}
        </div>
      )}

      {tab === 'measures' && (
        <div className="review__measures">
          {(Object.keys(DOMAIN_DIMENSIONS) as DomainId[]).map((domain) => (
            <section key={domain} className="measures__domain">
              <h2>{DOMAIN_LABELS[domain]}</h2>
              {DOMAIN_DIMENSIONS[domain].map((dim) => {
                const def = DIMENSIONS.find((d) => d.id === dim);
                const score = profile.dimensions[dim].score;
                return (
                  <article key={dim} className="measures__dim">
                    <header>
                      <h3>{DIMENSION_LABELS[dim]}</h3>
                      <span className="measures__score">
                        {score}
                        <small>/100</small>
                      </span>
                    </header>
                    <div className="measures__bar" aria-hidden>
                      <div
                        className={`measures__fill band-${score < 40 ? 'low' : score > 60 ? 'high' : 'mid'}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <p>{def?.what}</p>
                    <p className="measures__evidence">
                      {countEvidence(dim)} question{countEvidence(dim) === 1 ? '' : 's'} contributed ·{' '}
                      {bandWord(score)}
                    </p>
                  </article>
                );
              })}
            </section>
          ))}
          <section className="measures__meta">
            <h2>How the readings were checked</h2>
            <p>
              Several scenarios were deliberately repeated in different clothes — a first
              impression of a situation, then the same territory weeks-of-questions later. Your
              answers agreed with themselves <strong>{profile.consistencyIndex}%</strong> of the
              time on those pairs. High agreement means the picture above is stable; low agreement
              usually marks exactly where two of your values trade off against each other.
            </p>
            <p>
              The app also compared <em>the way you give</em> care with <em>the way you like to
              receive it</em> (through words, presence and touch, practical acts, or granted
              space). Your harmony score: <strong>{profile.dimensions.express_receive_alignment.score}/100</strong>.
              {profile.dimensions.express_receive_alignment.score < 50 &&
                ' The blueprint below has a note about where the translation is needed.'}
            </p>
          </section>
        </div>
      )}

      <footer className="review__footer">
        <button className="btn btn--ghost" onClick={onBack}>
          ← {hideFinish ? 'Back to blueprint' : 'Back to questions'}
        </button>
        {!hideFinish && (
          <button className="btn btn--primary" onClick={onFinish}>
            Read my blueprint →
          </button>
        )}
      </footer>
    </main>
  );
}

function countEvidence(dim: DimensionId): number {
  let n = 0;
  for (const q of QUESTIONS) {
    if (q.options.some((o) => dim in (o as { weight?: Record<string, number> }).weight!)) n += 1;
  }
  return n;
}

function bandWord(score: number): string {
  return TIER_LABELS[tierOf(score)];
}

function AnswerCard({ q, number, answers }: { q: Question; number: number; answers: Answers }) {
  const [open, setOpen] = useState(false);
  const v = answers[q.id];
  if (!v) return null;

  const chosen =
    v.kind === 'option'
      ? q.options.find((o) => o.id === v.optionId)
      : q.options.find((o) => 'value' in o && (o as { value: number }).value === v.value);
  if (!chosen) return null;

  const alternatives = q.options.filter((o) => o.id !== chosen.id);
  const channel = 'channel' in chosen ? (chosen as { channel?: string }).channel : undefined;

  return (
    <article className={`anscard${open ? ' is-open' : ''}`}>
      <button className="anscard__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="anscard__num">{number}</span>
        <span className="anscard__title">
          {q.prompt[0]}
          {q.prompt.length > 1 ? ' …' : ''}
        </span>
        <span className="anscard__layer">{LAYER_NAMES[q.layer]}</span>
        <span className="anscard__chevron" aria-hidden>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="anscard__body">
          <div className="anscard__prompt">
            {q.prompt.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="anscard__chosen">
            <span className="anscard__tag">You chose</span>
            <p className="anscard__label">{chosen.label}</p>
            <p className="anscard__desc">{chosen.description}</p>
            {channel && (
              <p className="anscard__channel">
                Channel: {CHANNEL_LABELS[channel] ?? channel}
              </p>
            )}
          </div>
          <div className="anscard__alts">
            <span className="anscard__tag anscard__tag--alt">What the others would have said about you</span>
            {alternatives.map((o) => (
              <div key={o.id} className="anscard__alt">
                <p className="anscard__label">{o.label}</p>
                <p className="anscard__desc">{o.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
