import type { Blueprint, BlueprintSection, ConsistencyPair, DimensionId, ScoredProfile } from './types';
import { DIMENSION_LABELS } from './types';
import { DIMENSIONS, TIERS, TIER_LABELS, tierOf, VARIANCE_LIBRARY, genericVarianceFor } from './dimensions';
import { seededPick, hash, CHANNEL_LABELS, isInternallyDivided } from './scoring';
import { buildPatternPlan, renderPattern } from './patterns';

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
function paragraphFor(dim: DimensionId, score: number): string {
  const def = DIMENSIONS.find((d) => d.id === dim);
  if (!def) return '';
  const tier = tierOf(score);
  const variants = def[tier];
  const seed = hash(dim + String(Math.round(score / 7)));
  return calibrate(varyTierOpener(seededPick(variants, seed), seed));
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
function alignmentParagraphFor(p: ScoredProfile): string {
  const { express, receive } = p.channels;
  if (express && !receive && (p.receiveBreadth ?? 0) >= 3) {
    const name = (c: string) => CHANNEL_LABELS[c] ?? c;
    return `Your giving runs through one flagship channel — ${name(express)} — while your receiving side reads as a wide dictionary: care lands in whatever register it is offered. That combination is generous in both directions, and it carries one specific risk: a partner may assume your way of giving is also your way of needing, and never discover the breadth on the other side. The bridge is the same as ever — tell them when something lands, in whichever register it arrived.`;
  }
  if (express && receive && express !== receive) {
    const name = (c: string) => CHANNEL_LABELS[c] ?? c;
    return `Your giving and receiving profiles overlap in breadth — you speak and hear several registers of care — but your flagship channels differ: you give most naturally through ${name(express)}, while what lands hardest arrives through ${name(receive)}. Breadth and emphasis are different measurements, and both are real; the single-channel asymmetry is named in the tensions below, because it is the one worth a dictionary exchange.`;
  }
  const s = p.dimensions.express_receive_alignment?.score;
  return s === undefined ? '' : paragraphFor('express_receive_alignment', s);
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
  if (!v) return null;
  const d = p.dimensions[dim];
  if (!d || d.unmeasured) return null;
  const t = tierOf(d.score);
  if (t !== 'mid' && t !== 'mlow' && t !== 'mhigh') return null;
  if (!isInternallyDivided(v)) return null;
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
  /** Score-keyed heading variants — first match wins; static heading is the fallback. */
  headings?: { when: (p: ScoredProfile) => boolean; text: string }[];
  dims: DimensionId[];
  /** Opening line woven before the dimension paragraphs. */
  intro?: (p: ScoredProfile) => string;
}

const SECTION_SPECS: SectionSpec[] = [
  {
    id: 'understanding',
    heading: 'Being Understood',
    headings: [
      { when: (p) => ti(p, 'listening_first') >= 5, text: 'The One They Talk To First' },
      { when: (p) => ti(p, 'perspective_taking') <= 1, text: 'Where Interpretation Goes Wrong' },
    ],
    dims: ['perspective_taking', 'listening_first', 'logic_emotion_integration', 'capitalization', 'feedback_receiving'],
    intro: () =>
      'One of the biggest things for you appears to be how interpretation happens — what you do in the space between someone\'s behavior and your conclusion about it.',
  },
  {
    id: 'communication',
    heading: 'Communication Without Games',
    headings: [
      { when: (p) => ti(p, 'direct_communication') >= 5, text: 'Plain Speech as a Policy' },
      { when: (p) => ti(p, 'direct_communication') <= 1, text: 'How Truth Travels, Carefully' },
    ],
    dims: ['direct_communication', 'curiosity_worlds'],
    intro: () =>
      'Your answers describe a specific contract you tend to make with the people you love about how truth travels between you.',
  },
  {
    id: 'safety',
    heading: 'Feeling Safe, Being Safe',
    headings: [
      { when: (p) => ti(p, 'vulnerability_safety') >= 5, text: 'What It Takes to Be Seen' },
      { when: (p) => ti(p, 'reassurance_security') >= 5, text: 'Being Safe, Being Steadied' },
      { when: (p) => ti(p, 'vulnerability_safety') <= 1, text: 'The Vault and Its Keeper' },
    ],
    dims: ['vulnerability_safety', 'reassurance_security'],
    intro: () =>
      'Safety shows up in your answers as something with two halves: how you hold what others give you, and what steadies you when you\'re the one exposed.',
  },
  {
    id: 'reciprocity',
    heading: 'Love Going Both Ways',
    headings: [
      { when: (p) => ti(p, 'scorekeeping') >= 5, text: 'Giving Without an Invoice (Almost)' },
      { when: (p) => ti(p, 'scorekeeping') <= 1, text: 'The Ledger-Free Heart' },
      { when: (p) => ti(p, 'receiving_comfort') <= 1, text: 'Better at Giving Than Taking' },
    ],
    dims: ['care_initiation', 'receiving_comfort', 'scorekeeping'],
    intro: () =>
      'This is where your answers were most consistent: what you do with care — giving it, receiving it, and whether it turns into an accounting problem.',
  },
  {
    id: 'hard_days',
    heading: 'The Days When Nobody Is at 100%',
    headings: [
      { when: (p) => ti(p, 'repair_orientation') >= 5, text: 'Always Circling Back' },
      { when: (p) => ti(p, 'conflict_engagement') <= 1, text: 'How You Fight: By Not Fighting' },
    ],
    dims: ['same_side_problems', 'conflict_engagement', 'repair_orientation', 'shared_home_effort'],
    intro: () =>
      'Every relationship eventually meets exhaustion, breakage, and bad luck. Your answers describe what those days bring out in you.',
  },
  {
    id: 'closeness',
    heading: 'Closeness and Being Wanted',
    headings: [
      { when: (p) => ti(p, 'affection_daily') >= 5 && ti(p, 'desire') >= 5, text: 'Running Warm' },
      { when: (p) => ti(p, 'affection_daily') <= 1, text: 'Closeness at a Chosen Temperature' },
    ],
    dims: ['affection_daily', 'desire', 'desire_initiation', 'intimacy_attunement', 'sexual_communication', 'positivity_play', 'express_receive_alignment'],
    intro: () =>
      'Your answers sketch how closeness actually travels in and out of you — through what channel, at what volume, how you keep attraction alive, and how much of the relationship\'s lightness is tended.',
  },
  {
    id: 'independence',
    heading: 'Two People, One Life',
    headings: [
      { when: (p) => ti(p, 'autonomy_connection') >= 5, text: 'Two Whole People' },
      { when: (p) => ti(p, 'autonomy_connection') <= 1, text: 'Where You End and They Begin' },
    ],
    dims: ['autonomy_connection', 'commitment_sacrifice', 'money_coordination'],
    intro: () =>
      'Finally, the shape of the life itself: how much of you stays yours inside a relationship, and how the two of you carry the costs of a shared life.',
  },
  {
    id: 'privacy',
    heading: 'What Belongs to the Two of You',
    headings: [
      { when: (p) => ti(p, 'relational_privacy') >= 4, text: 'A Room With Two Chairs' },
      { when: (p) => ti(p, 'relational_privacy') <= 1, text: 'A Life Lived Out Loud' },
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
      return `Your answers show you give most naturally through ${name(exp)} — and on the receiving side, something rarer: each care question named a different channel, which reads less like an unreadable dictionary and more like a wide one. Care appears to reach you in whatever register it is offered. The risk flips accordingly: not starvation, but a partner never learning which gesture mattered most — so tell them, when something lands.`;
    }
    return `Your answers show you give most naturally through ${name(exp)}. What the answers say less clearly is which channel reaches you when you're the one who needs care — worth watching for, and worth telling the people close to you.`;
  }
  return rec
    ? `The care that reaches you most strongly comes through ${name(rec)}. What your answers say less clearly is how you naturally give it — worth noticing which gestures you reach for first, because that is usually your native dialect.`
    : `Neither direction of your love dialect came through clearly in the channel questions — worth noticing, over the next while, which gestures you reach for first and which ones land hardest when they arrive.`;
}

export function generateBlueprint(p: ScoredProfile): Blueprint {
  const sections: BlueprintSection[] = [];

  // Derived patterns: cross-dimension readings ranked by confidence × priority.
  // Synthesis patterns headline the Crosscurrents section; the rest render
  // inline where their placement says the reading belongs.
  const plan = buildPatternPlan(p);

  for (const spec of SECTION_SPECS) {
    // Score-keyed heading: the first matching variant wins; static is fallback.
    const heading = spec.headings?.find((h) => h.when(p))?.text ?? spec.heading;
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
      paragraphs.push(dim === 'express_receive_alignment' ? alignmentParagraphFor(p) : paragraphFor(dim, s));
      // Thin-evidence honesty: a tier paragraph carried by one or two answers
      // reads as confident temperament it hasn't earned. Say so, gently,
      // instead of letting two data points speak in generalities.
      const nContrib = p.variance?.[dim]?.contributions.length;
      if (nContrib !== undefined && nContrib <= 3) {
        const last = paragraphs[paragraphs.length - 1];
        paragraphs[paragraphs.length - 1] = `Worth reading gently — this dimension rests on the fewest answers in your run (${nContrib} ${nContrib === 1 ? 'answer carries' : 'answers carry'} it, where most others have many more): ${last}`;
      }
      // Derived patterns render at their placement point (a co-occurring score
      // changes this paragraph's meaning), then legacy interplay covers
      // combinations the pattern library doesn't reach.
      const spotKey = `${spec.id}:${dim}`;
      for (const h of plan.sections.get(spotKey) ?? []) paragraphs.push(...renderPattern(h, 'section'));
      const ip = interplayFor(dim, p);
      if (ip) paragraphs.push(varyInterplayOpener(ip, hash(dim + 'ip')));
      // Variance note last: after the tier prose and its contextual reads,
      // reveal what the average was hiding (mid scores built from opposites).
      const vn = varianceNoteFor(dim, p);
      if (vn) paragraphs.push(vn);
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
    sections.push({ id: spec.id, heading, paragraphs, headingAdaptive: heading !== spec.heading });
  }

  // ── Crosscurrents: the headline layer of derived patterns ──
  // Top-ranked synthesis patterns lead with their bolded frame lines. Capped
  // at three so the section reads as "the interactions that matter most in
  // your profile", not every qualifying combination.
  if (plan.headline.length > 0) {
    sections.push({
      id: '__crosscurrents',
      heading: 'Crosscurrents',
      paragraphs: plan.headline.flatMap((h) => renderPattern(h, 'headline')),
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
      const card = pairTensionCard(c, p);
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

  // ── Synthesis: "A relationship that may feel natural to you" ──
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

  const highs = (Object.values(p.dimensions) as { id: DimensionId; score: number; unmeasured?: boolean }[])
    .filter((d) => d.score >= 62 && d.id !== 'express_receive_alignment' && !d.unmeasured)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((d) => noteFor(d.id, d.score).toLowerCase());
  const synthesis: string[] = [
    leadIn,
    'Based on your answers, a relationship that may feel natural to you would probably involve ' +
      (highs.length > 0
        ? highs.join('; ') + '.'
        : 'a careful balance across all of these — your answers sit closer to the middle than the extremes, which suggests someone still assembling their own picture of what closeness should look like.'),
    'None of this is a verdict. It\'s a description of a pattern — drawn from dozens of small decisions you made about imaginary people, which is usually where real instincts live. Some of it will land as obviously you. Some of it will feel slightly off. Both reactions are useful: the parts that ring true are worth saying out loud to the people close to you, and the parts that don\'t are worth arguing with.',
  ];
  sections.push({ id: '__synthesis', heading: 'A Relationship That May Feel Natural to You', paragraphs: synthesis });

  // ── Closing ──
  const metaAvg = p.metas.reduce((s, m) => s + m.score, 0) / p.metas.length;
  // Consistency-aware bridge: the first closing line is keyed to how the run
  // actually held together, so the summary line reflects THIS data.
  const bridge = (() => {
    const conflicted = p.consistency.filter((c) => c.agreement < 50 && c.dimension !== 'ambiguity_update').length;
    if (p.consistencyIndex >= 78) return 'When everything here is put side by side, a consistent picture remains:';
    if (conflicted >= 2) return `Putting everything side by side, a picture remains — drawn from answers that agreed ${p.consistencyIndex}% of the time, and disagreed exactly where two of your values are still negotiating the lead:`;
    if (conflicted === 1) return 'Putting everything side by side, a picture remains — one your answers mostly confirmed, with a single honest dissension named above:';
    return `Putting everything side by side, a picture remains — steady enough to trust, drawn from ${p.consistencyIndex}% self-agreement:`;
  })();
  let closing: string[];
  if (metaAvg >= 62) {
    closing = [
      `${bridge} someone who wants mutuality at the core. Not perfectly equal every day, and not measured gesture for gesture — but mutual in the sense that both people genuinely want each other to feel loved, wanted, safe, and cared for.`,
      'You want to give without an invoice and receive without an apology. You want the ordinary evenings to count. You want to be someone\'s person, visibly, and to have them be yours.',
      '**I am loved here. I am wanted here. I matter here. And I want to make sure you feel the same way.**',
    ];
  } else if (metaAvg >= 45) {
    closing = [
      `${bridge.replace(':', ' —')} someone who wants mutuality and is still deciding how much of themselves to bet on it. The instincts toward care are there; the questions are about safety, debt, and who moves first.`,
      'That\'s not a smaller want. It\'s often just a more guarded one — and naming the guard is how it becomes a door instead of a wall.',
      '**I want to be loved here. I\'m still learning to believe I\'m wanted here. And I\'m working on making sure you feel the same way.**',
    ];
  } else {
    closing = [
      `${bridge.replace(':', ' —')} someone for whom self-protection is currently louder than mutuality — ledgers, deflection, and independence show up more often than reaching and receiving. That pattern usually has good reasons behind it.`,
      'The useful question isn\'t whether it\'s right or wrong. It\'s whether it\'s still the shape you want, or just the shape you learned.',
      '**I am careful here. I am safe here. And I\'m still deciding how much of me you get to hold.**',
    ];
  }

  // ── Epigraph: keyed to the most distinctive signal in the profile ──
  const dimsArr = (Object.values(p.dimensions) as { id: DimensionId; score: number; unmeasured?: boolean }[]).filter(
    (d) => d.id !== 'express_receive_alignment' && !d.unmeasured,
  );
  const topHigh = [...dimsArr].sort((a, b) => b.score - a.score)[0];
  const topLow = [...dimsArr].sort((a, b) => a.score - b.score)[0];

  const EPIGRAPH_BY_LOW: Partial<Record<DimensionId, string>> = {
    receiving_comfort: 'Loves loudly, receives carefully.',
    scorekeeping: 'Someone who loves in actions and counts in silences.',
    direct_communication: 'Careful where it counts, direct where it matters.',
    desire: 'A quiet interior that wants, without announcing it.',
    affection_daily: 'Closeness held at a chosen temperature.',
    perspective_taking: 'Reads fast, trusts slowly.',
    relational_privacy: 'A life the two of you keep between you.',
    sexual_communication: 'Feels deeply, says less where it counts most.',
    capitalization: 'Loves steadily; celebrates quietly.',
    commitment_sacrifice: 'Carries an internal audit alongside the giving.',
    money_coordination: 'Keeps the books; means well by it.',
  };
  const EPIGRAPH_BY_HIGH: Partial<Record<DimensionId, string>> = {
    care_initiation: 'Notices first, moves first — love as anticipation.',
    repair_orientation: 'Always circling back.',
    listening_first: 'A safe place to fall apart.',
    same_side_problems: 'Same side of everything.',
    affection_daily: 'Fluent in the small touches.',
    vulnerability_safety: 'A vault people trust without checking.',
    autonomy_connection: 'Two whole people, choosing each other daily.',
    curiosity_worlds: 'Interest as a form of love.',
    relational_privacy: 'Keeps what matters between you.',
    sexual_communication: 'Nothing unsayable, even there.',
    positivity_play: 'Gardens fun; plants the plan nobody knew they wanted.',
    capitalization: 'Where joy goes to land.',
    conflict_engagement: 'Curious even mid-argument.',
    commitment_sacrifice: 'Backs people — visibly, without an invoice.',
    money_coordination: 'Talks about money like a teammate.',
  };

  let epigraph: string;
  if (topLow && topLow.score <= 36 && EPIGRAPH_BY_LOW[topLow.id]) {
    epigraph = EPIGRAPH_BY_LOW[topLow.id]!;
  } else if (topHigh && topHigh.score >= 70 && EPIGRAPH_BY_HIGH[topHigh.id]) {
    epigraph = EPIGRAPH_BY_HIGH[topHigh.id]!;
  } else {
    const fallbacks = [
      'A steady presence that wants, quietly, to be chosen back.',
      'Direct where it matters, careful where it counts.',
      'Loves specifically, not generally.',
      'Built for the ordinary evenings.',
    ];
    epigraph = seededPick(fallbacks, hash((topHigh?.id ?? 'x') + String(p.consistencyIndex)));
  }

  const bands = (Object.values(p.dimensions) as { id: DimensionId; score: number; unmeasured?: boolean }[]).map((d) => ({
    id: d.id,
    label: DIMENSION_LABELS[d.id],
    score: d.score,
    tierLabel: d.unmeasured ? undefined : TIER_LABELS[tierOf(d.score)],
    unmeasured: d.unmeasured,
  }));

  // One calibration pass over everything the reader will see: the
  // evidence-distance rule applies to the final text, wherever it was built.
  const calibratedSections = sections.map((s) => ({
    ...s,
    paragraphs: s.paragraphs.map(calibrate),
  }));
  const calibratedTensions = tensions.map((t) => ({ title: t.title, body: calibrate(t.body) }));
  const calibratedClosing = closing.map(calibrate);

  return { epigraph, sections: calibratedSections, bands, tensions: calibratedTensions, closing: calibratedClosing };
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
  lines.push('## A Relationship That May Feel Natural to You');
  lines.push('');
  const synthesis = bp.sections.find((s) => s.id === '__synthesis');
  if (synthesis) {
    for (const para of synthesis.paragraphs) {
      lines.push(para);
      lines.push('');
    }
  }
  lines.push('## The Short Version');
  lines.push('');
  for (const para of bp.closing) {
    lines.push(para);
    lines.push('');
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
    b: 'a group chat trading screenshots of fights, where yours would be content',
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
function pairTensionCard(c: ConsistencyPair, p: ScoredProfile): Blueprint['tensions'][number] | null {
  const copy = PAIR_TENSION_LIBRARY[c.a + '|' + c.b] ?? PAIR_TENSION_LIBRARY[c.b + '|' + c.a];
  if (!copy) return null;
  const dimScore = p.dimensions[c.dimension as DimensionId]?.score;
  const scale =
    dimScore !== undefined && !p.dimensions[c.dimension as DimensionId]?.unmeasured
      ? ` Where this sits overall: the ${DIMENSION_LABELS[c.dimension as DimensionId]?.toLowerCase() ?? 'territory'} reads ${tierLabelFor(dimScore)} on this dimension — the disagreement is about which pull leads, not whether the trait is present.`
      : '';

  const posA = c.positionA;
  const posB = c.positionB;
  if (posA === undefined || posB === undefined) {
    // Imported profile (share code): no raw answers, so no direction — be
    // honest about the disagreement without inventing which way it leaned.
    return {
      title: `Two readings of ${copy.territory}`,
      body: `Two scenarios probed ${copy.territory} from different angles — ${copy.a}, then ${copy.b} — and your instincts pulled apart. The share code carries scores, not the reasoning behind them, so this document can't tell you which way the disagreement leaned. ${copy.tradeoff}${scale}`,
    };
  }
  const lean = posB - posA; // sign picks the direction; magnitude picks the phrasing
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
  const gap = Math.abs(lean);
  // Magnitude ladder: the size of the disagreement changes the reading.
  const qualifier = gap >= 1.0
    ? 'That is a wide split — two of your operating values are in open conflict here, and one of them is currently winning by default.'
    : gap >= 0.6
      ? 'That is not a wobble — a real fork in how you operate.'
      : 'That is a narrow disagreement — close to the threshold, worth knowing, not worth over-reading.';
  return {
    title: `Two readings of ${copy.territory}`,
    body: `Two scenarios probed ${copy.territory} from different angles — ${copy.a}, then ${copy.b} — and your instincts disagreed. Read together, they suggest ${dir}. ${qualifier} ${copy.tradeoff}${scale}`,
  };
}
