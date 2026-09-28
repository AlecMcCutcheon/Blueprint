# knowledge.md

Agent-facing notes for working on **Blueprint** — a React relationship-instincts
questionnaire (145 items → 30 hidden dimensions → generated narrative document),
deployed to GitHub Pages via Actions on push to `main`. No network calls, no
accounts: everything lives in localStorage; exports are local file downloads.

## What it is

141 scored questions across 30 hidden dimensions measure how the taker *actually*
tends to love (indirect measurement, forced choices, social-desirability
countermeasures). A derived-pattern engine reads interactions *between* scores;
within-dimension variance detection catches averages that are really tug-of-wars.
Run ends with 3 clarifying echo-pair questions (145 total). Output is prose, never
bare numbers. Flow: **Intro → Name → Quiz → Review → Blueprint**.

User-facing docs live in `README.md` (product + sharing model),
`PROJECT_NOTES.md` (design), `PSYCHOMETRIC_AUDIT.md` (evidence),
`PATTERN_CATALOG.md` (generated from source), `PSYCHOLOGY_REFERENCE.md` (citations).

## Code map

**`src/domain/`** — pure logic, no React:
- `questions.ts` — the question bank (141 scored + 3 clarifier slots), echo pairs.
- `scoring.ts` — answers → dimension scores (tiers 1–7), within-dimension variance.
- `dimensions.ts` / `types.ts` — dimension map and shared types.
- `patterns.ts` — derived cross-dimension patterns + interplay rules.
- `bonus.ts` — derived/extra dimensions (e.g. channel-alignment).
- `order.ts` — randomized-but-stable question ordering from the run seed.
- `blueprint.ts` — narrative document generator (tier-paragraph selection).
- `session.ts` — session JSON (de)serialization — **scripts/ tooling only now**;
  the UI never touches raw JSON.
- `share.ts` — the codes. `BP1`–`BP6` visitor codes (derived aggregates, name +
  intent in checksummed segments, `parseShareUrl`, `compareProfiles`) and `BPS`
  full-session codes: `encodeFullSession(answers, seed, name?)` appends an optional
  `[0xA1][len][utf8][FNV-1a low]` name block; `decodeFullSession` returns
  `{answers, seed, missing, name}` (name null on corruption; backward compatible).

**`src/app/`**:
- `App.tsx` — stage machine (`intro → 'name' → quiz → review → blueprint`/`compare`).
  `startFresh(name)` persists name + resets run. `handleImportCode` routes pasted
  input: link/`?bp=` → `parseShareUrl` → `openVisitorCode`; `^BPS` →
  `decodeFullSession` → `adoptRestored`; `^BP[1-6]` → visitor.
  `adoptRestored` calls `handleSaveName(restored.name)` **unconditionally**
  (a nameless restore must clear any cached name).
- `people.ts` — multi-profile state for compare.
- `components/`: `Intro.tsx` (single auto-detect import box), `NameGate.tsx`
  (name-first step), `Quiz.tsx` (dock, TTS toast, progress pill, message card),
  `Review.tsx`, `BlueprintView.tsx` (owner/visitor views, confirm-reset, hosts
  ShareOut), `Compare.tsx` (universal input + bar with highlighted Compare
  toggle), `ShareOut.tsx` (bar button + combined Share-or-download panel,
  **portaled to document.body**), `icons.tsx`, `messages.ts`, `theme.tsx`,
  `useSpeech.ts`.
- `styles.css` — all styling; see bar recipe below.

**`scripts/`** — verification & analysis tooling (run with node/esbuild, see below).

## Commands

```bash
npm install
npm run dev              # vite, http://localhost:5173
npm run build            # tsc && vite build (also the typecheck)
npx tsc --noEmit         # typecheck only
```

Verify battery (run before every push):
```bash
npx tsc --noEmit
npm run build
npx esbuild scripts/smoke.ts --bundle --platform=node --format=cjs --outfile=/tmp/smoke.cjs && node /tmp/smoke.cjs
# → must print "ALL SMOKE CHECKS PASSED"
node scripts/synthesis-audit.ts
node scripts/syn-shape-check.ts
GATE=1 node scripts/bench-docs.ts
node scripts/harness.ts            # pattern fire rates, 540 seeded profiles
node scripts/reachability.ts       # tier reachability + doc-space lower bound
node scripts/compare-check.ts "blueprint-session-alec NEW 2.json" "blueprint-session-OPPOSITE.json"
node scripts/readmine.ts <path>    # needs an explicit session file path arg
```

Deploy check after push: `gh run list --repo AlecMcCutcheon/Blueprint --limit 1`.

