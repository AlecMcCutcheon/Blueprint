// One-shot migration: rebuild src/domain/dimensions.ts at 7-tier resolution.
// Extracts the intact legacy prose region from the current (structurally broken)
// file and reassembles a clean module around it.
import { readFileSync, writeFileSync } from 'fs';

const src = readFileSync('src/domain/dimensions.ts', 'utf8');
// The broken edits ate the first entry's opening brace, so anchor on the id line
// and restore the brace when assembling.
const anchor = "    id: 'affection_daily',";
const start = src.indexOf(anchor);
const end = src.lastIndexOf('];');
if (start === -1 || end === -1) {
  console.error('region not found');
  process.exit(1);
}
const region = '  {' + src.slice(start, end).trimEnd().replace(/,\s*$/, '');
console.log('region chars:', region.length, '| dims:', (region.match(/id: '/g) || []).length);

const header = `import type { DimensionId } from './types';

/**
 * Score bands: 7 tiers — deliberately more granular than low/mid/high. Clinical
 * instruments read T-score zones, not triads (MMPI: 30-70 normal, cutoffs at
 * 65+); PSYCHOMETRIC_AUDIT section 3 flagged the 3-band compression as the main
 * resolution loss. Tiers also mirror the research practice of interpreting
 * PROFILES rather than isolated scale points (Furr; Lievens 2017): each tier
 * paragraph is written to survive having its score neighbor a very different
 * one, because blueprint.ts appends interplay passages at build time.
 */
export type TierId = 'vlow' | 'low' | 'mlow' | 'mid' | 'mhigh' | 'high' | 'vhigh';
export const TIERS: TierId[] = ['vlow', 'low', 'mlow', 'mid', 'mhigh', 'high', 'vhigh'];
/** Exclusive upper bounds of each tier (vlow < 22 <= low < 35 <= ... <= vhigh <= 100). */
export const TIER_BOUNDS: number[] = [22, 35, 48, 62, 75, 88, 100];

export function tierOf(score: number): TierId {
  for (let i = 0; i < TIERS.length; i++) {
    if (score < TIER_BOUNDS[i]) return TIERS[i];
  }
  return 'vhigh';
}

export const TIER_LABELS: Record<TierId, string> = {
  vlow: 'A quiet channel',
  low: 'Low',
  mlow: 'Leaning low',
  mid: 'Middle ground',
  mhigh: 'Leaning high',
  high: 'High',
  vhigh: 'A defining channel',
};

export interface DimensionNarrative {
  id: DimensionId;
  domain: string;
  /** What this dimension actually measures — shown on the review screen. */
  what: string;
  /** Narrative paragraph per tier. Arrays = variants (seeded pick). */
  vlow: string[];
  low: string[];
  mlow: string[];
  mid: string[];
  mhigh: string[];
  high: string[];
  vhigh: string[];
  /** One-line readouts shown in tooltips / review screen. */
  notes: Record<TierId, string>;
  /**
   * Conditional interplay passages: key \`Other:tier\` -> paragraph shown when
   * dimension Other's tier is at least the numeric tier (mhigh = 2, high = 3,
   * vhigh = 4; TIERS.indexOf). Evaluated in key order; first applicable key
   * wins. A high affection score next to a low play score must read
   * differently than either alone.
   */
  interplay?: Record<string, string>;
}

/** Narrative voice follows the founding values document: second person, plain, warm, no clinical jargon,
 * no moral ranking — every tier is a coherent way of loving, with tradeoffs. */

/** Pre-expansion entry shape (3 bands), retained as the authoring source. */
interface LegacyNarrative {
  id: DimensionId;
  domain: string;
  what: string;
  low: string[];
  mid: string[];
  high: string[];
  lowNote: string;
  midNote: string;
  highNote: string;
}

export const LEGACY: LegacyNarrative[] = [
`;

const footer = `,
];

/**
 * Hand-authored per-dimension tier modifiers — real sentences about this
 * dimension at that intensity, appended to the nearest legacy paragraph so
 * all seven tiers read distinctly. Short forms feed the one-line readouts.
 */
const TIER_MODIFIERS: Partial<Record<DimensionId, { vlow: string; mlow: string; mhigh: string; vhigh: string; vlowShort: string; vhighShort: string }>> = {
  affection_daily: {
    vlow: 'At this end of the scale, touch is rare enough that when it happens, it registers as an event — worth noticing how much of that is choice and how much is habit wearing choice\\'s clothes.',
    mlow: 'Even here, the channel is not closed — it runs at a trickle, and trickle is not the same as off.',
    mhigh: 'You sit just under the high expressers — the flow is there, and a nudge of intention would make it ambient.',
    vhigh: 'At this intensity, touch is not something you do — it is part of how you think out loud, and its absence reads to you like silence mid-sentence.',
    vlowShort: 'Touch as rare punctuation',
    vhighShort: 'Touch as first language',
  },
  desire: {
    vlow: 'Here, wanting to be wanted is nearly inaudible — close enough to indifference that a partner would need the dictionary to tell the difference.',
    mlow: 'The wish exists but rarely speaks first — it tends to surface only when it has gone unfed for a while.',
    mhigh: 'The appetite for being desired is nearly constant — a notch more and it would organize the whole relationship.',
    vhigh: 'At this intensity, being wanted is the thermometer you read the whole relationship by — its absence is never neutral information.',
    vlowShort: 'Want runs quiet',
    vhighShort: 'Want as thermometer',
  },
  vulnerability_safety: {
    vlow: 'Here the vault is shut by default — a partner lives outside the walls, and the wall is old enough to feel like architecture rather than decision.',
    mlow: 'Admission happens, but sparingly, and usually after long evidence-gathering.',
    mhigh: 'The door is nearly always open — one more notch and being seen would be your default state.',
    vhigh: 'At this intensity, being fully seen is not a risk you take — it is the condition that makes closeness real, and hiddenness feels like the actual danger.',
    vlowShort: 'Vault by default',
    vhighShort: 'Seen as baseline',
  },
  reassurance_security: {
    vlow: 'Here, reassurance is barely on your inventory — you run on internal settlement, and a partner may misread that independence as not needing them at all.',
    mlow: 'You rarely need the words, but their absence accumulates quietly.',
    mhigh: 'You sit just under the reassurance-seeking band — the need is real and mostly speaks through checking behaviors.',
    vhigh: 'At this intensity, reassurance is oxygen — the question is not whether you need it but whether the asking has found a voice that can be answered.',
    vlowShort: 'Internally settled',
    vhighShort: 'Reassurance as oxygen',
  },
  sexual_communication: {
    vlow: 'Here the channel is essentially sealed — the most consequential conversations of intimacy happen entirely inside your head.',
    mlow: 'Fragments escape — hints, indirect signals — but the map stays mostly undrawn.',
    mhigh: 'The channel is nearly open — most of the map is drawn, with a few marked regions left.',
    vhigh: 'At this intensity, nothing in intimacy is unsayable — the conversation itself is part of the pleasure, and silence would read as absence.',
    vlowShort: 'Channel sealed',
    vhighShort: 'Nothing unsayable',
  },
  positivity_play: {
    vlow: 'Here, cultivating fun is nearly absent — leisure happens to you rather than being gardened, and the flat stretches can quietly become the default.',
    mlow: 'You occasionally seed lightness, usually when your own reserves are full.',
    mhigh: 'You are nearly a habitual cultivator of fun — one notch up and it would be a role you own.',
    vhigh: 'At this intensity, play is infrastructure — you treat shared lightness as load-bearing, and its disappearance registers as structural damage.',
    vlowShort: 'Leisure happens to you',
    vhighShort: 'Play as infrastructure',
  },
  capitalization: {
    vlow: 'Here, good news largely passes unmarked — celebrations are small, late, or accidental, and joys lose altitude quickly.',
    mlow: 'You mark the big ones; the ordinary wins slip past unremarked.',
    mhigh: 'You are nearly a first stop for others\\' good news — the instinct is there and close to habitual.',
    vhigh: 'At this intensity, being where joy lands is a role you actively hold — active-constructive responding as a practiced craft.',
    vlowShort: 'Wins pass unmarked',
    vhighShort: 'Joy\\'s landing place',
  },
  care_initiation: {
    vlow: 'Here, care is almost entirely reactive — you respond when asked, and the noticing apparatus that anticipates needs is largely idle.',
    mlow: 'You sometimes move first, but usually after a cue you had to be given.',
    mhigh: 'You nearly always move first — one notch up and anticipation would be your signature.',
    vhigh: 'At this intensity, care runs ahead of need — you arrive before the asking, and being anticipated becomes the other person\\'s baseline expectation.',
    vlowShort: 'Care on request',
    vhighShort: 'Care ahead of need',
  },
  receiving_comfort: {
    vlow: 'Here, receiving is nearly closed — care offered to you finds no landing, and givers eventually stop offering, which quietly confirms the seal.',
    mlow: 'You let some care in, with an apology attached.',
    mhigh: 'You receive more easily than not — one notch up and the waving-off would disappear.',
    vhigh: 'At this intensity, receiving is a gift you give back — you let care land visibly, completing the circuit the giver started.',
    vlowShort: 'Receiving nearly closed',
    vhighShort: 'Receiving as gift',
  },
  scorekeeping: {
    vlow: 'Here the ledger is genuinely absent — you give and receive with no running account, which is rarer than people claim and comes with its own blind spots.',
    mlow: 'Only the largest imbalances register — the small ones vanish.',
    mhigh: 'The ledger exists but stays mostly shut — you notice patterns before you ever cite them.',
    vhigh: 'At this intensity, the account runs in real time — the work is not pretending it away but choosing what it is allowed to bill.',
    vlowShort: 'No ledger',
    vhighShort: 'Ledger in real time',
  },
  listening_first: {
    vlow: 'Here, listening is the exception — solutions, reframes, or your own story arrive before their sentence ends.',
    mlow: 'You listen, but the fix reflex sits close behind.',
    mhigh: 'You nearly always listen before solving — one notch up and presence would be your reflex.',
    vhigh: 'At this intensity, being heard happens before anything else in your presence — people finish sentences they did not know they were holding.',
    vlowShort: 'Fix first',
    vhighShort: 'Heard before anything',
  },
  logic_emotion_integration: {
    vlow: 'Here the two channels barely touch — problems get analyzed or felt, rarely both, and the unchosen register stays foreign.',
    mlow: 'You visit the other channel, but it is a second language spoken with an accent.',
    mhigh: 'You nearly always translate across registers — one notch up and the translation would be seamless.',
    vhigh: 'At this intensity, you metabolize experience in both directions at once — analysis that carries feeling, feeling that carries structure.',
    vlowShort: 'Two sealed registers',
    vhighShort: 'Fluent in both',
  },
  curiosity_worlds: {
    vlow: 'Here, other people\\'s worlds get courtesy rather than exploration — you notice the enthusiasm without entering it.',
    mlow: 'You enter occasionally, mostly out of care for the person rather than the territory.',
    mhigh: 'You are nearly a habitual explorer of their worlds — one notch up and interest would outrun duty entirely.',
    vhigh: 'At this intensity, their world is a place you actively live in — interest as a sustained practice, not a gesture.',
    vlowShort: 'Courtesy, not exploration',
    vhighShort: 'Living in their world',
  },
  perspective_taking: {
    vlow: 'Here, your own frame wins by default — their side arrives late, if at all, and conflict resolves on strength rather than understanding.',
    mlow: 'You can take their side when reminded to; it does not volunteer.',
    mhigh: 'Benefit of the doubt is nearly your default — one notch up and it would be unconditional.',
    vhigh: 'At this intensity, you hold their frame alongside yours effortlessly — the risk is not unfairness to them but forgetting your own corner.',
    vlowShort: 'Own frame wins',
    vhighShort: 'Both frames at once',
  },
  direct_communication: {
    vlow: 'Here, the real subject stays off the table — conversations happen around the thing rather than about it.',
    mlow: 'Directness appears for small things; the load-bearing topics route around.',
    mhigh: 'You are nearly a plain speaker across the board — one notch up and nothing would be unsayable.',
    vhigh: 'At this intensity, directness is structural — the real thing is said, kindly, the first time, and games are not a language you speak.',
    vlowShort: 'Around the subject',
    vhighShort: 'Said first time, kindly',
  },
  repair_orientation: {
    vlow: 'Here, ruptures heal by time alone or not at all — the return never quite happens, and distance quietly becomes the settlement.',
    mlow: 'You circle back eventually, usually long after the wound set.',
    mhigh: 'You nearly always come back — one notch up and repair would be immediate.',
    vhigh: 'At this intensity, you cannot leave things broken — the return is fast, practiced, and something partners describe as the safest thing about you.',
    vlowShort: 'Heals by time or not',
    vhighShort: 'The fast return',
  },
  same_side_problems: {
    vlow: 'Here, problems arrive as yours-and-mine — the issue gets assigned to a person before it gets solved as a team.',
    mlow: 'You find the shared side for the big problems; the small ones still get owners.',
    mhigh: 'Same-side is nearly your reflex — one notch up and blame would have nowhere to land.',
    vhigh: 'At this intensity, it is structurally us-versus-it — problems get externalized so fast that conflict itself changes shape around you.',
    vlowShort: 'Problems have owners',
    vhighShort: 'Us versus it',
  },
  conflict_engagement: {
    vlow: 'Here, conflict is mostly absence — you yield or exit, and the disagreement resolves by forfeit rather than by engagement.',
    mlow: 'You engage when pushed; the default is still retreat.',
    mhigh: 'You stay in the ring nearly every time — one notch up and curiosity would hold even at full heat.',
    vhigh: 'At this intensity, you engage at full heat without losing the thread — arguments become places you work rather than places you flee.',
    vlowShort: 'Resolves by forfeit',
    vhighShort: 'Works the heat',
  },
  autonomy_connection: {
    vlow: 'Here, closeness and independence feel like a fight — the relationship tends to absorb everything, and the self runs thin.',
    mlow: 'You keep some separate ground, but it erodes under pressure.',
    mhigh: 'The two lives run nearly in parallel by design — one notch up and it would be fully settled.',
    vhigh: 'At this intensity, the two-whole-people model is law — the risk is not losing yourself but a partner misreading space as distance.',
    vlowShort: 'Self runs thin',
    vhighShort: 'Two whole people, by design',
  },
  shared_home_effort: {
    vlow: 'Here, the invisible work goes mostly unnegotiated — it piles onto whoever notices it, and resentment finds the seam.',
    mlow: 'Splitting happens, but by drift rather than design.',
    mhigh: 'You are nearly a designed-system household — one notch up and nothing would run on noticing alone.',
    vhigh: 'At this intensity, the household runs like a shared project — the mental load is named, owned, and revisable out loud.',
    vlowShort: 'Runs on noticing',
    vhighShort: 'Designed, named, owned',
  },
  relational_privacy: {
    vlow: 'Here, the relationship lives in the wide circle by default — most things get processed out loud with others, sometimes before they are processed between you.',
    mlow: 'The two-person frame holds for heavy things; the ordinary flows outward.',
    mhigh: 'The frame is nearly firm — one notch up and audiences would be excluded on principle.',
    vhigh: 'At this intensity, the boundary is near-absolute — counsel is invited, audiences never, and the two-person room is where everything lands first.',
    vlowShort: 'Wide circle by default',
    vhighShort: 'Near-absolute frame',
  },
  express_receive_alignment: {
    vlow: 'Here, the giving and receiving dictionaries barely overlap — you speak one language of care and listen in another.',
    mlow: 'A partial translation layer exists — some of what you give, you can also take.',
    mhigh: 'The dictionaries nearly align — one notch up and the loop would close.',
    vhigh: 'At this intensity, what you give and what lands are the same dialect — a symmetry that makes love unusually legible in both directions.',
    vlowShort: 'Two dictionaries',
    vhighShort: 'One dialect',
  },
  commitment_sacrifice: {
    vlow: 'Here, giving runs on a short leash — the internal invoice arrives quickly, and sacrifice stays rare and priced.',
    mlow: 'You give, but the value-check runs quietly behind most of it.',
    mhigh: 'Your giving mostly settles its own books — one notch up and the audit would fall silent.',
    vhigh: 'At this intensity, you back people all the way in — the giving is constitutive of who you are, which makes choosing whom to give it to the real question.',
    vlowShort: 'Short leash',
    vhighShort: 'All the way in',
  },
  money_coordination: {
    vlow: 'Here, money is unmarked territory — spending legitimacy is decided ad hoc, and the silences around it do the deciding.',
    mlow: 'Some norms exist; they are implicit and rarely revisited.',
    mhigh: 'You are nearly a teammate about money — one notch up and it would be fully on the table.',
    vhigh: 'At this intensity, money is simply teamwork — visible, revisable, and free of double standards, which is rarer than it sounds.',
    vlowShort: 'Unmarked territory',
    vhighShort: 'Money as teamwork',
  },
};

/**
 * Cross-dimension interplay passages (the core ask): a dimension never reads
 * in isolation. Keys are \`Other:tier\`; first applicable key wins.
 * Grounding: interpreted profiles beat isolated traits (Furr; Lievens 2017);
 * communal strength (Clark & Mills) predicts giving without ledgers; Gable:
 * capitalization gains require active-constructive reception; Gottman: bids
 * and repair are the load-bearing couple mechanics.
 */
const INTERPLAY_LIBRARY: Partial<Record<DimensionId, Record<string, string>>> = {
  affection_daily: {
    'positivity_play:1': 'Read against your low score for cultivating lightness: your affection arrives as steady warmth without much play in it — devotion expressed as maintenance. Some partners read that as deep reliability; some miss the spark and call it seriousness. Naming the blend out loud is what turns it from a mystery into a style.',
    'positivity_play:3': 'Read against your high score for lightness and play: your affection and your fun feed each other — the touch carries jokes, the jokes carry touch. This combination is unusually self-sustaining; the two of you will rarely run out of shared weather.',
    'desire:3': 'Read against your high score for being wanted: your ambient touch and your appetite for being desired are the same signal in two dialects — physical closeness is how you both give and measure want. A partner who withholds touch while claiming love will leave you uniquely unsteady.',
  },
  desire: {
    'affection_daily:1': 'Read against your low everyday-affection score: wanting to be wanted while rarely initiating touch is a distinctive loop — you tend to read others\\' physical initiative as the thermometer of your own desirability. The useful upgrade is telling a partner which of their small gestures actually register.',
    'autonomy_connection:3': 'Read against your high independence score: you want to be wanted and also want wide open space — these are compatible, but only if want is expressed in yours-and-mine frequencies rather than constant togetherness.',
  },
  vulnerability_safety: {
    'reassurance_security:3': 'Read against your high reassurance score: the vault opens and the checking continues — you show people your interior and then scan their faces for whether it cost you. Being seen and being reassured are different needs wearing similar clothes; separating them will tell you which one is actually hungry.',
    'relational_privacy:3': 'Read against your high privacy score: you are selectively transparent — wide open inside the two-person room, sealed outside it. This is a coherent and protective architecture as long as the person inside the room knows they are the only one in it.',
  },
  reassurance_security: {
    'vulnerability_safety:1': 'Read against your low vulnerability score: you want reassurance you cannot quite ask for — the checking runs while the sharing stays shallow. This loop tends to produce reassurance that does not land, because it is aimed at a self the other person has never fully seen.',
    'direct_communication:1': 'Read against your low directness score: reassurance needs and indirect speech compound — you signal instead of asking, and signals are easy to miss. The single highest-leverage sentence you could learn is a plain one: "I could use some reassurance today."',
  },
  sexual_communication: {
    'direct_communication:3': 'Read against your high directness score: you are plain-spoken everywhere except the bedroom — which suggests the constraint is not a communication deficit but a vulnerability cost specific to desire. The words exist; the risk is what they reveal.',
    'vulnerability_safety:3': 'Read against your high openness score: where you can be seen, you can also say — intimacy talk likely rides the same channel as your general openness, making you rarer than the population baseline.',
  },
  positivity_play: {
    'care_initiation:3': 'Read against your high care-initiation score: you plant both kinds of seeds — practical care and fun. Together they read as devotion with light in it. Watch the asymmetry risk: the caring seed gets noticed; the fun one gets expected.',
    'capitalization:1': 'Read against your low celebration score: you create lightness but may not receive it — you garden fun while letting wins pass unmarked. The fix is mechanical: treat good news as its own bid, answered with the same energy you give a Saturday plan.',
  },
  capitalization: {
    'care_initiation:1': 'Read against your low care-initiation score: you celebrate others\\' news more reliably than you anticipate their needs — showing up for joy is easier for you than showing up for drudgery. A partner pairing you with the reverse type should trade roles deliberately.',
    'listening_first:3': 'Read against your high listening score: you both hear people fully and mark their wins — the combination that makes people say "talking to you makes me feel interesting." It is rarer than it sounds and worth protecting.',
  },
  listening_first: {
    'logic_emotion_integration:1': 'Read against your single-register processing: you listen well in your home channel, but problems that arrive in the other register may still get a mismatched reply. The listening is real; the translation is what to work on.',
    'same_side_problems:3': 'Read against your high same-side score: listening plus externalizing is the gold-standard pair — you hear the problem out and then aim it at the world rather than each other.',
  },
  direct_communication: {
    'perspective_taking:1': 'Read against your low benefit-of-the-doubt score: plain speech without the charity pass can land harder than you intend. The words were honest; the missing piece is the frame that makes them hearable.',
    'repair_orientation:3': 'Read against your high repair score: direct plus returning is the combination conflict researchers would design on purpose — you say the real thing and you come back to finish it.',
  },
  repair_orientation: {
    'conflict_engagement:1': 'Read against your low conflict score: you repair well but engage little — the ruptures are tended, but the disagreements that cause them sometimes resolve by forfeit. Repair without engagement can leave real issues unargued.',
    'scorekeeping:3': 'Read against your high ledger score: repair gets harder when the ledger is running — apologies land on an open account. The ledger is not wrong; it just needs closing before returning can work.',
  },
  autonomy_connection: {
    'affection_daily:3': 'Read against your high affection score: you need both wide space and frequent touch — an unusual pairing that works when closeness is dense in the time you are together rather than constant across the week.',
    'commitment_sacrifice:1': 'Read against your priced-giving score: independence plus a running internal audit means shared plans get costed before they get wanted. Naming that in advance is kinder than discovering it mid-plan.',
  },
  shared_home_effort: {
    'scorekeeping:3': 'Read against your high ledger score: invisible work plus a running account is the exact recipe for kitchen-table resentment — the fix is moving the tally into speech before it becomes a bill.',
    'care_initiation:3': 'Read against your high anticipation score: you likely carry a large share of the noticing itself — the meta-work of seeing what needs doing. That is a gift that bills its owner; name the load to share it.',
  },
  relational_privacy: {
    'direct_communication:3': 'Read against your high directness: inside the two-person room you are fully plain-spoken — the privacy boundary is not about avoidance but about audience control. Rare and coherent.',
  },
  commitment_sacrifice: {
    'money_coordination:3': 'Read against your high teamwork score: your willingness to carry extends to shared finances without flinching — the pairing that makes big joint gambles survivable.',
    'scorekeeping:3': 'Read against your high ledger score: sacrifice with a running audit — you give big and remember big. The accounting is not stinginess; it is a fairness organ turned all the way up.',
  },
};

/**
 * The 24 dimensions, rebuilt at 7-tier resolution: legacy 3-band paragraphs
 * carry the tone; hand-authored modifiers differentiate the leaning and
 * extreme tiers; the interplay library conditions on co-occurring scores.
 */
export const DIMENSIONS: DimensionNarrative[] = LEGACY.map((l) => {
  const m = TIER_MODIFIERS[l.id];
  const base = (arr: string[]): string => arr[0];
  return {
    id: l.id,
    domain: l.domain,
    what: l.what,
    vlow: [\`\${base(l.low)} \${m.vlow}\`],
    low: l.low,
    mlow: [\`\${base(l.low)} \${m.mlow}\`],
    mid: l.mid,
    mhigh: [\`\${base(l.high)} \${m.mhigh}\`],
    high: l.high,
    vhigh: [\`\${base(l.high)} \${m.vhigh}\`],
    notes: {
      vlow: m.vlowShort,
      low: l.lowNote,
      mlow: \`\${l.lowNote} (leaning up)\`,
      mid: l.midNote,
      mhigh: \`\${l.highNote} (leaning down)\`,
      high: l.highNote,
      vhigh: m.vhighShort,
    },
    interplay: INTERPLAY_LIBRARY[l.id],
  };
});
`;

writeFileSync('src/domain/dimensions.ts.new', header + region + footer);
console.log('written: src/domain/dimensions.ts.new');
