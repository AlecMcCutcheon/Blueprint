# Blueprint

**A relationship-instincts questionnaire that writes your document for you.**

Not "what's your love language." Not a compatibility score. Blueprint measures how you
*actually* tend to love — through 145 situational questions where the measurement is
hidden inside scenarios, forced choices, and behavioral agreement scales — then generates
a personalized narrative document about how you appear to love, built entirely from your
own answer pattern.

The output is a mirror, not a verdict: *here is how you appear to love, based on dozens
of small decisions you made when you didn't know what was being measured.*

**Take it:** [alecmccutcheon.github.io/Blueprint](https://alecmccutcheon.github.io/Blueprint/)

## What it measures

141 scored questions across **30 hidden dimensions** — from everyday affection and
desire to repair after conflict, invisible household effort, money-as-teamwork, and
the boundary around the relationship itself. No dimension is ever shown as a bare
number first; every score arrives as prose.

On top of the dimensions, a derived-pattern engine reads the *interactions between*
scores: what a high reassurance need means next to high benefit-of-the-doubt, what
wide receiving next to a touch-first giving channel implies, where two strong scores
quietly create a risk neither would create alone. Within-dimension variance detection
catches the averages that are actually tug-of-wars and says so.

The run ends with 3 clarifying questions (145 items total), generated from echo pairs — scenarios that
came back wearing different clothes — and the document reports how often your answers
agreed with themselves.

## How a run works

1. **Intro** — the honesty contract: answer fast, first instinct, there are no
   "good partner" answers, and some scenarios come back later wearing different clothes.
2. **Quiz** — the 141-item scored core in a randomized-but-stable order that never places
   same-dimension items back-to-back, then the 3 clarifiers once the engine knows
   which territories need a closer look. Progress checkpoints to localStorage after
   every answer.
3. **Review** — two tabs: *What each answer revealed* (your choice plus what every
   alternative would have revealed) and *What was actually measured* (the 30 dimensions).
4. **Blueprint** — the narrative document: everyday affection → understanding →
   communication → safety → reciprocity → hard days → closeness → independence →
   privacy → crosscurrents (your top cross-dimension patterns) → tensions → closing.
   Downloadable as Markdown; the full session exports as a portable `BPS` code.

## Sharing & privacy

Two carriers, two privacy levels:

- **For other people** — a share link carrying a `BP6` code: derived scores plus
  quantized variance shape (per-dimension answer counts and cancellation), tension
  directions, and channel breadth — exactly what the document reveals and nothing
  more. Raw answers never leave your machine, and the aggregates are not invertible
  back to how any specific question was answered. The name and intent
  (`show` vs `invite`) ride in a checksummed segment: a modified link degrades to
  the generic "somebody shared this" presentation. The shared document is byte-
  identical to the owner's (smoke-tested), so sharing no longer costs the reader
  any of the reading.
- **For yourself** — a full-session `BPS` code (raw answers + question-order seed,
  with your name in an opaque, checksummed block). Pasting one into the intro's
  import box restores the *real* session: the review shows actual choices and the
  blueprint rebuilds from evidence. Codes from older bank versions import partially
  and report exactly what was dropped. The universal import box auto-detects what
  you pasted — a link or `BP` code opens someone's blueprint, a `BPS` code restores
  your own session.

Everything stays in the browser. Answers live in localStorage; exports are local file
downloads. No network calls, no accounts, no analytics.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
```

## Deploy (GitHub Pages)

The site deploys automatically: every push to `main` runs
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds with the
Pages base path (`/Blueprint/`) and publishes via the official Pages actions. Enable it
once under **Settings → Pages → Source: GitHub Actions**. Manual runs: the **Actions**
tab → *Deploy to GitHub Pages* → *Run workflow*.

For a self-hosted build at a domain root, just `npm run build` — no env var needed;
the base path is applied only when the workflow sets it.

## Design & evidence

- [`PROJECT_NOTES.md`](PROJECT_NOTES.md) — the full design document: dimension map,
  question-design principles (indirect measurement, social-desirability countermeasures,
  echo pairs, forced-choice mirrors), the scoring model, and the document generator.
- [`PSYCHOMETRIC_AUDIT.md`](PSYCHOMETRIC_AUDIT.md) — the evidence audit: research
  grounding (Gottman's bids and repair, Clark & Mills' communal orientation, ECR-R
  attachment dimensions, Mallory 2021 on sexual communication, Gable on capitalization,
  Rusbult's investment model, Petronio's privacy management), known limitations, and
  the heuristics-vs-validated-instrument boundary.
- [`PSYCHOLOGY_REFERENCE.md`](PSYCHOLOGY_REFERENCE.md) — the research citations behind
  each construct, written into the document's own claims.
- [`PATTERN_CATALOG.md`](PATTERN_CATALOG.md) — every derived pattern, interplay rule,
  and variance note the engine can produce, generated from the source of truth.

## Testing

```bash
npx esbuild scripts/smoke.ts --bundle --platform=node --format=cjs --outfile=/tmp/smoke.cjs
node /tmp/smoke.cjs
```

The smoke test answers every question three different ways and asserts the scoring
engine and blueprint generator produce complete, distinct, non-empty output for each;
that `BP1`–`BP6` share codes round-trip, with legacy codes marking newer dimensions
unmeasured rather than guessed; that full-session codes (with and without a name)
restore bit-identical profiles; that clarifiers score in the main pass without
inflating the answered count; and that share links and session codes carry
name/intent in checksummed blocks without ever leaking plaintext into the code.

Additional tooling under `scripts/`: `harness.ts` (pattern fire rates across 540 seeded
profiles), `auditmine.ts` (per-dimension evidence contributions), `catalog.ts`
(regenerates the pattern catalog), `compare-check.ts` (prints the compare screen's full
data shape — alignment context line, matches/gaps, tier-band crossings, the domain
by-domain table, and the channel cross-check — for two session files, with row-count and
determinism assertions), and `opposite-session.ts` (builds a session that
answers every question maximally against a source session — the divergence stress test:
29/30 dimensions move >15 points and the generated documents share under 10% of
paragraphs). `reachability.ts` proves from the bank's weights which score bands each
dimension can actually reach (all 29 bank dimensions hit all 7 tiers exactly; the
derived channel-alignment dimension enumerates 6 of 7), enumerates the channel-derived
alignment dimension exactly, and lower-bounds the document space at ~10^29 distinct
tier-paragraph combinations. `sensitivity.ts`
measures what one answer is worth: exact balanced-baseline single-flip swings per dimension
(worst-case 37–68 pts on the thinnest constructs vs 1.5–4 pts on the well-evidenced core),
effective independent evidence counts (n_eff), and cross-dimension couplings — the empirical
basis for knowing where the instrument's 7-tier resolution is earned and where it is borrowed.

## License

[MIT](LICENSE)
