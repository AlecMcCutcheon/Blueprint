import type { DimensionId } from './types';
import { seededPick, hash } from './scoring';

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
   * Conditional interplay passages: key `Other:N` -> paragraph shown when
   * dimension Other's 7-tier index (TIERS.indexOf: mlow=2, mid=3, mhigh=4,
   * high=5, vhigh=6) is at least N; `N-` fires when it is at most N (a LOW
   * condition). Evaluated in key order; first applicable key wins. A high
   * affection score next to a low play score must read differently than
   * either alone. (The keys were authored under the old 3-band numbering;
   * they have been remapped to these indices — smoke-checked so a "high"
   * claim can never fire below mhigh again.)
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
  {    id: 'affection_daily',
    domain: 'closeness',
    what: 'How much everyday, non-sexual touch and closeness is part of how you connect — reaching for someone just because you want them near.',
    low: [
      'Your answers suggest that affection, for you, is more deliberate than constant. You tend to reach out at chosen moments rather than throughout the day — a hug that means something because it isn\'t automatic. A partner who needs frequent small touch would need to understand that your quietness is not distance; it\'s how you hold closeness at a steady temperature.',
      'Across the scenarios, you consistently let space stand in for touch. You are comfortable being near someone without needing contact to prove the nearness. The tradeoff is that a partner may occasionally wonder where they stand, because the signals you send are sparse rather than small.',
    ],
    mid: [
      'You appear to treat everyday affection as a background rhythm rather than an event. You reach for people when the moment invites it — passing through a room, sitting side by side — and you seem to understand that touch often means "I like being near you" rather than anything more. You give affection freely, but you don\'t flood; the tap is on, just turned to a moderate flow.',
      'Your answers point to someone for whom small physical contact is natural but not constant — a hand on the back, sitting close, the occasional kiss that asks for nothing. You would likely notice a partner\'s touch with pleasure rather than need it to feel secure.',
    ],
    high: [
      'Touch runs through nearly every scenario you answered. You notice when you haven\'t touched the person you love in a while, and you do something about it — the walk-by hand, the sit-beside, the reach across a couch. For you, everyday affection appears to be a kind of ambient language: touch doesn\'t always mean wanting something more; it usually just means "you\'re my person, and I like that you\'re here."',
      'You seem to express closeness physically before you express it verbally. Reaching, leaning, cuddling through an ordinary evening — these read to you as the relationship\'s baseline hum. A partner who matches this will rarely have to wonder whether they are wanted; your body appears to say it before your words do.',
    ],
    lowNote: 'Deliberate, sparse touch — chosen moments over constant contact',
    midNote: 'Natural background affection, moderate flow',
    highNote: 'Ambient physical language — touch as the baseline hum',
  },
  {
    id: 'desire',
    domain: 'closeness',
    what: 'How much being wanted — desired, not just loved or appreciated — matters to you, and how you keep attraction alive.',
    low: [
      'Being desired did not register as a strong need in your answers. You appear to value steady warmth over voltage — a relationship that feels safe and kind matters more to you than one that crackles. When attraction fades into comfort, you are more likely to read that as normal life than as a loss. The risk is quiet: a partner might assume you don\'t mind being taken for granted, when really you may simply not have words for wanting more.',
      'Your choices suggest that "loved" and "appreciated" cover most of what you need. Flirtation, pursuit, and sexual electricity are pleasant when present but not what you would fight for. If something is missing for you here, your answers indicate you\'re more likely to adapt than to ask.',
    ],
    mid: [
      'You appear to want attraction to stay alive without making it the centerpiece. Knowing you\'re wanted matters at a steady hum — a look across the room, a message out of nowhere, proof that your partner still sees you that way. You would likely notice its absence over time, even if you wouldn\'t always name it.',
      'Your answers describe someone who enjoys being wanted and gives that back, but who can also ride out long stretches of comfortable routine. Desire, for you, seems to be weather — it comes in seasons, and you don\'t panic when a season is quiet.',
    ],
    high: [
      'Being wanted — not merely loved — came through as one of your strongest signals. You want a partner who looks at you and visibly wants you; who initiates, flirts, and makes attraction obvious outside the bedroom. You also appear to want to give that feeling back, which means desire in your ideal relationship is a current that runs both directions, not a performance one person supplies.',
      'Your answers treat desire as something that must be actively kept alive: anticipation built through a day, a message that says "I was thinking about you," proof of being chosen rather than merely accommodated. A partner who stops showing want — even while still showing love — is something you would eventually feel as hunger.',
    ],
    lowNote: 'Steady warmth over voltage; comfort reads as normal',
    midNote: 'Attraction alive at a steady hum, noticed when absent',
    highNote: 'Wanting to be visibly wanted — desire as a two-way current',
  },
  {
    id: 'vulnerability_safety',
    domain: 'closeness',
    what: 'Whether you treat what someone tells you in confidence as sacred — or as ammunition that becomes available during conflict.',
    low: [
      'Your answers suggest that when conflict heats up, things people told you in confidence can surface in your thinking — not as weapons you would reach for, but as context that feels relevant. Under pressure, "you knew that about me" can feel like a fair point rather than a low blow. A partner who is more private than you may need to hear that their disclosures stay protected even mid-argument.',
      'The scenarios suggest you expect disclosure to be handled carefully by others, but under pressure you may reach for whatever gives you footing — including things shared vulnerably. This is one of the more human patterns; nearly everyone drifts here at least once. It asks for awareness rather than shame: the people closest to you are the most exposed to you.',
    ],
    mid: [
      'You appear to hold a line: most of the time, what someone tells you stays out of the fight. Under real pressure you might allude to it, or come close, but you generally pull back. You likely expect the same discipline in return and feel the sting sharply when it isn\'t given.',
      'Your answers describe someone who understands that trust means the person who knows you most deeply should also be among the least likely to use it against you. You mostly practice that — though a bad night could bend the rule.',
    ],
    high: [
      'You treat confidence as genuinely sacred. Across every conflict scenario, you refused options that turned someone\'s vulnerability into leverage — even the tempting, "fair in context" ones. Your answers suggest that people who open up to you are unlikely to have that vulnerability turned against them — which is quietly powerful.',
      'Your answers draw a hard boundary: what someone shares in a vulnerable moment is never ammunition, not even when you\'re hurt, not even when it would win the argument. You appear to protect others\' softness instinctively — and you want the same protection for your own.',
    ],
    lowNote: 'Disclosures can surface under pressure; honesty as license',
    midNote: 'Holds the line most of the time; bends under heat',
    highNote: 'Confidence is sacred — vulnerability never becomes ammunition',
  },
  {
    id: 'reassurance_security',
    domain: 'closeness',
    what: 'How you interpret distance and ambiguity — whether a partner\'s quiet day becomes a story about you, and how much proactive reassurance steadies you.',
    low: [
      'Your answers suggest a secure, low-fuel interior when it comes to reassurance. A partner saying "I\'m fine" is, to you, mostly just information — you take it at face value, and distance rarely becomes a story about you. This is genuinely steadying to live with. The tradeoff: a partner who needs reassurance might experience your calm as obliviousness, and you may occasionally under-signal your own care because you don\'t feel alarm.',
      'You appear to grant people large benefit of the doubt and to expect the same. Silence doesn\'t accuse. But your steadiness may mean you underestimate how much a single unprompted "I love you" can matter to someone wired differently than you.',
    ],
    mid: [
      'You notice shifts in attention and tone, and you do something with them — usually a check-in rather than a spiral. "I\'m fine" makes you curious rather than calm, and a pattern of quietness makes you more concerned than a single evening. Your answers show healthy updating: more context, more response.',
      'You appear to want reassurance that is offered, not extracted — you dislike having to ask, and you read proactive affection as proof of attention. When it comes, it lands deeply. When it doesn\'t, you mostly cope, but you keep score of the silence a little.',
    ],
    high: [
      'Ambiguity is expensive for you. A quiet evening, a shorter text, a partner who says "I\'m fine" — your answers show these get read quickly as possible signals about you, and they occupy your attention until resolved. You are highly attuned to shifts in the emotional weather, which also makes you someone who catches problems early. What you need is a partner who understands that reassurance, for you, is maintenance rather than mollycoddling — and who gives it before you have to ask.',
      'Your answers describe someone for whom proactive reassurance is not a luxury but a requirement of feeling safe: the unprompted "we\'re okay," the check-in when you\'re off, the explicit "it isn\'t about you." Without it, you tend to fill silence with meaning — and the meaning is rarely generous to you. With it, you are likely extraordinarily attentive and generous in return.',
    ],
    lowNote: 'Secure under ambiguity; silence doesn\'t accuse',
    midNote: 'Notices shifts; checks in rather than spirals',
    highNote: 'Attuned to every shift; needs proactive reassurance as maintenance',
  },
  {
    id: 'care_initiation',
    domain: 'reciprocity',
    what: 'The instinct to notice and proactively care — the "they had a rough day, what can I do" reflex that acts before being asked.',
    low: [
      'Your care, as your answers present it, is available but responsive — you show up fully when someone tells you what they need, but you rarely move first. You may believe noticing is the other person\'s job, or that unrequested help can intrude. A partner would describe you as reliable and respectful of their autonomy; they might also occasionally wonder whether you saw the thing they never said out loud.',
      'The scenarios show you waiting more than initiating. It isn\'t indifference — you chose engaged options when the other person asked. It\'s that your default orientation is to your own track until redirected. Love, for you, may be something you express when it\'s summoned.',
    ],
    mid: [
      'You notice, and you often act on it — a snack brought without being asked, a check-in when someone seems off — but your answers show it competes with your own momentum. On your best days you\'re the person who sees the invisible labor; on tired days, your attention turns inward and stays there.',
      'Your instinct to care appears real but selective — strongest for the people you\'re closest to, strongest when you\'re rested. You would likely want a partner who signals their needs clearly, because you don\'t always catch the unspoken ones.',
    ],
    high: [
      'Care arrives before it\'s requested. Across the scenarios, you consistently chose to notice first and act first — the favorite snack, the back rub after a hard day, the "I know you\'ve been carrying a lot." Your answers describe someone whose love language is anticipatory: you don\'t wait for need to announce itself.',
      'You appear to experience other people\'s rough days as something you are invited into. Making someone\'s day easier — food, massage, compliment, small rescue — reads in your choices as a reflex rather than a decision — the shape of someone who genuinely enjoys loving their partner.',
    ],
    lowNote: 'Care available on request; rarely moves first',
    midNote: 'Notices and often acts; competes with own momentum',
    highNote: 'Anticipatory care — notices, acts, before being asked',
  },
  {
    id: 'receiving_comfort',
    domain: 'reciprocity',
    what: 'Whether you can receive care — massages, favors, being taken care of — without guilt, deflection, or feeling diminished.',
    low: [
      'Receiving appears to be the harder direction for you. Your answers show deflection patterns — immediately repaying, minimizing, or gently refusing care — that suggest being attended to creates discomfort or debt. This often coexists with being a strong giver: it can feel safer to love than to be loved. The cost is that people who want to care for you gradually learn it won\'t land, and they stop offering.',
      'You appear to treat care as something to be earned or reciprocated before it can be enjoyed. A gift is answered, a favor repaid quickly, a compliment deflected. Partners experience this as a closed door they keep knocking on — not because you don\'t want closeness, but because receiving it feels like losing standing.',
    ],
    mid: [
      'You can receive, but only up to a point. Small care lands well; sustained attention makes you restless, and your first instinct is to restore balance. Your answers suggest someone learning — or wanting — to let care sit for a while without answering it.',
      'You accept care more easily when it\'s framed as no-big-deal. When someone makes a gesture of it, you feel the weight and look for the exit or the repayment. You\'re likely warmer as a receiver than you believe, but the reflex to earn what you\'re given is still there.',
    ],
    high: [
      'You let care land. Compliments are received, not deflected; massages are enjoyed without immediate repayment; being taken care of during a rough stretch reads to you as love rather than debt. Your answers describe someone who understands that receiving is itself a gift to the giver — it lets the people who love you actually love you.',
      'Across scenarios you allowed yourself to be cared for without guilt or score-rebalancing, which is the rarer half of generosity. You appear to know that being capable and being cared for are not opposites — and that letting someone pamper you can be an act of trust.',
    ],
    lowNote: 'Receiving creates debt-feeling; deflects or repays fast',
    midNote: 'Receives small care; restless under sustained attention',
    highNote: 'Lets care land — receiving as a gift to the giver',
  },
  {
    id: 'scorekeeping',
    domain: 'reciprocity',
    what: 'Whether care is communal (given in response to need) or transactional (given in response to comparable benefits received). High = communal, low = transactional.',
    low: [
      'Your answers lean toward tracking what goes out and what comes in — imbalance registers as unfairness even when the other person would call it circumstances. You are not wrong that fairness matters; it just operates at the level of the week, the chore, the favor. Over years that arithmetic gets heavy for both people, and the deeper wish underneath it — being cared for without having to manage the books — usually stays unspoken.',
      'The scenarios repeatedly found you keeping the exchanges visible — "I did this, so…" or "my turn, next time." You likely experience your own accounting as fairness. A partner can experience it as something to live up to. The deeper question your answers raise: do you trust that someone can love you without the books balancing first?',
    ],
    mid: [
      'You mostly give freely, but you know what you\'ve given. Your answers show a soft ledger — not resentment over a single unreciprocated massage, but a slow watchfulness when the imbalance runs one direction for long. You would likely benefit from saying that out loud earlier than feels comfortable.',
      'There is a quiet ledger in your choices: generous in the moment, attentive to the pattern over time. You appear to want to be the kind of person who gives without counting — and you mostly are — but a partner who takes for more than a season will eventually hear about it.',
    ],
    high: [
      'Your care is communal. Massages don\'t create debts; dinners don\'t create tallies; you gave without once asking what you\'d get back. What you appear to want instead is reciprocity at the level of the relationship: not "you owe me," but "I know you\'d do the same for me when it\'s your turn to carry." That is precisely what makes generosity feel safe in your answers.',
      'You consistently refused the transactional frame. When you give, it\'s because someone needs something, not because something is owed — and you seem to trust that over months and years the carrying evens out on its own. Your answers describe the person your document was written about: someone who can give freely without keeping score, and receive freely without shame.',
    ],
    lowNote: 'Fairness tracked closely — reciprocity at the level of the week',
    midNote: 'Generous in the moment, attentive to the pattern',
    highNote: 'Communal care — reciprocity at the level of the relationship',
  },
  {
    id: 'express_receive_alignment',
    domain: 'reciprocity',
    what: 'The match between how you naturally express care and how you most want to receive it. Large gaps mean your love may not land in the language your partner speaks — or theirs in yours.',
    low: [
      'A clear gap showed up between how you give and how you want to receive. You may find yourself loving someone in your language and wondering why they seem underfed, or quietly hungry in a language nobody\'s speaking to you. This is one of the most common and most fixable patterns in relationships — it responds well to simply showing each other your respective dictionaries.',
      'Your answers suggest you express care in one channel and experience love in another. Left unspoken, this produces the strange arithmetic of two people who are both trying and both missing. Left spoken, it becomes a strength: each of you knows exactly where the translation is needed.',
    ],
    mid: [
      'How you give and how you want to receive overlap substantially, with one channel offset. Most of your love lands as intended, and most of what you receive registers — but there is one expression you crave that you rarely deliver, or deliver that you rarely crave.',
      'Your giving and receiving profiles are mostly consonant. You tend to love people the way you\'d like to be loved, which makes you legible to partners like you — and occasionally mysterious to partners who aren\'t.',
    ],
    high: [
      'You express love in nearly the same language you want to receive it. What you do is what lands; the care you give is the care you can recognize when it\'s given to you. Partners will find you unusually readable — you are fed by your own way of loving.',
      'Your answers are self-consistent: the channel you reach for is the channel that reaches you. This symmetry means a partner who watches what you do already knows what you need — a quiet superpower, as long as they\'re paying attention.',
    ],
    lowNote: 'Give in one language, hungry in another',
    midNote: 'Mostly consonant; one channel offset',
    highNote: 'Fed by your own way of loving — unusually readable',
  },
  {
    id: 'listening_first',
    domain: 'processing',
    what: 'Whether you can be present with an emotion before reaching to fix, explain, or reframe it.',
    low: [
      'When someone you love is upset, your answers show you reaching for solutions, corrections, or explanations almost immediately. You are trying to help — but the person in the feeling often experiences this as being managed rather than heard. Over time, people may stop bringing you their feelings, because your care arrives pre-hurried.',
      'Your instinct under emotional weather is to fix the roof while the person is still standing in the rain. The scenarios show competence and speed, but little waiting. What\'s missing is not compassion; it\'s the tolerance to stay in the room while someone feels something you can\'t solve.',
    ],
    mid: [
      'You can listen first when you catch yourself — your answers show you choosing presence over repair often enough that people likely do come to you. But the fixer in you surfaces early, especially when the feeling has lasted a while or when you feel implicated in it.',
      'You appear to understand, in principle, that some feelings need witness rather than solution — and in practice you alternate. Your best moments are when you ask "do you want comfort or ideas?" and honor the answer.',
    ],
    high: [
      'You let people have their feelings before you do anything about them. Across every distress scenario you chose presence — sitting close, asking what it\'s like, offering warmth without agenda — over fixing, explaining, or silver-lining. People in your life likely describe you as someone they can actually fall apart in front of.',
      'Your answers show remarkable tolerance for un-resolved emotion. You don\'t rush the feeling, and you don\'t take it personally. You appear to know instinctively that being heard is itself the repair — and that solutions, when wanted, can wait their turn.',
    ],
    lowNote: 'Fixes the roof while someone stands in the rain',
    midNote: 'Alternates between witness and fixer',
    highNote: 'Presence before solution — being heard as the repair',
  },
  {
    id: 'logic_emotion_integration',
    domain: 'processing',
    what: 'Whether you can hold two processing styles — logical and emotional — as different rather than ranked, and expect the same respect for yours.',
    low: [
      'Your answers suggest you rank one processing style above the other. You may read a partner\'s emotionality as imprecision, or — the mirror case — read someone\'s step-by-step reasoning as coldness during a feeling-moment. Either way, the ranking taxes the relationship: one person is always being translated, and the translator is you.',
      'The scenarios show you treating your own mode as the default the other person should meet. It might be logic ("this is just what happened") or feeling ("why are you making this a spreadsheet"). Integration would mean holding both as valid dialects — and asking, rather than assuming, which one a moment calls for.',
    ],
    mid: [
      'You mostly respect that people process differently, with occasional lapses when stakes rise. You can explain without dismissing and feel without drowning — but under stress you revert to your home dialect and expect translation from the other side.',
      'Your answers show a working truce between logic and feeling: you know they\'re different instruments, and you mostly play the right one for the moment. The lapses are predictable — they happen when you\'re hurt or rushed.',
    ],
    high: [
      'You hold logic and emotion as different instruments, neither the master of the other. You can be the person who thinks a situation through without apologizing for it — and you can be the person who simply sits with a feeling without demanding it make sense. You appear to extend both respects: expecting your reasoning not to be read as coldness, and never treating someone\'s emotion as a malfunction.',
      'Your answers describe rare dual fluency: you step back to understand what actually happened, and you step forward to feel what\'s alive, and you seem to know which moment calls for which. You would likely want a partner who reads your logic as care — an attempt to understand, not an escape from feeling.',
    ],
    lowNote: 'Ranks one processing style above the other',
    midNote: 'Working truce; reverts home under stress',
    highNote: 'Dual fluency — logic as care, feeling as signal',
  },
  {
    id: 'curiosity_worlds',
    domain: 'processing',
    what: 'Genuine interest in the partner\'s inner world and passions — wanting to know why something matters to them, even when it isn\'t yours.',
    low: [
      'Your answers suggest you grant people their enthusiasms without needing to enter them. You support what your partner loves from a respectful distance — the way one supports a hobby that isn\'t one\'s own. The cost is subtle: passion is where a person is most themselves, and a partner who never gets curious there may feel loved in general but unseen in particular.',
      'The scenarios show you responding politely to excitement rather than leaning into it. You ask how it went, not what it\'s like. To a partner whose world matters to them, that difference is the whole difference — they may end up sharing their joy somewhere else, where someone\'s eyes light up.',
    ],
    mid: [
      'You have real curiosity for the passions of the people you love — when you\'re not depleted. Your answers show you asking the second question sometimes, listening to the explanation sometimes, occasionally joining in. It reads as genuine but rationed.',
      'You want to understand why things matter to your partner, and you usually will — though you may need them to know you\'re interested first, because your attention doesn\'t always volunteer itself.',
    ],
    high: [
      'You are curious about the people you love. Your answers repeatedly chose the leaning-in option: asking why it matters, listening to the whole explanation, occasionally stepping into their world even when it isn\'t yours. You seem to understand that interest is a form of love — that being asked "okay, but what is it actually like?" can mean more than any gift.',
      'Your scenarios show you treating a partner\'s excitement as an invitation rather than noise. You don\'t need to share the passion to honor it; you need to understand why it lights them up. This is the quality that makes people feel interesting for a lifetime rather than a season.',
    ],
    lowNote: 'Supports from a respectful distance',
    midNote: 'Genuine but rationed curiosity',
    highNote: 'Interest as love — leaning into their world',
  },
  {
    id: 'perspective_taking',
    domain: 'processing',
    what: 'Stepping outside your own assumptions to interpret a partner\'s behavior — giving the benefit of the doubt instead of building a story.',
    low: [
      'Your interpretations move fast. A partner\'s quiet becomes a story about you; a change in tone becomes evidence. Your answers show you confident in your readings — which is precisely what makes them risky, because confidence and accuracy are not the same thing. The people close to you may feel pre-judged by someone who hasn\'t asked yet.',
      'The scenarios repeatedly showed you filling ambiguity with your own experience — reading their behavior through what it would mean if you did it. The discipline your answers point toward is simpler than empathy-as-skill: "there is probably more going on underneath the surface than I can see."',
    ],
    mid: [
      'You mostly grant the benefit of the doubt, with lapses when you\'re hurt — and it\'s specifically when you\'re hurt that your interpretations accelerate. You know better stories get built when tired; you don\'t always stop building them.',
      'Your answers show someone who asks before concluding, more often than not. The residual risk is the times you don\'t: those tend to be the moments it matters most.',
    ],
    high: [
      'You interpret slowly. Before constructing a story about someone\'s behavior, your answers show you asking, checking, and leaving room for explanations that don\'t involve you. "There\'s probably more going on than I can see" appears to be a genuine operating assumption, not a slogan. People can likely be complicated around you without bracing for a verdict.',
      'You extend to others the interpretive patience you\'d want for yourself: a quiet partner gets curiosity before conclusions, a bad mood gets context before blame. Your answers describe someone whose benefit of the doubt is structural — built into how you see, not deployed as a favor.',
    ],
    lowNote: 'Fast interpretations; confident and risky',
    midNote: 'Benefit of the doubt with lapses when hurt',
    highNote: 'Interprets slowly — curiosity before conclusions',
  },
  {
    id: 'direct_communication',
    domain: 'teamwork',
    what: 'Saying things while they\'re small and true — no guessing games, no tests, no expecting a partner to read change in your tone.',
    low: [
      'Your answers suggest you signal rather than say. Important feelings get expressed through distance, tone, or waiting to be noticed — and you may find yourself testing whether a partner cares enough to decode you. The pattern is deeply human and reliably corrosive: tests are games where both players lose, because the other person can\'t study for them.',
      'You appear to hope important things will surface on their own, or to protect the relationship by not burdening it. What actually happens — per your own answers — is that things sit underneath until they calcify. Your partner isn\'t failing to notice; they were never given the information.',
    ],
    mid: [
      'You say the important things, eventually. Your answers show a preference for talking it through once something matters — though often after a period of carrying it, and sometimes only once it\'s already uncomfortable.',
      'You are direct about facts and softer about feelings. "This bothered me" comes out; "I need reassurance" comes harder. Your partner likely knows where you stand on things — but not always how you feel about them.',
    ],
    high: [
      'You put things into words while they\'re still small. Across the scenarios you consistently chose the option that says the true thing now — "this bothered me," "I\'m overwhelmed today, it isn\'t about you," "I need some reassurance" — over hoping it\'ll be noticed or letting it quietly rot. You appear to genuinely not want a relationship with guessing games in it, in either direction.',
      'Your answers describe someone who treats directness as respect: you say things while they\'re manageable because you want the relationship to have real information instead of archaeology. You also appear willing to receive it — which matters as much as giving it.',
    ],
    lowNote: 'Signals rather than says; tests instead of asks',
    midNote: 'Says it eventually; direct on facts, soft on feelings',
    highNote: 'The true thing, said while small — no tests in either direction',
  },
  {
    id: 'repair_orientation',
    domain: 'teamwork',
    what: 'What you do after friction: whether coming back matters more to you than protecting your pride or winning the point.',
    low: [
      'After an argument, your answers show you turning inward — needing space, replaying the case, waiting for the temperature to change on its own. You may assume the other person knows things are fine once you feel fine. What they experience is silence with no ETA. Repair, for you, may feel like admitting fault; it is actually just reopening the door.',
      'The scenarios show friction ending in distance rather than debrief. You don\'t escalate, which is a real strength — but nothing gets metabolized either. Patterns your answers point to: the apology that arrives days late, the topic that becomes undiscussable, the win that was never worth it.',
    ],
    mid: [
      'You come back — later, and usually after you\'ve sorted your own account of things. Your answers show genuine willingness to repair, with a lag: the pride tax gets paid first. Once you\'re back, you\'re actually back.',
      'You repair when the issue was small and stall when it was large. Your answers suggest the hesitation isn\'t about the relationship; it\'s about sitting with the possibility that you handled something badly.',
    ],
    high: [
      'Repair is your reflex. When something goes sideways, your answers show you moving toward it — acknowledging your part first, checking in after the temperature drops, caring more about the relationship than the scoreboard. You appear to understand that being right is a consolation prize, and that coming back is the actual win.',
      'Your scenarios show you reopening closed doors: apologizing specifically rather than generically, asking what the other person heard, treating a bad interaction as information rather than verdict. This is the single strongest protective habit in your answers — conflicts end faster and leave less residue when someone insists on repair.',
    ],
    lowNote: 'Turns inward; silence with no ETA',
    midNote: 'Comes back later, after the pride tax',
    highNote: 'Repair as reflex — being right is the consolation prize',
  },
  {
    id: 'same_side_problems',
    domain: 'teamwork',
    what: 'Whether life\'s messes — money, breakage, family, logistics — land as "us vs. the problem" or become judgments about the person standing next to you.',
    low: [
      'When things break, your answers show you looking first for the cause in the person closest to the problem. Stress narrows you toward blame — not cruelty, just reflex. The cost is that difficult periods become trials, and your partner learns to hide small disasters, which guarantees the large ones arrive late.',
      'Your scenarios show problem-framing that starts inside the relationship: whose fault, whose habit, whose family. The reframe your answers point toward is standing on the same side of the thing — the appliance, the bill, the complicated relative — and asking how to deal with it, together, before assigning meaning.',
    ],
    mid: [
      'Your first reaction depends on the day. When you\'re resourced, "how do we deal with this" comes naturally; when you\'re depleted, the problem becomes personal fast. Your answers suggest you know this pattern and wish it were otherwise.',
      'You hold the team frame for most external problems but struggle when the problem implicates your partner\'s choices — money spent, plans misjudged. That\'s exactly where the frame matters most, and your answers show it slipping precisely there.',
    ],
    high: [
      'You are on the same side of everything. Broken things, tight money, complicated families — your answers consistently reframed messes as shared problems before anyone was a defendant. "Okay, how do we deal with this?" appears to be your genuine first instinct, not your aspirational one. A partner in a crisis with you would feel accompanied, not audited.',
      'Your answers show the team frame holding even under the conditions that usually break it: fatigue, money stress, mistakes with real consequences. You appear to naturally separate the person from the problem — which is what lets people stay honest about the small disasters, because they know you\'ll receive them.',
    ],
    lowNote: 'Looks for the cause in the person closest to the problem',
    midNote: 'Team frame when resourced; personal when depleted',
    highNote: 'Same side of everything — problems before defendants',
  },
  {
    id: 'autonomy_connection',
    domain: 'interdependence',
    what: 'Whether independence and closeness coexist for you — your own world without distance, togetherness without fusion.',
    low: [
      'Your answers describe two poles rather than a blend. When you\'re close, you want togetherness everywhere; when you\'re distant, it\'s deep. Separate rooms can read to you as rejection, separate hobbies as drift. The integration your answers point toward is treating parallel play — two people in one room, each absorbed in their own thing — as a form of intimacy rather than its absence.',
      'You appear to experience independence as something a relationship does to you rather than something two people keep. Your partner\'s solo plans register as withdrawal. What your answers suggest you actually want is certainty of return — and that can be built with words and rituals rather than enforced with proximity.',
    ],
    mid: [
      'You can share a room doing different things and feel connected — most of the time. Your answers show comfort with separate worlds as long as the connection rituals stay intact: the kiss in passing, the check-in, the "you\'re still my person" gestures.',
      'You keep your own orbit and come back warmly. The friction in your answers appears at the extremes — too much togetherness depletes you, too much distance unsettles you — which means calibration, not commitment, is your project.',
    ],
    high: [
      'You integrate independence and closeness with unusual ease. Your answers treated separate hobbies, friends, and solo evenings as healthy tissue in the relationship — and you paired them with the small reconnecting gestures that keep two worlds knitted: the kiss on the way past, the sit-beside for a minute, the "you\'re still my person" that costs nothing and means everything.',
      'Your scenarios show someone who doesn\'t read independence as distance or togetherness as obligation. You appear to want two whole people choosing each other daily — which is the architecture your document calls "independence within togetherness," and your answers embody it.',
    ],
    lowNote: 'Two poles; parallel play reads as absence',
    midNote: 'Comfortable blend; calibration is the project',
    highNote: 'Two whole people choosing each other daily',
  },
  {
    id: 'shared_home_effort',
    domain: 'interdependence',
    what: 'How you share a home and its invisible labor: contributing without a permanent manager/passenger split, noticing what nobody sees, allowing 20% days.',
    low: [
      'Your answers suggest a home with an invisible org chart: you have your lanes, and stepping out of them — or having someone step into yours — registers as disorder. You may be the manager, quietly carrying the mental load, or the passenger, genuinely unaware of what\'s being carried. Either position, your answers indicate, eventually breeds resentment that neither person names.',
      'The scenarios show you treating effort as exchanged rather than shared — help granted in return for help, standards defended against the other person\'s mess. What your answers point toward is a home both people own: not 50/50 arithmetic, but neither person being the permanent manager while the other merely resides.',
    ],
    mid: [
      'You contribute to a shared home and notice most of the invisible work — though the noticing has a radius, and some of what your partner carries may simply not register as work. Your answers show willingness to ask and to be asked, which is the mechanic that matters.',
      'You appear to understand that homes run on flexible labor — some weeks you carry more, some weeks less. The risk your answers show is drift: lanes that harden over years without anyone deciding they should.',
    ],
    high: [
      'You see the invisible work. Researching the repair, the stressful phone call, the thing carried around in someone\'s head for a week — your answers show you noticing it and naming it, because you know that effort nobody sees becomes loneliness. You appear to hold standards without urgency: clean enough to be calm, imperfect enough to be human, dishes allowed to wait on a 20% night.',
      'Your answers describe a home both people own. You contribute without tallying, ask without shame, answer "yeah, I\'ve got it" when you can and "not today" when you can\'t — and you extend the same grammar back. You appear to want the household to feel like a partnership of two adults who keep choosing the shared project.',
    ],
    lowNote: 'Invisible org chart; lanes harden into roles',
    midNote: 'Contributes and asks; some load goes unnoticed',
    highNote: 'Sees the invisible work; standards without urgency',
  },
  {
    id: 'relational_privacy',
    domain: 'boundaries',
    what: 'What belongs to the two of you: how much of the relationship lives between you, and where outside voices are allowed in — trusted counsel welcomed, audiences not.',
    low: [
      'Your answers treat the relationship as a life lived in public view — updates, reads, and verdicts from a wider circle. Some of that is transparency you genuinely value. The tradeoff your answers point to: the more people hold a piece of the story, the more the two of you are negotiating in front of a jury, and the harder it becomes to tell which voice is the relationship\'s and which is the chorus.',
      'The scenarios show your conflicts traveling — screenshots, sympathetic rehashes, a supportive crowd. The support is real, and so is the cost: a partner who has been discussed does not un-know it. What remains is the repair work of two people, now performed on a stage they did not choose.',
    ],
    mid: [
      'You hold a mostly private relationship with channels that open under strain — a trusted friend when a hard stretch runs long, a sounding board when you need to hear yourself think. The boundary your answers draw is real but porous at the exact moments privacy matters most: mid-conflict, when the story is one-sided and still hot.',
      'Your answers show someone who keeps ordinary life between the two of you and reaches outward at a measured rate. The signal worth watching: whether the doors you open in hard moments are ones you close again — or whether the circle quietly becomes a standing panel.',
    ],
    high: [
      'You treat the relationship as something that belongs to the two of you. Problems get worked through inside first; a trusted outside voice is welcome when you genuinely need one — asked for openly, aimed at understanding — but there is no audience to win and no jury being polled. That privacy reads as protection, not secrecy: it is why the people close to you can risk being imperfect around you.',
      'Your answers describe a clear boundary with a working door: what happens between you is held between you, disclosures to the outside are chosen rather than leaked, and a partner can count on not opening their phone to find the argument they thought was over, being relitigated somewhere else. Privacy here is a form of loyalty, not a wall.',
    ],
    lowNote: 'A life lived in front of a wider circle; repair on a stage',
    midNote: 'Mostly private; doors open under strain and stay ajar',
    highNote: 'Belongs to the two of you — trusted counsel welcomed, audiences not',
  },
  {
    id: 'sexual_communication',
    domain: 'closeness',
    what: 'Whether the channel exists for telling a partner what you actually want, don\'t want, and are curious about — without it feeling like a risk.',
    low: [
      'The intimate channel in your answers runs narrow. Preferences stay internal — sometimes out of privacy, sometimes out of a wish to protect a partner from a conversation that might sting. The cost is invisible from the inside: a partner left guessing usually guesses toward repetition, and repetition slowly reads as the whole map.',
      'Your scenarios show comfort with intimacy itself but silence around its specifications. What stays unsaid isn\'t necessarily large — often it\'s a set of small preferences that never got a doorway. Partners tend to experience the silence not as absence of wants, but as absence of trust in how they\'d receive them.',
    ],
    mid: [
      'The channel exists and mostly works — some territory is easy to name, some stays closed. Your answers suggest someone who communicates in intimacy by mood and safety level rather than by policy, which means your partner\'s map of you is accurate in places and blank in others.',
      'You can go there, with warm-up. Direct conversations about what works happen, but they cost you something, and a few topics are simply routed around. The gap between what you\'d want and what you\'ve said aloud is real but bridgeable — this dimension responds well to exactly that.',
    ],
    high: [
      'You treat intimacy as speakable. Wants, limits, curiosity — your answers show all of it as sayable without it becoming a crisis, which is the trait the research ties most strongly to both sexual and relationship satisfaction. A partner with you is never left performing a script they can\'t edit.',
      'Your scenarios show the rare combination: comfort with the topic and kindness in the delivery. You name preferences as invitations rather than verdicts, and you can hear a partner\'s the same way. This is the dimension where your document\'s "figure it out together" section lives as behavior rather than intention.',
    ],
    lowNote: 'Preferences stay internal; partners guess toward repetition',
    midNote: 'Channel open in places; a few topics routed around',
    highNote: 'Intimacy as speakable — wants named as invitations',
  },
  {
    id: 'positivity_play',
    domain: 'closeness',
    what: 'Whether you actively cultivate fun, lightness, and shared laughter — or whether good times are something that happens to the relationship rather than something grown.',
    low: [
      'In your answers, fun tends to be foraged rather than planted. You enjoy good times when they arrive, but the cultivating energy — the plan, the invented outing, the deliberate silliness — isn\'t your usual lane. The steady version of this is calm; the risky version is a relationship whose lightness depends entirely on the other person\'s mood and initiative.',
      'Your scenarios show comfort with flatness — gray Sundays don\'t distress you, and you don\'t feel obliged to fix quiet. Fair enough. But a partner who reads shared joy as the relationship\'s pulse will eventually experience your contentment as passivity, even when it\'s really just a different thermostat.',
    ],
    mid: [
      'You plant sometimes. The seed-planting shows up when your own tank is full — a good week produces an idea, a depleted one produces waiting. Your answers describe someone whose playfulness is real but weather-dependent, which most partners experience as perfectly liveable.',
      'Lightness is a shared project you contribute to in seasons. You respond well to a partner\'s plans, occasionally invent your own, and mostly let momentum and mood co-produce the fun. The gap worth watching: whether "usually" means the fun is distributed, or just inconsistently scheduled.',
    ],
    high: [
      'You garden fun. Flat Sundays get met with an invention — the specific walk, the dumb movie, the project nobody planned. Your answers describe someone who treats shared joy as maintenance work you actually enjoy: the lightness of the relationship is grown, not inherited.',
      'Play, for you, is a duty of care. Your scenarios show you supplying the spark or handing the match — either way, momentum lives in you. This is one of the quiet predictors of long-term satisfaction, and your answers treat it as instinct rather than assignment.',
    ],
    lowNote: 'Fun foraged, not planted; lightness depends on the other',
    midNote: 'Plants in seasons; playfulness runs on fuel',
    highNote: 'Gardens fun — shared joy as maintenance you enjoy',
  },
  {
    id: 'capitalization',
    domain: 'processing',
    what: 'How you meet a partner\'s good news — and whether you are where their joy goes to land. Active celebration versus deflection, or quiet receiving.',
    low: [
      'Good news, in your answers, gets a warm receipt but rarely a room. The "that\'s great" reflex, the details deferred to later — the news is received, but the celebration is thin. The slow cost: people route their first-tellings to wherever they get lit up, and over time that routing moves away from you.',
      'Your scenarios show the pattern most visible in what\'s missing: no second question, no leaning in, no turning-off-the-stove moment. It isn\'t coldness — you likely celebrate sincerely in your own register. But capitalization research is blunt on this point: passive responses to good news erode closeness as reliably as bad responses to bad news.',
    ],
    mid: [
      'You celebrate, with a lag. Some of their wins get your full-body attention; others catch you mid-task and get the warm-but-distracted version. Your answers suggest someone whose celebration is sincere but not yet habitual — the moment sometimes arrives before your attention does.',
      'The good-news channel runs, mostly. You hear about wins, you respond genuinely, and occasionally you\'re the first call — though a few first-tellings have migrated elsewhere. Worth noticing which ones, because routing is a leading indicator of what a partner has stopped expecting from you.',
    ],
    high: [
      'You stop what you\'re doing. Your answers consistently chose the put-it-down, turn-around, "start from the beginning" move — the active-constructive response that turns a good day into a bond. People who live with you likely experience their wins as **bigger** for having told you.',
      'You are, functionally, where joy goes to land. Your scenarios show enthusiasm plus investigation — you celebrate and pull the story out at once. Gable\'s capitalization work describes exactly this pattern as one of the strongest known engines of closeness, and your answers run on it naturally.',
    ],
    lowNote: 'Warm receipt, thin celebration; first-tellings drift elsewhere',
    midNote: 'Celebrates with a lag; sincere but not yet habitual',
    highNote: 'Puts it down, turns around — joy lands here',
  },
  {
    id: 'conflict_engagement',
    domain: 'teamwork',
    what: 'What you do in the heat: stay engaged and curious, pursue resolution, or withdraw to process — and whether you can hold your ground and their perspective at once.',
    low: [
      'Heat moves you out of the room, one way or another — into silence and holding ground, or into pressing your point while the temperature climbs. Your answers show engagement narrowing exactly when it matters most: curiosity about their side goes offline until the storm passes or the point lands.',
      'Your scenarios show two possible signatures — withdrawal as shelter or pursuit as pressure. Neither is a character flaw; both are nervous-system defaults. The cost is the same either way: mid-conflict, your partner is negotiating with the weather rather than with you.',
    ],
    mid: [
      'You stay in the room, mostly. Your capacity to hold your position and their perspective at once is real but heat-sensitive — some topics spend it faster than others. The repair instinct (measured separately) is what closes the distance afterward; this dimension is about how much distance gets opened in the first place.',
      'Mid-conflict, you are sometimes the calmest person present and sometimes a participant in the escalation. The inconsistency itself is information: your engagement runs on state, not trait — which means rest, timing, and topic selection matter more for you than for most.',
    ],
    high: [
      'You can be fully present and fully curious in an argument — defending your position and genuinely hearing theirs at the same time. Your answers show the brake-reaching reflex: naming the temperature, asking questions instead of scoring points. Your preferred conflict style is one where disagreement does not have to become relational damage — a learnable skill, and your answers suggest you already have it.',
      'Heat sharpens rather than narrows you. Your scenarios show de-escalation as an active practice — not conflict avoidance, but engagement with the temperature dial in hand. Partners in a disagreement with you come out feeling heard even when they lost the point, which is why they keep bringing things to you.',
    ],
    lowNote: 'Heat narrows you — withdrawal or pursuit; curiosity offline',
    midNote: 'Stays in the room, mostly; engagement runs on state',
    highNote: 'Curious mid-argument — holds ground and their side at once',
  },
  {
    id: 'commitment_sacrifice',
    domain: 'interdependence',
    what: 'How you carry the costs of a shared life: whether giving to the relationship settles its own books, and how you hold sacrifices that were never invoiced.',
    low: [
      'Sacrifice, in your answers, comes with an internal audit. When you give something up for the relationship, a quiet accounting runs alongside — was it worth it, is it being noticed, will it be returned. The audit is honest and human; the cost is that partners feel audits even unspoken ones, and giving starts to carry interest.',
      'Your scenarios show the cost speaking first — stability, comfort, and what-you-had register louder than what-your-partner-could-become. That\'s not selfishness; it\'s a risk calculus that runs hot. Worth watching, though, because a partnership full of unmade leaps develops its own quiet grief.',
    ],
    mid: [
      'You give to the relationship and mostly let the giving settle the question — with exceptions at the large end, where the value-check runs visibly. Your answers describe a fairly normal economy: small sacrifices pass unnoticed, big ones get weighed, and the weighing is where a partner sometimes feels the audit.',
      'Commitment, for you, is strong with a spectator. You show up for the shared project, and part of you keeps score of what the showing-up cost. Neither half is wrong — but the spectator deserves an occasional seat at the table, said out loud rather than run silently.',
    ],
    high: [
      'Your investment closes its own books. When you give something up for the relationship, the giving itself settles the question — no running audit, no waiting invoice. Your answers describe the settled form of commitment: a way of being rather than a cost-benefit that runs in the background.',
      'You carry costs as logistics rather than losses. Your scenario showed a partner\'s big want met with "how do we make this work" — commitment as verb. People who live with this pattern describe feeling *backed*, which is different from feeling loved, and rarer.',
    ],
    lowNote: 'Giving carries an internal audit; the cost speaks first',
    midNote: 'Gives freely in small things; weighs the large ones',
    highNote: 'Investment closes its own books — commitment as verb',
  },
  {
    id: 'money_coordination',
    domain: 'interdependence',
    what: 'Whether money is handled as teammates: equal legitimacy for both people\'s spending, information shared early, and no audit running on either side.',
    low: [
      'Money, in your answers, activates the auditor. Spending gets traced, legitimacy gets sorted — whose purchase was necessary, whose was indulgent. Sometimes that reflex comes from a history worth respecting. The cost is the same either way: one person\'s joys end up on trial, and trials make people hide.',
      'Your scenarios show money under stress pulling you away from the team frame — toward silent cutting, or toward mentally assigning fault. The squeeze passes; the pattern it activates is what lasts. What your answers point toward is earlier disclosure, shared adjustment, and letting the problem be the defendant instead of the person.',
    ],
    mid: [
      'You run a mostly symmetrical money economy. Both people\'s interests get roughly equal legitimacy, with a flicker of the audit reflex on the large or unannounced purchases — usually overruled, occasionally acted on. The flicker is worth watching, because asymmetries harden by repetition rather than decision.',
      'Your answers describe coordination with a comfort zone: some things discussed, some discretionary, a private margin of handling-it-yourself. Workable — the growth edge is whether the categories were ever chosen together, or just accumulated.',
    ],
    high: [
      'Money, for you, is a team instrument. Equal seriousness for both people\'s hobbies when the card comes out, information shared early when the month tightens, no trial for the unannounced purchase as long as the foundation holds. Your answers describe the teammate frame your document calls "talking about money like teammates building a stable life."',
      'You separate the purchase from the person. Your scenarios show curiosity arriving before accounting — what is it, do they love it — and the squeeze months met with plain speech rather than blame. This is the dimension where financial stability and generosity stop being rivals.',
    ],
    lowNote: 'The auditor activates; joys end up on trial',
    midNote: 'Symmetrical with a flicker; categories never chosen together',
    highNote: 'Money as team instrument — equal legitimacy, early information',
  },
  {
    id: 'desire_initiation',
    domain: 'closeness',
    what: 'Whether you are the one who moves — initiating want out loud, and what happens in you when the move meets a no.',
    low: [
      'Your wanting tends to arrive as invitation-awaiting rather than movement. The desire is real — the answers show it — but it waits to be drawn out, and a partner may read the waiting as absence. The useful honesty is telling them the want is there in the waiting; some people will learn to read it, but nobody can read what was never named.',
      'You rarely move first in the wanting. Being pursued is what reads as evidence of being wanted — which is a real preference, not a flaw, but it puts the whole ignition of the relationship in someone else\'s hands. Naming that out loud lets a partner know the engine is theirs to start, and that you are not indifferent — you are receptive.',
    ],
    mid: [
      'You can move first, and you can wait — the answer depends on the dynamic more than a rule. The useful thing to know is which conditions turn your ignition on: with some people you initiate naturally; with others the wanting stays private until invited. The variance is the finding, not a lack.',
    ],
    high: [
      'Your initiation runs on resilience rather than bravado: you can make the move, and when it meets a no, the sting is brief and real — “okay, come here,” and meaning the cuddle that follows. That recovery is the rare part. The wanting is mostly legible rather than always loud, and the very first moves in new territory are ones you would rather build to mutuality than seize. A partner gets someone who moves without bracing — and whose no-handling makes the moving safe to be around.',
    ],
    lowNote: 'Want waits to be invited',
    midNote: 'Moves or waits, depending on the dynamic',
    highNote: 'Moves without bracing — resilient after a no',
  },
  {
    id: 'intimacy_attunement',
    domain: 'closeness',
    what: 'Reading each other in real time — noticing drift, separating want from obligation, and taking bodies\' weather as information rather than verdict.',
    low: [
      'In intimate moments, the current tends to run one-way: your attention is on the experience as it should be, less on the person experiencing it with you. Drift, hesitation, a partner going somewhere else — these pass unremarked, which reads to them as unseen. The repair is small: one check — "you here with me?" — changes the whole texture.',
      'Your intimacy is experienced more than navigated. When something shifts mid-moment, you keep going and hope it rejoins — naming it feels like breaking something. The irony is that the naming is what makes it safe to stay: a partner who knows you will check can afford to drift and return without pretending.',
    ],
    mid: [
      'You read the moment when it is calm and miss it when it is charged — attunement that works at half-speed. The checks happen, inconsistently, and your partner likely experiences you as present but not always tracking. The upgrade is bringing the same attention you give their words into the unworded moments.',
    ],
    high: [
      'You read the room in the dark. Drift, hesitation, the difference between want and willingness — you notice, you respond, you check when unsure. Bodies\' weather (the days things do not cooperate) reads to you as information rather than verdict, which is the trait intimacy researchers tie most strongly to long-term satisfaction. A partner never has to perform okay-ness with you; you would catch the performance anyway.',
    ],
    lowNote: 'Experienced more than navigated',
    midNote: 'Reads the calm, misses the charged',
    highNote: 'Reads the room in the dark — nothing has to be performed',
  },
  {
    id: 'feedback_receiving',
    domain: 'processing',
    what: 'What happens in you when someone you love gives you hard feedback — the armor, the hearing, and how much gets through.',
    low: [
      'Feedback triggers the defense before the hearing: the case-building starts mid-sentence, and the explanation arrives before the point does. People learn to soften, time, and package anything hard for you — which means you are also hearing a filtered version of everything. The upgrade is one sentence: "let me make sure I have the whole thing before I respond."',
      'Hard feedback finds armor fast in you. Even when you agree to work on something, the sting keeps for weeks, and the relationship between you and the person who told you quietly changes. Worth knowing: the armor protects the immediate bruise and costs the long-term information.',
    ],
    mid: [
      'Your armor rises and usually stands down — the flash of defense comes, you let it pass, and the feedback mostly gets through. The residue is the watch-item: agreeing in the room and carrying the indictment privately afterward. A partner cannot tell which one they are getting; telling them would help both of you.',
    ],
    high: [
      'You hear the whole thing before you respond — hard feedback lands as information, not attack. Your first instinct is curiosity (what took them so long to tell me?), and the people close to you get to say the true thing while it is small, because they trust the landing. This is one of the rarer and more relationally load-bearing skills there is.',
    ],
    lowNote: 'Defense arrives before the hearing',
    midNote: 'Armor rises, mostly stands down',
    highNote: 'Hears the whole thing — the true thing said while small',
  },
  {
    id: 'external_processing',
    domain: 'boundaries',
    what: 'How much you need to talk things through with someone outside the relationship — and how openly that processing is held with your partner.',
    low: [
      'You process inside first — talking it out with outsiders muddies what you already know, and your clarity is a private product until you choose to share it. The watch-item is not the privacy; it is whether a partner knows that your silence during hard weeks is method, not distance. Telling them the difference converts it from exclusion into architecture.',
      'Outside voices play little role in your processing — the relationship\'s problems get worked through where they live. A partner gets unfiltered access to your thinking, which is rare; the cost is that you may carry tangles alone longer than the tangles require.',
    ],
    mid: [
      'Your processing is situational — small things stay inside, tangles get a trusted voice. The variability itself is worth naming to a partner: what determines which mode you are in is probably the size of the tangle and whether you already know your own mind about it.',
    ],
    high: [
      'You think out loud, and the loud version needs another person — a trusted outside voice is part of your thinking apparatus, not a betrayal channel. The load-bearing condition is the one your answers already respect: openness. Processing declared is collaboration; processing discovered is exclusion. You appear to know the difference.',
    ],
    lowNote: 'Processes inside first',
    midNote: 'Situational — size of the tangle decides',
    highNote: 'Thinks out loud — the trusted voice as apparatus',
  },
  {
    id: 'care_role_flexibility',
    domain: 'reciprocity',
    what: 'Whether care-roles are fixed or flexible: can you be taken care of, pampered, planned-for — without it costing you anything you believe about yourself, and can you extend the same freedom to a partner?',
    low: [
      'Care has assigned roles in your operating model: you are the one who gives the back rub, opens the door, plans the surprise — and being on the receiving end of the same gestures reads as foreign, or as something you would have to laugh off to tolerate. Sometimes that comes from how you were raised; sometimes from what being taken care of has meant before. Either way, the person who loves you is working with half a map: they can give you effort, but not the version where you are the one being looked after. That is worth naming out loud, because some partners will misread the reflex as not wanting them at all.',
      'Being pampered, planned-for, or waited on costs you something — comfort, maybe, or a quiet sense that the role is not yours to occupy. The giving side of care is where you live, and you live there generously; the watch-item is whether the receiving side was ever really declined, or just never rehearsed. A partner who tries the reversal once and gets waved off will usually not try twice — which means the refusal to be cared for becomes invisible, and the hunger (if there is one) goes unfed in both directions.',
    ],
    mid: [
      'Your care-roles are mostly traditional with exceptions you approve of: you give the gestures, and you can accept certain ones back — the massage, the cooked meal — while others would genuinely not sit right. That selectivity is legitimate and worth knowing precisely: which reversals feel like love to you, and which feel like a costume. A partner who knows the difference can take care of you in the register you can actually receive.',
    ],
    high: [
      'Care-roles in your answers are equipment, not identity: you give the gestures freely, and you receive them the same way — the back rub, the planned evening, being taken care of after a hard day — without it costing you anything you believe about yourself. This is rarer than it sounds, especially where gendered expectations are involved: the reflex to treat each other like someone precious, in both directions, without either of you having to stop being who you are. A partner gets the full loop with you — someone who makes them feel treasured AND lets themselves be treasured, which is what keeps the loop from becoming a service arrangement.',
    ],
    lowNote: 'Care has assigned roles; receiving reads foreign',
    midNote: 'Traditional with approved exceptions',
    highNote: 'Roles as equipment — gives and receives without cost',
  },
  {
    id: 'desire_grace',
    domain: 'closeness',
    what: 'What a mismatch costs in you: whether a no stays a no, whether bodies\' off days stay off the record, and whether want is allowed to exist without becoming an obligation.',
    low: [
      'In your answers, a mismatch tends to arrive with weight attached: a partner\'s not-now registers as a verdict to be managed, your own not-now is hard to voice without softening it into a excuse, and desire carries an audit trail — who initiated, who deferred, what the imbalance means. None of that is cruelty; it is usually what happens when want has been tied to evidence of being wanted. The cost is real though: a partner who has to perform availability stops telling the truth about their body, and that silence is where the distance actually starts.',
      'Desire, in your operating model, comes with stakes: a deflection lingers, an off-day gets read into the relationship, and saying no carries a debt you feel obligated to repay. The reflex usually comes from somewhere specific — a stretch where being wanted felt conditional. Worth knowing precisely because it is load-bearing: the partner who cannot decline around you will eventually resent the performing, and you will sense the performance without knowing its name.',
    ],
    mid: [
      'Grace around mismatch is mostly there with lapses: most nos land as information, most off-days stay off the record — but some versions of the conversation still carry a charge, and you know which ones. The useful precision is naming which mismatches you can absorb freely and which ones you privately total up; a partner can work with a map, but not with weather.',
    ],
    high: [
      'Your answers give mismatch an easy weight: a partner\'s not-now can simply be a not-now — no verdict attached, no audit opened — and your own no comes out clean rather than as a softened excuse. Bodies\' weather (the days things do not cooperate) reads as information, not evidence of anything; want is allowed to exist in the room without becoming an obligation either person has to answer for. This is the specific trait the research ties to desire surviving the years: not constant appetite, but the absence of a performance review. A partner can be honest with you at their least available, which is exactly what keeps them honest at their most.',
    ],
    lowNote: 'Mismatch carries weight and an audit',
    midNote: 'Mostly grace, with known charges',
    highNote: 'A no stays a no — no verdict, no audit',
  },
];

