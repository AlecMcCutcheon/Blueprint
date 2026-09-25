# Psychometric Audit — open concerns, evidence, and a roadmap

*Written Sep 2026 to record the user's standing concerns about measurement quality, what the
evidence actually says, and what remains undone. Re-read whenever the instrument changes.*

## 1. The concerns (recorded so nothing is lost)

1. **Does the question count properly cover the dimensions?** Are some claims recycled from
   too little data?
2. **Is the resolution real?** With 18 dimensions and many possible answer combinations, is the
   final narrative actually customized — or does it need more variation/pathways to describe
   results properly?
3. **Are the assumptions correct?** Is our interpretation of what the data means grounded in real
   psychology methodology, not just our own invention?
4. **The consistency layer specifically:** "answers agreeing with themselves" is a second-order
   metric (the instrument evaluating its own data) that can swing the output. That layer, like the
   first-order dimensions, should be rooted in real psychology rather than invented.
5. **Willing to expand** toward ~24 dimensions if the research supports it — but coverage/quality
   of what exists comes first.

## 2. Coverage: what the numbers actually are (recomputed after the expansion — `scripts/audit.ts`)

115 questions across 28 dimensions; 99 of the 115 questions carry weights on 2+ dimensions (the
interwoven design working as intended).

| dimension | questions | | dimension | questions |
|---|---|---|---|---|
| direct_communication | 42 | | same_side_problems | 17 |
| care_initiation | 33 | | affection_daily | 18 |
| listening_first | 27 | | receiving_comfort | 19 |
| perspective_taking | 22 | | scorekeeping | 20 |
| autonomy_connection | 21 | | repair_orientation | 13 |
| reassurance_security | 11 | | money_coordination | 4 |
| curiosity_worlds | **9** *(was 3)* | | relational_privacy | **10** *(was 5)* |
| capitalization | 6 | | sexual_communication, positivity_play, conflict_engagement, commitment_sacrifice | 3 each |
| logic_emotion_integration, shared_home_effort, desire, vulnerability_safety | 9–10 | | express_receive_alignment | derived from channel tags |

Findings after the expansion wave:

- **Coverage debt paid**: curiosity_worlds tripled (3→9), relational_privacy doubled (5→10).
- **The six new dimensions launched at 3–6 questions each** — the same launch density the
  original dimensions had (3–5). This is the documented floor for a narrative band; deepening
  them to 5–6 is the natural next wave, listed in §7.
- Over-sampling in direct_communication (42) and care_initiation (33) is **harmless by design**:
  scores normalize within each dimension, so extra items add stability, not bias. The originally
  planned "rebalance by demoting weights" was dropped as pointless — removing signal adds noise.

## 3. Resolution: is the output customized enough?

The band system gives each dimension 3 bands with ~2 variants each (144 narrative paragraphs
total). Distinct documents come from the *combination*, not the variants:

- 23 scored dimensions × 3 bands ≈ 3^23 possible band-combinations before any variant seeding,
  epigraph keying (27 keyed + 4 fallback epigraphs), tension triggers, or the 3-track closing.
- **Edge-band clauses (implemented)**: scores within 4–5 points of a band boundary get the
  neighboring band's one-line readout appended, so a 58 and a 66 no longer render identically.
- **Derived-pattern engine (implemented, `patterns.ts`)**: Crosscurrents grew from 7 hand-wired
  pair passages into a derived-pattern layer — 36 authored cross-dimension patterns with
  declarative conditions, modes (augment/reinterpret/tension/synthesis), priorities, and
  confidence gating (raw-score margin past the crossed boundary; soft-band hedging; partial-run
  damping; unmeasured inputs drop the pattern). Top-3 synthesis patterns headline Crosscurrents;
  the rest render inline at placement points under per-spot/per-section caps. This is the
  second-order-interpretation lever: the text depends on the *relationship between* scores, not
  either score alone — extracted from the existing answers, no new questions.
- **Within-dimension variance (implemented)**: the other half of the compression problem —
  opposing answers canceling into a mid-band score. Signed per-question contributions are kept
  at scoring time; a mid/leaning tier with cancellation ≥ 0.4 (and ≥ 2 opposing answers with
  real evidence mass) renders a dimension-specific tug-of-war note instead of letting the
  average pose as temperament. Unmeasured tiers and share-code profiles (no raw reasoning)
  are excluded rather than guessed at.
