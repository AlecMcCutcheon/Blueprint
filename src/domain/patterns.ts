// ─────────────────────── Derived-pattern engine ───────────────────────
// Second-order interpretation: what a score MEANS next to another score.
// The 7-tier paragraphs say how much of a dimension is present; the pattern
// layer says what that amount means in context. Patterns are hand-authored
// (only combinations where several questions probe the same underlying
// tension from different directions — never all pairwise permutations),
// confidence-gated (so the engine cannot turn a tier coincidence into a
// personality claim), and priority-ranked (so the document shows the three
// most important interactions, not every qualifying one).
//
// Modes:
//   augment     — adds an observation the single-dimension paragraphs missed
//   reinterpret — changes what a paragraph means; prevents the generic read
//   tension     — names where two co-occurring preferences create friction
//   synthesis   — profile-level architecture worth reading on its own
//
// Conditions use three bands of the existing 7-tier scale:
//   high(d)   tier index >= 4 (mhigh and up) — "on the high side or above"
//   lowish(d) tier index <= 2 (mlow and down) — "on the low side or below"
//   midPlus(d) tier index >= 3 — "not low"
// Confidence derives from the RAW score's distance from the crossed boundary
// (tier edge alone would make 62 and 89 indistinguishable), is reduced when a
// dimension sits on a tier boundary, and is capped down on partial runs.

import type { DimensionId, ScoredProfile } from './types';
import { DIMENSIONS, TIERS, tierOf } from './dimensions';

type Cond = (p: ScoredProfile) => boolean;

/** Tier index for a profile dimension; 2 (mid) when unmeasured — but unmeasured dims are dropped before conditions run. */
function tierIdx(p: ScoredProfile, d: DimensionId): number {
  const s = p.dimensions[d]?.score;
  return s === undefined ? 2 : TIERS.indexOf(tierOf(s));
}

const high = (d: DimensionId): Cond => (p) => tierIdx(p, d) >= 4;
const lowish = (d: DimensionId): Cond => (p) => tierIdx(p, d) <= 2;
const midPlus = (d: DimensionId): Cond => (p) => tierIdx(p, d) >= 3;
const both = (a: Cond, b: Cond): Cond => (p) => a(p) && b(p);
const all = (...cs: Cond[]): Cond => (p) => cs.every((c) => c(p));

/** Raw (0–100) score of a dimension; 50 when absent — gap conditions also gate on measurement upstream. */
const rawOf = (p: ScoredProfile, d: DimensionId): number => p.dimensions[d]?.score ?? 50;

/**
 * Raw-score gap condition (the contrast family): `a` must lead `b` by at least
 * `min` points AND clear `floorA` itself — the gap means nothing if the leading
 * dimension isn't actually high. The tier system can't see these: two mids can
 * sit 30 points apart.
 */
function gapCond(a: DimensionId, b: DimensionId, min: number, floorA: number): { spec: ConditionSpec; cond: Cond } {
  const cond: Cond = (p) => rawOf(p, a) - rawOf(p, b) >= min && rawOf(p, a) >= floorA;
  return { spec: { dim: a, other: b, band: 'gap', min, cond }, cond };
}

/** Raw floor condition: the dimension must reach `min` (a conjunctive gate without a tier claim). */
function rawCond(d: DimensionId, min: number): { spec: ConditionSpec; cond: Cond } {
  const cond: Cond = (p) => rawOf(p, d) >= min;
  return { spec: { dim: d, band: 'rawmin', min, cond }, cond };
}

/** Which boundary a condition crossed, for confidence margin. */
type Band = 'high' | 'lowish' | 'midPlus' | 'gap' | 'rawmin';
const BOUNDARY: Record<Exclude<Band, 'gap' | 'rawmin'>, number> = { high: 62, lowish: 48, midPlus: 48 };

interface ConditionSpec {
  dim: DimensionId;
  band: Band;
  cond: Cond;
  /** For 'gap': the other dimension the distance is measured to. */
  other?: DimensionId;
  /** For 'gap': the minimum lead. For 'rawmin': the minimum raw score. */
  min?: number;
}

export type PatternMode = 'augment' | 'reinterpret' | 'tension' | 'synthesis';

export interface DerivedPattern {
  id: string;
  dims: DimensionId[];
  conditions: ConditionSpec[];
  when: Cond;
  mode: PatternMode;
  /** Selection weight — the interaction analysis' "which interactions matter most". */
  priority: number;
  /** Short frame line: the pattern in one sentence (bolded lead in crosscurrents). */
  frame: string;
  /** The interpretation itself; every variant must stand alone. */
  narrative: string[];
  /** Where section-mode patterns render. Synthesis patterns render in Crosscurrents. */
  placement?: { section: string; after: DimensionId };
  /** When this pattern is eligible, the named coarser (tier-level) pattern is dropped. */
  supersedes?: string;
}

export interface PatternHit {
  pattern: DerivedPattern;
  /** 0–1; the engine only surfaces >= 0.55 and renders hedges below 0.72. */
  confidence: number;
  /** True when a dimension sits right on a tier boundary — wording hedges accordingly. */
  soft: boolean;
}

/**
 * The pattern library. Grounding for each entry lives in the interaction analysis it
 * came from: interaction effects between questionnaire scales carry more
 * information than either scale alone; contrasts and gaps are where the
 * reading stops being generic. Polarity of every dimension was verified
 * against the instrument's own tier notes before conditions were written.
 */
