import type { Blueprint, BlueprintSection, ConsistencyPair, DimensionId, ScoredProfile } from './types';
import { DIMENSION_LABELS } from './types';
import { DIMENSIONS, TIERS, TIER_BOUNDS, TIER_LABELS, tierOf, TIER_VARIANTS, VARIANCE_LIBRARY, genericVarianceFor } from './dimensions';
import { seededPick, hash, CHANNEL_LABELS } from './scoring';
import { buildPatternPlan, renderPattern, PATTERNS } from './patterns';

/**
 * Evidence-distance calibration (calibration review §2): the farther an
 * interpretation travels from the answers, the softer its language must be.
 * Absolutes that claim outcomes, rarity, or other people's inner states get
 * rewritten to the reasonable-synthesis register — mechanistically, at render
 * time, so every current and future prose author is covered by the rule.
 */
const CALIBRATION_REWRITES: [RegExp, string][] = [
  [/Arguments with you end without casualties/g, 'Disagreement does not have to become relational damage in your style'],
  [/is among the rarest of everyday gifts/g, 'is a real everyday gift'],
  [/conflict researchers would design on purpose/g, 'the combination conflict research keeps pointing toward'],
  [/safer with you than with almost anyone else/g, 'unlikely to have that vulnerability turned against them'],
  [/usually need both, in exactly that sequence, and rarely get them from the same person/g, 'usually work best in that order — understanding first, then the load'],
  [/keep bringing you their good news first/g, 'could make you someone people naturally bring good news to'],
  [/likely feel safe being complicated around you/g, 'can likely be complicated around you without bracing'],
];

function calibrate(text: string): string {
  let out = text;
  for (const [re, to] of CALIBRATION_REWRITES) out = out.replace(re, to);
  return out;
}

/**
 * Opener de-templating (calibration review §6): the 24 tier modifiers all open
 * "At this intensity," (vlow: "Here,") and the interplay passages all open
 * "Read against your…" — correct machinery, but repeated across a whole
 * document it reads as algorithmic. These rewriters swap in seeded equivalent
 * lead-ins at render time. Deterministic: the same profile always renders the
 * same variants. The grammar of each replacement preserves the original claim.
 */
const INTENSITY_LEADS = ['At this intensity,', 'This far up the scale,', 'In its strongest form,', 'At the top of your range,', 'At full strength,'];
const HERE_LEADS = ['Here,', 'At this end of the scale,', 'Down at this end,', 'In its quietest form,'];
const INTERPLAY_LEADS = ['Read against', 'Paired with', 'Set beside', 'Read together with', 'Next to'];

function varyTierOpener(text: string, seed: number): string {
  const pick = (arr: string[]) => arr[Math.floor(Math.abs(Math.sin(seed) * 10000)) % arr.length];
  let out = text;
  // Tier modifiers are APPENDED after the base paragraph, so the lead phrase
  // usually sits mid-string after a sentence break ("…baseline. At this
  // intensity, …"). Replace at the sentence seam; every lead keeps the
  // original's comma, so the continuation text is untouched.
  if (out.includes('. At this intensity,')) out = out.replace('. At this intensity,', '. ' + pick(INTENSITY_LEADS));
  if (out.includes('. Here,')) out = out.replace('. Here,', '. ' + pick(HERE_LEADS));
  // Paragraph-initial forms (belt and braces — correct comma handling).
  if (out.startsWith('At this intensity, ')) out = pick(INTENSITY_LEADS) + out.slice('At this intensity,'.length);
  if (out.startsWith('Here, ')) out = pick(HERE_LEADS) + out.slice('Here,'.length);
  return out;
}

function varyInterplayOpener(text: string, seed: number): string {
  text = calibrate(text);
  const m = text.match(/^Read against your (high|low) ([^:]+): /);
  if (!m) return text;
  const pick = (arr: string[]) => arr[Math.floor(Math.abs(Math.sin(seed) * 10000)) % arr.length];
  return `${pick(INTERPLAY_LEADS)} your ${m[1]} ${m[2]}: ` + text.slice(m[0].length);
}

/** Narrative paragraph for one dimension at one score, 7-tier resolution. */
function paragraphFor(dim: DimensionId, score: number, runSeed: number): string {
  const def = DIMENSIONS.find((d) => d.id === dim);
  if (!def) return '';
  const tier = tierOf(score);
  let pool: string[] = def[tier];
  // Alternate band prose: the legacy mhigh and high tiers share one base
  // paragraph, so two profiles at the same band rendered identical text.
  // The variant is chosen by POSITION WITHIN THE BAND, and position decides
  // outright: the lower half (a fresh arrival) reads the alternate, which is
  // written as a flat-band claim; the upper half (approaching the next tier)
  // reads the base, which carries the intensity suffix. Two profiles in
  // different halves always diverge; profiles in the same half share the
  // paragraph body (honest convergence) with run-seeded opener rotation.
  if (tier === 'mhigh' || tier === 'high') {
    const alt = TIER_VARIANTS[dim]?.[tier] ?? TIER_VARIANTS[dim]?.mhigh;
    if (alt) {
      // Band range straight from the tier table. A tier spans
      // [TIER_BOUNDS[ti-1], TIER_BOUNDS[ti]) — TIER_BOUNDS[ti] is its UPPER
      // edge (off-by-one here silently widened every band and pushed
      // upper-half scores into the alternate).
      const ti = TIERS.indexOf(tier);
      const lo = ti > 0 ? (TIER_BOUNDS[ti - 1] ?? 0) : 0;
      const hi = TIER_BOUNDS[ti] ?? 100;
      const upperHalf = score >= lo + (hi - lo) / 2;
      if (!upperHalf) pool = [alt];
    }
  }
  // Per-run rotation: the run seed (derived from the answers themselves, so a
  // restored session always regenerates identically) decorates the stable
  // content seed — different runs at the same tier rotate their openers
  // without the text ever being random across regenerations.
  const seed = hash(dim + String(Math.round(score / 7))) + runSeed * 31;
  return calibrate(varyTierOpener(seededPick(pool, seed), seed));
}

/** One-line tier readout (band chart tooltips, review screen). */
function noteFor(dim: DimensionId, score: number): string {
  const def = DIMENSIONS.find((d) => d.id === dim);
  if (!def) return '';
  return def.notes[tierOf(score)];
}

/**
 * The express/receive alignment score measures BREADTH (how similar the spread
 * of your giving and receiving channels is); the tension card keys on the
 * MODAL channels. When the modes differ, the mid-band "mostly consonant"
 * paragraph would contradict the card — replace it with a bridge that holds
 * both facts honestly.
 */
function alignmentParagraphFor(p: ScoredProfile, runSeed: number): string {
  const { express, receive } = p.channels;
  if (express && !receive && (p.receiveBreadth ?? 0) >= 3) {
    const name = (c: string) => CHANNEL_LABELS[c] ?? c;
    return `Your giving runs through one flagship channel — ${name(express)} — while your receiving side reads as a wide dictionary: care lands in whatever register it is offered. That combination is generous in both directions, and it carries one specific risk: a partner may assume your way of giving is also your way of needing, and never discover the breadth on the other side. The bridge is the same as ever — tell them when something lands, in whichever register it arrived.`;
  }
  if (express && receive && express !== receive) {
    const name = (c: string) => CHANNEL_LABELS[c] ?? c;
    return `Your giving and receiving profiles overlap in breadth — you speak and hear several registers of care — but your flagship channels differ: you give most naturally through ${name(express)}, while what lands hardest arrives through ${name(receive)}. Breadth and emphasis are different measurements, and both are real; the single-channel asymmetry is named in the tensions below, because it is the one worth a dictionary exchange.`;
  }
  if (express && !receive) {
    const name = (c: string) => CHANNEL_LABELS[c] ?? c;
    // Receive side gave no modal channel (answers point different ways or go
    // unnamed). The generic tier paragraph would INVENT an offset channel —
    // say the honest thing instead: giving has a flagship, receiving is
    // unmapped in this run.
    return `Your giving runs through one flagship channel — ${name(express)} — but your answers never converged on a single channel for receiving: the receive-side questions point in different directions, so this document will not guess. That is a finding in itself. A partner may assume your way of giving is your way of needing, and the honest answer right now is "unmapped" — watch what actually lands when care arrives, and tell them when it does.`;
  }
  if (!express && receive) {
    const name = (c: string) => CHANNEL_LABELS[c] ?? c;
    return `The care that reaches you comes most clearly through ${name(receive)} — but your giving side never converged on one flagship channel in this run, so this document will not guess at how you most naturally give. The useful move is the same in both directions: notice which register you reach for when someone you love has a rough day, and say it out loud.`;
  }
  const s = p.dimensions.express_receive_alignment?.score;
  return s === undefined ? '' : paragraphFor('express_receive_alignment', s, runSeed);
}