- **Remaining known limitation**: within a band's interior (e.g. scores 46–54), paragraphs still
  come from ~2 variants. Score-parameterized phrasing is the next lever if needed (§7).

## 4. The consistency layer — now grounded in the literature

The user is right that a second-order metric can swing the output, and that it needed grounding.
It now has it:

- **Established practice.** Inconsistency/validity scales are standard in high-stakes personality
  measurement: the MMPI-2 family (VRIN/TRIN), and the Multidimensional Personality
  Questionnaire's inconsistency scales, which "identify invalid profiles through internal
  statistics and external correlates" (Benning et al., 2017, *Psychological Assessment*). Simpler
  embeddable versions exist too — the 5-item Conscientious Responders Scale (Marjanovic et al.)
  and infrequency items for insufficient-effort detection (Huang et al., 2015, *Journal of
  Business and Psychology*).
- **How the instrument maps onto that practice.** Our six echo pairs are conceptually-duplicate
  items at distance (the brief's Layer 6), scored by cosine similarity of their weighted vectors
  — this is the *same family* as MPQ-style inconsistency scales, just framed non-clinically. The
  mapping rules the instrument uses: disagreement is **never** moralized; it is interpreted as
  either a value tradeoff (the two answers pulled different values) or, for the "I'm fine" pair
  specifically, as threshold information (single ambiguity vs. sustained ambiguity update, per
  the brief's Layer-5 "update" mechanism).
- **McCrae (2010) caveat, adopted.** McCrae's review ("Internal Consistency, Retest Reliability,
  and their Implications for Personality Scale Validity") warns that internal consistency is a
  *data-quality* check, not a validity guarantee. The app's framing follows that: the blueprint
  reports "how much your answers agreed with themselves" as context on the reading's stability,
  never as a pass/fail, and never lets a low score veto the profile — it adds a tension note.
- **What is still missing (roadmap):** unlike MPQ research, we have no sample data to set empirical
  cutoffs. Our thresholds (45/40 on pair agreement, 78 for the "unusual agreement" note) are
  heuristics. Fine for a mirror, worth re-titling as provisional in any future docs.

## 5. Grounding of first-order dimensions (what carries real research weight)

Where each dimension's construct comes from in the literature — the ones marked ✓ were verified
by search during this audit; others were sourced during original design (see §1 of PROJECT_NOTES)
and are due a citation pass:

- ✓ **Scorekeeping** — Clark & Mills communal vs. exchange orientation (Yale; the academic
  statement of "care without keeping score").
- ✓ **Reassurance/ambiguity** — ECR-R attachment anxiety/avoidance analog (distance-interpretation
  items mirror their ambiguity items).
- ✓ **Direct communication / repair / same-side framing** — Gottman's repair attempts and
  "accepting influence"; bids/turning-toward scenarios.
- ✓ **Express–receive channels** — Mostova et al. 2022 on express/receive love-channel mismatch.
- ✓ **Relational privacy** — new dimension; construct anchored in the privacy-regulation
  literature's boundary-tension work (Petronio's CPM is the canonical frame) + the user's own
  document. Flag: do a dedicated citation pass when adding its planned questions.
- ✓ **Option-tone parity rule** — consistent with social-desirability research (Edwards 1957
  onward): options that differ in desirability measure desirability, not the trait.

## 6. Dimension expansion: the research-backed shortlist (target ~24)

Candidates that are (a) canonical in relationship science, (b) clearly distinct from the existing
18, and (c) derivable from situational answers without naming the trait:

1. **Sexual communication** — Mallory et al. 2021 meta-analysis: sexual communication correlates
   r ≈ .37 with relationship satisfaction and r ≈ .43 with sexual satisfaction. The founding values
   document has an entire "Intimacy Should Be Something We Figure Out Together" section; currently only
   obliquely measured. Strongest candidate.
2. **Conflict style** (demand/withdraw vs. collaborative engagement) — direct extension of
   Gottman; distinct from repair_orientation (what you do *during*, not after).
3. **Commitment/sacrifice willingness** — Rusbult's investment model; accommodation and
   willingness-to-sacrifice are well-validated constructs and highly situation-writable.
4. **Positivity/play/maintenance** — Stafford & Canary's five-factor maintenance taxonomy
   (positivity, openness, assurances, social networks, tasks). Most overlap with existing
   dimensions (openness ≈ direct_communication, assurances ≈ reassurance) but *positivity/play*
   is genuinely uncovered — "do you actively cultivate fun" is a real axis.
5. **Responsiveness to good news (capitalization)** — Gable et al.'s active-constructive
   responding; distinct from listening_first (distress) — this is about *joy*. The founding values
   document's
   "Supporting Each Other's Worlds" section gestures here, and curiosity_worlds is its closest
   neighbor (another reason to thicken that dimension while adding this one).
6. **Gratitude/receiving-appreciation orientation** — Algoe's find-remind-bind theory; partially
   overlaps receiving_comfort, so possibly fold in rather than add.
7. **Money coordination** — present in the founding values document ("Money, Hobbies, and Mutual Respect"), uncovered by
   the instrument; small but real. Could share a domain with shared_home_effort.

Recommended sequence: thicken curiosity_worlds and relational_privacy first (coverage debt), then
add sexual_communication, positivity_play, and capitalization (three high-value axes, ~15–18 new
questions total, all situational), with conflict style and commitment as the following wave. This
reaches ~24 dimensions and ~90 questions while keeping the 15–20 minute format only if some
over-sampled dimensions are rebalanced simultaneously.

## 7. Standing action items (condensed)

- [x] Coverage debt: curiosity_worlds (3→9), relational_privacy (5→10) — done
- [x] Dimension expansion to 24 — done (sexual_communication, positivity_play, capitalization,
      conflict_engagement, commitment_sacrifice, money_coordination)
- [x] Output-resolution upgrade — done (edge-band clauses + Crosscurrents section)
      **superseded by the 7-tier expansion**: 7 score tiers × 24 dimensions (240 paragraphs),
      28 cross-dimension interplay passages, adaptive score-keyed section headings, and
      per-pair direction-aware tension cards (see PSYCHOLOGY_REFERENCE.md for grounding)
- [x] Rebalance item — resolved as *no-op by design*: normalization makes demotion pointless
- [x] Bank rounded to a clean 100 questions: 97 scored core items + two refinement items
      (q99 need-voicing, q100 picture-specificity) + 3 clarifying questions appended at the
      tail of every run (real conflicts first, remaining bank items after — every run reaches
      118 presented questions; scored in the main pass, excluded from the answered count and
      consistency pairs) — done
- [x] Randomized presentation order — done (`domain/order.ts`): seeded per-run shuffle;
      echo pairs structurally ≥15% of the quiz apart (reserved slot geometry); same-dimension
      items never adjacent (±2 window tried, relaxed to ±1 — see order.ts comment for why);
      meta items pinned last; retake reseeds. Verified across seeds in smoke test
- [x] Conflict resolution flow — done: up to 3 clarifying questions (one per self-conflicted
      dimension, ranked by disagreement × tier extremity) appended to the tail of the quiz
      flow; their answers score in the main pass like any other item, so the exported session
      rebuilds the adjusted profile by re-scoring alone. Bonus pool seeded with
      receiving_comfort, direct_communication, scorekeeping — extend to remaining
      conflict-capable dimensions as needed
- [x] State survey retired from the instrument — done: the 3 PANAS-logic items (q96–q98) are
      out of scoring, blueprint, and presentation order; legacy saved runs carrying them are
      ignored and session-file imports drop them (reported) rather than guessing
- [x] Synthesis lead-in and closing bridge made data-driven — done: both now key off
      consistencyIndex and disagreeing-pair count instead of static text
- [ ] Deepen the six new dimensions from 3–6 toward 5–6 questions each (next wave)
- [x] Citation pass — done (see §5 and PROJECT_NOTES §1; consistency layer grounded in
      Benning 2017 / McCrae 2010; Mallory 2021, Gable, Stafford & Canary, Rusbult, Petronio added)
- [ ] Mark consistency thresholds as provisional heuristics pending sample data *(standing note —
      they are documented as heuristics in-app framing; revisit if the instrument is ever validated)*
- [x] Resolution: 3-band compression resolved — 7 tiers per dimension + interplay conditioning
      + adaptive headings (documented in PSYCHOLOGY_REFERENCE.md §1.1–1.2, §3)
- [x] Derived-pattern engine — done: 36 authored cross-dimension patterns (modes, priorities,
      confidence gating, unmeasured-drop, headline/inline selection) replacing the 7 hardcoded
      Crosscurrents passages; determinism, caps, gating, and polarity smoke-checked
- [ ] Per-score unique paragraphs (the "one paragraph per point" extreme): the 7-tier structure
      is the infrastructure for this if ever wanted — add per-point variants to each tier array