export const PATTERNS: DerivedPattern[] = [
  // ── Synthesis patterns (headline: rendered in the Crosscurrents section) ──

  {
    id: 'space_and_certainty',
    dims: ['autonomy_connection', 'reassurance_security'],
    conditions: [
      { dim: 'autonomy_connection', band: 'high', cond: high('autonomy_connection') },
      { dim: 'reassurance_security', band: 'high', cond: high('reassurance_security') },
    ],
    when: both(high('autonomy_connection'), high('reassurance_security')),
    mode: 'synthesis',
    priority: 95,
    frame: 'Space and certainty are different things for you.',
    narrative: [
      'Your answers hold two things side by side that are often mistaken for a contradiction: real comfort with a partner having their own life, and a real sensitivity to not knowing what that life means while it happens. Distance itself appears to be affordable to you. It is the unexplained part that costs — the shift you can see but cannot read. This is not the pattern of someone who needs constant company; it is the pattern of someone who needs enough information to know what reality they are standing in. A partner who narrates their distance ("work is eating me, it is not you") buys enormous steadiness cheaply.',
    ],
  },
  {
    id: 'noticed_not_managing',
    dims: ['care_initiation', 'reassurance_security', 'direct_communication'],
    conditions: [
      { dim: 'care_initiation', band: 'midPlus', cond: midPlus('care_initiation') },
      { dim: 'reassurance_security', band: 'midPlus', cond: midPlus('reassurance_security') },
      { dim: 'direct_communication', band: 'midPlus', cond: midPlus('direct_communication') },
    ],
    when: all(midPlus('care_initiation'), midPlus('reassurance_security'), midPlus('direct_communication')),
    mode: 'synthesis',
    priority: 86,
    frame: 'The want underneath: to be noticed without being managed.',
    narrative: [
      'Three scores point at the same appetite from different directions. You can say what you need — you believe asking is how love stays honest. You also know people are not mind-readers, and you mean it. And yet the care that lands hardest in your answers is the kind that arrived before the asking. That is not a demand for telepathy. It is a demand for attentiveness: "tell me what you need" is the requirement, "I noticed before you had to" is the reward. The practical translation: a partner who asks is doing it right, and a partner who occasionally notices first is doing something extra — and you will feel the difference even if you never name it.',
    ],
  },
  {
    id: 'team_of_two',
    dims: ['autonomy_connection', 'same_side_problems'],
    conditions: [
      { dim: 'autonomy_connection', band: 'high', cond: high('autonomy_connection') },
      { dim: 'same_side_problems', band: 'high', cond: high('same_side_problems') },
    ],
    when: both(high('autonomy_connection'), high('same_side_problems')),
    mode: 'synthesis',
    priority: 84,
    frame: 'Own orbits, one shared gravity.',
    narrative: [
      'You want considerable space for your own life, and you want problems faced as a team rather than assigned to a person. Those are not in tension — together they describe a specific architecture: two whole people who deliberately operate as one unit when it matters. Your partner can have their own weekend, their own crisis, their own ambitions, without the relationship reading it as rejection. But when something genuinely touches the shared life, you want the two of you on the same side of it. The failure mode to watch is not the independence — it is the drift where separate lives stop reporting to each other.',
    ],
  },
  {
    id: 'shared_reality',
    dims: ['direct_communication', 'perspective_taking'],
    conditions: [
      { dim: 'direct_communication', band: 'midPlus', cond: midPlus('direct_communication') },
      { dim: 'perspective_taking', band: 'midPlus', cond: midPlus('perspective_taking') },
    ],
    when: both(midPlus('direct_communication'), midPlus('perspective_taking')),
    mode: 'synthesis',
    priority: 82,
    frame: 'Honesty as shared reality, not as weapon or ritual.',
    narrative: [
      'Your directness and your benefit-of-the-doubt belong to the same project: keeping the two of you standing in the same reality. You say the true thing while it is small, and you give other people room to explain themselves before you conclude — which means information stays flowing in both directions. In your model, honesty is not bluntness and charity is not denial; they are two halves of not-making-each-other-guess. The tell that this is load-bearing for you: concealment bothers you more than disagreement. A partner can fight with you and be fine; a partner who curates what you know is harder to forgive.',
    ],
  },
  {
    id: 'separate_worlds_curious',
    dims: ['autonomy_connection', 'curiosity_worlds'],
    conditions: [
      { dim: 'autonomy_connection', band: 'high', cond: high('autonomy_connection') },
      { dim: 'curiosity_worlds', band: 'high', cond: high('curiosity_worlds') },
    ],
    when: both(high('autonomy_connection'), high('curiosity_worlds')),
    mode: 'synthesis',
    priority: 78,
    frame: 'Compatibility through curiosity, not sameness.',
    narrative: [
      'You do not appear to want the same life as your person — you want to be interested in each other\'s lives. Wide personal space on one side, genuine appetite for their inner world on the other: the combination reads less like "couple" and more like two people who keep choosing to visit each other. This is a different compatibility model from shared-everything, and it fails differently: not from merging, but from drifting into polite strangers who no longer tour each other\'s worlds. The maintenance is small and specific — keep being invited in, keep inviting.',
    ],
  },

  // ── Reinterpret patterns (change what a dimension paragraph means) ──

  {
    id: 'interpreting_room',
    dims: ['perspective_taking', 'reassurance_security'],
    conditions: [
      { dim: 'perspective_taking', band: 'high', cond: high('perspective_taking') },
      { dim: 'reassurance_security', band: 'high', cond: high('reassurance_security') },
    ],
    when: both(high('perspective_taking'), high('reassurance_security')),
    mode: 'reinterpret',
    priority: 90,
    frame: 'You give interpretive room easily; patience for not-knowing is thinner.',
    narrative: [
      'But patience for interpreting people is not the same as comfort with not-knowing. What you are generous with is interpretation; what you find hard is the interval where there is nothing yet to interpret. Space with a story attached is fine. Silence with no story is where your imagination starts filling the blank. The distinction matters, because the fix is not reassurance — it is information, delivered before you have to ask.',
    ],
    placement: { section: 'understanding', after: 'perspective_taking' },
  },
  {
    id: 'witness_and_carry',
    dims: ['listening_first', 'shared_home_effort'],
    conditions: [
      { dim: 'listening_first', band: 'high', cond: high('listening_first') },
      { dim: 'shared_home_effort', band: 'midPlus', cond: midPlus('shared_home_effort') },
    ],
    when: both(high('listening_first'), midPlus('shared_home_effort')),
    mode: 'reinterpret',
    priority: 76,
    frame: 'You witness first, then lighten the load — in that order.',
    narrative: [
      'Your support has two stages, and the order is the finding: first you hear the story out, then you take something off the plate. You are not the fixer who interrupts with solutions, and not the pure witness who leaves the burden untouched — the listening is real AND the load gets lighter. For you, support appears to work best in that order: understand what someone is carrying first, then help make the load lighter.',
    ],
    placement: { section: 'understanding', after: 'listening_first' },
  },
  {
    id: 'problem_direct',
    dims: ['direct_communication', 'vulnerability_safety'],
    conditions: [
      { dim: 'direct_communication', band: 'midPlus', cond: midPlus('direct_communication') },
      { dim: 'vulnerability_safety', band: 'lowish', cond: lowish('vulnerability_safety') },
    ],
    when: both(midPlus('direct_communication'), lowish('vulnerability_safety')),
    mode: 'reinterpret',
    priority: 76,
    frame: 'Direct about problems; less direct about exposure.',
    narrative: [
      'Your directness has a shape worth naming precisely. Problems, logistics, dissatisfaction — you will say those plainly, and sooner than most. What costs more is the sentence that exposes you: the "I was hurt because I wanted to matter to you" kind. So the useful dimension is not direct versus indirect — it is problem-directness versus vulnerability-directness, and yours are not the same size. A partner should know the plain feedback is safe to receive; the quieter work is making it safe for you to be the one exposed.',
    ],
    placement: { section: 'communication', after: 'direct_communication' },
  },
  {
    id: 'open_inside_sealed_out',
    dims: ['vulnerability_safety', 'relational_privacy'],
    conditions: [
      { dim: 'vulnerability_safety', band: 'high', cond: high('vulnerability_safety') },
      { dim: 'relational_privacy', band: 'high', cond: high('relational_privacy') },
    ],
    when: both(high('vulnerability_safety'), high('relational_privacy')),
    mode: 'reinterpret',
    priority: 78,
    frame: 'Sealed from the world, wide open inside it.',
    narrative: [
      'Your openness and your privacy are not opposites — they are the same boundary drawn correctly. Inside the two-person room you are unusually willing to be seen; outside it, the relationship\'s contents are not public property. The failure mode is only one: when the person inside the room stops knowing they are the only one in it. As long as that is clear, this is one of the more protective architectures a relationship can have.',
    ],
    placement: { section: 'safety', after: 'vulnerability_safety' },
  },
  {
    id: 'touch_as_weather',
    dims: ['affection_daily', 'sexual_communication'],
    conditions: [
      { dim: 'affection_daily', band: 'high', cond: high('affection_daily') },
      { dim: 'sexual_communication', band: 'lowish', cond: lowish('sexual_communication') },
    ],
    when: both(high('affection_daily'), lowish('sexual_communication')),
    mode: 'reinterpret',
    priority: 82,
    frame: 'Ambient affection is fluent; the explicit conversation stays quiet.',
    narrative: [
      'Your touch runs as ambient weather — constant, unforced, its own language. But the everyday fluency and the explicit fluency are different channels, and your answers say the second one carries less traffic. Lots of physical affection can coexist with a mostly-undrawn map of desire. That is a coherent combination, not a contradiction — but it means a partner may assume the touch is the whole conversation. Worth telling them it is the greeting, not the agenda.',
    ],
    placement: { section: 'closeness', after: 'affection_daily' },
  },
  {
    id: 'competent_and_carried',
    dims: ['shared_home_effort', 'care_initiation'],
    conditions: [
      { dim: 'shared_home_effort', band: 'high', cond: high('shared_home_effort') },
      { dim: 'care_initiation', band: 'high', cond: high('care_initiation') },
    ],
    when: both(high('shared_home_effort'), high('care_initiation')),
    mode: 'reinterpret',
    priority: 92,
    frame: 'The invisible load and the want to be seen carrying it are the same subject.',
    narrative: [
      'Two strong scores point at one quiet risk. You notice what needs doing, and you do it — much of it before anyone knows it was done. That competence is a gift, but it has a known cost: work that goes unseen reads, to the person doing it, as work that does not count. People who carry this way usually also want the carrying to be seen — worth checking whether that is true of you. If it is, the warning is not "carry less": self-sufficiency can mute the very recognition you want. "I\'ve got this" is true, and it can still cost you the acknowledgment that would make the having-it worth more.',
    ],
    placement: { section: 'hard_days', after: 'shared_home_effort' },
  },

  {
    id: 'independent_but_connected',
    dims: ['autonomy_connection', 'affection_daily'],
    conditions: [
      { dim: 'autonomy_connection', band: 'high', cond: high('autonomy_connection') },
      { dim: 'affection_daily', band: 'high', cond: high('affection_daily') },
    ],
    when: both(high('autonomy_connection'), high('affection_daily')),
    mode: 'synthesis',
    priority: 84,
    frame: "Independence here doesn't mean distance — the touch points the other way.",
    narrative: [
      "Read together, your independence and your affection change each other's meaning: you want wide personal space AND frequent physical closeness, which means the independence was never a request for distance. The combination works when closeness is dense in the time you are together rather than constant across the week — separate orbits, high contact. The risk is only when a partner reads your space as cooling; your touch says otherwise, and it is worth saying out loud that both are true at once.",
    ],
    placement: { section: 'independence', after: 'autonomy_connection' },
  },
  {
    id: 'understanding_over_wanting',
    dims: ['desire', 'listening_first'],
    conditions: [
      { dim: 'desire', band: 'midPlus', cond: midPlus('desire') },
      // The mechanism is a REAL ranking, not two high scores: understanding
      // must actually lead wanting in the raw scores (the q18-style forced
      // choice drags desire down inside its own number).
      gapCond('listening_first', 'desire', 1, 55).spec,
    ],
    when: (p) => midPlus('desire')(p) && gapCond('listening_first', 'desire', 1, 55).cond(p),
    mode: 'augment',
    priority: 82,
    frame: 'Wanting matters to you — but forced to choose, you kept being understood.',
    narrative: [
      'One forced choice in your answers settles the hierarchy: offered understanding or being deeply wanted, you kept being understood — even though wanting to be wanted runs hot in everything else you chose. That ordering matters. Physical affection and desire are your ambient languages, but the definition of being known, for you, is someone who gets how your mind works. A relationship high on touch and low on understanding would starve you differently than the reverse.',
    ],
    placement: { section: 'closeness', after: 'desire' },
  },
  {
    id: 'clarity_over_reassurance',
    dims: ['reassurance_security', 'direct_communication'],
    conditions: [
      { dim: 'reassurance_security', band: 'midPlus', cond: midPlus('reassurance_security') },
      { dim: 'direct_communication', band: 'midPlus', cond: midPlus('direct_communication') },
    ],
    when: both(midPlus('reassurance_security'), midPlus('direct_communication')),
    mode: 'reinterpret',
    priority: 86,
    frame: 'Not more reassurance — better information.',
    narrative: [
      'Your reassurance need is real, and your answers are precise about what would actually meet it: not repeated comforting, but proportionate, reality-based information — "I\'m having a bad day; it isn\'t about you" lands where ten "are we sure?"s would not. You even ask what reassurance looks like for someone rather than guessing, which is exactly the right instinct. And you know the flip side from the inside: a partner who needs constant reassuring would exhaust you — which is why what you want to be met with is information, not volume. Clarity, not more.',
    ],
    placement: { section: 'safety', after: 'reassurance_security' },
  },
  {
    id: 'bedroom_vulnerability_cost',
    dims: ['sexual_communication', 'direct_communication'],
    conditions: [
      { dim: 'sexual_communication', band: 'lowish', cond: lowish('sexual_communication') },
      { dim: 'direct_communication', band: 'midPlus', cond: midPlus('direct_communication') },
    ],
    when: both(lowish('sexual_communication'), midPlus('direct_communication')),
    mode: 'reinterpret',
    priority: 84,
    frame: 'Direct in every other room — which is what makes the quiet here meaningful.',
    narrative: [
      'Your plain speech is structural everywhere else, so the quieter register in this one is not a communication deficit — it is a vulnerability cost specific to desire. The words exist; the risk is what they reveal. That makes this the one channel where a partner\'s patience is worth more than their questions: the map gets drawn when drawing it feels safe, not when it is requested.',
    ],
    placement: { section: 'closeness', after: 'sexual_communication' },
  },

  // ── Tension patterns (name the friction two co-occurring preferences create) ──

  {
    id: 'generous_ledger',
    dims: ['care_initiation', 'scorekeeping'],
    conditions: [
      { dim: 'care_initiation', band: 'midPlus', cond: midPlus('care_initiation') },
      { dim: 'scorekeeping', band: 'lowish', cond: lowish('scorekeeping') },
    ],
    when: both(midPlus('care_initiation'), lowish('scorekeeping')),
    mode: 'tension',
    priority: 88,
    frame: 'You give readily — and your fairness clock runs on weeks, not years.',
    narrative: [
      'You move first for people, and your fairness tracking runs close to the surface: an unreciprocated stretch registers within weeks, not months. That pairing has a real upside — imbalance rarely compounds on you silently, because you surface it while it is still small. The watch-item is how the tracking reads from the outside: a partner on a longer horizon can experience quick noticing as an invoice. Tell them your clock runs on weeks because you would rather name a small thing than bank a resentment — that reframe turns the audit into care.',
    ],
    placement: { section: 'reciprocity', after: 'scorekeeping' },
  },
  {
    id: 'givers_asymmetry',
    dims: ['care_initiation', 'receiving_comfort'],
    conditions: [
      { dim: 'care_initiation', band: 'midPlus', cond: midPlus('care_initiation') },
      { dim: 'receiving_comfort', band: 'lowish', cond: lowish('receiving_comfort') },
    ],
    when: both(midPlus('care_initiation'), lowish('receiving_comfort')),
    mode: 'tension',
    priority: 80,
    frame: 'The giver\'s asymmetry: moving first is easy; letting care land is not.',
    narrative: [
      'You move first for everyone, and wave off the same when it is offered back. The imbalance is not generosity running out — it is the receiving half still practicing. Left alone, this pattern quietly starves the people around you: they cannot feed you, so they learn you do not need feeding, and the relationship tilts. Letting care land is a skill, and it is the one your people are most quietly asking you to learn.',
    ],
    placement: { section: 'reciprocity', after: 'receiving_comfort' },
  },
  {
    id: 'fast_conclusions_anxious',
    dims: ['perspective_taking', 'reassurance_security'],
    conditions: [
      { dim: 'perspective_taking', band: 'lowish', cond: lowish('perspective_taking') },
      { dim: 'reassurance_security', band: 'high', cond: high('reassurance_security') },
    ],
    when: both(lowish('perspective_taking'), high('reassurance_security')),
    mode: 'tension',
    priority: 70,
    frame: 'The conclusion arrives faster than the clarity does.',
    narrative: [
      'Two scores compound in a way worth knowing about. Ambiguity already sits uncomfortably with you — and your interpretation engine moves fast, which means the blank gets filled quickly, and the fill is not always charitable. Unexplained distance tends to become a story before anyone has told you the true one. The lever is small: build the habit of asking one question before believing the first conclusion. Not because the conclusions are always wrong — because they arrive too early to be checked.',
    ],
    placement: { section: 'understanding', after: 'perspective_taking' },
  },
  {
    id: 'repair_the_why',
    dims: ['repair_orientation', 'vulnerability_safety'],
    conditions: [
      { dim: 'repair_orientation', band: 'midPlus', cond: midPlus('repair_orientation') },
      { dim: 'vulnerability_safety', band: 'lowish', cond: lowish('vulnerability_safety') },
    ],
    when: both(midPlus('repair_orientation'), lowish('vulnerability_safety')),
    mode: 'tension',
    priority: 68,
    frame: 'You return quickly — the why sometimes stays home.',
    narrative: [
      'The return is fast: you come back after conflict, reliably, before things set. But your answers hint the return can outrun the accounting — repair covers the distance without always naming the cause. "We\'re okay" is real, and it can also be a door closing gently on a subject that still had weight. The upgrade is not more apology; it is letting one repair include the sentence about what actually happened, even when that sentence exposes you.',
    ],
    placement: { section: 'hard_days', after: 'repair_orientation' },
  },
  {
    id: 'repair_only_giver',
    dims: ['conflict_engagement', 'repair_orientation'],
    conditions: [
      { dim: 'conflict_engagement', band: 'lowish', cond: lowish('conflict_engagement') },
      { dim: 'repair_orientation', band: 'midPlus', cond: midPlus('repair_orientation') },
    ],
    when: both(lowish('conflict_engagement'), midPlus('repair_orientation')),
    mode: 'tension',
    priority: 70,
    frame: 'Storms and returns: you go quiet mid-conflict, and you always come back.',
    narrative: [
      'Mid-argument you go somewhere quieter — heat narrows you, and the disagreement can resolve by forfeit. But you reliably return. Partners learn to read the pattern: the withdrawal is temporary, the return is certain. It is a workable architecture, with one condition — the person waiting has to know it is temporary. Telling them, once, calmly, outside of any argument, is what converts a confusing pattern into a trusted one.',
    ],
    placement: { section: 'hard_days', after: 'conflict_engagement' },
  },
  {
    id: 'listening_without_celebrating',
    dims: ['listening_first', 'capitalization'],
    conditions: [
      { dim: 'listening_first', band: 'midPlus', cond: midPlus('listening_first') },
      { dim: 'capitalization', band: 'lowish', cond: lowish('capitalization') },
    ],
    when: both(midPlus('listening_first'), lowish('capitalization')),
    mode: 'tension',
    priority: 72,
    frame: 'You make real room for what goes wrong — and far less for what goes right.',
    narrative: [
      'There is an asymmetry worth naming: you make real room for the people you love when something goes wrong — and far less when something goes right. Both are attention; only one of them is celebration. People notice this asymmetry faster than you would think: they learn their crises have a landing place and their wins do not. The repair is small and strange: treat good news like distress, as something worth stopping for.',
    ],
    placement: { section: 'understanding', after: 'capitalization' },
  },
  {
    id: 'sealed_ledgers',
    dims: ['scorekeeping', 'money_coordination'],
    conditions: [
      { dim: 'scorekeeping', band: 'lowish', cond: lowish('scorekeeping') },
      { dim: 'money_coordination', band: 'lowish', cond: lowish('money_coordination') },
    ],
    when: both(lowish('scorekeeping'), lowish('money_coordination')),
    mode: 'tension',
    priority: 66,
    frame: 'The audit shows up in two ledgers — care and money.',
    narrative: [
      'The accounting reflex appears in two places at once: reciprocity and spending. When the same auditor wakes in both ledgers, it is rarely about the favor or the purchase — it is about how safe the books themselves feel. Worth asking what would have to be true for the auditing to relax, because the answer is usually about control and predictability, not arithmetic.',
    ],
    placement: { section: 'independence', after: 'money_coordination' },
  },

  // ── Augment patterns (add an observation the dimension paragraphs missed) ──

  {
    id: 'first_telling_intimacy',
    dims: ['capitalization', 'curiosity_worlds'],
    conditions: [
      { dim: 'capitalization', band: 'midPlus', cond: midPlus('capitalization') },
      { dim: 'curiosity_worlds', band: 'midPlus', cond: midPlus('curiosity_worlds') },
    ],
    when: both(midPlus('capitalization'), midPlus('curiosity_worlds')),
    mode: 'augment',
    priority: 74,
    frame: 'Good news has a full room in your answers.',
    narrative: [
      'The compounding effect is worth naming on its own: because your celebrating is also curious, joy told to you tends to grow a second life — the win becomes a conversation, the conversation becomes an invitation, and the person learns their happiness has somewhere to go. That combination could make you someone people naturally want to bring their good news to.',
    ],
    placement: { section: 'understanding', after: 'capitalization' },
  },
  {
    id: 'play_want_loop',
    dims: ['positivity_play', 'desire'],
    conditions: [
      { dim: 'positivity_play', band: 'midPlus', cond: midPlus('positivity_play') },
      { dim: 'desire', band: 'midPlus', cond: midPlus('desire') },
    ],
    when: both(midPlus('positivity_play'), midPlus('desire')),
    mode: 'augment',
    priority: 68,
    frame: 'Play and want feed each other in your answers.',
    narrative: [
      'The couple that laughs together stays charged — lightness keeps attraction unserious enough to be safe, and attraction keeps the playfulness pointed at each other. Your answers suggest you run on that loop naturally. The maintenance implication is pleasant but real: the laughter is not a luxury beside the wanting; it is one of the things feeding it.',
    ],
    placement: { section: 'closeness', after: 'positivity_play' },
  },
  {
    id: 'agency_preserving',
    dims: ['autonomy_connection', 'care_initiation'],
    conditions: [
      { dim: 'autonomy_connection', band: 'high', cond: high('autonomy_connection') },
      { dim: 'care_initiation', band: 'midPlus', cond: midPlus('care_initiation') },
    ],
    when: both(high('autonomy_connection'), midPlus('care_initiation')),
    mode: 'augment',
    priority: 72,
    frame: 'Care that expands your life lands; care that runs it does not.',
    narrative: [
      'You give and receive a lot of anticipatory care, and you also hold real ground for your own life — which together draw a clean line: care that expands the life is welcome; care that quietly takes over its operation is not. Planning done as affection reads as love. Planning done as management reads as removal. Most people never articulate this line even to themselves; having it crisp makes it possible to tell a partner exactly where it runs.',
    ],
    placement: { section: 'independence', after: 'autonomy_connection' },
  },
  {
    id: 'reciprocity_horizon',
    dims: ['scorekeeping', 'care_initiation'],
    conditions: [
      { dim: 'scorekeeping', band: 'midPlus', cond: midPlus('scorekeeping') },
      { dim: 'care_initiation', band: 'midPlus', cond: midPlus('care_initiation') },
    ],
    when: both(midPlus('scorekeeping'), midPlus('care_initiation')),
    mode: 'augment',
    priority: 80,
    frame: 'Your fairness horizon is long — the years balance, not the weeks.',
    narrative: [
      'Your generosity runs on a long ledger: individual gestures are not billed, seasons of imbalance are expected to bend back, and the accounting that matters happens at the scale of years. That is the communal form of fairness — rarer than people claim. Its one failure mode is silent: because every individual imbalance is explainable, a chronic one can normalize before you ever say it. The long horizon still needs an occasional voice — name the pattern when it becomes a season, not a history.',
    ],
    placement: { section: 'reciprocity', after: 'scorekeeping' },
  },
  {
    id: 'competence_transparency',
    dims: ['shared_home_effort', 'care_initiation'],
    conditions: [
      { dim: 'shared_home_effort', band: 'midPlus', cond: midPlus('shared_home_effort') },
      { dim: 'care_initiation', band: 'midPlus', cond: midPlus('care_initiation') },
    ],
    when: both(midPlus('shared_home_effort'), midPlus('care_initiation')),
    mode: 'tension',
    priority: 76,
    frame: 'You bring plans, not problems — which protects them and excludes them at once.',
    narrative: [
      'Your instinct under load is to work it through alone first and arrive with the plan — competence offered as care, sparing them the raw worry. The cost hides inside the kindness: a partner who only ever sees the finished plan cannot participate in the decision, only ratify it. The upgrade is small: bring the fork instead of the conclusion — "here is what I found, here is where I am leaning, where do you see it differently." Letting someone into the unsolved version is its own form of intimacy.',
    ],
    placement: { section: 'hard_days', after: 'shared_home_effort' },
  },
  {
    id: 'privacy_outward_only',
    dims: ['relational_privacy'],
    conditions: [
      { dim: 'relational_privacy', band: 'midPlus', cond: midPlus('relational_privacy') },
    ],
    when: midPlus('relational_privacy'),
    mode: 'augment',
    priority: 72,
    frame: 'Your privacy wall faces outward only.',
    narrative: [
      'The boundary in your answers protects the two-person room from the world — it does not seal the room off from itself. The violation that stings is not a friend hearing too much; it is learning something about your person late, through someone else. Which makes the rule simple to state: a partner telling nobody is not the same as telling you first. Your privacy stance is a claim about audiences, never a license for distance inside.',
    ],
    placement: { section: 'privacy', after: 'relational_privacy' },
  },

  // ── Contrast patterns (raw-score gaps — resolution the tiers cannot see) ──
  // Two mids can sit 30 points apart; a gap that wide is a finding, not noise.
  // Each supersedes its tier-level twin so the two never co-render.

  {
    id: 'givers_gap_raw',
    dims: ['care_initiation', 'receiving_comfort'],
    conditions: [gapCond('care_initiation', 'receiving_comfort', 20, 55).spec],
    when: gapCond('care_initiation', 'receiving_comfort', 20, 55).cond,
    mode: 'tension',
    priority: 88,
    supersedes: 'givers_asymmetry',
    frame: 'The daylight between your giving and your receiving is wide enough to measure.',
    narrative: [
      'The gap is not a mood — it is a measured distance between how far your care runs out and how far it lets itself be run to. You give well past the point where you stop receiving; care offered back has to get past a debt-check your own giving never faces. This is the pattern that quietly exhausts the people who love you: they cannot feed you, so they learn to stop offering. The practice is unglamorous and specific — once a week, let something land without repaying it, and notice what the debt-check actually says.',
    ],
    placement: { section: 'reciprocity', after: 'receiving_comfort' },
  },
  {
    id: 'bedroom_directness_gap',
    dims: ['direct_communication', 'sexual_communication'],
    conditions: [gapCond('direct_communication', 'sexual_communication', 20, 55).spec],
    when: gapCond('direct_communication', 'sexual_communication', 20, 55).cond,
    mode: 'reinterpret',
    priority: 84,
    supersedes: 'bedroom_vulnerability_cost',
    frame: 'Direct in every other room — which is what makes the quiet here meaningful.',
    narrative: [
      'The distance between your plain speech everywhere else and your quieter register here is not a communication deficit — it is a vulnerability cost specific to desire. The words exist; the risk is what they reveal. That makes this the one channel where a partner\'s patience is worth more than their questions: the map gets drawn when drawing it feels safe, not when it is requested.',
    ],
    placement: { section: 'closeness', after: 'sexual_communication' },
  },
  {
    id: 'certainty_gap',
    dims: ['reassurance_security', 'perspective_taking'],
    conditions: [gapCond('reassurance_security', 'perspective_taking', 15, 55).spec],
    when: gapCond('reassurance_security', 'perspective_taking', 15, 55).cond,
    mode: 'tension',
    priority: 70,
    supersedes: 'fast_conclusions_anxious',
    frame: 'The checking runs measurably ahead of the charity.',
    narrative: [
      'Your need for emotional information leads your benefit-of-the-doubt by a real margin — which means when ambiguity hits, the story-arriving machinery gets there before the charitable pass does. Unexplained distance tends to become a conclusion before anyone has told you the true one. The lever is small and repeatable: one question, asked before the first conclusion is believed. Not because the conclusions are always wrong — because they arrive too early to have been checked.',
    ],
    placement: { section: 'understanding', after: 'perspective_taking' },
  },
  {
    id: 'space_over_touch',
    dims: ['autonomy_connection', 'affection_daily'],
    conditions: [gapCond('autonomy_connection', 'affection_daily', 25, 55).spec],
    when: gapCond('autonomy_connection', 'affection_daily', 25, 55).cond,
    mode: 'augment',
    priority: 66,
    frame: 'Space leads touch by a wide margin in your answers.',
    narrative: [
      'The distance between how much room you need and how much ambient contact you want is wide — your architecture leans deliberately toward the spacious end: closeness at chosen temperatures, contact that arrives as event rather than weather. None of that is coldness; the measurement gives the priority order, not the absence of warmth. Worth saying plainly to a high-touch partner: your quiet is design, not withdrawal.',
    ],
    placement: { section: 'independence', after: 'autonomy_connection' },
  },
  {
    id: 'touch_over_space',
    dims: ['affection_daily', 'autonomy_connection'],
    conditions: [gapCond('affection_daily', 'autonomy_connection', 25, 55).spec],
    when: gapCond('affection_daily', 'autonomy_connection', 25, 55).cond,
    mode: 'augment',
    priority: 66,
    frame: 'Touch leads space by a wide margin in your answers.',
    narrative: [
      'The distance between how much ambient contact you want and how much room you need is wide — your architecture leans toward the dense end: frequent touch, low distance, closeness as the background state rather than a scheduled event. Worth saying plainly to a space-heavy partner: your reach is design, not neediness — and their separation is likely design too, not cooling.',
    ],
    placement: { section: 'closeness', after: 'affection_daily' },
  },
  {
    id: 'carry_into_money',
    dims: ['commitment_sacrifice', 'money_coordination'],
    conditions: [rawCond('commitment_sacrifice', 65).spec, rawCond('money_coordination', 60).spec],
    when: (p) => rawOf(p, 'commitment_sacrifice') >= 65 && rawOf(p, 'money_coordination') >= 60,
    mode: 'augment',
    priority: 78,
    frame: 'The way you back people extends to the ledger the two of you share.',
    narrative: [
      'Two scores read together: the way you back people and the way shared money runs both come from the same trust. The willingness to carry is not rhetorical — it extends to the shared ledger, and that is the pairing that makes big joint gambles survivable. The watch-item is the reverse door: make sure the same lack of arithmetic applies to what a partner wants to carry for you.',
    ],
    placement: { section: 'independence', after: 'commitment_sacrifice' },
  },

  // ── Latent constructs (cross-reading against the founding values document, third pass) ──
  // Two needs the instrument measures only indirectly. They are authored as
  // conditional patterns — constructs that EMERGE from measured dimensions in
  // combination — not as new scored questions, because forcing a question
  // would ask the reader to self-report a need they may not have words for.
  // The blueprint-vs-me reading identified both as real, nameable, and absent
  // from the tier paragraphs.

  {
    // compliments-as-identity: receiving_comfort measures whether care LANDS;
    // it cannot see that one register of it (verbal appreciation) is an
    // identity need rather than a taste. The combination that exposes it is a
    // wide-open receiver (high receiving, low ledger — no deflection, no
    // debt-check) who still runs an appetite the scores never bill. Anchored
    // after receiving_comfort, where the "care lands in whatever register"
    // claim is made — this paragraph is the counterweight it needs.
    id: 'appreciation_as_identity',
    dims: ['receiving_comfort', 'scorekeeping', 'care_initiation'],
    conditions: [
      gapCond('receiving_comfort', 'scorekeeping', 12, 55).spec,
      rawCond('receiving_comfort', 65).spec,
      rawCond('care_initiation', 55).spec,
    ],
    when: (p) =>
      rawOf(p, 'receiving_comfort') - rawOf(p, 'scorekeeping') >= 12 &&
      rawOf(p, 'receiving_comfort') >= 65 &&
      rawOf(p, 'care_initiation') >= 55,
    mode: 'tension',
    priority: 78,
    frame: 'Verbal appreciation is not a preference for you — it is identifying.',
    narrative: [
      'There is a specific hunger the receiving scores cannot see, because it is not about volume: praise lands somewhere deeper in you than merely pleasant. A compliment is not just a nice moment — it is someone saying they see who you actually are, and its absence can read the way being misread does. This coexists happily with a wide receiving dictionary: the care lands in every register, and the words still matter on their own channel. Most people can run months on scarcity of this; the ones for whom appreciation is identity cannot, and they rarely announce it. The practical upshot is small and load-bearing: telling you what someone admires about you is not a courtesy you enjoy — it is maintenance you need, and going long without it will not show up as missing it. It will show up as something quieter.',
    ],
    placement: { section: 'reciprocity', after: 'receiving_comfort' },
  },
  {
    // the 20% pact: same_side_problems covers the crisis reflex (us-versus-it)
    // and commitment covers wholehearted carrying, but the DELIBERATE MUTUAL
    // DOWNSHIFT — both people agreeing today is an easy day — is its own skill
    // that only exists when the team frame is unquestioned AND the giving
    // behind it is unpriced. Anchored after same_side_problems, whose extreme
    // band ends on conflict shape-shifting; this extends the same structure
    // to depletion days, which the tier paragraph never reaches.
    id: 'mutual_downshift',
    dims: ['same_side_problems', 'commitment_sacrifice'],
    conditions: [rawCond('same_side_problems', 62).spec, rawCond('commitment_sacrifice', 60).spec],
    when: (p) => rawOf(p, 'same_side_problems') >= 62 && rawOf(p, 'commitment_sacrifice') >= 60,
    mode: 'augment',
    priority: 82,
    frame: 'You have a gear most couples never name: both engines down at once.',
    narrative: [
      'One skill your answers circle without quite naming: on the days both of you are depleted, the right move reads to you as a deliberate mutual downshift — not one person carrying at twenty percent while the other runs at full, but both engines consciously cut to match, the shared life idling in low gear without either of you filing it as failure. That is rarer than the crisis reflex, because it asks something harder than teamwork: agreeing together that today is an easy day, on purpose, with nobody owing anybody. Your same-side instinct supplies the we; the way you back people supplies the absence of arithmetic. What is left is only to say it out loud on the day — "we are both at twenty today; let\'s make it easy" — because the pact only works when both people know it is one.',
    ],
    placement: { section: 'hard_days', after: 'same_side_problems' },
  },

  // Section placements whose FRAME overlaps a section headline or whose tier
  // paragraph already carries the finding — see filterSectionHits.
];