**Session data files are gitignored**: `blueprint-session-alec NEW 2.json`
(source of truth), `blueprint-session-OPPOSITE.json`, `blueprint-session-TEST.json`.
Older-bank codes import partially and report what was dropped.

## Conventions & policy

- **Codes over JSON, always.** The user hates raw JSON in the UI. Codes are the
  method: a link or `BP` code opens someone's blueprint, a `BPS` code restores
  your own session — the universal import box auto-detects which. JSON import
  exists only inside `scripts/` tooling.
- **Verify before push.** Full battery above; then check the Actions deploy is
  green. **Never commit without the user's sign-off.**
- **No redundant UI.** Consistent nav bars everywhere, one primary action, no
  duplicate buttons. Open/highlight states are *highlight-only* — icons never
  swap to X. Likes icon circles + labeled expansion; dislikes per-question
  coaching notes.
- **Checksummed name/intent scheme:** names and `show`/`invite` intent ride in
  checksummed code segments; a tampered link degrades to generic "somebody shared
  this" — never leak plaintext into codes.
- Prose-first: no dimension is ever shown as a bare number before it appears as
  prose.

## Gotchas (learned the hard way)

- `str_replace` `oldString` must match **exactly** — watch comment dash-counts.
- JSX comments containing a literal `<body>` break parsing; use `{/* */}`
  without angle-bracket tags inside.
- `.export-dlg__panel h2 { margin: 0 0 8px }` out-specifies `.export-dlg__sub`;
  fixed via `.export-dlg__panel h2.export-dlg__sub`.
- `ParsedShareUrl` has **no `.profile`** — call `decodeProfile`.
- TDZ crash: `useCallback` deps referencing later-declared consts — declare in
  dependency order.
- smoke's `a.answers` includes injected retired state ids **q96–q98** which
  session codes never encode — when comparing, match core counts only.
- **Flex axis trap:** flex values written for a horizontal row distort a
  `flex-direction: column` container — `flex-basis: 0`/`100%` become HEIGHTS
  and grow lands on the wrong children. In `.dlrow--stack`, children are
  pinned `flex: 0 0 auto` for exactly this reason.
- **Label/mini ladder is scoped per container.** Every button carrying the
  `bp__fbtn-label`/`bp__fbtn-mini` pair needs its container named in the
  ladder rules in styles.css — forgetting one renders BOTH spans (doubled
  words). Currently covered: `.bp__footer`, `.review__footer`, `.review__tab`.
- **No raw text arrows inside flex buttons.** `.btn` has `gap: 8px`, so a
  literal `→` becomes a detached flex child floating off the label. Use the
  `arrow-left`/`arrow-right` icons.
- **No em-dash asides in user-facing prose.** The user considers them the
  AI-writing tell. Prose uses commas, colons, and full sentences instead;
  comments/code may still use `—`. (Em-dashes in dialogue, e.g. a cut-off
  quote, are fine.)
- **scripts/*.ts can't run via plain `node`** (extensionless imports fail on
  Node 22). Bundle first, smoke-style:
  `npx esbuild scripts/X.ts --bundle --platform=node --format=cjs --outfile=/tmp/x.cjs && node /tmp/x.cjs`.
- Compare screen data shape lives in `compare-check.ts`; it needs both session
  files passed as args and asserts row-count + determinism.

## Bar recipe (the current standard)

`.bp__footer` is `position:fixed` bottom, z-index 70 (above the z-60 dialog);
`body:has(.bp__footer) .screen { padding-bottom: 120px + safe-area }`;
`.bp__footer-actions` is a fixed 44px row, `nowrap`, no grow. Owner slots:
Review (primary) · Compare · Share · theme · Restart (confirm via `confirmingReset`
+ `.bp__confirm`, same wording as quiz dock). Visitor: Take the test (primary) ·
Back to start (instant) · theme. Compare: Review primary (returns to compare via
`stageBeforeReview='compare'`), Compare slot highlighted (`.bp__fbtn-accent`,
`aria-pressed`, press again = back), ShareOut, theme, Restart.

Quiz dock: `.dock > .dock__in` (opaque, z-1) with Back + speak (reads only
`q.prompt.join(' ')`); progress in a rounded pill; TTS toast `.tts-toast` rests at
`bottom: calc(100% + 8px)`, parks at `translateY(calc(100% + 120px))`, `.is-in`
shows, clock = `p::after` `ttsToastClock` 10s scaleX (restarts per show); toast
**unmounts** when parked (`ttsMounted` + double-rAF + 500ms retract timer) — this
fixed a phantom space under the mobile nav bar. Dock messages use
`.quiz__msgcard` below the card, centered, hidden when it would overflow
(`useLayoutEffect` + ResizeObserver against the hidden twin
`.quiz__msgcard--measure`; `justify-content: safe center`).
