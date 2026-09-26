import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Answers, Question } from '../../domain/types';
import { BONUS_POOL } from '../../domain/questions';
import { messageFor } from './messages';
import Icon from './icons';
import { useSpeech } from './useSpeech';

interface Props {
  questions: Question[];
  answers: Answers;
  onAnswer: (questionId: string, optionId: string | number) => void;
  onFinish: () => void;
  onStartOver: () => void;
  /** Two-pile catch-up order active (bank grew since this run started). */
  catchUpActive?: boolean;
}

export default function Quiz({ questions, answers, onAnswer, onFinish, onStartOver, catchUpActive }: Props) {
  // Resume where the user left off: land on the first unanswered question.
  // (After a refresh, `answers` is already the restored set by the time the
  // quiz mounts, so this picks up exactly where they stopped.)
  const [index, setIndex] = useState<number>(() => {
    const firstUnanswered = questions.findIndex((x) => answers[x.id] === undefined);
    return firstUnanswered === -1 ? Math.max(0, questions.length - 1) : firstUnanswered;
  });
  const [confirmingReset, setConfirmingReset] = useState(false);
  const { supported: ttsSupported, speaking, failedReason, speak, stop: stopSpeech } = useSpeech();
  const q = questions[index];
  // Clarifying questions close the run — presented as ordinary questions, with
  // a one-line note so the shift lands ("the last few", not a surprise quiz).
  const isClarifier = BONUS_POOL.some((b) => b.id === q.id);
  const answeredCurrent = answers[q.id] !== undefined;
  const answeredCount = useMemo(
    () => questions.filter((x) => answers[x.id] !== undefined).length,
    [questions, answers],
  );
  const pct = Math.round((answeredCount / questions.length) * 100);
  // Catch-up notice shows only while in catch-up mode AND standing on an
  // unanswered question — i.e. exactly when the user is on fresh material.
  // (The through-history pass reviews already-answered questions; App retires
  // catch-up mode automatically once every core question is answered.)
  const showCatchUpNotice = catchUpActive === true && answers[q.id] === undefined;
  // The dock message lives in its own card under the question card (same
  // styling), the pair centered as a unit. When a question + its options are
  // too tall to share the space, the message card disappears for that
  // question. A hidden, always-mounted measurer carries the message's
  // natural height even while the real one is unrendered — otherwise
  // hide → smaller → show → bigger would oscillate forever.
  const mainRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const msgMeasureRef = useRef<HTMLElement | null>(null);
  const [msgVisible, setMsgVisible] = useState(true);
  useLayoutEffect(() => {
    const main = mainRef.current, card = cardRef.current, meas = msgMeasureRef.current;
    if (!main || !card || !meas) return;
    const check = () => {
      const cs = getComputedStyle(main);
      const avail = main.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const gap = parseFloat(cs.rowGap) || 0;
      setMsgVisible(card.offsetHeight + gap + meas.offsetHeight <= avail);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(main);
    ro.observe(card);
    return () => ro.disconnect();
  }, [q.id]);
  // Read-aloud can fail (no voices installed, engine dead). Instead of a
  // per-card note that shoves the layout around, the failure surfaces as a
  // toast anchored to the dock's top edge: it slides up from behind the bar,
  // holds ten seconds while its clock bar drains, then sinks back out.
  const [ttsToast, setTtsToast] = useState(false);
  const [ttsMounted, setTtsMounted] = useState(false);
  useEffect(() => {
    if (!failedReason) return;
    // Mount first, then flip the class a couple of frames later so the
    // slide-in transition actually plays.
    setTtsMounted(true);
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setTtsToast(true)));
    const t = window.setTimeout(() => setTtsToast(false), 10000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [failedReason]);
  // After the slide-out finishes, remove the toast from the DOM entirely.
  // Its parked position hangs below the bar; a mounted-but-parked box there
  // extends the page's scroll area on mobile (phantom space around the nav
  // bar) and can peek out whenever the dock isn't flush with the viewport
  // bottom.
  useEffect(() => {
    if (ttsToast) return;
    const t = window.setTimeout(() => setTtsMounted(false), 500);
    return () => window.clearTimeout(t);
  }, [ttsToast]);
  const countFresh = useMemo(
    () => questions.filter((x) => answers[x.id] === undefined).length,
    [questions, answers],
  );

  const advance = () => {
    if (!answeredCurrent) return;
    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      onFinish();
    }
  };

  const back = () => setIndex(Math.max(0, index - 1));

  const choose = (optionId: string) => {
    // Select only — nothing advances. Continue (in the dock) is the only
    // forward commitment, and any option can be re-picked before that.
    onAnswer(q.id, optionId);
  };

  const renderOptions = () => {
    if (q.format === 'agreement') {
      return (
        <div className="scale" role="radiogroup" aria-label="Agreement scale">
          {(q.options as Array<{ id: string; label: string; value: number }>).map((o) => {
            const av = answers[q.id];
            const selected = av?.kind === 'scale' && av.value === o.value;
            return (
              <button
                key={o.id}
                role="radio"
                aria-checked={selected}
                className={`scale__opt${selected ? ' is-selected' : ''}`}
                onClick={() => chooseScale(o.value)}
              >
                <span className="scale__num">{o.value}</span>
                <span className="scale__label">{o.label}</span>
              </button>
            );
          })}
        </div>
      );
    }
    const isForced = q.format === 'forced_pair';
    return (
      <div className={`choices${isForced ? ' choices--pair' : ''}`}>
        {(q.options as Array<{ id: string; label: string }>).map((o) => {
          const av = answers[q.id];
          const selected = av?.kind === 'option' && av.optionId === o.id;
          return (
            <button
              key={o.id}
              className={`choice${selected ? ' is-selected' : ''}`}
              onClick={() => choose(o.id)}
            >
              <span className="choice__marker" aria-hidden>{isForced ? (o.id === 'a' ? 'A' : 'B') : '·'}</span>
              <span className="choice__label">{o.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const chooseScale = (value: number) => {
    onAnswer(q.id, value);
  };

  /** Read the question itself. The options are already on screen — the voice
      is for listening to the scenario, not for reciting the choice list. */
  const speakQuestion = () => {
    if (speaking) {
      stopSpeech();
      return;
    }
    speak(q.prompt.join(' '));
  };

  return (
    <div className="quizwrap">
      {/* Progress is the header's only furniture, in its own rounded pill —
          back and read-aloud live in the bottom nav bar with the rest of the
          test's navigation. */}
      <header className="quiz__top">
        <div className="quiz__progress">
          <div className="quiz__progress-track" aria-hidden>
            <div className="quiz__progress-fill" style={{ width: `${pct}%` }} />
          </div>
          {/* Progress = answers given, not position in the (shuffled) order —
              with randomized ordering, "position N" doesn't mean "question N". */}
          <span className="quiz__counter">
            {answeredCount} / {questions.length}
            {isClarifier ? ' · clarifying' : ''}
          </span>
        </div>
      </header>

      <main className="quiz__main" ref={mainRef}>
        <section className="quiz__card" key={q.id} ref={cardRef}>
          <div className="quiz__prompt">
            {q.prompt.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {/* The question's own note is spoken by read-aloud but not rendered:
              per-card coaching read as filler — the dock message at the bottom
              is the one place the instrument talks about itself. */}
          {isClarifier && (
            <p className="quiz__note quiz__note--clarifier">
              One of the last few — a closer look at a territory your earlier answers left
              genuinely open.
            </p>
          )}
          {renderOptions()}
        </section>

        {/* The dock message, as a matching card: the question + message pair
            centers together, and the message yields its seat when the two
            wouldn't fit. */}
        {msgVisible && (
          <aside className="quiz__msgcard" key={`msg-${q.id}`}>
            {messageFor(index)}
          </aside>
 )}
        {/* Invisible twin that measures the message's natural height. */}
        <aside className="quiz__msgcard quiz__msgcard--measure" ref={msgMeasureRef} aria-hidden>
          {messageFor(index)}
        </aside>
      </main>

      <footer className="dock">
        <div className="dock__in">
        {showCatchUpNotice && (
          <p className="dock__catchup">
            The questionnaire grew since you started — {countFresh} new questions first;
            your previous answers carry over, and ← Back can revisit any of them.
          </p>
        )}
        <div className="dock__actions">
          {confirmingReset ? (
            <>
              <span className="dock__confirm">Clear this run and return to the start?</span>
              <button className="btn btn--danger btn--small" onClick={onStartOver}>
                Yes, start over
              </button>
              <button className="btn btn--ghost btn--small" onClick={() => setConfirmingReset(false)}>
                Keep going
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn--ghost btn--small dock__back"
                onClick={back}
                disabled={index === 0}
                title="Back to the previous question"
                aria-label="Previous question"
              >
                <span aria-hidden>←</span>
                <span className="dock__backlabel">Back</span>
              </button>
              {ttsSupported && (
                <button
                  className={`speakbtn${speaking ? ' is-speaking' : ''}${failedReason ? ' is-broken' : ''}`}
                  onClick={speakQuestion}
                  aria-label={speaking ? 'Stop reading' : 'Read the question aloud'}
                  title={
                    failedReason === 'no-voices'
                      ? 'No speech voices are installed in this browser'
                      : failedReason === 'engine'
                        ? 'Speech could not start in this browser'
                        : speaking
                          ? 'Stop reading'
                          : 'Read the question aloud'
                  }
                >
                  <Icon name={speaking ? 'stop' : 'volume'} size={16} />
                </button>
              )}
              <button
                className="btn btn--ghost btn--small dock__reset"
                onClick={() => setConfirmingReset(true)}
                title="Clear this run"
              >
                <Icon name="loop" size={14} />
                <span className="dock__resetlabel">Start over</span>
              </button>
              <button
                className="btn btn--primary dock__primary"
                onClick={advance}
                disabled={!answeredCurrent}
                autoFocus={answeredCurrent}
              >
                {index === questions.length - 1 ? 'Review my answers →' : 'Continue →'}
              </button>
            </>
          )}
        </div>
        </div>

        {/* Read-aloud failure toast. A CHILD of the dock (an earlier bug put
            it outside, where its percentages resolved against the viewport).
            It rests just above the bar's edge and parks translated down
            behind .dock__in's opaque surface — overlay, never layout push.
            It is UNMOUNTED while parked: a parked box hanging below the bar
            extends the page's scroll area on mobile (phantom space around
            the nav bar) and can peek out when the dock isn't flush with the
            visual viewport bottom. */}
        {ttsMounted && (
        <div className={`tts-toast${ttsToast ? ' is-in' : ''}`} role="status" aria-live="polite">
          <p>
            {failedReason === 'no-voices' ? (
              <>
                No speech voices in this browser, so read-aloud can't play. On Linux: install{' '}
                <code>speech-dispatcher</code> and <code>espeak-ng</code>, then restart it. Chrome
                or Edge sound best.
              </>
            ) : (
              <>Speech couldn't start in this browser.</>
            )}
          </p>
        </div>
        )}
      </footer>
    </div>
  );
}