/**
 * Frame lines that would duplicate a section's adaptive heading or a directly
 * adjacent tier paragraph's opening — never render these INLINE (headlines are
 * fine; the repetition only reads when the same section shows both).
 */
const FRAME_SUPPRESSED_INLINE = new Set<string>([
  // (empty since independent_but_connected became synthesis — it headlines
  // Crosscurrents now, where frame-echo of a section heading doesn't apply)
]);

/**
 * Tier paragraphs that already say what a pattern would say — keyed by pattern
 * id. When this dimension's tier paragraph is its HIGH-band variant (checked by
 * the caller via the dimension's raw score), the inline render is suppressed.
 * The interaction analysis' rule: never tell the reader the same finding twice within
 * one screen of prose.
 */
const HIGH_TIER_COVERED = new Set([
  'competent_and_carried', // shared_home_effort vhigh paragraph already names invisible-noticing risk
]);

/**
 * Opening phrases a pattern must not repeat within one section — the tier
 * paragraphs' signature openers. A pattern paragraph starting with the same
 * move reads as a stutter.
 */
const PHRASE_ECHOES: { phrase: string; owner: DimensionId }[] = [
  { phrase: 'You stop what you\'re doing', owner: 'capitalization' },
  { phrase: 'You stop, you turn around', owner: 'capitalization' },
  { phrase: 'You interpret slowly', owner: 'perspective_taking' },
  { phrase: 'You let care land', owner: 'receiving_comfort' },
  { phrase: 'Touch runs through nearly every scenario', owner: 'affection_daily' },
];