/**
 * Interplay conditioning: for dimension `dim`, walk its interplay keys in
 * order. Key grammar: `Other:N` / `Other:N+` = Other's tier index >= N;
 * `Other:N-` = Other's tier index <= N (a LOW condition — e.g. "read against
 * your low affection score"). Default is `+`. First applicable key wins; at
 * most one passage per dimension keeps sections readable.
 */
function interplayFor(dim: DimensionId, p: ScoredProfile): string | null {
  const def = DIMENSIONS.find((d) => d.id === dim);
  if (!def?.interplay) return null;
  for (const [key, text] of Object.entries(def.interplay)) {
    const idx = key.lastIndexOf(':');
    const other = key.slice(0, idx) as DimensionId;
    const spec = key.slice(idx + 1);
    const dir = spec.endsWith('+') || spec.endsWith('-') ? spec.slice(-1) : '+';
    const tierNum = Number(spec.replace(/[+-]$/, ''));
    if (!(other in p.dimensions)) continue;
    const t = ti(p, other);
    if (dir === '-' ? t <= tierNum : t >= tierNum) return text;
  }
  return null;
}

/**
 * Within-dimension variance note: when a middle-band score was produced by
 * opposing answers canceling, say so — a negotiated middle reads differently
 * from a resting middle. Gated three ways: variance data must exist (share-code
 * profiles carry scores, not reasoning), the tier must be mid/mlow/mhigh
 * (extremes are never averages), and isInternallyDivided must agree the shape
 * is a real tug-of-war, not two mild answers.
 */
function varianceNoteFor(dim: DimensionId, p: ScoredProfile): string | null {
  const v = p.variance?.[dim];
  const d = p.dimensions[dim];
  if (!d || d.unmeasured) return null;
  const t = tierOf(d.score);
  if (t !== 'mid' && t !== 'mlow' && t !== 'mhigh') return null;
  // Gate on the QUANTIZED shape, whichever source it came from: raw
  // contributions (owner) or the reconstructed varianceShape (BP5 share code).
  // Both are rounded to the same lattice, so owner and shared documents gate
  // identically — that is the whole point of the derived-evidence code.
  let count: number, posCount: number, cancellation: number;
  if (v) {
    count = v.contributions.length;
    posCount = v.contributions.filter((c) => c > 0).length;
    cancellation = Math.round(v.cancellation * 200) / 200;
  } else if (d.varianceShape) {
    ({ count, posCount, cancellation } = d.varianceShape);
  } else {
    return null;
  }
  const opposing = count - posCount;
  const divided =
    cancellation >= 0.4 &&
    opposing >= 2 &&
    count >= 5;
  if (!divided) return null;
  return VARIANCE_LIBRARY[dim] ?? genericVarianceFor(dim + String(Math.round(d.score)));
}

/** Tier label for prose contexts (lowercase-first phrasing). */
function tierLabelFor(score: number): string {
  const t = tierOf(score);
  switch (t) {
    case 'vlow': return 'very low';
    case 'low': return 'on the low side';
    case 'mlow': return 'leaning low';
    case 'mid': return 'near the middle';
    case 'mhigh': return 'leaning high';
    case 'high': return 'on the high side';
    case 'vhigh': return 'very high';
  }
}

// Cross-dimension composition moved to patterns.ts: the hand-wired pair
// passages grew into a derived-pattern engine (conditions, confidence gating,
// priority selection) so the document shows the most important interactions
// rather than whichever hardcoded pair happened to match.

/** Tier index helper for heading/interplay conditions (0=vlow … 6=vhigh; 2=mid default when unmeasured). */
const ti = (p: ScoredProfile, id: DimensionId): number => {
  const s = p.dimensions[id]?.score;
  return s === undefined ? 2 : TIERS.indexOf(tierOf(s));
};

interface SectionSpec {
  id: string;
  heading: string;
  /**
   * Condition-keyed heading POOLS — first matching condition wins, then a
   * seeded pick inside that pool; the static heading is the last candidate.
   * Each pool carries several tellings of the same content-aware title, so
   * two profiles with the same shape rarely share every heading.
   */
  headings?: { when: (p: ScoredProfile) => boolean; texts: string[] }[];
  /**
   * Pattern-keyed heading pools — checked BEFORE the tier conditions. `anyOf`
   * lists Crosscurrents (headline) pattern ids; the first entry where any
   * listed pattern actually fired wins. Keyed only on plan.headline, so a
   * title never references a pattern the document didn't show. The keyed
   * pattern's own frame vocabulary is exempt from the echo guard: naming the
   * section after the finding is the point, not a stutter.
   */
  patternHeadings?: { anyOf: string[]; texts: string[] }[];
  dims: DimensionId[];
  /** Opening line woven before the dimension paragraphs. */
  intro?: (p: ScoredProfile) => string;
}

// ── Title echo guard ──
// A heading must not re-say a line the section (or the document) is about to
// say: a title like "Where Good News Gets a Hearing" directly above a pattern
// paragraph that opens "Good news has a full room in your answers…" reads as
// a stutter. Candidates sharing too much vocabulary with what actually
// renders are skipped at pick time — render-time calibration, the same rule
// the prose everywhere else follows. If every candidate collides, the first
// (content-matched) one is used rather than rendering a broken heading.

const TITLE_STOPWORDS = new Set(
  ('the a an of to and in on for with at by is are it its as be or not no nor you your yours they them their ' +
    'we us our ours i me my mine he she his her hers that this these those there here when where what who whom ' +
    'how why than then so but if out up down over under one two').split(' '),
);

