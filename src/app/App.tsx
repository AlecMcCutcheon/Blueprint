import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Answers, Blueprint, Question, ScoredProfile } from '../domain/types';
import { QUESTIONS, QUESTION_BY_ID } from '../domain/questions';
import { computeOrder, computeCatchUpOrder } from '../domain/order';
import { bonusQuestionsFor } from '../domain/bonus';
import { decodeProfile, decodeFullSession, parseShareUrl, type ShareIntent } from '../domain/share';
import { scoreProfile } from '../domain/scoring';
import { generateBlueprint, blueprintToMarkdown } from '../domain/blueprint';
import { buildSessionFile, downloadSessionFile, importSessionJson } from '../domain/session';
import { loadPeople, savePeople, upsertPerson, renamePerson, removePerson, type Person } from './people';
import { ThemeProvider } from './components/theme';
import Intro from './components/Intro';
import Quiz from './components/Quiz';
import Review from './components/Review';
import BlueprintView from './components/BlueprintView';
import Compare from './components/Compare';

type Stage = 'intro' | 'quiz' | 'review' | 'blueprint' | 'compare';

const STORAGE_KEY = 'blueprint.progress.v1';
const SEED_KEY = 'blueprint.orderSeed.v1';
const NAME_KEY = 'blueprint.name.v1';
const LEGACY_IMPORT_KEY = 'blueprint.imported.v1'; // retired — cleaned up on mount

/** Seeded, persisted presentation order — randomized per run, stable per run. */
function useOrderSeed(): { seed: number; resetSeed: () => void; adoptSeed: (n: number) => void } {
  const [seed, setSeed] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(SEED_KEY);
      // Tolerate a legacy JSON-quoted value ("42") as well as a plain number.
      const n = Number((raw ?? '').replace(/"/g, ''));
      if (raw && Number.isFinite(n) && n > 0) return n;
    } catch {
      // ignore
    }
    return Math.floor(Math.random() * 2147483646) + 1;
  });
  // Persist the seed the moment it exists — including the first randomly
  // generated one. Without this, every reload reshuffled the quiz, scattering
  // already-answered questions around the resume point.
  useEffect(() => {
    try {
      if (localStorage.getItem(SEED_KEY) === null) {
        localStorage.setItem(SEED_KEY, String(seed));
      }
    } catch {
      // storage blocked — order just can't survive a refresh
    }
  }, [seed]);
  const resetSeed = useCallback(() => {
    const fresh = Math.floor(Math.random() * 2147483646) + 1;
    try {
      localStorage.setItem(SEED_KEY, String(fresh));
    } catch {
      // storage blocked — retakes just reuse the in-memory seed this session
    }
    setSeed(fresh);
  }, []);
  // Adopt an incoming seed (session restore): the restored run's review must
  // appear in the order its owner experienced.
  const adoptSeed = useCallback((n: number) => {
    const s = Math.max(1, Math.floor(n));
    try {
      localStorage.setItem(SEED_KEY, String(s));
    } catch {
      // storage blocked — order survives in memory for this session only
    }
    setSeed(s);
  }, []);
  return { seed, resetSeed, adoptSeed };
}