/**
 * The pattern engine, part 2: dedup. Patterns covering the same tension as an
 * existing interplay passage never render alongside it; inline frames that
 * duplicate a section heading or a tier paragraph's opener are dropped.
 * (Headline rendering is exempt — Crosscurrents is a different reading
 * context, and its frame lines were written to stand alone.)
 */
export function filterSectionHits(hits: PatternHit[], p: ScoredProfile): PatternHit[] {
  // Only interplay passages that would actually FIRE on this profile own
  // their combination — a low-condition key (':1-') that cannot fire while
  // the pattern's own condition holds must not suppress it.
  const interplayPresent = new Set<string>();
  for (const d of DIMENSIONS) {
    for (const key of Object.keys(d.interplay ?? {})) {
      const idx = key.lastIndexOf(':');
      const other = key.slice(0, idx) as DimensionId;
      const spec = key.slice(idx + 1);
      const dir = spec.endsWith('-') ? -1 : 1;
      const n = Number(spec.replace(/[+-]$/, ''));
      const ds = p.dimensions[other];
      if (!ds || ds.unmeasured) continue;
      const t = TIERS.indexOf(tierOf(ds.score));
      if (dir === -1 ? t <= n : t >= n) interplayPresent.add(d.id + '>' + other);
    }
  }
  const out: PatternHit[] = [];
  const seenFrames = new Set<string>();
  for (const h of hits) {
    const pl = h.pattern.placement;
    if (!pl) continue;
    // Does an interplay passage on this dimension condition on the pattern's
    // other dimension? Then the interplay owns the combination.
    if (interplayPresent.has(pl.after + '>' + h.pattern.dims.find((d) => d !== pl.after))) continue;
    if (FRAME_SUPPRESSED_INLINE.has(h.pattern.frame)) continue;
    if (HIGH_TIER_COVERED.has(h.pattern.id)) {
      const s = p.dimensions[pl.after]?.score;
      if (s !== undefined && tierOf(s) === 'vhigh') continue;
    }
    const echoOwner = PHRASE_ECHOES.find((e) => h.pattern.narrative[0]?.startsWith(e.phrase));
    if (echoOwner && echoOwner.owner === pl.after) continue;
    if (seenFrames.has(h.pattern.frame)) continue;
    seenFrames.add(h.pattern.frame);
    out.push(h);
  }
  return out;
}