function contentWords(s: string): Set<string> {
  const out = new Set<string>();
  for (const w of s.toLowerCase().replace(/[’'"—–-]/g, ' ').replace(/[^a-z ]/g, ' ').split(/\s+/)) {
    if (w.length >= 4 && !TITLE_STOPWORDS.has(w)) out.add(w);
  }
  return out;
}

function titlesCollide(title: string, blockers: Set<string>): boolean {
  const words = [...contentWords(title)];
  let shared = 0;
  for (const w of words) if (blockers.has(w)) shared += 1;
  // Two shared content words always collide; a one-word overlap only counts
  // against one- and two-word titles, where it would dominate the whole line.
  return shared >= 2 || (shared >= 1 && words.length <= 2);
}

function headingBlockers(paragraphs: string[], epigraph: string, frames: string[]): Set<string> {
  const b = new Set<string>();
  for (const src of [...paragraphs, epigraph, ...frames]) {
    for (const w of contentWords(src)) b.add(w);
  }
  return b;
}

/**
 * First non-echoing heading candidate: pattern-keyed pools first (most specific
 * signal — what actually fired in Crosscurrents), then tier pools, then static.
 */
function pickHeading(
  spec: SectionSpec,
  p: ScoredProfile,
  runSeed: number,
  blockers: Set<string>,
  firedHeadline: Set<string>,
  frameById: Map<string, string>,
): string {
  const patternChoice = spec.patternHeadings?.find((h) => h.anyOf.some((id) => firedHeadline.has(id)));
  const pool = patternChoice ?? spec.headings?.find((h) => h.when(p));
  const texts = pool?.texts ?? [];
  const rot = texts.length > 0 ? Math.floor(Math.abs(Math.sin(hash(spec.id + '::heading') + runSeed) * 10000)) % texts.length : 0;
  // The pattern a keyed heading NAMES may share its vocabulary — the title
  // deliberately carries the frame's theme. Every other blocker (tier
  // paragraphs, sibling pattern frames, the epigraph) still applies.
  const guard = new Set(blockers);
  if (patternChoice) {
    for (const id of patternChoice.anyOf) {
      const frame = frameById.get(id);
      if (frame && firedHeadline.has(id)) for (const w of contentWords(frame)) guard.delete(w);
    }
  }
  const candidates = [...texts.slice(rot), ...texts.slice(0, rot), spec.heading];
  for (const c of candidates) if (!titlesCollide(c, guard)) return c;
  return candidates[0];
}

const SECTION_SPECS: SectionSpec[] = [
  {
    id: 'understanding',
    heading: 'Being Understood',
    headings: [
      { when: (p) => ti(p, 'listening_first') >= 5, texts: ['The One They Talk To First', 'Where the Story Gets to Finish', 'A Landing Place for What Matters', 'The Listener at the End of the Rope'] },
      { when: (p) => ti(p, 'perspective_taking') <= 1, texts: ['Where Interpretation Goes Wrong', 'Fast Verdicts, Slow Charity', 'Reading Before the Facts Arrive'] },
      { when: (p) => ti(p, 'capitalization') <= 2 && ti(p, 'listening_first') >= 4, texts: ['Wins Have Somewhere to Land', 'A Room for Good News', 'Where Good News Gets a Hearing'] },
      { when: (p) => ti(p, 'perspective_taking') >= 4 && ti(p, 'listening_first') >= 4, texts: ['Attention, in Both Directions', 'Reading and Receiving', 'The Two Kinds of Attention'] },
      { when: (p) => ti(p, 'perspective_taking') <= 3 && ti(p, 'listening_first') <= 3, texts: ['The Work of Interpretation', 'Reading and Being Read', 'Attention and Its Aims', 'The Bridge Between Two Minds'] },
    ],
    dims: ['perspective_taking', 'listening_first', 'logic_emotion_integration', 'capitalization', 'feedback_receiving'],
    patternHeadings: [
      { anyOf: ['shared_reality'], texts: ['Keeping One Reality', 'The Same Map of the World', 'Two Halves of Not-Guessing'] },
      { anyOf: ['separate_worlds_curious'], texts: ['Two Worlds, Both Visited', 'Curiosity as Compatibility', 'Touring Each Other'] },
    ],
    intro: () =>
      'One of the biggest things for you appears to be how interpretation happens — what you do in the space between someone\'s behavior and your conclusion about it.',
  },
  {
    id: 'communication',
    heading: 'Communication Without Games',
    headings: [
      { when: (p) => ti(p, 'direct_communication') >= 4 && ti(p, 'curiosity_worlds') >= 4, texts: ['Honesty Plus Appetite', 'The Question Behind the Question', 'Interested, and Blunt About It'] },
      { when: (p) => ti(p, 'direct_communication') >= 4, texts: ['Plain Speech as a Policy', 'The Straight Version', 'Saying It Before It Spoils', 'Direct by Design'] },
      { when: (p) => ti(p, 'direct_communication') <= 2, texts: ['How Truth Travels, Carefully', 'Truth, Routed Around Obstacles', 'The Softened Sentence', 'Circuits of Care'] },
      { when: (p) => ti(p, 'direct_communication') <= 3, texts: ['Truth Without Tactics', 'How You Say the Real Thing', 'Words, Handled With Care', 'Between Nothing Held Back and Nothing Forced'] },
    ],
    dims: ['direct_communication', 'curiosity_worlds'],
    patternHeadings: [
      { anyOf: ['shared_reality'], texts: ['Honesty as Shared Reality', 'Concealment Costs More Than Conflict', 'Information Stays Flowing'] },
      { anyOf: ['separate_worlds_curious'], texts: ['Interest You Can Say Out Loud', 'The Visit-and-Return Model', 'Curious About You, Out Loud'] },
    ],
    intro: () =>
      'Your answers describe a specific contract you tend to make with the people you love about how truth travels between you.',
  },
  {
    id: 'safety',
    heading: 'Feeling Safe, Being Safe',
    headings: [
      { when: (p) => ti(p, 'vulnerability_safety') >= 4, texts: ['The Vault, and Who It Opens For', 'Being Seen Without Bracing', 'Where the Armor Comes Off', 'What It Takes to Be Seen'] },
      { when: (p) => ti(p, 'reassurance_security') >= 4, texts: ['Being Safe, Being Steadied', 'What Calm Is Made Of', 'The Information That Steadies You'] },
      { when: (p) => ti(p, 'vulnerability_safety') <= 2, texts: ['The Vault and Its Keeper', 'Private by Default', 'What Stays Behind the Door'] },
    ],
    patternHeadings: [
      { anyOf: ['space_and_certainty'], texts: ['Space, With a Signal Attached', 'Distance You Can Read', 'Room Is Fine; Silence Is Not'] },
      { anyOf: ['noticed_not_managing'], texts: ['Noticed, Not Managed', 'Care That Arrives Early', 'Before the Asking'] },
    ],
    dims: ['vulnerability_safety', 'reassurance_security'],
    intro: () =>
      'Safety shows up in your answers as something with two halves: how you hold what others give you, and what steadies you when you\'re the one exposed.',
  },
  {
    id: 'reciprocity',
    heading: 'Love Going Both Ways',
    headings: [
      { when: (p) => ti(p, 'scorekeeping') >= 4, texts: ['Giving Without an Invoice (Almost)', 'The Quiet Audit', 'Generous, With a Memory'] },
      { when: (p) => ti(p, 'scorekeeping') <= 2, texts: ['The Ledger-Free Heart', 'Giving That Doesn’t Keep Score', 'Zero Invoices'] },
      { when: (p) => ti(p, 'receiving_comfort') <= 2, texts: ['Better at Giving Than Taking', 'Where Receiving Gets Hard', 'The Return Trip Stalls'] },
      { when: (p) => ti(p, 'care_initiation') >= 4 && ti(p, 'receiving_comfort') >= 4, texts: ['Care, Full Circle', 'Moving First, Landing Softly', 'Both Directions, Fully Open'] },
    ],
    dims: ['care_initiation', 'receiving_comfort', 'scorekeeping'],
    patternHeadings: [
      { anyOf: ['noticed_not_managing'], texts: ['The Ask Is Easy; the Noticing Is Love', 'Beyond Being Asked', 'Noticed Without Being Managed'] },
    ],
    intro: () =>
      'This is where your answers were most consistent: what you do with care — giving it, receiving it, and whether it turns into an accounting problem.',
  },
  {
    id: 'hard_days',
    heading: 'The Days When Nobody Is at 100%',
    headings: [
      { when: (p) => ti(p, 'repair_orientation') >= 4, texts: ['Coming Back as a Practice', 'Returns, Without Keeping Count', 'Always Circling Back'] },
      { when: (p) => ti(p, 'conflict_engagement') <= 2, texts: ['The Quiet During the Storm', 'Where You Go Mid-Argument', 'How You Fight: By Not Fighting'] },
      { when: (p) => ti(p, 'repair_orientation') <= 2, texts: ['When Things Set, They Set', 'Repair on a Delay', 'The Long Way Back'] },
      { when: (p) => ti(p, 'shared_home_effort') >= 4, texts: ['Carrying More Than Gets Noticed', 'Load-Bearing', 'Who Notices the Carrier'] },
    ],
    dims: ['same_side_problems', 'conflict_engagement', 'repair_orientation', 'shared_home_effort'],
    patternHeadings: [
      { anyOf: ['team_of_two'], texts: ['The Team Under Load', 'Us Against It, Especially Then', 'Two Against the Day'] },
    ],
    intro: () =>
      'Every relationship eventually meets exhaustion, breakage, and bad luck. Your answers describe what those days bring out in you.',
  },
  {
    id: 'closeness',
    heading: 'Closeness and Being Wanted',
    headings: [
      { when: (p) => ti(p, 'affection_daily') >= 4 && ti(p, 'desire') >= 4, texts: ['Warm Year-Round', 'High Ambient Warmth', 'Running Warm'] },
      { when: (p) => ti(p, 'affection_daily') <= 2, texts: ['Closeness at a Chosen Temperature', 'Warmth by Design, Not Default', 'Contact as Occasion'] },
      { when: (p) => ti(p, 'sexual_communication') >= 4, texts: ['An Open Script for Want', 'The Bedroom Speaks Plainly Too', 'Nothing Unsayable'] },
      { when: (p) => ti(p, 'sexual_communication') <= 2, texts: ['The Unsaid Part of Want', 'Where Words Stay Out', 'Desire Off the Record'] },
      { when: (p) => ti(p, 'positivity_play') >= 4, texts: ['Lightness, Tended', 'Fun as Infrastructure', 'The Recess Clause'] },
    ],
    dims: ['affection_daily', 'desire', 'desire_initiation', 'intimacy_attunement', 'sexual_communication', 'positivity_play', 'express_receive_alignment'],
    patternHeadings: [
      { anyOf: ['independent_but_connected'], texts: ['Close in the Time You Share', 'Density, Not Distance', 'The Time You Share, Dense'] },
    ],
    intro: () =>
      'Your answers sketch how closeness actually travels in and out of you — through what channel, at what volume, how you keep attraction alive, and how much of the relationship\'s lightness is tended.',
  },
  {
    id: 'independence',
    heading: 'Two People, One Life',
    headings: [
      { when: (p) => ti(p, 'autonomy_connection') >= 4, texts: ['Two Whole People', 'Space as a Form of Respect', 'Close, With the Doors Unlocked'] },
      { when: (p) => ti(p, 'autonomy_connection') <= 2, texts: ['Where You End and They Begin', 'The Borders Blur Here', 'One Life, Lightly Divided'] },
      { when: (p) => ti(p, 'money_coordination') >= 4, texts: ['Money as a Team Sport', 'The Shared Books, Open', 'One Ledger, Two Signatures'] },
      { when: (p) => ti(p, 'money_coordination') <= 2, texts: ['Money, Mostly Unmentioned', 'The Quiet Economy', 'Fairness Without a Meeting'] },
    ],
    dims: ['autonomy_connection', 'commitment_sacrifice', 'money_coordination'],
    patternHeadings: [
      { anyOf: ['space_and_certainty'], texts: ['Room, With the Story Attached', 'Space That Reports Back', 'Freedom With a Signal'] },
      { anyOf: ['team_of_two'], texts: ['Own Orbits, One Gravity', 'Separate Weekends, Shared Fronts', 'The Alliance Model'] },
      { anyOf: ['independent_but_connected'], texts: ['Wide Space, High Contact', 'Independent, and Still Warm', 'Far Apart, Close On Purpose'] },
      { anyOf: ['separate_worlds_curious'], texts: ['A Life Worth Visiting', 'Room to Roam, Reasons to Return', 'Two Lives, Cross-Referenced'] },
    ],
    intro: () =>
      'Finally, the shape of the life itself: how much of you stays yours inside a relationship, and how the two of you carry the costs of a shared life.',
  },
  {
    id: 'privacy',
    heading: 'What Belongs to the Two of You',
    headings: [
      { when: (p) => ti(p, 'relational_privacy') >= 4, texts: ['A Room With Two Chairs', 'Sealed at the Walls, Open Inside', 'The Two-Person Rule'] },
      { when: (p) => ti(p, 'relational_privacy') <= 2, texts: ['A Life Lived Out Loud', 'Porous by Design', 'Few Walls, Known Reasons'] },
      { when: (p) => ti(p, 'external_processing') >= 4, texts: ['Thinking Out Loud, Together', 'Processed in Company', 'Drafts Shared Live'] },
      { when: (p) => ti(p, 'external_processing') <= 2, texts: ['Finished Thoughts Only', 'The Inside Edit', 'Processed in Private'] },
    ],
    dims: ['relational_privacy', 'external_processing'],
    intro: () =>
      'One more boundary, drawn around the relationship itself: what stays between two people, and where outside voices are welcome — and on purpose.',
  },
];

function channelProfileText(p: ScoredProfile): string | null {
  const name = (c?: string | null) => (c ? CHANNEL_LABELS[c] ?? c : 'not clear from your answers');
  const exp = p.channels.express;
  const rec = p.channels.receive;
  if (!exp && !rec && !p.receiveBreadth) return null;
  if (exp && rec && exp === rec) {
    return `You appear to speak nearly the same love dialect in both directions: you give most naturally through ${name(exp)}, and that is also the channel that reaches you most deeply. That symmetry makes you unusually legible to a partner — what they see you do is a reliable map of what you need.`;
  }
  if (exp && rec) {
    return `You appear to give most naturally through ${name(exp)}, but the care that actually reaches you comes most strongly through ${name(rec)}. That is not a flaw — it is a translation note. A partner who watches what you do might misread the manual; the one who asks what you need will find the real one.`;
  }
  // Receive is null for two very different reasons: no usable answers, or the
  // answers naming several channels evenly (breadth, not absence). Say the
  // true one.
  if (exp && !rec) {
    if ((p.receiveBreadth ?? 0) >= 3) {
      return `Your answers show you give most naturally through ${name(exp)} — and on the receiving side, something rarer: each care question named a different channel, which reads less like an unreadable dictionary and more like a wide one. Care appears to reach you in whatever register it is offered. The risk flips accordingly: not starvation, but a partner never learning which gesture mattered most.`;
    }
    return `Your answers show you give most naturally through ${name(exp)}. What the answers say less clearly is which channel reaches you when you're the one who needs care — worth watching for, and worth telling the people close to you.`;
  }
  return rec
    ? `The care that reaches you most strongly comes through ${name(rec)}. What your answers say less clearly is how you naturally give it — worth noticing which gestures you reach for first, because that is usually your native dialect.`
    : `Neither direction of your love dialect came through clearly in the channel questions — worth noticing, over the next while, which gestures you reach for first and which ones land hardest when they arrive.`;
}

export function generateBlueprint(p: ScoredProfile): Blueprint {
  const sections: BlueprintSection[] = [];

  // Run-level variation seed: derived from this profile's actual dimension
  // scores, so two different people (or two different answer sets) never get
  // the identical prose cadence, while re-scoring the same answers stays
  // byte-stable.
  const runSeed = hash(
    (Object.keys(p.dimensions) as DimensionId[])
      .map((d) => `${d}:${p.dimensions[d].score}`)
      .join('|') + `#${p.answered}`,
  );
  // Dimensions whose mid-band score was a real tug-of-war (collected during the
  // section walk, same gate as the rendered variance notes) — a synthesis
  // signal the old closer never used.
  const dividedDims: DimensionId[] = [];

  // ── Epigraph: keyed to the most distinctive signal in the profile ──
  // Computed BEFORE the sections so heading selection can avoid re-saying it.
  const dimsArr = (Object.values(p.dimensions) as { id: DimensionId; score: number; unmeasured?: boolean }[]).filter(
    (d) => d.id !== 'express_receive_alignment' && !d.unmeasured,
  );
  const topHigh = [...dimsArr].sort((a, b) => b.score - a.score)[0];
  const topLow = [...dimsArr].sort((a, b) => a.score - b.score)[0];
  const EPIGRAPH_BY_LOW: Partial<Record<DimensionId, string[]>> = {
    receiving_comfort: ['Loves loudly, receives carefully.', 'Gives freely; receives like it costs.', 'Open hand out, closed hand in.', 'The door swings out more easily than in.'],
    scorekeeping: ['Someone who loves in actions and counts in silences.', 'A quiet ledger behind open generosity.', 'Gives big; remembers quietly.', 'Generosity with a memory.'],
    direct_communication: ['Careful where it counts, direct where it matters.', 'Says the true thing — except when it exposes.', 'Plain speech with a private wing.', 'Truth, selectively scheduled.'],
    desire: ['A quiet interior that wants, without announcing it.', 'Wanting kept mostly private.', 'The wanting runs hot inside; outside, stillness.', 'Want, kept off the wire.'],
    affection_daily: ['Closeness held at a chosen temperature.', 'Reach withheld; warmth rationed by design.', 'Contact as occasion, not current.', 'Warmth on a thermostat, not a tide.'],
    perspective_taking: ['Reads fast, trusts slowly.', 'Interpretation with a gatekeeper.', 'Charity for some; verdicts for others.', 'Curious first, convinced after — usually.'],
    relational_privacy: ['A life the two of you keep between you.', 'Walls high, doors selective.', 'A story told only when settled.', 'Few entries in the public record.'],
    sexual_communication: ['Feels deeply, says less where it counts most.', 'The deepest wants stay offstage.', 'Desire legible only in clues.', 'Want, spoken in a lower register.'],
    capitalization: ['Loves steadily; celebrates quietly.', 'Good news gets a receipt, not a room.', 'Marks the big ones; the small joys slip past.', 'Joy acknowledged; rarely amplified.'],
    commitment_sacrifice: ['Carries an internal audit alongside the giving.', 'Gives with one hand, tallies with the other.', 'Sacrifice with a running tab.', 'Backs people; keeps the receipts.'],
    money_coordination: ['Keeps the books; means well by it.', 'A fairness organ, turned all the way up.', 'Every purchase gets a quiet hearing.', 'The auditor never fully sleeps.'],
  };
  const EPIGRAPH_BY_HIGH: Partial<Record<DimensionId, string[]>> = {
    care_initiation: ['Notices first, moves first — love as anticipation.', 'Love, in your answers, shows up early.', 'Anticipates the need; arrives before the ask.', 'The first responder of the people they love.'],
    repair_orientation: ['Always circling back.', 'Returns, repairs, remains.', 'The one who comes back.', 'Nothing stays broken between you for long.'],
    listening_first: ['A safe place to fall apart.', 'Heard all the way to the end.', 'Where the story gets to finish.', 'People bring you their unfinished sentences.'],
    same_side_problems: ['Same side of everything.', 'Us versus it, every time.', 'Problems get externalized; people get embraced.', 'Takes the problem’s side, and yours.'],
    affection_daily: ['Fluent in the small touches.', 'Touch as first language.', 'Ambient closeness, maintained daily.', 'Warmth as the background state.'],
    vulnerability_safety: ['A vault people trust without checking.', 'Safe hands for fragile things.', 'Holds what is handed, hand steady.', 'Where confessions go to be safe.'],
    autonomy_connection: ['Two whole people, choosing each other daily.', 'Separate orbits, shared gravity.', 'Close by choice, not by need.', 'Room to roam, reason to return.'],
    curiosity_worlds: ['Interest as a form of love.', 'Asks the second question.', 'Finds every world worth entering.', 'Treats every enthusiasm as an invitation.'],
    relational_privacy: ['Keeps what matters between you.', 'The two-person room, kept.', 'Protected, not hidden.', 'What happens between you, stays between you.'],
    sexual_communication: ['Nothing unsayable, even there.', 'Speaks plainly, even about want.', 'Intimacy with an open script.', 'The bedroom gets the same honesty as the kitchen.'],
    positivity_play: ['Gardens fun; plants the plan nobody knew they wanted.', 'Carries the spark; hands you the match.', 'Lightness, on purpose.', 'Builds the joke ahead of time.'],
    capitalization: ['Where joy goes to land.', 'Stops the world for good news.', 'Wins grow when told to you.', 'Good news compounds at your place.'],
    conflict_engagement: ['Curious even mid-argument.', 'Stays in the ring; hears while defending.', 'Heat does not cost you your hearing.', 'Argues to learn, not to win.'],
    commitment_sacrifice: ['Backs people — visibly, without an invoice.', 'All the way in, books closed.', 'Gives like it settles the question.', 'Bets on people, and stays at the table.'],
    money_coordination: ['Talks about money like a teammate.', 'One ledger, two signatures.', 'A team economy, no double standards.', 'Money as a shared project, never a weapon.'],
  };

  let epigraph: string;
  // Seed = f(dimension, score) only — nothing that differs between the owner
  // and a BP5 share-code profile (pairLeans presence would shift the seed and
  // break the byte-parity invariant). Rotation comes from the exact score.
  if (topLow && topLow.score <= 36 && EPIGRAPH_BY_LOW[topLow.id]) {
    epigraph = seededPick(EPIGRAPH_BY_LOW[topLow.id]!, hash(topLow.id + String(topLow.score)));
  } else if (topHigh && topHigh.score >= 70 && EPIGRAPH_BY_HIGH[topHigh.id]) {
    epigraph = seededPick(EPIGRAPH_BY_HIGH[topHigh.id]!, hash(topHigh.id + String(topHigh.score)));
  } else {
    const fallbacks = [
      'A steady presence that wants, quietly, to be chosen back.',
      'Direct where it matters, careful where it counts.',
      'Loves specifically, not generally.',
      'Built for the ordinary evenings.',
      'Attention, given like it costs something.',
      'Steady hands, particular heart.',
    ];
    epigraph = seededPick(fallbacks, hash((topHigh?.id ?? 'x') + String(p.consistencyIndex)) + runSeed);
  }

  // Derived patterns: cross-dimension readings ranked by confidence × priority.
  // Synthesis patterns headline the Crosscurrents section; the rest render
  // inline where their placement says the reading belongs.
  const plan = buildPatternPlan(p);
  // What actually headlined Crosscurrents, by id and by frame text — the
  // pattern-keyed headings react to this set, and the echo guard needs the
  // frame vocabulary of the pattern a keyed title names.
  const firedHeadline = new Set(plan.headline.map((h) => h.pattern.id));
  const frameById = new Map(PATTERNS.map((pat) => [pat.id, pat.frame] as const));

  for (const spec of SECTION_SPECS) {
    const paragraphs: string[] = [];
    if (spec.intro) paragraphs.push(spec.intro(p));
    for (const dim of spec.dims) {
      const s = p.dimensions[dim]?.score;
      if (s === undefined) continue;
      // A dimension from an older share code has no real evidence — show the
      // gap explicitly rather than a plausible-looking mid-band paragraph.
      if (p.dimensions[dim]?.unmeasured) {
        paragraphs.push(
          '*This dimension was not measured by the earlier version of the questionnaire this blueprint came from — there is no honest way to render it yet. Answering the newer questions completes this section.*',
        );
        continue;
      }
      paragraphs.push(dim === 'express_receive_alignment' ? alignmentParagraphFor(p, runSeed) : paragraphFor(dim, s, runSeed));
      // Thin-evidence honesty: a tier paragraph carried by one or two answers
      // reads as confident temperament it hasn't earned. Say so, gently,
      // instead of letting two data points speak in generalities.
      const nContrib = p.variance?.[dim]?.contributions.length ?? p.dimensions[dim]?.varianceShape?.count;
      if (nContrib !== undefined && nContrib <= 3) {
        const last = paragraphs[paragraphs.length - 1];
        paragraphs[paragraphs.length - 1] = `Worth reading gently — this dimension rests on some of the fewest answers in your run (${nContrib} ${nContrib === 1 ? 'answer carries' : 'answers carry'} it, where most others have many more): ${last}`;
      }
      // Derived patterns render at their placement point (a co-occurring score
      // changes this paragraph's meaning), then legacy interplay covers
      // combinations the pattern library doesn't reach.
      const spotKey = `${spec.id}:${dim}`;
      for (const h of plan.sections.get(spotKey) ?? []) paragraphs.push(...renderPattern(h, 'section', runSeed));
      const ip = interplayFor(dim, p);
      if (ip) paragraphs.push(varyInterplayOpener(ip, hash(dim + 'ip')));
      // Variance note last: after the tier prose and its contextual reads,
      // reveal what the average was hiding (mid scores built from opposites).
      const vn = varianceNoteFor(dim, p);
      if (vn) {
        paragraphs.push(vn);
        dividedDims.push(dim);
      }
    }
    if (spec.id === 'reciprocity') {
      const ch = channelProfileText(p);
      if (ch) paragraphs.push(ch);
    }
    if (spec.id === 'communication' && p.dimensions.direct_communication.score >= 60) {
      paragraphs.push(
        'Taken together, your directness and your curiosity suggest something specific: you don\'t just want honesty about problems — you want the relationship to be a place where enthusiasm is also spoken out loud. Not only "this bothered me," but "look at this thing I love."',
      );
    }
    // Content-aware heading, picked from the matched pool with seeded rotation,
    // skipping candidates that would re-say what this section (or the epigraph
    // or the inline pattern frames) is about to say.
    const frames = spec.dims.flatMap((d) => (plan.sections.get(`${spec.id}:${d}`) ?? []).map((h) => h.pattern.frame));
    const heading = pickHeading(spec, p, runSeed, headingBlockers(paragraphs, epigraph, frames), firedHeadline, frameById);
    sections.push({ id: spec.id, heading, paragraphs, headingAdaptive: heading !== spec.heading });
  }

  // ── Crosscurrents: the headline layer of derived patterns ──
  // Top-ranked synthesis patterns lead with their bolded frame lines. Capped
  // at three so the section reads as "the interactions that matter most in
  // your profile", not every qualifying combination.
  if (plan.headline.length > 0) {
    // Crosscurrents title keyed to the ACTUAL synthesis mix. plan.headline is
    // priority-ordered, so the first matching pair entry names the interaction
    // of the two dominant themes; the single entries lead with the dominant
    // pattern alone; the static title is the last resort. Every candidate is
    // echo-guarded against the fired frames and the epigraph — a title that
    // restated its own lead frame would stutter on arrival.
    const CROSS_BY_PAIR: Record<string, string[]> = {
      'space_and_certainty|noticed_not_managing': ['The Distance That Still Reports', 'Far, and Never Uninformed', 'Room, and the Reading of It'],
      'space_and_certainty|team_of_two': ['Free Range, United Front', 'Alone Time, Team Instincts', 'Separate Camps, One Flag'],
      'space_and_certainty|independent_but_connected': ['Dense Hours, Wide Days', 'Close When It Counts, Free the Rest', 'The Warm Return'],
      'space_and_certainty|shared_reality': ['Distance With Documentation', 'Room to Move, Facts to Hold', 'The Explained Absence'],
      'space_and_certainty|separate_worlds_curious': ['Two Worlds, Wide Rooms', 'Space for Both Maps', "Rooms of One's Own, Tours of Two"],
      'noticed_not_managing|shared_reality': ['Attentiveness and Straight Talk', 'Seen Early, Told Plainly', 'The Information Standard'],
      'noticed_not_managing|team_of_two': ['The Early-Warning Team', 'Attentive, and on the Same Side', 'Cared For, Carried With'],
      'noticed_not_managing|independent_but_connected': ['The Considerate Distance', 'Early Word, Wide Room', 'Attentive Without Crowding'],
      'noticed_not_managing|separate_worlds_curious': ['The Wide-Awake Arrangement', 'Curious, and Already Prepared', 'Interest With Anticipation'],
      'team_of_two|independent_but_connected': ['A Team of Two Full Lives', 'United Front, Separate Corners', 'The Working Partnership'],
      'team_of_two|shared_reality': ['One Story, One Side', 'The Same Page, the Same Team', 'Plain Facts, Joint Front'],
      'team_of_two|separate_worlds_curious': ['Separate Trails, One Summit', 'The Expedition of Two', 'Two Camps, One Expedition'],
      'shared_reality|independent_but_connected': ['Closeness With Candor', 'Warm, and Never Vague', 'The Candid Orbit'],
      'shared_reality|separate_worlds_curious': ['Two Worlds, One Truth', 'Curiosity, Verified', 'The Cross-Checked Map'],
      'independent_but_connected|separate_worlds_curious': ['Warm Visits, Own Rooms', 'The Guest Who Lives Next Door', 'Interest Across the Hall'],
    };
    const CROSS_BY_TOP: Partial<Record<string, string[]>> = {
      space_and_certainty: ['The Distance That Still Reports', 'Room, With a Signal', 'Space, Read Accurately'],
      noticed_not_managing: ['The Attentiveness Standard', 'Before You Have to Ask', 'Care That Preempts the Ask'],
      team_of_two: ['The Two-Person Front', 'A Compact Under Load', 'Side by Side, By Design'],
      independent_but_connected: ['Dense Hours, Wide Days', 'Close on Your Own Terms', 'The Warm Orbit'],
      shared_reality: ['The Information Standard', 'One Version of Events', 'Where Nothing Gets Curated'],
      separate_worlds_curious: ['The Visiting Arrangement', 'Two Worlds, Both Inhabited', 'Interest Across the Hall'],
    };
    const fired = plan.headline.map((h) => h.pattern.id);
    const crossBlockers = headingBlockers([], epigraph, plan.headline.map((h) => h.pattern.frame));
    const crossPools: string[][] = [];
    for (let i = 0; i < fired.length; i++) {
      for (let j = i + 1; j < fired.length; j++) {
        const pool = CROSS_BY_PAIR[`${fired[i]}|${fired[j]}`] ?? CROSS_BY_PAIR[`${fired[j]}|${fired[i]}`];
        if (pool) crossPools.push(pool);
      }
    }
    if (CROSS_BY_TOP[fired[0]]) crossPools.push(CROSS_BY_TOP[fired[0]]!);
    const rotated = crossPools.map((texts) => seededPick(texts, hash('crosscurrents') + runSeed));
    const crossHeading = rotated.find((c) => !titlesCollide(c, crossBlockers)) ?? 'Crosscurrents';
    sections.push({
      id: '__crosscurrents',
      heading: crossHeading,
      paragraphs: plan.headline.flatMap((h) => renderPattern(h, 'headline', runSeed)),
    });
  }

  // ── Tensions ──
  const tensions: Blueprint['tensions'] = [];
  if (
    p.channels.express && p.channels.receive && p.channels.express !== p.channels.receive
  ) {
    tensions.push({
      title: 'You give in one language and listen in another',
      body: `Your answers show you most naturally express care through ${CHANNEL_LABELS[p.channels.express] ?? p.channels.express}, while the care that actually reaches you comes most strongly through ${CHANNEL_LABELS[p.channels.receive] ?? p.channels.receive}. This is one of the most common — and most fixable — patterns between two people. The fix is almost boring: show each other the dictionary. Tell a partner what lands for you; ask what lands for them; then believe both answers.`,
    });
  }
  for (const c of p.consistency) {
    if (c.agreement < 45 && c.dimension === 'ambiguity_update') {
      tensions.push({
        title: 'You respond differently to a bad day and a bad week',
        body: 'When your partner said "I\'m fine" once, and when they said it all week, your answers told different stories. That isn\'t hypocrisy — it\'s information about your thresholds. It\'s worth knowing at what point a quiet partner stops being "having an off day" and starts being, in your private accounting, something that needs a response.',
      });
    } else if (c.agreement < 40 && c.dimension !== 'ambiguity_update') {
      const card = pairTensionCard(c, p, runSeed);
      if (card) tensions.push(card);
    }
  }
  if (p.consistencyIndex >= 78) {
    tensions.push({
      title: 'Your answers agreed with themselves to an unusual degree',
      body: 'Across scenarios asked hours-of-attention apart, in different clothes, your instincts kept pointing the same direction. Whatever this document says about you, you built it consistently — these are not mood answers.',
    });
  }
  if (p.answered < p.total) {
    tensions.push({
      title: 'This blueprint is built from a partial run',
      body: `You answered ${p.answered} of ${p.total} questions. Everything here is still valid — it\'s built from what you did answer — but the quieter dimensions had less evidence to work from.`,
    });
  }
  const unmeasuredCount = (Object.values(p.dimensions) as { unmeasured?: boolean }[]).filter((d) => d.unmeasured).length;
  if (unmeasuredCount > 0) {
    tensions.push({
      title: unmeasuredCount === 1 ? 'One thing this document cannot see' : `Things this document cannot see (${unmeasuredCount})`,
      body: `This blueprint was built from an earlier, shorter version of the questionnaire — ${unmeasuredCount === 1 ? 'one section is' : `${unmeasuredCount} sections are`} marked as unmeasured below rather than guessed. The honest upgrade: answer the newer questions whenever you like — everything already answered is kept, and the document completes itself.`,
    });
  }

  // ── Synthesis: a multi-signal closing read ──
  // Synthesis heading: seeded rotation — the closer's title varies like every
  // other title in the document, while the paragraphs stay profile-specific.
  const SYNTHESIS_HEADINGS = [
    'A Relationship That May Feel Natural to You',
    'What Your Answers Point Toward',
    'The Shape of a Relationship That Fits',
    'What Tends to Work for You',
    'The Relationship Your Answers Describe',
  ];
  // The lead-in names HOW the picture was assembled — consistency, conflicts,
  // and how the document handled them — so it is earned by this profile, not
  // stamped onto every document.
  const disagreeingPairs = p.consistency.filter((c) => c.agreement < 50 && c.dimension !== 'ambiguity_update');
  let leadIn: string;
  if (p.consistencyIndex >= 78 && disagreeingPairs.length === 0) {
    leadIn =
      'Your answers kept pointing the same direction — across ' + String(p.consistency.length) + ' deliberately repeated scenarios, in different clothes, your instincts agreed with themselves ' + String(p.consistencyIndex) + '% of the time. That consistency is why the picture below can be drawn in confident strokes.';
  } else if (disagreeingPairs.length > 0 && p.consistencyIndex >= 60) {
    leadIn =
      'Mostly, your answers pointed one direction — but not everywhere. ' + String(disagreeingPairs.length) + ' of the ' + String(p.consistency.length) + ' repeated-scenario pairs pulled different instincts from you, and this document treats those disagreements as findings, not noise: they are named, given their two readings, and — where a clarifying question was answered — resolved.';
  } else if (disagreeingPairs.length > 0) {
    leadIn =
      'This picture was assembled from answers that disagreed with themselves in places — ' + String(disagreeingPairs.length) + ' repeated scenarios pulled different instincts from you. Read the sections below with that in mind: where the document sounds least sure of you is usually where two of your values are still negotiating.';
  } else {
    leadIn =
      'Your answers were steady enough (' + String(p.consistencyIndex) + '% self-agreement across repeated scenarios) to sketch this picture in fair confidence — with the usual caveat that any mirror shows the face that was brought to it.';
  }

  // The shape paragraph composes SIX signal families instead of the old
  // four-tier-note list: the two strongest highs, the most distinctive low,
  // the dominant cross-dimension current (what actually headlined), a divided
  // dimension when the average was hiding a tug-of-war, and the channel
  // asymmetry when care travels in two languages. Every clause is conditional
  // on its signal actually existing — silence, not filler, where evidence is
  // thin.
  const topSyn = dimsArr.filter((d) => d.score >= 62).sort((a, b) => b.score - a.score).slice(0, 2);
  const lowSyn = dimsArr.filter((d) => d.score <= 40).sort((a, b) => a.score - b.score)[0];
  const shapeSentences: string[] = [];
  if (topSyn.length > 0) {
    const notes = topSyn.map((d) => noteFor(d.id, d.score).toLowerCase());
    const joined = notes.length === 2 ? notes[0] + ' and ' + notes[1] : notes.join('; and ');
    shapeSentences.push(
      'Based on your answers, a relationship that may feel natural to you would probably involve ' + joined + '.',
    );
  } else {
    shapeSentences.push(
      'Based on your answers, a relationship that may feel natural to you is still more assembly than inheritance — your scores sit close enough to the middle that the fit is something you will design with someone, not discover pre-made.',
    );
  }
  if (lowSyn) {
    shapeSentences.push('What it would not ask of you: ' + noteFor(lowSyn.id, lowSyn.score).toLowerCase() + '.');
  }
  const domPattern = plan.headline[0]?.pattern;
  if (domPattern && domPattern.dims.length >= 2) {
    const label1 = DIMENSION_LABELS[domPattern.dims[0]]?.toLowerCase() ?? domPattern.dims[0];
    const label2 = DIMENSION_LABELS[domPattern.dims[1]]?.toLowerCase() ?? domPattern.dims[1];
    const spineLeads = [
      `The most specific work in your answers happens where ${label1} meets ${label2} — that interaction is the spine of this document.`,
      `If this document has a spine, it is where ${label1} meets ${label2}: each one changes what the other means for you.`,
      `${label1} and ${label2} are the pair doing the most work in your answers — neither reading is complete without the other.`,
    ];
    shapeSentences.push(seededPick(spineLeads, hash('spine') + runSeed));
  }
  if (dividedDims.length > 0) {
    const d0 = dividedDims[0];
    const dl = DIMENSION_LABELS[d0]?.toLowerCase() ?? d0;
    shapeSentences.push(
      `And one part of this picture is genuinely two-valued rather than settled: your ${dl} reads as a back-and-forth still in negotiation — the sections above name what the average was hiding.`,
    );
  }
  if (p.channels.express && p.channels.receive && p.channels.express !== p.channels.receive) {
    shapeSentences.push(
      'Care also moves through you in two different languages — the one you give in and the one that reaches you — which makes the dictionary exchange the single highest-leverage habit in this whole document.',
    );
  }

  // The closer earns its place or gets out of the way: when tensions rendered,
  // it points at them as the unsettled part; when nothing disagreed, the
  // keep-or-argue line stands on its own.
  const closer =
    tensions.length > 0
      ? 'None of this is a verdict — and where your answers disagreed with themselves, the tensions above hold the honest version. The rest of the reading is yours to test: the parts that ring true are worth saying out loud to the people close to you, and the parts that don\'t are worth arguing with.'
      : 'None of this is a verdict. It\'s a description of a pattern — drawn from dozens of small decisions you made about imaginary people, which is usually where real instincts live. Some of it will land as obviously you. Some of it will feel slightly off. Both reactions are useful: the parts that ring true are worth saying out loud to the people close to you, and the parts that don\'t are worth arguing with.';

  sections.push({
    id: '__synthesis',
    heading: seededPick(SYNTHESIS_HEADINGS, hash('synthesis' + String(p.consistencyIndex) + String(p.answered))),
    paragraphs: [leadIn, ...shapeSentences, closer],
  });
  // (The closing/“Short Version” block was removed by design: its three
  // meta-branch summaries read as boilerplate against the per-profile prose
  // everywhere else, and its sign-off was a direct lift from the founding
  // values document — a mirror shouldn't end by quoting the original it
  // was built from. The document now ends on the synthesis section.)

  // (The closing/“Short Version” block was removed by design: its three
  // meta-branch summaries read as boilerplate against the per-profile prose
  // everywhere else, and its sign-off was a direct lift from the founding
  // values document — a mirror shouldn't end by quoting the original it
  // was built from. The document now ends on the synthesis section.)

  const bands = (Object.values(p.dimensions) as { id: DimensionId; score: number; unmeasured?: boolean }[]).map((d) => {
    const nContrib = p.variance?.[d.id]?.contributions.length ?? p.dimensions[d.id]?.varianceShape?.count;
    let tierLabel = d.unmeasured ? undefined : TIER_LABELS[tierOf(d.score)];
    // Thin-evidence hedge: when three or fewer answers carry a dimension, a
    // single flip can move it a full band (measured: 9–20 pts mean single-
    // answer swing on the 2–3-item constructs vs 1.5–5 on the well-evidenced
    // core). The chip flags that instead of borrowing the core's confidence.
    if (tierLabel && !d.unmeasured && nContrib !== undefined && nContrib <= 3) {
      tierLabel = `${tierLabel} · lightly held`;
    }
    return {
      id: d.id,
      label: DIMENSION_LABELS[d.id],
      score: d.score,
      tierLabel,
      unmeasured: d.unmeasured,
    };
  });

  // One calibration pass over everything the reader will see: the
  // evidence-distance rule applies to the final text, wherever it was built.
  const calibratedSections = sections.map((s) => ({
    ...s,
    paragraphs: s.paragraphs.map(calibrate),
  }));
  const calibratedTensions = tensions.map((t) => ({ title: t.title, body: calibrate(t.body) }));

  return { epigraph, sections: calibratedSections, bands, tensions: calibratedTensions };
}

/** Render the blueprint as a downloadable Markdown document. */
export function blueprintToMarkdown(bp: Blueprint, p: ScoredProfile): string {
  const lines: string[] = [];
  lines.push('# My Relationship Blueprint');
  lines.push('');
  lines.push(`*${bp.epigraph}*`);
  lines.push('');
  lines.push(
    `Generated from ${p.answered} answers · self-consistency ${p.consistencyIndex}% · ${new Date().toLocaleDateString()}`,
  );
  lines.push('');
  lines.push('---');
  lines.push('');
  for (const s of bp.sections) {
    if (s.id === '__synthesis' || s.id === '__crosscurrents') continue;
    lines.push(`## ${s.heading}`);
    lines.push('');
    for (const para of s.paragraphs) {
      lines.push(para);
      lines.push('');
    }
  }
  const cross = bp.sections.find((s) => s.id === '__crosscurrents');
  if (cross) {
    lines.push('## Crosscurrents');
    lines.push('');
    for (const para of cross.paragraphs) {
      lines.push(para);
      lines.push('');
    }
  }
  if (bp.tensions.length > 0) {
    lines.push('## Where Your Answers Suggest Some Tension');
    lines.push('');
  for (const t of bp.tensions) {
    lines.push(`**${t.title}**`);
    lines.push('');
    lines.push(t.body);
    lines.push('');
  }
  }
  const synthesis = bp.sections.find((s) => s.id === '__synthesis');
  if (synthesis) {
    lines.push(`## ${synthesis.heading}`);
    lines.push('');
    for (const para of synthesis.paragraphs) {
      lines.push(para);
      lines.push('');
    }
  }
  lines.push('---');
  lines.push('');
  lines.push('### Dimension readouts');
  lines.push('');
  for (const b of bp.bands) {
    lines.push(`- **${b.label}**: ${b.unmeasured ? 'unmeasured' : `${b.score}/100`}`);
  }
  return lines.join('\n');
}

// ───────────────────── Per-pair tension resolution ─────────────────────
// A generic "your answers disagreed somewhere" card is resolution fraud:
// the reader already KNOWS they disagreed — what they need is the reading.
// Each echo pair gets its own card: the territory, the two readings, which
// direction the disagreement leaned, and what the trade-off is actually
// between. Direction is computable from the signed weights of the two
// answers (positionA/positionB on the pair's shared dimension); profiles
// restored from share codes carry no raw answers, so those fall back to a
// territory-specific but non-directional body.

/**
 * Direction rule for every entry: `lean = positionB − positionA` where position
 * is the chosen answer's signed weight on the pair's shared dimension.
 * `highIs` describes lean > 0 (the SECOND-listed scenario carried MORE of the
 * dimension); `lowIs` describes lean < 0 (the FIRST one did). Every entry below
 * was verified against the actual option weights in questions.ts.
 */
interface PairCardCopy {
  territory: string;
  a: string;
  b: string;
  lowIs: string;
  highIs: string;
  tradeoff: string;
}

const PAIR_TENSION_LIBRARY: Record<string, PairCardCopy> = {
  // q10 = compliment from nowhere (words); q55 = snack set beside you (service)
  // [receiving_comfort] — lean>0: service answer outweighed the words answer.
  'q10|q55': {
    territory: 'being loved out loud',
    a: 'a compliment from nowhere',
    b: 'care that arrives without a word — the snack set beside you',
    lowIs: 'worded praise lands more easily than wordless care',
    highIs: 'wordless care lands more easily than worded praise',
    tradeoff: 'Whether you measure love by what gets said or by what gets done — a partner will assume one of the two, and the wrong guess reads as indifference.',
  },
  // q04 = terrible week, first hour; q61 = bad presentation, first 30 seconds
  // [listening_first] — lean>0: more listening in the sharp, specific moment.
  'q04|q61': {
    territory: 'showing up when someone is struggling',
    a: 'a partner at the end of a terrible week, before anyone speaks',
    b: 'a partner walking in from a presentation that just went badly',
    lowIs: 'you show up as a listener more when the wound is diffuse than when it is specific',
    highIs: 'you show up as a listener more when the wound is specific than when it is diffuse',
    tradeoff: 'Whether comfort means “help me carry this” or “sit with me in it” — both are love, and they are not interchangeable on the receiving end.',
  },
  // q14 = offered back-rub at 9pm; q62 = thanks after two weeks of cooking
  // [scorekeeping] — the pair's declared dimension is the LEDGER, not comfort:
  // lean>0 means the fairness/audit instinct showed up in the giving scenario
  // but not the receiving one (or vice versa for lean<0).
  'q14|q62': {
    territory: 'your private ledger of giving and receiving',
    a: 'receiving care at 9pm with your defenses down',
    b: 'two weeks of dinners answered by a warm thank-you for one of them',
    lowIs: 'the ledger opens on the receiving side — care offered to you stirs a debt feeling — while your own giving runs invoice-free',
    highIs: 'the ledger opens on the giving side — you keep an account of your own outlay — while care arriving for you lands debt-free',
    tradeoff: 'This asymmetric ledger is one of the most common quiet patterns there is: many people give freely and still feel debt the moment care arrives, or the exact reverse. Naming which way yours points is the whole exercise.',
  },
  // q06 = their enthusiasm, ten minutes in; q69 = explaining your own thing
  // [curiosity_worlds] — lean>0: the want-side (your world received) outweighed the extend-side.
  'q06|q69': {
    territory: 'meeting another person’s world',
    a: 'their excitement about something you know nothing about',
    b: 'the moment your own world is the one on the table',
    lowIs: 'the attention you extend to their world is easy and forgiving — while engagement with yours faces a stricter audition: performed interest stings more than absence would',
    highIs: 'you extend more curiosity to their world than you ask back for yours',
    tradeoff: 'Whether interest is something you extend or something you exchange — the difference between being interesting and being interested.',
  },
  // q63 = morning after an argument (support frame); q67 = group-chat screenshots (content frame)
  // [relational_privacy] — lean>0: firmer in the content frame than the support frame.
  'q63|q67': {
    territory: 'what stays between the two of you',
    a: 'the morning after a hard argument, when support is what you might want',
    b: 'a friend asking to see the screenshots of last night\'s disagreement',
    lowIs: 'your line is firmer when telling the story reads as seeking support than when it reads as entertainment',
    highIs: 'your line is firmer when sharing reads as content than when it reads as seeking counsel',
    tradeoff: 'Privacy as protection versus privacy as a wall — worth knowing which frame actually trips it, because the two feel nothing alike from inside.',
  },
  // q65 = two-person principle (live details sealed); q72 = finished-story principle
  // [relational_privacy] — lean>0: the finished-story stance outweighed the two-person one,
  // i.e. the settled story is sealed while a trusted voice may still hear live details.
  'q65|q72': {
    territory: 'the boundary around your private life',
    a: '“worked out between the two people in it, before anyone else hears details”',
    b: '“outsiders get the finished story, never the drafts”',
    lowIs: 'you seal the live details while letting the settled story travel — narration over counsel',
    highIs: 'you seal the settled story while leaving room for a trusted voice in the live details — counsel over narration',
    tradeoff: 'Both are real privacy stances; they just permit different things. A partner assuming the wrong one will feel shut out without knowing why.',
  },
  // q74 = heat rising in your chest (scenario); q84 = curiosity-under-fire (scale)
  // [conflict_engagement] — lean>0: the scale claimed more curiosity than the scenario showed.
  'q74|q84': {
    territory: 'staying curious mid-conflict',
    a: 'the moment the heat actually rises in your chest',
    b: 'the calmer claim about what you can hold while defending your side',
    lowIs: 'in the moment you stayed more curious than your calmer self gives you credit for',
    highIs: 'your stated curiosity outruns your in-the-moment behavior — on paper you stay open longer than your chest does',
    tradeoff: 'Whether your conflict style survives contact with an actual raised voice — most people’s is calmer on paper than in the body.',
  },
  // q78 = your news deflected (“that’s great” + subject change); q88 = your news carried to a distracted room
  // [capitalization] — lean>0: the delivery-strategy answer outweighed the deflection sting.
  'q78|q88': {
    territory: 'good news finding its landing place',
    a: 'watching your shared news get deflected',
    b: 'deciding how to deliver your news to a distracted room',
    lowIs: 'you hold the receiver responsible — their deflection is what costs',
    highIs: 'you adapt your own telling to protect the news rather than count on the reception',
    tradeoff: 'Whether you manage the telling or hold the receiving to a standard — both protect joy, and each hides its own cost.',
  },
  // q75 = “I’d say so out loud” (scale); q85 = the bedroom scenario
  // [sexual_communication] — lean>0: the scenario showed more willingness than the scale claimed.
  'q75|q85': {
    territory: 'saying the unsayable in intimacy',
    a: 'the abstract claim about voicing a bedroom preference',
    b: 'the same territory asked as a lived scenario',
    lowIs: 'in the concrete situation, voicing it costs more than the abstract scale admitted — the policy is braver than the practice',
    highIs: 'in the concrete moment you voice preferences more readily than the abstract scale predicted',
    tradeoff: 'Whether your spoken philosophy of desire survives the actual bedroom — the gap between policy and practice is the whole finding.',
  },
  // q87 = partner’s cross-country gamble; q90 = the audit scale
  // [commitment_sacrifice] — lean>0: everyday giving settled its books more easily than the big gamble.
  'q87|q90': {
    territory: 'backing someone all the way in',
    a: 'a partner’s cross-country gamble that would cost you both for years',
    b: 'the everyday question of whether your giving settles its own books',
    lowIs: 'you back big gambles more freely than your everyday giving admits — the audit runs on Tuesdays, not at crossroads',
    highIs: 'everyday giving settles its own books, but the audit wakes up when the cost is concrete',
    tradeoff: 'Whether generosity survives arithmetic — the moment a real price tag tests whether the giving was unconditional or just untested.',
  },
  // q53 = care you most like to receive; q54 = care you most naturally give
  // [express_receive_alignment] — note: these are channel-tag questions and carry
  // no weights on the alignment dimension itself, so this card renders directionless
  // (the zero-guard in pairTensionCard handles it). The channel card above it
  // already names the asymmetry; this one notes the answers didn't cohere.
  'q53|q54': {
    territory: 'how care travels — out and in',
    a: 'the care you most like to receive',
    b: 'the care you most naturally give',
    lowIs: 'the receiving side of that pair outweighed the giving side',
    highIs: 'the giving side outweighed the receiving side',
    tradeoff: 'Whatever the mix, the useful act is the same: show each other the dictionary. Tell a partner what lands for you; ask what lands for them; then believe both answers.',
  },
};

/**
 * Build the tension card for one disagreeing echo pair — territory-named,
 * direction-aware when raw answers are available, honest about what is
 * unknown when they are not.
 */
function pairTensionCard(c: ConsistencyPair, p: ScoredProfile, runSeed = 0): Blueprint['tensions'][number] | null {
  const copy = PAIR_TENSION_LIBRARY[c.a + '|' + c.b] ?? PAIR_TENSION_LIBRARY[c.b + '|' + c.a];
  if (!copy) return null;
  const dimScore = p.dimensions[c.dimension as DimensionId]?.score;
  const scale =
    dimScore !== undefined && !p.dimensions[c.dimension as DimensionId]?.unmeasured
      ? ` Where this sits overall: the ${DIMENSION_LABELS[c.dimension as DimensionId]?.toLowerCase() ?? 'territory'} reads ${tierLabelFor(dimScore)} on this dimension — the disagreement is about which pull leads, not whether the trait is present.`
      : '';

  const posA = c.positionA;
  const posB = c.positionB;
  // BP5 share profiles carry per-pair leans instead of raw positions — the
  // same quantized value the owner path computes below, so both render the
  // identical directional card.
  const lean =
    posA !== undefined && posB !== undefined
      ? posB - posA
      : p.pairLeans?.[`${c.a}|${c.b}`] ?? p.pairLeans?.[`${c.b}|${c.a}`];
  if (lean === undefined) {
    // No direction available from either raw answers or the share code — be
    // honest about the disagreement without inventing which way it leaned.
    return {
      title: `Two readings of ${copy.territory}`,
      body: `Two scenarios probed ${copy.territory} from different angles — ${copy.a}, then ${copy.b} — and your instincts pulled apart. This link carries the reading, not the answer-by-answer reasoning, so it can't tell you which way the disagreement leaned. ${copy.tradeoff}${scale}`,
    };
  }
  // A vanishing lean means the pair's shared dimension carries no usable
  // direction from these two answers (e.g. q53/q54, whose channel tags live
  // outside the weight system) — render directionless rather than invent one.
  if (Math.abs(lean) < 0.05) {
    return {
      title: `Two readings of ${copy.territory}`,
      body: `Two scenarios probed ${copy.territory} from different angles — ${copy.a}, then ${copy.b} — and your instincts pulled apart. ${copy.tradeoff}${scale}`,
    };
  }
  const dir = lean > 0 ? copy.highIs : copy.lowIs;
  // Magnitude ladder — evaluated on the QUANTIZED lean in both paths (the
  // owner's raw lean is quantized here, the share code stores it quantized),
  // so owner and shared documents always pick the same qualifier.
  const leanQ = Math.round(lean * 70) / 70;
  const gap = Math.abs(leanQ);
  // Magnitude ladder: the size of the disagreement changes the reading.
  const qualifier = gap >= 1.0
    ? 'That is a wide split — two of your operating values are in open conflict here, and one of them is currently winning by default.'
    : gap >= 0.6
      ? 'That is not a wobble — a real fork in how you operate.'
      : 'That is a narrow disagreement — close to the threshold, worth knowing, not worth over-reading.';
  // Lead-in rotation (seeded): same finding, different sentence path, so two
  // people's documents don't open every tension card identically.
  const leads = [
    `Two scenarios probed ${copy.territory} from different angles — ${copy.a}, then ${copy.b} — and your instincts disagreed. Read together, they suggest ${dir}.`,
    `The same territory looked different twice: ${copy.a} in one scenario, then ${copy.b} — and your answers split. Read side by side, they point to ${dir}.`,
    `${copy.a[0].toUpperCase() + copy.a.slice(1)} — and then, from the other side, ${copy.b}. On ${copy.territory}, your instincts pulled apart, and the split reads as ${dir}.`,
  ];
  const lead = leads[Math.floor(Math.abs(Math.sin(hash(c.a + c.b) + runSeed) * 10000)) % leads.length];
  return {
    title: `Two readings of ${copy.territory}`,
    body: `${lead} ${qualifier} ${copy.tradeoff}${scale}`,
  };
}