interface Persisted {
  stage: Stage;
  answers: Answers;
}

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted;
    if (parsed && typeof parsed === 'object' && parsed.answers) {
      // 'bonus' stage no longer exists (clarifiers are part of the quiz flow).
      if (parsed.stage === ('bonus' as Stage) || parsed.stage === ('clarifier' as Stage)) {
        return { stage: 'quiz', answers: parsed.answers };
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function loadSavedName(): string | null {
  try {
    const n = (localStorage.getItem(NAME_KEY) ?? '').trim();
    return n ? n.slice(0, 40) : null;
  } catch {
    return null;
  }
}

/** Remove share-link params so a refresh can't re-enter visitor mode after the user moved on. */
function clearShareUrl() {
  try {
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('bp') || url.searchParams.has('name') || url.searchParams.has('mode')) {
        url.searchParams.delete('bp');
        url.searchParams.delete('name');
        url.searchParams.delete('mode');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    }
  } catch {
    // ignore — a stale param at worst reopens the visitor view
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

/** Viewing someone else's blueprint (arrived via a share link). */
interface Visitor {
  code: string;
  name: string | null;
  intent: ShareIntent;
  profile: ScoredProfile;
}

function AppInner() {
  const [stage, setStage] = useState<Stage>('intro');
  const [answers, setAnswers] = useState<Answers>({});
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [myName, setMyName] = useState<string | null>(() => loadSavedName());
  // Randomized-but-stable presentation order for this run (order-effects
  // countermeasure). Retakes reseed for a genuinely fresh order.
  const { seed, resetSeed, adoptSeed } = useOrderSeed();
  // Catch-up mode: a saved run started before the bank grew. New questions
  // shuffle into their own pile and present first; answered ones keep the
  // original seed's relative order. Retired automatically once every core
  // question is answered — the permanent seed then governs the full bank.
  const [catchUpMode, setCatchUpMode] = useState(false);
  const order = useMemo(
    () => (catchUpMode ? computeCatchUpOrder(seed, Object.keys(answers)) : computeOrder(seed)),
    [catchUpMode, seed, answers],
  );

  // ── Mount: visitor link takes precedence, then the user's own session. ──
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_IMPORT_KEY); // retired key — hygiene
    } catch {
      // ignore
    }
    // 1) A share link (?bp=…&name=…&mode=…) opens that person's blueprint.
    try {
      const parsed = parseShareUrl(window.location.search);
      if (parsed) {
        const decoded = decodeProfile(parsed.code);
        if (decoded) {
          rememberPerson(parsed.code, parsed.name);
          setVisitor({ code: parsed.code, name: parsed.name, intent: parsed.intent, profile: decoded });
          setStage('blueprint');
          return;
        }
      }
    } catch {
      // fall through to normal resume
    }
    // 2) Resume the user's own progress (any stage, incl. a finished blueprint).
    const saved = loadPersisted();
    if (saved && saved.stage !== 'intro') {
      const count = Object.keys(saved.answers).length;
      if (count > 0) {
        setAnswers(saved.answers);
        setStage(saved.stage);
        // Bank-growth detection. A session started before the bank grew does
        // NOT have its answered questions forming a prefix of the current
        // seeded order (the new items interleave into it) — while a run
        // started on the CURRENT bank always answers the seeded order's
        // prefix, so a normal mid-run pause never trips catch-up mode.
        const answeredIds = new Set(Object.keys(saved.answers));
        const answeredCore = QUESTIONS.filter((q) => answeredIds.has(q.id)).length;
        if (answeredCore < QUESTIONS.length) {
          const ord = computeOrder(seed);
          const isPrefix = ord.slice(0, answeredCore).every((id) => answeredIds.has(id));
          if (!isPrefix) setCatchUpMode(true);
        }
      }
    }
  }, []);

  // Persist on every change — except while viewing a visitor's blueprint,
  // which is not this user's session and must never overwrite the saved run.
  useEffect(() => {
    if (stage === 'intro') return;
    if (stage === 'blueprint' && visitor) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ stage, answers }));
    } catch {
      // storage blocked — the run just won't checkpoint
    }
  }, [stage, answers, visitor]);

  const profile = useMemo(() => scoreProfile(answers), [answers]);

  // ── Clarifying questions: appended at the END of the normal flow. ──
  // Once the core bank is fully answered, echo-pair analysis picks which
  // clarifiers matter (real conflicts first, remaining bank items after —
  // every run reaches the advertised 118 and clean runs still collect
  // resolution evidence). They then present as ordinary questions at the tail
  // of the quiz, not as a separate post-blueprint detour.
  const [clarifierQueue, setClarifierQueue] = useState<Question[]>([]);
  useEffect(() => {
    if (stage !== 'quiz' || clarifierQueue.length > 0) return;
    const coreComplete = QUESTIONS.every((q) => answers[q.id] !== undefined);
    if (!coreComplete) return;
    const coreAnswers: Answers = {};
    for (const q of QUESTIONS) coreAnswers[q.id] = answers[q.id] as Answers[string];
    setClarifierQueue(bonusQuestionsFor(scoreProfile(coreAnswers)));
  }, [stage, answers, clarifierQueue.length]);

  const orderedQuestions = useMemo(() => {
    const core = order.map((id) => QUESTION_BY_ID[id]).filter(Boolean) as Question[];
    return clarifierQueue.length > 0 ? [...core, ...clarifierQueue] : core;
  }, [order, clarifierQueue]);

  // Retire catch-up mode the moment the core bank is complete: the two-pile
  // order is a temporary bridge, and a completed run reverts to the
  // seed-governed order for the whole bank.
  useEffect(() => {
    if (!catchUpMode) return;
    const complete = QUESTIONS.every((q) => answers[q.id] !== undefined);
    if (complete) setCatchUpMode(false);
  }, [catchUpMode, answers]);

  const startFresh = useCallback(() => {
    setAnswers({});
    setBlueprint(null);
    setVisitor(null);
    setClarifierQueue([]);
    setCatchUpMode(false);
    resetSeed(); // retake → genuinely fresh question order
    clearShareUrl();
    setStage('quiz');
  }, [resetSeed]);

  const startOver = useCallback(() => {
    setAnswers({});
    setBlueprint(null);
    setVisitor(null);
    setClarifierQueue([]);
    setCatchUpMode(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    clearShareUrl();
    setStage('intro');
  }, []);

  const handleAnswer = useCallback((questionId: string, optionId: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]:
        typeof optionId === 'number'
          ? { kind: 'scale', value: optionId }
          : { kind: 'option', optionId: String(optionId) },
    }));
  }, []);

  const finish = useCallback(() => {
    const p = scoreProfile(answers);
    setBlueprint(generateBlueprint(p));
    setStage('blueprint');
    clearShareUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  // Where the Review screen was opened from — blueprint visits read, quiz visits complete.
  const [stageBeforeReview, setStageBeforeReview] = useState<Stage>('quiz');

  const handleExport = useCallback(() => {
    const bp = blueprint ?? generateBlueprint(profile);
    const md = blueprintToMarkdown(bp, profile);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = myName ? `relationship-blueprint-${myName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md` : 'my-relationship-blueprint.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [blueprint, profile, myName]);

  const handleSaveName = useCallback((name: string | null) => {
    setMyName(name);
    try {
      if (name) localStorage.setItem(NAME_KEY, name);
      else localStorage.removeItem(NAME_KEY);
    } catch {
      // storage blocked — the name just won't survive a refresh
    }
  }, []);

  const handleExportSession = useCallback(() => {
    try {
      downloadSessionFile(buildSessionFile(answers, seed, myName));
    } catch {
      // download blocked — nothing else to do here
    }
  }, [answers, seed, myName]);

  // ── Restore paths: the REAL session, answers and all. ──
  const adoptRestored = useCallback((restored: { answers: Answers; orderSeed: number; name: string | null }) => {
    setAnswers(restored.answers);
    adoptSeed(restored.orderSeed);
    // Same bank-growth check as local resume: an imported session whose
    // answered items are not a prefix of its seed's current order predates a
    // bank change and gets the catch-up flow if the quiz is entered.
    const answeredIds = new Set(Object.keys(restored.answers));
    const answeredCore = QUESTIONS.filter((q) => answeredIds.has(q.id)).length;
    const isPrefix =
      answeredCore === QUESTIONS.length ||
      computeOrder(restored.orderSeed)
        .slice(0, answeredCore)
        .every((id) => answeredIds.has(id));
    setCatchUpMode(!isPrefix);
    if (restored.name) handleSaveName(restored.name);
    setVisitor(null);
    setClarifierQueue([]);
    setBlueprint(generateBlueprint(scoreProfile(restored.answers)));
    setStage('blueprint');
    clearShareUrl();
  }, [adoptSeed, handleSaveName]);

  const restoreFromJson = useCallback((text: string): string | null => {
    try {
      const result = importSessionJson(text);
      if (Object.keys(result.answers).length === 0) {
        return 'That file contains no answers this version can read.';
      }
      adoptRestored(result);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'That file could not be read as a Blueprint session.';
    }
  }, [adoptRestored]);

  const restoreFromSessionCode = useCallback((code: string): string | null => {
    const decoded = decodeFullSession(code);
    if (!decoded) return "That code doesn't parse as a full-session code — check for missing characters.";
    if (Object.keys(decoded.answers).length === 0) {
      return 'That code encodes an empty session.';
    }
    adoptRestored({ answers: decoded.answers, orderSeed: decoded.seed, name: null });
    return null;
  }, [adoptRestored]);

  // ── Visitor actions ──
  // Directory of other people's blueprints opened here (for choosing whom to
  // compare with). Names are editable and entries removable on the compare
  // screen; the profile itself is re-decoded from its stored code on demand.
  const [people, setPeople] = useState<Person[]>(() => loadPeople());
  const rememberPerson = useCallback((code: string, name: string | null) => {
    setPeople((prev) => {
      const next = upsertPerson(prev, code, name);
      savePeople(next);
      return next;
    });
  }, []);
  const handleRenamePerson = useCallback((code: string, name: string | null) => {
    setPeople((prev) => {
      const next = renamePerson(prev, code, name);
      savePeople(next);
      return next;
    });
  }, []);
  const handleRemovePerson = useCallback((code: string) => {
    setPeople((prev) => {
      const next = removePerson(prev, code);
      savePeople(next);
      return next;
    });
  }, []);

  // A bare metric code (BP1/2/3) pasted on the intro opens that person's
  // blueprint — visitor mode without a name, framed accordingly.
  const openVisitorCode = useCallback((code: string): string | null => {
    const trimmed = code.trim();
    const decoded = decodeProfile(trimmed);
    if (!decoded) return "That code doesn't parse — check for missing characters.";
    clearShareUrl();
    rememberPerson(trimmed, null);
    setVisitor({ code: trimmed, name: null, intent: 'show', profile: decoded });
    setStage('blueprint');
    return null;
  }, [rememberPerson]);

  const saved = loadPersisted();
  const savedCount = Object.keys(saved?.answers ?? {}).length;

  const visitorBlueprint = useMemo(
    () => (visitor ? generateBlueprint(visitor.profile) : null),
    [visitor],
  );

  if (stage === 'intro') {
    return (
      <Intro
        hasProgress={savedCount > 0}
        answeredCount={savedCount}
        onStart={startFresh}
        onContinue={() => {
          clearShareUrl();
          setVisitor(null);
          setStage('quiz');
        }}
        onImportJson={restoreFromJson}
        onImportSessionCode={restoreFromSessionCode}
        onOpenCode={openVisitorCode}
      />
    );
  }

  if (stage === 'quiz') {
    return (
      <Quiz
        key={catchUpMode ? 'catchup' : 'full'}
        questions={orderedQuestions}
        answers={answers}
        onAnswer={handleAnswer}
        onFinish={() => setStage('review')}
        onStartOver={startOver}
        catchUpActive={catchUpMode}
      />
    );
  }

  if (stage === 'review') {
    // Opened from the blueprint: `back` returns there and `finish` is hidden —
    // the blueprint already exists, this visit is for reading, not completing.
    const fromBlueprint = blueprint !== null && stageBeforeReview === 'blueprint';
    return (
      <Review
        answers={answers}
        order={order}
        onBack={fromBlueprint ? () => setStage('blueprint') : () => setStage('quiz')}
        onFinish={fromBlueprint ? () => setStage('blueprint') : finish}
        hideFinish={fromBlueprint}
      />
    );
  }

  if (stage === 'compare') {
    return (
      <Compare
        ownProfile={profile}
        others={people.map((p) => {
          const decoded = decodeProfile(p.code);
          return decoded ? { code: p.code, name: p.name, profile: decoded } : null;
        }).filter((p): p is NonNullable<typeof p> => p !== null)}
        onBack={() => setStage('blueprint')}
        onDone={() => setStage('intro')}
        onRememberPerson={rememberPerson}
        onRenamePerson={handleRenamePerson}
        onRemovePerson={handleRemovePerson}
      />
    );
  }

  // Blueprint stage — the visitor's, or the user's own.
  if (visitor && visitorBlueprint) {
    return (
      <BlueprintView
        blueprint={visitorBlueprint}
        profile={visitor.profile}
        visitor={{ name: visitor.name, intent: visitor.intent }}
        // Visitor exit must not touch this device's own saved run (STORAGE_KEY
        // belongs to the local user, whoever they are) — just leave visitor mode.
        onRetake={() => {
          setVisitor(null);
          clearShareUrl();
          setStage('intro');
        }}
        onStartTest={() => {
          // "Take the test" leads to the START, not a forced quiz: the intro
          // offers Begin, Continue (own progress), and the import box — so an
          // existing session can be compared without retaking anything.
          setVisitor(null);
          clearShareUrl();
          setStage('intro');
        }}
      />
    );
  }

  return (
    <BlueprintView
      blueprint={blueprint ?? generateBlueprint(profile)}
      profile={profile}
      myName={myName}
      onExport={handleExport}
      onExportSession={handleExportSession}
      onSaveName={handleSaveName}
      onStartCompare={() => setStage('compare')}
      onRetake={startOver}
      onStartUpgrade={
        Object.values(profile.dimensions).some((d) => d.unmeasured)
          ? () => {
              setVisitor(null);
              setStage('quiz');
            }
          : undefined
      }
      onOpenReview={() => {
        setStageBeforeReview('blueprint');
        setStage('review');
      }}
    />
  );
}