// ── Confidence ──

/**
 * Margin of a raw score past the boundary its condition crossed. Tier alone
 * would make 62 and 89 equivalent; the raw distance separates "barely high"
 * from "strongly high" without exposing new categories to the reader.
 */
export function marginFor(p: ScoredProfile, spec: ConditionSpec): number {
  const s = p.dimensions[spec.dim]?.score;
  if (s === undefined) return 0;
  if (spec.band === 'gap') {
    const o = spec.other ? p.dimensions[spec.other]?.score : undefined;
    if (o === undefined) return 0;
    return Math.abs(s - o) - (spec.min ?? 0);
  }
  if (spec.band === 'rawmin') return s - (spec.min ?? 0);
  const b = BOUNDARY[spec.band];
  return spec.band === 'lowish' ? b - s : s - b;
}

const NEAR_LINE_POINTS = 3; // within this margin of a boundary, wording hedges

function confidenceFor(p: ScoredProfile, pat: DerivedPattern): { confidence: number; soft: boolean } {
  let min = Infinity;
  let soft = false;
  for (const c of pat.conditions) {
    const m = marginFor(p, c);
    if (m < min) min = m;
    if (m <= NEAR_LINE_POINTS) soft = true;
  }
  let conf = min >= 7 ? 0.92 : min >= 4 ? 0.85 : min >= 2 ? 0.78 : 0.68;
  if (soft) conf = Math.min(conf, 0.72);
  // Partial runs squeeze every derived claim: fewer answers, thinner margins.
  if (p.answered < 60) conf -= 0.12;
  else if (p.answered < 80) conf -= 0.06;
  return { confidence: Math.round(conf * 100) / 100, soft };
}

