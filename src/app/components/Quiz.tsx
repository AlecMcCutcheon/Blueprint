import { useMemo, useState } from 'react';
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
        {isForced && !q.note && (
          <p className="quiz__note quiz__note--prompt quiz__note--full">
            It always depends on the day — pick the one that's true more often than not, or the
            one whose absence you'd feel first.
          </p>
        )}
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

  /** Read the scenario aloud, then each option as "Option A … Option B …" */
  const speakQuestion = () => {
    if (speaking) {
      stopSpeech();
      return;
    }
    const parts: string[] = [q.prompt.join(' ')];
    if (q.note) parts.push(q.note);
    q.options.forEach((o, i) => {
      const letter = String.fromCharCode(65 + i); // A, B, C…
      parts.push(`Option ${letter}. ${o.label}`);
    });
    speak(parts.join(' .. '));
  };

  return (
    <div className="quizwrap">
      <header className="quiz__top">
        <button
          className="btn btn--ghost btn--small"
          onClick={back}
          disabled={index === 0}
          title="Change an earlier answer"
        >
          ← Back
        </button>
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

      <main className="quiz__main">
        <section className="quiz__card" key={q.id}>
          <div className="quiz__promptrow">
            <div className="quiz__prompt">
              {q.prompt.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {ttsSupported && (
              <button
                className={`speakbtn${speaking ? ' is-speaking' : ''}${failedReason ? ' is-broken' : ''}`}
                onClick={speakQuestion}
                aria-label={speaking ? 'Stop reading' : 'Read this question aloud'}
                title={
                  failedReason === 'no-voices'
                    ? 'No speech voices are installed in this browser'
                    : failedReason === 'engine'
                      ? 'Speech could not start in this browser'
                      : speaking
                        ? 'Stop reading'
                        : 'Read aloud'
                }
              >
                <Icon name={speaking ? 'stop' : 'volume'} size={16} />
              </button>
            )}
          </div>
          {q.note && <p className="quiz__note quiz__note--prompt">{q.note}</p>}
          {isClarifier && (
            <p className="quiz__note quiz__note--clarifier">
              One of the last few — a closer look at a territory your earlier answers left
              genuinely open.
            </p>
          )}
          {failedReason === 'no-voices' && (
            <p className="quiz__note quiz__note--tts">
              This browser has no speech voices installed, so read-aloud can't play. On Linux:
              install <code>speech-dispatcher</code> and <code>espeak-ng</code>, then restart the
              browser. Voice quality is best on Chrome or Edge.
            </p>
          )}
          {renderOptions()}
          {answeredCurrent && (
            <p className="quiz__note quiz__note--hint">
              Changed your mind? Pick a different option, or go ← Back for earlier questions.
            </p>
          )}
        </section>
      </main>

      <footer className="dock">
        {showCatchUpNotice && (
          <p className="dock__catchup">
            The questionnaire grew since you started — {countFresh} new questions first;
            your previous answers carry over, and ← Back can revisit any of them.
          </p>
        )}
        <p className="dock__message">{messageFor(index)}</p>
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
                className="btn btn--ghost btn--small dock__reset"
                onClick={() => setConfirmingReset(true)}
                title="Clear this run"
              >
                <Icon name="loop" size={14} /> Start over
              </button>
              <button
                className="btn btn--primary"
                onClick={advance}
                disabled={!answeredCurrent}
                autoFocus={answeredCurrent}
              >
                {index === questions.length - 1 ? 'Review my answers →' : 'Continue →'}
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
