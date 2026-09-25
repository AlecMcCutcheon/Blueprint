# Project Notes — "Blueprint" Relationship Instincts Questionnaire

A React app that measures *relationship instincts* through indirect, situational questions and
generates a personalized narrative "relationship blueprint" document — a narrative in the spirit
of a personal values document, derived entirely from the taker's own answer pattern.

The goal is **not** a compatibility score. It is self-knowledge: "here is how you appear to love,
based on dozens of small decisions you made when you didn't know what was being measured."

---

## 1. Research foundations (verified via web search, Sep 2026)

| Finding | Source | How it's used |
|---|---|---|
| Indirect, situational, and forced-choice question formats reduce social desirability bias vs. direct "do you value X" items | Scribbr (Social Desirability Bias), The Decision Lab, Frontiers in Psychology (Kreitchmann 2019) | Core design principle: no question states the trait it measures; scenarios instead of value statements |
| A "bid" is the fundamental unit of emotional connection; partners respond by turning toward, away, or against; turning-toward frequency strongly predicts relationship survival (86% vs 33% in Gottman's observational work) | The Gottman Institute ("Bids", "Turn Toward Instead of Away") | Multiple scenario questions are micro-bids: partner looks over shoulder, sighs, mentions a win. Options encode toward/away/against *and* style-of-toward |
| Communal vs. exchange relationship orientation: communal = giving in response to the other's need without expecting comparable return; exchange = benefits given for benefits received, debts tracked. "Communal strength" is a validated construct | Clark & Mills (Yale Relationship Lab), Mills 2004 communal strength measure, Batson 1993 | The **reciprocity / scorekeeping** dimension. Options that convert care into debt vs. care as need-response |
| Adult attachment has two measurable dimensions: anxiety (fear of rejection/abandonment, need for reassurance and approval) and avoidance (discomfort with closeness and dependence) | ECR-R (Fraley, U. Illinois); ECR-S literature | **Reassurance & security** dimension: low band = secure/independent, mid = comfort-seeking, high = anxiety-sensitive. Measured indirectly via ambiguity tolerance and interpretation of distance |
| People differ in how they express love vs. how they prefer to receive it; relationship satisfaction rises when partners express in the channel the other prefers to receive | Mostova et al. 2022 (PMC9216579), 5 Love Languages research | The **"which would affect you most" vs. "which would you most likely do" paired questions** — the gap itself is reportable in the blueprint |
| More affection, even unequally distributed, correlates with stronger relational ties than equal-but-scarce affection | WSU coverage of affection research (Feb 2026) | Supports "mutuality ≠ equality" scoring: generous-asymmetric is a *high* reciprocity outcome, not a flaw |
| Repair attempts (any statement/action that prevents negativity from escalating) predict relationship thriving; success depends on reception as much as delivery | Gottman Institute ("R is for Repair", "Manage Conflict") | **Conflict & repair** dimension: what you do when you notice things went sideways |
| Item-order effects (priming, carryover, context) bias self-report; randomization "does not eliminate order effects, but it does ensure that this type of bias is spread randomly"; same-construct items back-to-back are what prime a mindset | Pew Research Center (questionnaire order experiments); Şahin 2021 ("Effect of Item Order on Certain Psychometric Properties") | **Randomized presentation order** (`domain/order.ts`): seeded per-run shuffle, same-dimension items never adjacent, echo pairs structurally far apart, retake → fresh seed |
| Positive and negative affect are partially independent axes, not one good–bad dial; single-item state measures are well-established (PANAS tradition) | Watson, Clark & Tellegen 1988 (PANAS); single-item state mood measures literature | **Instrument-state checks (q96–q98)**, always last: calm / stirred / touched read the reader, not the traits — carried as reading context (`stateNote`), excluded from all scoring |

## 2. Dimension map (extracted from the founding values document + relationship-science literature)

24 primary dimensions, grouped into 6 domains. Each question carries weights on 1–4 dimensions,
and the taker never sees dimension names during the quiz.

**Domain A — Closeness** (affection, reassurance, vulnerability, desire, intimacy, lightness)
1. `affection_daily` — everyday non-sexual touch; "I like being close to you" vs. touch-as-means
2. `desire` — wanting to be *wanted*, not merely loved; attraction kept alive; flirtation
3. `vulnerability_safety` — treating disclosures as sacred vs. ammunition
4. `reassurance_security` — need for/comfort with proactive reassurance; interpretation of distance
   *(ECR-R anxiety/avoidance analog)*
5. `sexual_communication` — the channel for wants/limits/curiosity in intimacy
   *(Mallory et al. 2021 meta-analysis: r≈.37 relationship, r≈.43 sexual satisfaction)*
6. `positivity_play` — cultivating fun, lightness, shared laughter
   *(Stafford & Canary maintenance taxonomy: positivity)*

**Domain B — Reciprocity** (giving, receiving, scorekeeping)
5. `care_initiation` — instinct to notice and proactively care (the "she had a rough day, what can I do" reflex)
6. `receiving_comfort` — ability to receive care without guilt, deflection, or feeling diminished
7. `scorekeeping` — transactional vs. communal orientation *(Clark & Mills)*; scored inverted: high = communal
8. `express_receive_alignment` — symmetry between how you express care and how you want to receive it
   *(Mostova 2022; measured via paired question deltas)*

**Domain C — Emotional processing**
9. `listening_first` — hear-before-solve when a partner is upset; room to feel
10. `logic_emotion_integration` — respecting different processing styles; not reading logic as dismissal,
    not reading emotion as illogic
11. `curiosity_worlds` — genuine interest in the partner's inner world and passions
12. `perspective_taking` — stepping outside your own assumptions to interpret their behavior
13. `capitalization` — meeting a partner's good news actively; being where joy lands
    *(Gable et al., active-constructive responding)*

**Domain D — Conflict & teamwork**
14. `direct_communication` — saying things while small, no guessing games/tests
15. `repair_orientation` — coming back after friction; repair over pride; no winner-hunting
16. `same_side_problems` — "us vs. the problem" framing when life gets messy (money, family, breakage)
17. `conflict_engagement` — behavior in the heat: engagement vs. withdrawal vs. pursuit
    *(Gottman demand/withdraw; distinct from repair_orientation — during, not after)*

**Domain E — Interdependence**
18. `autonomy_connection` — independence without distance; coexisting in a room; two whole people
19. `shared_home_effort` — contributing without a permanent manager/passenger split; noticing invisible labor;
    permission to coexist at 20%
20. `commitment_sacrifice` — giving to the relationship without a running audit; carrying costs
    *(Rusbult investment model: commitment, accommodation, willingness to sacrifice)*
21. `money_coordination` — money as teamwork: equal legitimacy, early information, no audit
    *(couples' financial communication literature)*

**Domain F — Boundaries & privacy**
22. `relational_privacy` — what belongs to the two of you: conflicts worked through inside first;
    trusted counsel welcomed, audiences not; private ≠ hidden
    *(Petronio's Communication Privacy Management frame; added Sep 2026)*

**Meta-composites** (computed, not directly asked):
- `mutual_care` = care_initiation + receiving_comfort + scorekeeping — *"do you experience a relationship
  as two people taking care of each other, or two people negotiating entitlements?"*
- `emotional_safety` = vulnerability_safety + reassurance_security + listening_first
- `teamwork` = same_side_problems + repair_orientation + direct_communication

## 3. Scoring model

- Every option carries signed weights (e.g. `{ scorekeeping: -1.0, care_initiation: 0.4 }`).
- Question weights differ: situational/instinct questions count more than self-reflection ones.
- Negative ("away/against/exchange") answers subtract from the relevant dimension.
- Raw sums → normalized 0–100 per dimension: `(sum / maxPossibleForDimension) * 100`,
  clamped, computed from the *asked* question set (so partial completion is still valid).
- **Clarifying questions in the flow, not after it** (`domain/bonus.ts`): echo-pair analysis
  ranks dimensions whose repeated scenarios disagreed (pair agreement < 50, weighted by
  disagreement magnitude × tier extremity × pair count). The three `BONUS_POOL` clarifiers are
  then APPENDED to the tail of the quiz — real conflicts first, remaining items after — so
  every run ends with 100 presented questions and reaches the advertised count. They are
  scored in the MAIN scoring pass like any other item: their answers accumulate evidence
  directly, so an exported session rebuilds the adjusted profile by re-scoring alone (no
  post-hoc patching, nothing to re-derive). Conflicted territories get a resolution attempt;
  clean ones still collect resolution evidence. The clarifiers are excluded from the honest
  `answered` count and from consistency-pair scoring (a clarifier seen after a disagreeing
  pair is a clarification, not another echo). The old flow (post-blueprint offer card →
  `applyBonus` score-space nudge → `bonus` stage) is retired.
- **State survey retired**: the three PANAS-logic items (q96–q98, calm/stirred/touched) are
  out of the instrument entirely — removed from scoring, from the blueprint (`stateNote`
  deleted from generation, markdown, and types), and from the presentation order. The ids
  remain reserved: legacy saved runs carrying them are ignored by scoring, and session-file
  imports drop them (reported) rather than guessing.
- **Consistency pairs**: 12 conceptually-duplicate question pairs in different scenarios (the brief's
  "Layer 6"). Each pair's delta contributes to a `consistency` metric shown in the blueprint as
  "how much your answers agreed with themselves" — never as a pass/fail. The shuffle keeps pair
  members ≥15% of the quiz apart (structurally reserved slots), because echo diagnostics only
  work when enough other questions separate the two wordings.
- **Narrative bands (7 tiers)**: each dimension maps to seven score tiers — vlow/low/mlow/mid/
  mhigh/high/vhigh with bounds 22/35/48/62/75/88 — replacing the original 3-band compression
  (the resolution loss flagged in PSYCHOMETRIC_AUDIT §3; clinical instruments read T-score zones,
  not triads — see PSYCHOLOGY_REFERENCE.md §1.1). Legacy 3-band paragraphs carry the tone;
  hand-authored per-tier modifiers differentiate the leaning and extreme tiers; all 240 tier
  paragraphs are integrity-checked in the smoke test.
- **Derived-pattern engine** (`patterns.ts`): the second interpretation layer — what a score
  MEANS next to another score. 28 hand-authored cross-dimension patterns (only combinations
  where several questions probe the same underlying tension from different directions — never
  pairwise enumeration), including a contrast family keyed on RAW-score gaps (two mids can sit
  30 points apart — a resolution the 7-tier system cannot see); each gap pattern supersedes its
  coarser tier-level twin so the two never co-render. Patterns carry declarative conditions on
  the tier scale, a mode
  (`augment` / `reinterpret` / `tension` / `synthesis`), a priority, and confidence gating:
  confidence derives from the RAW score's distance past the crossed boundary (not just the
  tier), is capped when a dimension sits on a tier edge (`soft` → hedged wording), and is
  reduced on partial runs. Selection is ranked by confidence × priority with caps (3 headline,
  2 per placement spot, 1 tension / 2 augments per section); a dedup pass drops inline hits
  whose combination an interplay passage already owns, whose frame echoes the section heading,
  or whose opener stutters on the tier paragraph it would follow; any pattern with an unmeasured
  input is dropped rather than guessed. Synthesis patterns headline the Crosscurrents section;
  the rest render inline where a co-occurring score changes a paragraph's meaning. The
  machinery stays invisible — the reader sees prose, never scores or confidence numbers.
- **Evidence-distance calibration** (interpretation-review rule): the farther a claim travels
  from the answers, the softer its language — absolutes claiming outcomes, rarity, or other
  people's inner states are rewritten to mechanism-phrasing in one final pass over the whole
  document (`calibrate()` in blueprint.ts), so prose authors cannot ship uncalibrated claims.
  Templated openers ("At this intensity,", "Read against your…") are likewise varied at render
  time with seeded equivalents — deterministic per profile, never algorithmic-reading.
- **`PATTERN_CATALOG.md`** (generated by `scripts/catalog.ts`): the formal catalog — every
  pattern's trigger combination, relationship type, evidence rule, and placement, plus the
  interplay and variance libraries. Regenerate after any interpretation-layer change.
- **Within-dimension variance detection**: the average hides the shape — a "mid" built from
  opposing extremes canceling is a different finding from a genuine middle. Scoring accumulates
  signed per-question contributions per dimension (core + clarifiers); when cancellation
  (share of |weight| that opposes the majority) ≥ 0.4 with ≥ 2 opposing answers and enough
  evidence mass, a mid/leaning-tier dimension gets a variance note after its prose — naming the
  tug-of-war for that dimension (20 authored entries) or a generic fallback. Gated honestly:
  extremes are never averages, and share-code profiles carry scores without reasoning, so they
  get no variance notes rather than invented ones.
- **Interplay conditioning** (legacy layer): dimension paragraphs are still followed by
  cross-dimension passages when a co-occurring tier changes the reading (24 passages in the
  interplay library; first applicable `Other:tierIndex` key wins) — now covering combinations
  the pattern library doesn't reach. Both layers implement the profile-interpretation
  principle (Furr; Lievens 2017).
- **Adaptive section headings**: each section carries condition-keyed heading POOLS — the first
  matching condition (a dimension's tier, or a combination like "capitalization low AND listening
  high") selects a pool of 3–5 content-matched tellings, and a seeded pick rotates inside it, so
  two profiles rarely share a full set of titles (126 distinct texts observed across 300 random
  runs; titles never repeat within one document). PATTERN-keyed pools are checked first: when one
  of the six synthesis patterns headlined Crosscurrents, sections keyed to that pattern take
  titles written from its frame (e.g. `noticed_not_managing` firing titles the safety and
  reciprocity sections as "Noticed, Not Managed" / "Beyond Being Asked") — keyed only on what
  actually rendered, with the named pattern's frame vocabulary exempt from the echo guard. A
  render-time echo guard otherwise drops any candidate that shares too much vocabulary with what
  the section renders — tier paragraphs, fired pattern frames, or the epigraph — falling back to
  the static title if everything collides. `headingAdaptive` records which were chosen.
- **Crosscurrents titles keyed to the synthesis mix**: the interaction section's title comes from
  a pool for the profile's dominant pattern PAIR (plan.headline is priority-ordered, so the pair
  names the two dominant themes) — 15 authored pairs × 3 tellings, single-pattern pools when no
  pair applies, and the guarded static "Crosscurrents" as last resort. Every candidate is
  echo-guarded against the fired frames and the epigraph. 25 distinct titles observed across 300
  runs, with 91% of docs drawing a pair-keyed title.
- **Epigraph pools**: the opening line is keyed to the most distinctive dimension signal (score
  ≤ 36 or ≥ 70), with 3–4 tellings per keyed dimension and a seeded fallback pool — seeds derive
  only from profile content (dimension + score), never from owner-vs-share state, so BP5 share
  codes render byte-identical documents.
- **The blueprint** interpolates across bands: sentences are chosen per-dimension, then composed in
  the rhetorical structure of a personal values document ( Understanding → Communication → Safety → Reciprocity →
  Bad days → Affection/Intimacy → Home → Independence → Repair → closing lines), including a
  closing **"I am loved here"** paragraph when earned by the meta-composites.
- **Tensions**: dimensions whose *paired* questions disagree (e.g. expresses affection through acts
  but wants to receive words) surface as explicit "where your answers suggest some tension" sections.
- **Alternatives, per the brief**: for every question, the app stores a full description of what each
  *other* option would have revealed. The review screen shows your choice plus what the alternatives
  would have meant — this is what makes the system "deeply interwoven": the meaning of any answer
  depends on, and is explained through, every other possible answer.## 4. Question design principles (from questions-idea.md)

1. **Behavior under competing demands** beats stated values ("project due tomorrow AND partner has
   a bad night" beats "do you support your partner?").
2. **Every option is understandable.** No strawmen. The "away" option in any bid question must be
   a thing a decent person might actually do.
3. **Descriptive, not evaluative, option descriptions** (external design review, Sep 2026):
   descriptions render only on the post-blueprint review screen, so they cannot bias scoring —
   but they still frame the mirror. Phrases that grade answers ("the mature version", "the
   rarest and most useful reflex", "person before property", "efficiency over empathy") were
   removed across the bank so the review reads as description rather than lesson. The same pass
   rebuilt the label gradients on the items where one option was the visible "saint" answer
   (q08, q14, q21, q25, q26, q28, q32, q41, q43, q46–q48, q50, q55, q57, q62, q67, q71, q73,
   q84, q89, q131, q132, q138–q140) — labels now describe reactions rather than rank them,
   with option weights, ids, and diagnostics unchanged (verified: identical benchmark corpus
   stats before/after).
4. **Hypothetical, not retrospective** (external design review, Sep 2026): q116 (large
   sacrifice), q117 (playful rituals), and q123 (processing out loud) were converted from
   "I have done X" to "I could imagine X" / style phrasing so they are answerable without
   relationship history. q96–q98 are retired from scoring (post-blueprint state survey) and
   q100 is scored as state — the reviewer's "separate, don't rewrite" for the reflection items
   was already implemented.
3. **No obvious correct answers**; no option should read as the "good partner" answer.
3b. **Option-tone parity** (added after user review): every option label must describe the
   *function* the behavior serves (fairness, protection, self-respect, honesty) rather than
   caricature it. A reader must never be able to rank options by "which one sounds like a
   decent person." Diagnostics: the low-band option must not be the one that "sounds mean"
   (e.g. a scorekeeping option phrased as coldness or resentment measures nothing — people
   either avoid it or feel villainized for being honest). Ditto descriptions: no gotcha
   parentheticals like "(You don't, quite.)", no "the catastrophic author", no framing that
   reads as a verdict on character. The narrative banks follow the same rule: low-band
   paragraphs name the *cost* of a pattern, never the person's worth.
4. **Layered**: instinct (fast scenario) → preference (which would you rather) → tradeoff (which
   matters more when they conflict) → self-reflection (which thought stays with you) → behavior
   (what would you actually do) → contradiction checks (same construct, distant scenarios).
5. **Ambiguity tolerance**: same scenario twice, second time with more context — the *update* is
   the signal, not the answer.
6. **Hypothetical, not retrospective** (added after user review): every item must be answerable by
   someone not currently in a relationship. Present-tense "my partner does X" reports measure the
   *current* relationship (and exclude single takers); hypothetical scenarios about "a partner" or
   "someone I love" and dispositional scales ("I'd want…", "with someone I love, I can…") measure
   the *taker*. Mentioning a partner is fine — requiring one is not. Rewritten under this rule
   (weights untouched, no rescore risk): q38, q66, q72, q75, q82, q89, q93 in the first pass;
   q01, q65, q81, q90, and q31's frame in the second pass, which extended the rule to all
   current-relationship referents — possessives ("my partner"), **"we/us/our" pronouns**, and
   frames like "with a partner in mind". Preferred registers: general principles ("whatever
   happens in a relationship should…"), conditionals ("when there's fun to be had in a
   relationship…"), want-framings ("I want to be the first person they tell"), and self-predictions
   ("if something wasn't working for me in bed, I'd say so out loud").
6. **Formats mixed**: multiple-choice scenario, forced-choice pairs (A/B), 1–5 agreement scales
   (used sparingly, framed behaviorally), "which affects you most" vs. "which would you do".
7. **~137 questions, 25–40 minutes.** Every dimension gets multiple questions; the thinnest constructs (intimacy attunement, outside-voice processing, feedback reception) get dedicated evidence-depth waves.
   (q63–q67 privacy Sep 2026; q68–q95 Sep 2026 expansion: 3 curiosity_worlds + 3 relational_privacy
   coverage debt, then 6 new dimensions. New questions always append to ORDER so existing local
   runs resume unchanged and simply gain the newer questions.)

## 5. Architecture

```
src/
  domain/
    types.ts        — Question, Option, Weight, Scores, Blueprint types
    dimensions.ts   — 28 dimensions + 3 meta-composites + narrative banks (low/mid/high)
    questions.ts    — core bank (137 scored questions: 97 original + wave-4 + wave-5 evidence-depth + wave-6 equal-flattery pairs, ids q01–q144) + BONUS_POOL (3 tail-of-run clarifiers)
    order.ts        — seeded constrained shuffle: echo-pair slot reservation, adjacency preference (137 core items)
    scoring.ts      — normalization (core + clarifiers in the main pass), consistency deltas, meta-composites
    blueprint.ts    — narrative generation (bands, tensions, closing)
    share.ts        — BP1/BP2/BP3 metric codes, BPS full-session codes, share links (name + intent)
    session.ts      — full-session JSON export/import (raw answers + order seed + optional name)
  app/
    App.tsx         — state machine: intro → quiz (140 incl. clarifiers) → review → blueprint → compare; visitor mode from share links
    components/     — Intro, Quiz, Review, BlueprintView, Compare
  styles.css        — single stylesheet, warm paper aesthetic (the blueprint should feel like a document)
```

Band chart: 28 dimension bars with score, one-line tier readout (e.g. "Touch as first language"),
and fill; unmeasured dimensions render as a grayed gap.

Persistence: localStorage checkpoint after every answer (a 137-question scored run should never be lost).
The presentation order is seeded and persisted too — a refresh resumes in the identical order; a
retake reseeds.
Export: blueprint as downloadable Markdown.

### Sharing: two carriers, two privacy levels

**Metric codes / links (for other people).** A BP1/BP2/BP3 code carries only derived metrics —
never raw answers — and decodes entirely client-side. It travels either as a bare code or
wrapped in a **share link**: `?bp=<code>&name=<optional name>&mode=show|invite`. The name and
the intent live in the LINK, never in the code (transport, not payload): a code pasted some
other way stays name-free, and a link without a name presents the blueprint unnamed.
`mode=show` frames the visit as "look at my blueprint"; `mode=invite` frames it as "take the
test and compare with me". Recipients land in **visitor mode**: a framing panel ("This is
Maya's relationship blueprint — they've invited you to take the test…"), no owner-only UI (no
share box, no export, no "review my answers"), a note that the document's "you" means its
owner, a soft optional "take it yourself" path, and a compare shortcut once they have their
own blueprint. The intro's import box takes a session file/code (restore) or a bare BP code
(open someone's blueprint, unnamed).

**Full-session export/import (for the owner).** `domain/session.ts` writes a JSON file of the
raw answers + presentation-order seed + optional name. Import validates every answer against
its own question (unknown ids and stale options are dropped and reported — never guessed at),
adopts the seed (the restored review appears in the order its owner experienced), and
re-scores: everything downstream is rebuilt naturally from answers. `BPS` full-session codes
carry the same payload in one deterministic string (answers + seed; same round-trip
exactness, smoke-tested). The old `reconstruct.ts` approximation is gone — restore is the
real session or nothing.

### Metric-code format (v3)

Codes carry only derived metrics — never raw answers — and are decoded entirely client-side.
All layouts share one structure: version byte + dimension scores + consistencyIndex + pair
agreements + answered count + channel nibbles, base64url after the prefix.

- **BP3 (current)**: 24 dimension scores + 12 pair agreements (~57 chars).
- **BP2 (legacy, still decodes)**: 18 dimensions + 6 pairs — the six expansion dimensions are
  absent and decode as `unmeasured`.
- **BP1 (legacy, still decodes)**: 17 dimensions + 5 pairs — same treatment.

Unmeasured dimensions are never guessed: the blueprint renders those sections as explicit gaps
plus a "things this document cannot see" tension, comparison excludes them, and `profileToCode`
refuses to re-encode a profile with unmeasured dimensions. Upgrade path: answer the newer
questions (existing answers are kept), or share the document itself.

## 6. Ethical framing (shown in-app)

- This is a reflection instrument, not a diagnosis. It reveals *patterns in your choices*, not your
  "true subconscious" (per the brief: no claims of magic).
- No compatibility scores, ever. The output belongs to the taker.
- Blueprints are private to the taker's browser.