/** One unmeasured input makes the whole derivation a guess — drop it, honestly. */
export function evaluatePatterns(p: ScoredProfile): PatternHit[] {
  const hits: PatternHit[] = [];
  for (const pat of PATTERNS) {
    if (pat.dims.some((d) => p.dimensions[d]?.unmeasured)) continue;
    if (!pat.when(p)) continue;
    const { confidence, soft } = confidenceFor(p, pat);
    if (confidence < 0.55) continue;
    hits.push({ pattern: pat, confidence, soft });
  }
  return hits;
}

// ── Selection ──
// Eligible hits are ranked by confidence, then priority. Headline (synthesis)
// patterns take the top three; section patterns fill their placements under
// per-spot and per-section caps so no reading ever becomes a paragraph dump.

export interface PatternPlan {
  headline: PatternHit[];
  /** Key `${sectionId}:${dimId}` → hits in rank order. */
  sections: Map<string, PatternHit[]>;
}

const HEADLINE_MAX = 3;
const PER_SPOT_MAX = 2;
const PER_SECTION_TENSION_MAX = 2;
const PER_SECTION_AUGMENT_MAX = 2;
/** Below this many answers, synthesis claims stay out of the headline entirely. */
const HEADLINE_MIN_ANSWERED = 60;

function rank(hits: PatternHit[]): PatternHit[] {
  // Priority first: the authored importance of the interaction decides what
  // the reader sees. Confidence is the EVIDENCE bar (gate + soft hedge), not
  // the ranking key — ranking by it starves important-but-nuanced patterns
  // whenever several qualify in one section.
  return [...hits].sort(
    (a, b) => b.pattern.priority - a.pattern.priority || b.confidence - a.confidence,
  );
}