/**
 * Hand-authored per-dimension tier modifiers — real sentences about this
 * dimension at that intensity, appended to the nearest legacy paragraph so
 * all seven tiers read distinctly. Short forms feed the one-line readouts.
 */
const TIER_MODIFIERS: Partial<Record<DimensionId, { vlow: string; mlow: string; mhigh: string; vhigh: string; vlowShort: string; vhighShort: string }>> = {
  affection_daily: {
    vlow: 'At this end of the scale, touch is rare enough that when it happens, it registers as an event — worth noticing how much of that is choice and how much is habit wearing choice\'s clothes.',
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
    mlow: 'A receiving style rather than a missing one: you meet play warmly when a partner brings it, and your gift is appreciating the bit rather than inventing it — which makes a plan-making partner feel brilliantly funny.',
    mhigh: 'You are nearly a habitual cultivator of fun — one notch up and it would be a role you own.',
    vhigh: 'At this intensity, play is infrastructure — you treat shared lightness as load-bearing, and its disappearance registers as structural damage.',
    vlowShort: 'Leisure happens to you',
    vhighShort: 'Play as infrastructure',
  },
  capitalization: {
    vlow: 'Here, good news largely passes unmarked — celebrations are small, late, or accidental, and joys lose altitude quickly.',
    mlow: 'You mark the big ones; the ordinary wins slip past unremarked.',
    mhigh: 'You are nearly a first stop for others\' good news — the instinct is there and close to habitual.',
    vhigh: 'At this intensity, being where joy lands is a role you actively hold — active-constructive responding as a practiced craft.',
    vlowShort: 'Wins pass unmarked',
    vhighShort: 'Joy\'s landing place',
  },
  care_initiation: {
    vlow: 'Here, care is almost entirely reactive — you respond when asked, and the noticing apparatus that anticipates needs is largely idle.',
    mlow: 'You sometimes move first, but usually after a cue you had to be given.',
    mhigh: 'You nearly always move first — one notch up and anticipation would be your signature.',
    vhigh: 'At this intensity, care runs ahead of need — you arrive before the asking, and being anticipated becomes the other person\'s baseline expectation.',
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
    vlow: 'Here, other people\'s worlds get courtesy rather than exploration — you notice the enthusiasm without entering it.',
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
    mlow: 'A quieter style, not a lesser one: you step back from heat first and re-engage once the temperature drops — the pacing works well with a partner who reads the pause as processing, not absence.',
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
    mhigh: 'Almost every ledger closes when you give — the one exception worth knowing is the sacrifice that went unnoticed, which is where an audit briefly reopens.',
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
  desire_initiation: {
    vlow: 'Here, the wanting runs entirely on reception — the ignition sits in a partner\'s hands, and stillness is doing the speaking you have not found words for.',
    mlow: 'You move only when the landing is certain; until then the want stays deliberately legible only to you.',
    mhigh: 'You initiate most of the time — one notch up and waiting would feel like a silence you were choosing.',
    vhigh: 'At this intensity, initiation is how want stays true — wanting that never moved would feel like a small lie told with your stillness.',
    vlowShort: 'Want waits to be invited',
    vhighShort: 'Wanting out loud',
  },
  intimacy_attunement: {
    vlow: 'Here, the moment is experienced more than navigated — drift goes unremarked, and the current runs one-way while feeling shared.',
    mlow: 'You notice the shift but the naming is where yours stops — hope replaces the check.',
    mhigh: 'You track the moment well — one notch up and nothing would need to be performed at all.',
    vhigh: 'At this intensity, attunement is continuous — the room is legible even in the dark, and bodies\' weather never becomes a verdict.',
    vlowShort: 'Experienced, not navigated',
    vhighShort: 'Reads the room in the dark',
  },
  feedback_receiving: {
    vlow: 'Here, the case-building starts before the sentence ends — the defense is not chosen, it just arrives first.',
    mlow: 'The armor rises fast; the hearing eventually happens, but the filtered version is what most people learn to bring you.',
    mhigh: 'The flash of defense comes and mostly stands down — the residue afterward is the watch-item.',
    vhigh: 'At this intensity, feedback lands as information — the whole thing gets heard first, and the true thing gets said while it is small.',
    vlowShort: 'Defense arrives first',
    vhighShort: 'Hears the whole thing',
  },
  external_processing: {
    vlow: 'Here, processing is a private discipline — the clarity is made alone, and what a partner sees is the finished product.',
    mlow: 'An outside voice is occasionally useful, rarely necessary — the tangles mostly unwind inside.',
    mhigh: 'In practice, though, the voice is an option you rate highly rather than a need you run on — most tangles still unwind inside first, and what you hold firmly is the permission in both directions: fine with a partner using a trusted voice, fine with using one yourself when a tangle earns it. The line you actually keep is declaration over discovery.',
    vhigh: 'At this intensity the voice is infrastructure — the watch-item is not whether to use it but whether the two-person room still receives the finished thinking too, not only the processed version.',
    vlowShort: 'Processes inside first',
    vhighShort: 'Thinks out loud',
  },
  care_role_flexibility: {
    vlow: 'Here the roles are walls: the giving side is real, but the receiving side is locked, and a partner will learn the lock as a door that does not open.',
    mlow: 'The reversal is tolerated more than enjoyed — the gestures land as gestures, not as being taken care of.',
    mhigh: 'The reversal mostly lands as love rather than as a role violation — one notch up and you would be the person the gestures flow both ways around.',
    vhigh: 'At this intensity, the loop is the point: you make people feel precious, and being made to feel precious lands as care, not as a costume — the mutuality your document keeps describing is visible here.',
    vlowShort: 'Care has its lanes',
    vhighShort: 'Treasured both ways',
  },
  desire_grace: {
    vlow: 'Here every mismatch files a report: the no gets read into the relationship, the off-day becomes evidence, and want comes with an invoice attached.',
    mlow: 'Grace is there on good weeks; the charged versions of the conversation are the tell — you know exactly which nos you cannot absorb freely.',
    mhigh: 'Most nos and off-days land clean in you — the remaining charges are specific enough to name.',
    vhigh: 'At this intensity, want in the room is obligation-free in both directions — the specific trait that keeps desire honest, and alive, for years.',
    vlowShort: 'Mismatch keeps a ledger',
    vhighShort: 'Want without obligation',
  },
};

/**
 * Cross-dimension interplay passages (the core ask): a dimension never reads
 * in isolation. Keys are `Other:tierIndex` against the 7-tier scale (':4' =
 * mhigh and up); first applicable key wins.
 * Grounding: interpreted profiles beat isolated traits (Furr; Lievens 2017);
 * communal strength (Clark & Mills) predicts giving without ledgers; Gable:
 * capitalization gains require active-constructive reception; Gottman: bids
 * and repair are the load-bearing couple mechanics.
 */
const INTERPLAY_LIBRARY: Partial<Record<DimensionId, Record<string, string>>> = {
  affection_daily: {
    'positivity_play:1-': 'Read against your low score for cultivating lightness: your affection arrives as steady warmth without much play in it — devotion expressed as maintenance. Some partners read that as deep reliability; some miss the spark and call it seriousness. Naming the blend out loud is what turns it from a mystery into a style.',
    'positivity_play:4': 'Read against your high score for lightness and play: your affection and your fun feed each other — the touch carries jokes, the jokes carry touch. This combination is unusually self-sustaining; the two of you will rarely run out of shared weather.',
    // (The desire link lives under `desire` below — it renders after BOTH
    // paragraphs so it closes the pair instead of interrupting it; between
    // them, its consequence sentence landed directly above the desire
    // paragraph's own "stops showing want → hunger" ending.)
  },
  desire: {
    // First in key order: when both this and the autonomy link qualify, the
    // touch–want system is the more central reading of the desire paragraph.
    'affection_daily:6': 'Read against your high everyday-affection score: your ambient touch and your appetite for being desired are the same signal in two dialects — physical closeness is how you both give and measure want. A week of words without touch will read to you as a contradiction — want claimed but not enacted.',
    'affection_daily:1-': 'Read against your low everyday-affection score: wanting to be wanted while rarely initiating touch is a distinctive loop — you tend to read others\' physical initiative as the thermometer of your own desirability. The useful upgrade is telling a partner which of their small gestures actually register.',
    'autonomy_connection:4': 'Read against your high independence score: you want to be wanted and also want wide open space — these are compatible, but only if want is expressed in yours-and-mine frequencies rather than constant togetherness.',
  },
  vulnerability_safety: {
    'reassurance_security:4': 'Read against your high reassurance score: the vault opens and the checking continues — you show people your interior and then scan their faces for whether it cost you. Being seen and being reassured are different needs wearing similar clothes; separating them will tell you which one is actually hungry.',
  },
  reassurance_security: {
    'vulnerability_safety:1-': 'Read against your low vulnerability score: you want reassurance you cannot quite ask for — the checking runs while the sharing stays shallow. This loop tends to produce reassurance that does not land, because it is aimed at a self the other person has never fully seen.',
    'direct_communication:1-': 'Read against your low directness score: reassurance needs and indirect speech compound — you signal instead of asking, and signals are easy to miss. The single highest-leverage sentence you could learn is a plain one: "I could use some reassurance today."',
  },
  sexual_communication: {
    // "plain-spoken everywhere except the bedroom" moved to patterns.ts as
    // bedroom_vulnerability_cost — it needs a lowish sex-comm condition of its
    // own, which the single-key interplay grammar cannot express.
    'vulnerability_safety:4': 'Read against your high openness score: where you can be seen, you can also say — intimacy talk likely rides the same channel as your general openness, making you rarer than the population baseline.',
  },
  positivity_play: {
    'care_initiation:4': 'Read against your high care-initiation score: you plant both kinds of seeds — practical care and fun. Together they read as devotion with light in it. Watch the asymmetry risk: the caring seed gets noticed; the fun one gets expected.',
    'capitalization:1-': 'Read against your low celebration score: you create lightness but may not receive it — you garden fun while letting wins pass unmarked. The fix is mechanical: treat good news as its own bid, answered with the same energy you give a Saturday plan.',
  },
  capitalization: {
    'care_initiation:1-': 'Read against your low care-initiation score: you celebrate others\' news more reliably than you anticipate their needs — showing up for joy is easier for you than showing up for drudgery. A partner pairing you with the reverse type should trade roles deliberately.',
    // listening_first:3 combo owned by the pattern layer (joy_full_room) —
    // it must not fire while celebration is low.
  },
  listening_first: {
    'logic_emotion_integration:1-': 'Read against your single-register processing: you listen well in your home channel, but problems that arrive in the other register may still get a mismatched reply. The listening is real; the translation is what to work on.',
    'same_side_problems:4': 'Read against your high same-side score: listening plus externalizing is the gold-standard pair — you hear the problem out and then aim it at the world rather than each other.',
  },
  direct_communication: {
    'perspective_taking:1-': 'Read against your low benefit-of-the-doubt score: plain speech without the charity pass can land harder than you intend. The words were honest; the missing piece is the frame that makes them hearable.',
    'repair_orientation:4': 'Read against your high repair score: direct plus returning — you say the real thing and you come back to finish it, so disagreement stays something the two of you work through rather than something that costs you.',
  },
  repair_orientation: {
    'scorekeeping:4': 'Read against your high ledger score: repair gets harder when the ledger is running — apologies land on an open account. The ledger is not wrong; it just needs closing before returning can work.',
  },
  autonomy_connection: {
    'commitment_sacrifice:1-': 'Read against your priced-giving score: independence plus a running internal audit means shared plans get costed before they get wanted. Naming that in advance is kinder than discovering it mid-plan.',
  },
  shared_home_effort: {
    'scorekeeping:4': 'Read against your high ledger score: invisible work plus a running account is the exact recipe for kitchen-table resentment — the fix is moving the tally into speech before it becomes a bill.',
  },
  relational_privacy: {
    'direct_communication:4': 'Read against your high directness: inside the two-person room you are fully plain-spoken — the privacy boundary is not about avoidance but about audience control. Rare and coherent.',
  },
  commitment_sacrifice: {
    // money_coordination link owned by the pattern layer (carry_into_money) —
    // it requires BOTH scores to be high; a one-key interplay fired on
    // commitment alone, which could claim the money frame was open when it
    // wasn't.
    'scorekeeping:4': 'Read against your high ledger score: sacrifice with a running audit — you give big and remember big. The accounting is not stinginess; it is a fairness organ turned all the way up.',
  },
};

/**
 * The 28 dimensions, rebuilt at 7-tier resolution: legacy 3-band paragraphs
 * carry the tone; hand-authored modifiers differentiate the leaning and
 * extreme tiers; the interplay library conditions on co-occurring scores.
 */
export const DIMENSIONS: DimensionNarrative[] = LEGACY.map((l) => {
  const m = TIER_MODIFIERS[l.id]!;
  const base = (arr: string[]): string => arr[0];
  return {
    id: l.id,
    domain: l.domain,
    what: l.what,
    vlow: [`${base(l.low)} ${m.vlow}`],
    low: l.low,
    mlow: [`${base(l.low)} ${m.mlow}`],
    mid: l.mid,
    mhigh: [`${base(l.high)} ${m.mhigh}`],
    high: l.high,
    vhigh: [`${base(l.high)} ${m.vhigh}`],
    notes: {
      vlow: m.vlowShort,
      low: l.lowNote,
      mlow: `${l.lowNote} (leaning up)`,
      mid: l.midNote,
      mhigh: `${l.highNote} (leaning down)`,
      high: l.highNote,
      vhigh: m.vhighShort,
    },
    interplay: INTERPLAY_LIBRARY[l.id],
  };
});

/** Tier modifiers by id, exported for blueprint.ts (band-chart tier labels). */
export const TIER_MODS = TIER_MODIFIERS;

/**
 * Within-dimension variance prose: what a middle score means when the answers
 * underneath it were fighting. Keyed by dimension where the specific tug-of-war
 * is worth naming; every other dimension falls back to GENERIC_VARIANCE.
 * All entries are written for the mid/leaning bands (48–62) where averaging
 * does its best concealment, and every one names the practical upshot.
 */
export const VARIANCE_LIBRARY: Partial<Record<DimensionId, string>> = {
  affection_daily: 'Your everyday-affection score lands near the middle, but the middle is a negotiated settlement, not a resting point: some answers pull toward frequent ambient touch, others toward chosen, deliberate distance. Worth knowing which contexts activate which side — the average will mislead a partner; the pattern will not.',
  desire: 'Your score for wanting to be wanted sits near the middle, but the answers beneath it split: wanting to be visibly wanted in some registers, indifferent to it in others. The useful question is not how much you need desire expressed, but when — the switch between the two modes is the actual finding.',
  vulnerability_safety: 'Your openness score sits near the middle because two different instincts took turns answering: moments of real willingness to be seen next to moments of sealing. What exposes you varies more than how exposed you are — worth noticing which rooms open the vault and which keep it shut.',
  reassurance_security: 'Your reassurance score lands near the middle, but it is not a settled middle: some answers describe someone steady under silence, others someone counting the hours. Context, not constitution, is what moves you — naming the contexts is more useful than resolving the average.',
  care_initiation: 'Your care-initiation score sits near the middle for a reason worth knowing: anticipatory care in some territories, care-on-request in others. You are not uniformly a mover-first or a responder — the map of where you move first is the finding.',
  receiving_comfort: 'Your receiving score sits near the middle because letting care land and waving it off both got real votes. Which one wins may depend on who is giving and what it would mean to owe them — that dependency is the actual pattern, and the average hides it.',
  scorekeeping: 'Your ledger score lands near the middle, but the ledger itself is contested territory underneath: moments of genuinely free giving next to moments of quiet accounting. The scale you actually run on is likely situational — worth learning what tips it.',
  listening_first: 'Your listening score sits near the middle because witness and fixer both showed up strongly. Which one takes over likely tracks how urgent the other person\'s need reads — worth knowing, because the two modes land very differently on the receiving end.',
  direct_communication: 'Your directness score lands near the middle, but the answers underneath pull from both ends: plain speech on some subjects, careful routing around others. The topics, not the trait, are what vary — the map of what you will and will not say plainly is the real document.',
  repair_orientation: 'Your repair score sits near the middle because both instincts are real: the fast return and the longer, pride-taxed one. What decides is probably the argument\'s stakes — worth knowing your own switch, since partners mostly see only the outcome.',
  same_side_problems: 'Your same-side score lands near the middle because the team frame and the blame frame both answered. When you are resourced, you externalize the problem; when depleted, you look for its owner. The average hides that dependency — the condition is the finding.',
  conflict_engagement: 'Your conflict score sits near the middle because engagement and retreat both carried weight in your answers. Heat is likely the switch: one person\'s raised voice draws you in, another\'s sends you quiet. Knowing your trigger matters more than the midpoint you average to.',
  autonomy_connection: 'Your independence score lands near the middle, but the middle here is genuinely two-valued: strong comfort alone next to strong pull toward togetherness. That is not indecision — it is a real oscillation, and the calibration between its poles is the lifelong project the score flattens.',
  shared_home_effort: 'Your shared-effort score sits near the middle, but the answers beneath it split between designed systems and running-on-noticing. Which mode you are in likely tracks how loaded your week already was — the average hides that your contribution has states, not a level.',
  relational_privacy: 'Your privacy score lands near the middle because two boundary rules both answered: the sealed two-person room and the wider-circle default. What gets shared probably depends on the audience more than the content — mapping that dependency is more honest than any single number.',
  sexual_communication: 'Your intimacy-communication score sits near the middle, but it is not a uniform middle: some regions of desire are speakable in your answers and others are routed around. The map of where the channel opens is the actual finding — the average smooths it into fog.',
  positivity_play: 'Your play score lands near the middle, but the answers show planting lightness and foraging it both happened. You may be the gardener in some seasons and the guest in others — knowing which season activates which role is worth more than the midpoint.',
  capitalization: 'Your celebration score sits near the middle, but the underneath is not lukewarm: stopping fully for some wins and letting others pass unmarked. The inconsistency is the pattern — worth learning which kind of good news reliably gets your full stop.',
  commitment_sacrifice: 'Your carry score lands near the middle because wholehearted backing and the value-check both answered. Size of the ask is likely the switch — small things ride free while the large ones get priced. Knowing that about yourself beats defending the average.',
  money_coordination: 'Your money score sits near the middle, but the answers beneath split between teammate framing and auditor framing. The trigger is probably legitimacy — spending that reads as obviously shared passes free while debatable purchases get a hearing. The average hides the courtroom.',
  desire_initiation: 'Your initiation score lands near the middle, but the answers beneath it split: moving first in some registers of want, waiting to be invited in others. Which mode activates probably tracks how safe the landing feels — the map of where you move is the finding, not the average.',
  intimacy_attunement: 'Your attunement score sits near the middle because reading-the-moment and following-your-own-current both answered. You likely track well in calm moments and lose the thread in charged ones — the condition, not the midpoint, is the finding.',
  feedback_receiving: 'Your feedback score lands near the middle, but the underneath is contested: genuine curiosity about the point next to a reflex of defense. Which one wins probably depends on how exposed the feedback finds you — knowing your trigger beats defending the average.',
  external_processing: 'Your processing score sits near the middle because thinking-out-loud and working-it-through-alone both got real votes. What decides is probably the size of the tangle and whether you already know your own mind — the average hides that your method has states, not a level.',
  care_role_flexibility: 'Your care-role score lands near the middle, but the middle here is a permission slip with conditions: some reversals read as love and others as costume. The map of which is which is worth more than the average — a partner can work with a list, not with a vibe.',
  desire_grace: 'Your grace score sits near the middle because easy and charged both answered: most mismatches land clean, some versions of the conversation still carry a price. Which ones charge you is the actual finding — the average smooths a map into a mood.',
};

/** Fallback variance prose for dimensions without a specific entry. */
export const GENERIC_VARIANCE: string[] = [
  'Your score here sits near the middle, but the answers underneath it were not all mild ones — pulls in both directions canceled into the average. That is a different situation from genuinely moderate feelings: you likely run strong in one context and opposite in another. The middle number will mislead a partner more than the pattern will.',
  'The middle score here is doing more averaging than it looks like: some of your answers pulled clearly one way, others clearly the other, and the two settled into a compromise neither of them chose. Where the context flips matters more than where the number lands.',
];

/** Seeded pick so the same profile renders the same variance note every time. */
export function genericVarianceFor(seedKey: string): string {
  return seededPick(GENERIC_VARIANCE, hash(seedKey));
}

/**
 * Alternate band paragraphs (the two bands real profiles actually land in).
 * The legacy mhigh and high arrays share one base paragraph, so two different
 * people at the same band previously rendered the identical prose. Each entry
 * here is a second, fully standalone paragraph for the band — distinct opener,
 * same factual claim, honest tone, no tier-specific intensity claims (it is
 * used for both leaning-high and high). Selection is seeded per-run and
 * deterministic: the same session always regenerates the same document.
 */
export const TIER_VARIANTS: Partial<Record<DimensionId, Partial<Record<'mhigh' | 'high', string>>>> = {
  affection_daily: {
    mhigh: 'Reaching comes naturally to you — the hand on the back in passing, the shoulder lean while something is on the stove. Your answers describe contact as a running background process: it does not wait for occasions, and a day or two without it is something you register and then correct. A partner rarely has to ask whether you are still glad they are there; they can feel it in the traffic — constant small evidence of proximity maintained.',
  },
  desire: {
    mhigh: 'For you, desire is not a mood that visits — it is a signal that has to keep being sent. The message in the middle of the day, the look across a room, the evidence of being chosen rather than merely accommodated: these read to you as the difference between a partner and a housemate. Your answers suggest a partner could love you steadily and still leave you hungry if the wanting went quiet — and that you would notice long before you said anything.',
  },
  vulnerability_safety: {
    mhigh: 'What people hand you in confidence stays handed. When an argument heats up, the temptation to reach for a disclosed soft spot is real, and your answers show you not reaching — declining the low blow even when it would have scored. That refusal is the thing people eventually describe as the reason they trusted you with the deep material: it never came back aimed at them.',
  },
  reassurance_security: {
    mhigh: 'Unanswered questions about where you stand have a way of growing. Your answers show you managing the quiet stretches — coping, functioning — while a background thread keeps checking whether the distance means anything. You do not want to be talked down from ledges; you want the information that prevents the ledge: a plain sentence about someone\'s bad day arriving before you had to ask. Proactive clarity is what actually settles you.',
  },
  care_initiation: {
    mhigh: 'You move first. The snack that was not asked for, the massage offered on the hard day, the errand absorbed before anyone mentioned it — in your scenarios, noticing and acting were the same step. This reads to people as being truly seen in the practical register: not told "let me know if you need anything," but simply finding it already handled. The attention to watch is the reverse direction — making sure you still let people anticipate you too.',
  },
  receiving_comfort: {
    mhigh: 'Care offered to you gets to arrive. Your answers show no flinch at compliments, no reflex to split the bill on kindness, no need to repay a favor before it settles — being taken care of reads to you as love, not debt. That ease is rarer than it looks and it does real work: it lets the people who love you experience their own generosity landing, which is half of what anyone wants from giving.',
  },
  scorekeeping: {
    mhigh: 'You run a long ledger, and mostly a closed one. Individual gestures in your answers carry no price tags — no one owes anyone for dinner or a favor — but the pattern over time is not invisible to you either: you notice when the giving runs one way for a season, and you expect it to bend back eventually without being invoiced. The fairness you practice is measured in years, and its one blind spot is silence — a chronic imbalance can normalize before you name it.',
  },
  express_receive_alignment: {
    mhigh: 'There is a symmetry to how you love: what you naturally give and what naturally lands on you belong to the same dialect family. A partner can learn you by watching you — the way you care for people is a readable map of how you want to be cared for. That legibility is a quiet gift in a relationship: fewer translation errors, fewer unmet needs hiding behind different vocabularies.',
  },
  listening_first: {
    mhigh: 'Your instinct is to hold the space open. When someone brings you something heavy, you do not reach for the fix, the reframe, or your own story — you let the sentence finish and then ask about what is inside it. People notice being heard at that level, and it changes what they bring you: more truth, earlier, less edited. The solutions can wait their turn, and in your answers, they usually do.',
  },
  logic_emotion_integration: {
    mhigh: 'You keep two registers running without forcing either to translate for the other. Something happens: you can think it through, and you can feel it through, and your answers suggest you know which mode a moment calls for — without treating the other one as a failure. It is a rare integration: analysis that has not lost its warmth, feeling that has not lost its structure.',
  },
  curiosity_worlds: {
    mhigh: 'Other people\'s enthusiasms pull you in. The explanation you do not understand and do not need to — you ask anyway, because the point is what it does to them when they talk about it. Your answers treat interest as a form of attention, and attention as a form of love: the person whose world you keep entering gets to feel worth entering. It is a quality people describe as feeling interesting for a lifetime rather than a season.',
  },
  perspective_taking: {
    mhigh: 'You give people room. Before a story forms about why someone did the thing, your instinct is to widen it — check the facts, hold the alternate explanations, assume there is more underneath than visible. It makes you hard to feel misjudged by: the people around you get to be complicated without bracing for a verdict. The charity is not naïveté; your answers pair it with checking, not wishful thinking.',
  },
  direct_communication: {
    mhigh: 'You do not let things ferment. When something bothers you, your answers route it into speech while it is still manageable — "this bothered me" said on day one rather than archived into resentment on day forty. Directness, for you, appears to be a form of respect: the relationship deserves real information, not archaeology. And you seem to want it in both directions, which matters as much as the giving.',
  },
  repair_orientation: {
    mhigh: 'You come back. After the blowup or the cold stretch, your answers show you re-opening the conversation — apologizing specifically, asking what actually landed, treating the bad interaction as information rather than a verdict on anyone. Conflicts around you tend to end faster and leave less residue, because someone keeps insisting on the return. That someone is usually you.',
  },
  same_side_problems: {
    mhigh: 'Problems in your answers get externalized fast. The broken thing, the tight month, the complicated relative — your first instinct reframes it as a shared situation before anyone has to become the defendant. Standing next to you in a crisis apparently feels like accompaniment rather than audit, and that is the quality partners describe as "we can get through anything" — earned, in your case, at the level of reflex.',
  },
  autonomy_connection: {
    mhigh: 'You do not treat closeness and separateness as opposites. Your answers hold real comfort with a partner\'s separate life — their hobbies, their friendships, their quiet — right next to a strong pull toward connection. The combination reads as secure rather than avoidant: space does not register as rejection, and togetherness does not register as loss of self. Calibration, not commitment, is the ongoing work.',
  },
  shared_home_effort: {
    mhigh: 'The household\'s invisible labor does not stay invisible to you. You notice what needs doing and mostly just do it — the researched fix, the phone call absorbed, the thing handled before it was announced as a task. Your answers also favor a home where the mental load is speakable: ask without shame, answer honestly, extend the same grammar back. The watch-item is the classic one — competence that never announces itself can mute its own recognition.',
  },
  relational_privacy: {
    mhigh: 'What happens between you stays between you by default. Your answers draw a firm frame around the relationship\'s contents: counsel from a trusted voice is welcome when genuinely needed, but there is no audience to perform for and no jury to poll. It reads as protection rather than secrecy — the privacy is what lets the people close to you risk being imperfect without becoming a story someone else tells.',
  },
  sexual_communication: {
    mhigh: 'In your answers, nothing in intimacy has to go unsaid. Wants, limits, curiosities, the things that are not working — they are framed as conversation rather than confession, and the ease extends to hearing a partner\'s map without flinching. Research ties this speakability to both sexual and relationship satisfaction more strongly than almost anything else, and it comes with a corollary your answers already carry: nobody has to perform a script they cannot edit.',
  },
  positivity_play: {
    mhigh: 'Flat time does not stay flat around you. Your answers show you seeding lightness deliberately — the invented walk, the dumb movie, the project nobody planned — treating shared fun as something grown rather than waited for. Play, for you, is maintenance work you actually enjoy, and its payoff compounds: the couple that laughs keeps wanting each other, and you seem to know it.',
  },
  capitalization: {
    mhigh: 'Good news gets a reception at your place. Your answers chose the full-body response to someone\'s win — put it down, turn around, start from the beginning — the active-constructive pattern that turns a report into a bond. People who live with you likely experience their victories as bigger for having told you, and they learn where joy goes to land.',
  },
  conflict_engagement: {
    mhigh: 'You do not leave the ring. Your answers show you staying in hard conversations and defending your position while genuinely tracking theirs — and reaching for the brake ("let\'s name the temperature") rather than the counterattack when the temperature rises. Disagreement, in your make-up, does not have to become damage; it can just be the two of you working. That is a learnable skill, and your answers suggest you already learned it.',
  },
  commitment_sacrifice: {
    mhigh: 'When you give something up for the relationship, the giving settles it. Your answers show no running invoice, no background cost-benefit — sacrifice reads as constitutive, part of what choosing someone meant. The upside is a steadiness partners can build on; the caution is proportionality — make sure the same arithmetic-free door swings both ways, because one-way carrying is the only load this generosity cannot absorb.',
  },
  money_coordination: {
    mhigh: 'You frame money as a shared project rather than a private scoreboard. Equal seriousness for both people\'s spending when the bills are paid, early information when the month is tight, no trial for the unannounced purchase the foundation can absorb — your answers describe a teammate economy, revisable out loud, without double standards. It is rarer than it sounds, and it removes one of the standard couple fights before it starts.',
  },
  desire_initiation: {
    mhigh: 'You are willing to move first — and you are willing to hear no. Your answers describe initiation without bracing: the move gets made, and when it does not land, the sting is brief and real and does not curdle into withdrawal or score-keeping. That recovery is the rare and load-bearing part; it is what makes you safe to want things around, because your wanting does not turn into pressure the moment it is not immediately matched.',
  },
  intimacy_attunement: {
    mhigh: 'You track the unworded. Drift, hesitation, the difference between want and willingness — your answers show you noticing, adjusting, and checking when unsure rather than hoping. Bodies\' off days read to you as information, not verdicts, which is precisely the attunement the research links to lasting satisfaction. A partner never has to perform okay-ness with you; you would catch the performance anyway.',
  },
  feedback_receiving: {
    mhigh: 'Hard feedback gets a full hearing from you before anything fires back. Your answers suggest the defense reflex does not get the first word — curiosity does: what took them so long to tell me, what am I missing. The people close to you can say the true thing while it is still small, because they have learned it lands. That is among the rarer and more load-bearing skills a relationship can run on.',
  },
  external_processing: {
    mhigh: 'Your best untangling happens out loud, with someone you trust. Your answers treat talking something through — openly, declared, aimed at understanding — as a legitimate way to think, and they extend the same permission to a partner. The line you keep is not about silence; it is about consent: processing declared is collaboration, processing discovered is exclusion. You know the difference, and it shows.',
  },
};
