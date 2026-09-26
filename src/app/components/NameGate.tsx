import { useState } from 'react';
import Icon from './icons';
import { useTheme } from './theme';

interface Props {
  /** A previously used name, offered back as the default. */
  initialName?: string;
  /** Continue into the quiz with the confirmed name (non-empty). */
  onDone: (name: string) => void;
  /** Back to the intro. */
  onBack: () => void;
}

/**
 * The questionnaire's first step: a name, before question one. Every run is
 * named here, so exports, share links, and the document's own voice always
 * know who they belong to — the Share section never needs a name input.
 */
export default function NameGate({ initialName = '', onDone, onBack }: Props) {
  const { theme, toggle } = useTheme();
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const ready = trimmed.length > 0;

  return (
    <main className="screen namegate">
      <button
        className="theme-toggle"
        onClick={toggle}
        aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} />
      </button>

      <div className="namegate__inner">
        <p className="intro__kicker">
          <Icon name="feather" size={14} /> Before the first question
        </p>
        <h1 className="namegate__title">Whose blueprint is this?</h1>
        <p className="namegate__lede">
          Your name goes on everything this test produces — the document, the share link, the
          session code that carries your answers. It stays in this browser and inside your codes;
          nothing is uploaded anywhere.
        </p>

        <form
          className="namegate__form"
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) onDone(trimmed);
          }}
        >
          <input
            className="namegate__input"
            value={name}
            maxLength={40}
            placeholder="Your name"
            aria-label="Your name"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
        </form>
      </div>

      {/* The same bottom nav bar the test itself uses: Back docks left, the
          primary action carries the row. Enter in the field starts too. */}
      <footer className="namegate__bar">
        <div className="namegate__bar-actions">
          <button className="btn btn--ghost" onClick={onBack}>
            Back
          </button>
          <button
            className="btn btn--primary"
            onClick={() => ready && onDone(trimmed)}
            disabled={!ready}
          >
            Start the test →
          </button>
        </div>
      </footer>
    </main>
  );
}