export function buildPatternPlan(p: ScoredProfile): PatternPlan {
  // A raw-resolution pattern replaces its coarser tier-level twin entirely —
  // never co-render (one reading per tension).
  const superseded = new Set(
    evaluatePatterns(p).map((h) => h.pattern.supersedes).filter(Boolean) as string[],
  );
  const eligible = rank(evaluatePatterns(p).filter((h) => !superseded.has(h.pattern.id)));

  const headline: PatternHit[] = [];
  const sectionHits: PatternHit[] = [];
  for (const h of eligible) {
    if (h.pattern.mode === 'synthesis') {
      if (p.answered >= HEADLINE_MIN_ANSWERED && headline.length < HEADLINE_MAX) headline.push(h);
      continue;
    }
    sectionHits.push(h);
  }

  // Dedup pass: drop inline hits whose finding an interplay passage already
  // owns, whose frame echoes a section heading, or whose opener stutters on
  // the tier paragraph it would follow.
  const deduped = filterSectionHits(sectionHits, p);

  const sections = new Map<string, PatternHit[]>();
  const sectionTotals = new Map<string, { tension: number; augment: number }>();
  const spotTotals = new Map<string, number>();
  for (const h of deduped) {
    const pl = h.pattern.placement;
    if (!pl) continue;
    const spotKey = `${pl.section}:${pl.after}`;
    const spot = spotTotals.get(spotKey) ?? 0;
    if (spot >= PER_SPOT_MAX) continue;
    const totals = sectionTotals.get(pl.section) ?? { tension: 0, augment: 0 };
    if (h.pattern.mode === 'tension' && totals.tension >= PER_SECTION_TENSION_MAX) continue;
    if (h.pattern.mode === 'augment' && totals.augment >= PER_SECTION_AUGMENT_MAX) continue;
    spotTotals.set(spotKey, spot + 1);
    if (h.pattern.mode === 'tension') totals.tension += 1;
    if (h.pattern.mode === 'augment') totals.augment += 1;
    sectionTotals.set(pl.section, totals);
    const arr = sections.get(spotKey) ?? [];
    arr.push(h);
    sections.set(spotKey, arr);
  }

  return { headline, sections };
}

/** Render one hit as blueprint paragraphs. Soft hits get hedged lead-ins. */
export function renderPattern(hit: PatternHit, context: 'headline' | 'section'): string[] {
  const { pattern: pat, soft } = hit;
  if (context === 'headline') {
    const lead = soft ? 'This reads as a lean, not a verdict — ' : '';
    return [`**${pat.frame}** ${lead}${pat.narrative.join(' ')}`];
  }
  if (soft) return [`Hold this one lightly — it is a lean, not a verdict. ${pat.narrative[0]}`, ...pat.narrative.slice(1)];
  return [...pat.narrative];
}
