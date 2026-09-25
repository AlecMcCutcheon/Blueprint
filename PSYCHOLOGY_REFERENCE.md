# Psychology Reference — the science this instrument stands on

*A repository copy of the general-psychology and relationship-science findings that
shape the Blueprint questionnaire, scoring, and narrative engine. Written so any future
change can be checked against the evidence it rests on, not just against taste.
All items verified via literature search, September 2026.*

---

## 1. Measurement fundamentals

### 1.1 Banding: read zones, not triads

- **MMPI family** (MMPI-2/MMPI-3; NCBI StatPearls 2023, Pearson interpretive guides):
  T-scores, mean 50, SD 10; the "normal band" spans 30–70, with clinically-elevated
  cutoffs at 65+ and further gradations above. Interpretation practice uses several
  zones, not three. **Use:** our 7-tier banding (22/35/48/62/75/88 bounds) mirrors the
  zone structure of professional instruments; the low/mid/high triad was a compression
  flagged in PSYCHOMETRIC_AUDIT §3 and resolved in the 7-tier expansion.
- **Code-type interpretation** (Pearson MMPI-2 guide): practitioners interpret
  *configurations* of scales ("code types"), not isolated scores; at least a 5-point
  spread between scales is required before a configuration is considered defined.
  **Use:** (a) our Crosscurrents and interplay passages are the narrative equivalent
  of code types — meaning read from pairs; (b) our 7-point tier gap is a deliberate
  analog of the 5-point rule, so adjacent tiers stay distinguishable.

### 1.2 Profiles, not single traits

- **Furr (Univ. of Richmond), "Persons, Situations, and Person-Situation Interactions"**
  (cited 187+): behavior is a function of dispositions × situations; traits manifest
  as *if-then* patterns across situations, not as fixed outputs.
- **Lievens et al. 2017** (personnel selection): statistical trait–situation effects
  are small per-situation but accumulate in profiles; assessment practice increasingly
  reads the *whole* profile. **Use:** interplay conditioning — a high-affection/
  low-play profile must read differently than the sum of its parts.

### 1.3 Self-report quality control

- **Benning 2017** (*Psychological Assessment*; MPQ inconsistency scales) and the
  **MMPI VRIN** tradition: paired near-duplicate items detect inconsistent responding
  as a *data-quality* signal.
- **McCrae 2010**: internal consistency is never a validity verdict about the person —
  people are allowed to feel two ways about the same territory. **Use:** our 12 echo
  pairs + consistencyIndex are reported as context, never pass/fail; disagreement
  cards name the trade-off rather than flagging error.

### 1.4 Item-order effects

- **Pew Research Center** (questionnaire order experiments): randomization "does not
  eliminate order effects, but it does ensure that this type of bias is spread randomly."
- **Şahin 2021**: same-construct items adjacent prime a mindset; separation is the
  countermeasure. **Use:** `domain/order.ts` — seeded shuffle, echo pairs ≥15% of the
  quiz apart (structurally reserved slots), same-dimension items never adjacent,
  retake reseeds.

### 1.5 State, not just trait

- **Watson, Clark & Tellegen 1988 (PANAS)**: positive and negative affect are partially
  independent axes, not one good–bad dial; single-item state measures are legitimate.
  **Use:** q96–q98 (calm / stirred / touched) read the taker *after* the instrument,
  carry zero trait weights, and surface only as a reading-context note.

---

## 2. Relationship science: what the dimensions are made of

| Construct | Source | Where it lives in the instrument |
|---|---|---|
| **Bids & turning toward** (86% vs 33% survival in Gottman's observational work) | Gottman Institute | Micro-bid scenarios throughout; "toward/away/against" options |
| **Communal vs exchange orientation**; communal strength as a validated measure | Clark & Mills (Yale); Mills 2004; Batson 1993 | `scorekeeping` dimension; ledger language in tier prose |
| **Attachment: anxiety & avoidance as two dimensions** | ECR-R (Fraley); ECR-S literature | `reassurance_security`, `vulnerability_safety` |
| **Express vs receive channel asymmetry** | Mostova et al. 2022 (PMC9216579); 5-love-languages research | q53/q54 mirror pair; `express_receive_alignment`; channel tension card |
| **Repair attempts predict thriving; reception matters as much as delivery** | Gottman ("R is for Repair") | `repair_orientation` |
| **Capitalization: sharing good news builds bonds; active-constructive responding is the key style** | Gable et al. | `capitalization`; the celebration-asymmetry crosscurrent |
| **Relationship maintenance taxonomy** (positivity, assurances, etc.) | Stafford & Canary | `positivity_play`, `care_initiation` |
| **Commitment: sacrifice & willingness** | Rusbult's investment model | `commitment_sacrifice` |
| **Sexual communication ↔ satisfaction** (r ≈ .37/.43 meta-analytic) | Mallory 2021 | `sexual_communication` |
| **Privacy as a boundary-management process** (counsel vs audiences) | Petronio's CPM theory | `relational_privacy`; "the two-person room" framing |
| **Demand/withdraw, engagement styles** | Gottman conflict literature | `conflict_engagement` |
| **Perceived partner responsiveness as the core intimacy mechanism** | Reis & Shaver's intimacy model | Blueprint synthesis language; "the room with two chairs" |
| **Fairness/equity distress in close relationships** | Hatfield equity theory; Staff & - research on perceived inequity | `scorekeeping` high-tier prose ("fairness organ turned up") |

---

## 3. Narrative-engine principles derived from the above

1. **Zone language, not verdicts.** Seven tiers per dimension, each described as a
   coherent way of loving with tradeoffs (tone-parity rule) — a direct consequence of
   1.1 and the McCrae 2010 principle: no band is a diagnosis.
2. **Pairs over points.** Meaning lives in configurations (1.1 code types, 1.2
   profiles). Implemented as: Crosscurrents section, per-dimension interplay
   passages, direction-aware echo-pair tension cards.
3. **State vs trait separation.** Affect checks never touch trait scores (1.5).
4. **Order as methodology.** Randomization is a bias-control instrument, not a
   cosmetic (1.4).
5. **Honesty about limits.** Direction of a disagreement is only ever stated when
   computable (raw answers present — own runs and full-session restores); profiles opened
   from metric codes get territory-specific but non-directional copy. Unmeasured dimensions
   render as explicit gaps.

---

## 4. Reading list (short form)

- NCBI StatPearls: *Minnesota Multiphasic Personality Inventory* (2023)
- Pearson: *Interpretation of MMPI-2 Clinical Scales*
- Benning (2017), *Psychological Assessment* — MPQ inconsistency scales
- McCrae (2010) — on the limits of internal consistency
- Watson, Clark & Tellegen (1988) — PANAS
- Furr — *Persons, Situations, and Person-Situation Interactions*
- Lievens et al. (2017) — personality–situation interplay in assessment
- Şahin (2021) — item-order effects on psychometric properties
- Pew Research Center — question-order experiments
- Gottman Institute — bids, repair, conflict management
- Clark & Mills — communal vs exchange relationships
- Fraley — ECR-R / attachment dimensions
- Gable et al. — capitalization
- Stafford & Canary — relationship maintenance
- Rusbult — investment model
- Mallory (2021) — sexual communication meta-analysis
- Petronio — Communication Privacy Management
- Reis & Shaver — intimacy process model
