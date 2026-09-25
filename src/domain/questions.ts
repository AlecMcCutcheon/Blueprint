import type { Question } from './types';

// Question bank design principles (see PROJECT_NOTES.md §4):
// - No question names the trait it measures.
// - Every option is a thing a decent person might actually do (no strawmen).
// - Situational layers (instinct/behavior) carry higher diagnosticWeight than
//   self-reflection layers.
// - Options carry signed weights on 1–4 dimensions; per-option descriptions
//   power the review screen ("what the alternatives would have revealed").
// - `channel` tags on q53/q54 (and selected others) power express_receive_alignment.
// - q03/q60 (update pair), q53/q54 (mirror pair), and the layer-6 duplicates
//   (q10/q55, q04/q61, q14/q62) are measured for internal consistency.

const CORE_QUESTIONS: Question[] = [
  // ─────────────────────────── Layer 1 — Instinct ───────────────────────────
  {
    id: 'q01',
    layer: 1,
    format: 'scenario',
    prompt: [
      'You can tell your partner is upset about something. When you ask, they say, "I don\'t want to talk about it right now," and go quiet.',
      'What\'s your first instinct?',
    ],
    options: [
      {
        id: 'a',
        label: 'Give them space, but stay nearby so they know I\'m here.',
        description: 'You read silence as a need, not a rejection — and you answer it with presence rather than pressure.',
        weight: { listening_first: 0.7, affection_daily: 0.3, reassurance_security: 0.2 },
      },
      {
        id: 'b',
        label: 'Wait it out. When they\'re ready, they\'ll tell me.',
        description: 'You take people at their word, even when the word is "fine." Steady, but the quiet can go unexplored longer than it needs to.',
        weight: { perspective_taking: 0.4, reassurance_security: -0.3, listening_first: 0.2 },
      },
      {
        id: 'c',
        label: 'Gently ask once more — I\'d rather know than guess.',
        description: 'You treat ambiguity as something to resolve together. Direct, though it can read as pressure to someone who needs the silence first.',
        weight: { direct_communication: 0.7, listening_first: 0.3, perspective_taking: -0.2 },
      },
      {
        id: 'd',
        label: 'Do something for them — make tea, handle a chore — so the evening feels lighter.',
        description: 'Your care arrives through action. Real, though sometimes it substitutes for the harder work of just being with the feeling.',
        weight: { care_initiation: 0.7, listening_first: 0.2, affection_daily: 0.2 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q02',
    layer: 1,
    format: 'scenario',
    prompt: [
      'You\'re both home after work. Neither of you has much energy left. You\'ve had something on your mind you wanted to talk about — but your partner seems completely drained.',
      'What do you most naturally do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Bring it up anyway, gently — better tonight than letting it sit.',
        description: 'You put things into words while they\'re small, even when the moment isn\'t perfect. Timing sometimes costs you.',
        weight: { direct_communication: 0.8, listening_first: -0.2 },
      },
      {
        id: 'b',
        label: 'Wait for a better moment, and actually make one tomorrow.',
        description: 'You can hold a thing without dropping it — patience plus follow-through. Rare combination.',
        weight: { direct_communication: 0.6, listening_first: 0.5, repair_orientation: 0.2 },
      },
      {
        id: 'c',
        label: 'Let it go for now. It probably wasn\'t that important.',
        description: 'You defer to the mood of the room. Things occasionally evaporate that needed saying.',
        weight: { direct_communication: -0.7, listening_first: 0.3 },
      },
      {
        id: 'd',
        label: 'Mention there\'s something on my mind, then ask when a good time would be.',
        description: 'You give the relationship a heads-up without demanding the evening. You treat conversations as appointments two people agree to.',
        weight: { direct_communication: 0.8, listening_first: 0.4, shared_home_effort: 0.2 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q03',
    layer: 1,
    format: 'scenario',
    prompt: [
      'Your partner comes home quieter than usual. You ask how their day was. They say, "I\'m fine," and start making dinner.',
      'What do you do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Take it at face value and let the evening be the evening.',
        description: 'You grant "fine" its dignity. People are sometimes just tired — though you may miss the times it isn\'t true.',
        weight: { perspective_taking: 0.6, reassurance_security: -0.4 },
      },
      {
        id: 'b',
        label: 'Stay close. Don\'t ask again, but don\'t drift to the other room either.',
        description: 'You answer ambiguity with proximity — available without interrogating. The classic "there if you want me."',
        weight: { listening_first: 0.6, affection_daily: 0.3, care_initiation: 0.2 },
      },
      {
        id: 'c',
        label: 'Check in once more, softly: "You seem a little flat — everything okay?"',
        description: 'You name what you notice and invite the real answer. Once is attentive; your pattern elsewhere tells us if it ever becomes pushing.',
        weight: { care_initiation: 0.5, direct_communication: 0.4, perspective_taking: 0.2 },
      },
      {
        id: 'd',
        label: 'Give them room, but notice whether it happens again tomorrow.',
        description: 'You track patterns, not moments. One quiet evening is data; several are a signal. You\'re already watching.',
        weight: { perspective_taking: 0.5, care_initiation: 0.3, logic_emotion_integration: 0.2 },
      },
    ],
    diagnosticWeight: 1.2,
    note: 'This one reappears later in a different light.',
  },
  {
    id: 'q04',
    layer: 1,
    format: 'scenario',
    prompt: [
      'Your partner walks in at the end of a terrible week. You can see it on them before they say a word.',
      'What feels most natural to you in the first hour?',
    ],
    options: [
      {
        id: 'a',
        label: 'Make them comfortable — food, the couch, their favorite thing on.',
        description: 'Anticipatory care: you treat their depletion as a request that never needed to be spoken.',
        weight: { care_initiation: 0.9, affection_daily: 0.2 },
      },
      {
        id: 'b',
        label: 'Be available without pressing — let them lead the evening.',
        description: 'You follow their pace, not yours. Your presence is an offer, not a plan.',
        weight: { listening_first: 0.7, perspective_taking: 0.4 },
      },
      {
        id: 'c',
        label: 'Try to lift the mood — get us out of the house, make us laugh.',
        description: 'You fight heaviness with energy. Sometimes that\'s exactly right; sometimes it skips the feeling entirely.',
        weight: { care_initiation: 0.4, listening_first: -0.4, affection_daily: 0.2 },
      },
      {
        id: 'd',
        label: 'Ask what happened and start working out what can be done.',
        description: 'You meet problems head-on. Useful — but a drained person sometimes needs witness before a plan.',
        weight: { logic_emotion_integration: 0.4, listening_first: -0.5, same_side_problems: 0.3 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q05',
    layer: 1,
    format: 'scenario',
    prompt: [
      'Your partner has had a rough week. You have an important project of your own tomorrow and you\'re already exhausted.',
      'They aren\'t asking you for anything specifically. They\'re just clearly having a bad night.',
      'What would you be most likely to do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Make sure they know I\'m available, then focus on my own work.',
        description: 'You balance honestly — signal care, keep your commitments. The risk is that "available" becomes theoretical.',
        weight: { scorekeeping: 0.3, care_initiation: 0.2, direct_communication: 0.3 },
      },
      {
        id: 'b',
        label: 'Put my own plans aside for the evening.',
        description: 'When need appears, you move toward it. No ledger consulted.',
        weight: { care_initiation: 0.8, scorekeeping: -0.4 },
      },
      {
        id: 'c',
        label: 'Spend some real time with them, but keep most of my plans intact.',
        description: 'You split the difference. It can work — if both halves actually happen.',
        weight: { scorekeeping: 0.4, care_initiation: 0.3 },
      },
      {
        id: 'd',
        label: 'Ask directly what they need before deciding anything.',
        description: 'You don\'t guess at need; you ask. Respectful — though on some nights, "I don\'t know" is the honest answer and your question adds weight.',
        weight: { direct_communication: 0.6, care_initiation: 0.3, listening_first: 0.2 },
      },
    ],
    diagnosticWeight: 1.4,
  },
  {
    id: 'q06',
    layer: 1,
    format: 'scenario',
    prompt: [
      'Your partner is excited about something you know almost nothing about. They light up and start explaining it — and ten minutes in, they\'re still going.',
      'What\'s actually happening for you?',
    ],
    options: [
      {
        id: 'a',
        label: 'I\'m genuinely into it — I want to understand why it grabs them.',
        description: 'Curiosity as love. You know that being asked a second question can mean more than any gift.',
        weight: { curiosity_worlds: 0.9, listening_first: 0.3 },
      },
      {
        id: 'b',
        label: 'I\'m happy they\'re happy. I follow most of it, some of it floats past.',
        description: 'Warm support without deep entry. Their joy registers; the mechanics don\'t.',
        weight: { curiosity_worlds: 0.4, listening_first: 0.2 },
      },
      {
        id: 'c',
        label: 'I drift. I care about them, but not about the thing.',
        description: 'Honest, and common. The cost lands later — passion is where people are most themselves, and it goes unwitnessed.',
        weight: { curiosity_worlds: -0.7 },
      },
      {
        id: 'd',
        label: 'I start asking questions — partly from interest, partly because I want to be part of their world.',
        description: 'You step into their world on purpose. Participation as affection, even without native interest.',
        weight: { curiosity_worlds: 0.8, autonomy_connection: 0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q07',
    layer: 1,
    format: 'scenario',
    prompt: [
      'You\'ve had a heavy few days. You\'re quieter than normal, and your partner notices and asks if you\'re okay.',
      'What\'s your honest first response?',
    ],
    options: [
      {
        id: 'a',
        label: 'Tell them what\'s actually going on.',
        description: 'You let yourself be known while it\'s happening. Receiving care starts with letting someone see the need.',
        weight: { direct_communication: 0.6, receiving_comfort: 0.5 },
      },
      {
        id: 'b',
        label: '"I\'m fine" — I\'ll deal with it myself first.',
        description: 'You process privately and surface later. Self-sufficient — but it can leave a partner locked out of the one room they want in.',
        weight: { receiving_comfort: -0.5, direct_communication: -0.4, perspective_taking: 0.2 },
      },
      {
        id: 'c',
        label: '"Just tired" — technically true, not the whole picture.',
        description: 'A partial door: open enough to avoid worry, closed enough to avoid explaining. Sometimes wise, sometimes a habit of withholding.',
        weight: { receiving_comfort: -0.2, direct_communication: -0.3 },
      },
      {
        id: 'd',
        label: 'Tell them, and tell them it isn\'t about them.',
        description: 'You share the load and the reassurance in the same breath — protecting them from the story-building the silence would cause.',
        weight: { receiving_comfort: 0.6, perspective_taking: 0.5, direct_communication: 0.4 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q08',
    layer: 1,
    format: 'scenario',
    prompt: [
      'Someone you love tells you that something you said hurt them. You didn\'t intend it that way at all.',
      'Your immediate internal reaction is closest to:',
    ],
    options: [
      {
        id: 'a',
        label: '"I didn\'t mean it that way, so they probably misheard me."',
        description: 'Intent becomes the whole story. The hurt gets processed as an error to correct rather than a signal to hear.',
        weight: { perspective_taking: -0.7, repair_orientation: -0.3 },
      },
      {
        id: 'b',
        label: '"I need to understand what they heard that I didn\'t say."',
        description: 'You treat their experience as data about impact, not accusation about intent. The rarest and most useful reflex.',
        weight: { perspective_taking: 0.9, listening_first: 0.4 },
      },
      {
        id: 'c',
        label: 'I feel accused and want to explain myself.',
        description: 'Defense first — human, and usually the wrong first move. The explanation exists, but it needs to wait its turn.',
        weight: { repair_orientation: -0.5, listening_first: -0.4 },
      },
      {
        id: 'd',
        label: '"I don\'t know if they\'re being fair, but I want to hear them out."',
        description: 'You hold both truths: your intent and their experience. Fairness deferred in favor of understanding.',
        weight: { perspective_taking: 0.6, listening_first: 0.5, repair_orientation: 0.3 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q09',
    layer: 1,
    format: 'scenario',
    prompt: [
      'You\'re working on something at your desk, absorbed. Your partner walks by and takes your hand for a moment. Doesn\'t say anything. Keeps walking.',
      'What does that moment do to you?',
    ],
    options: [
      {
        id: 'a',
        label: 'It lands. That little touch stays with me for a while.',
        description: 'Small bids of connection register with you — and being registered is what keeps people making them.',
        weight: { affection_daily: 0.8, desire: 0.2 },
      },
      {
        id: 'b',
        label: 'It\'s nice, though I barely notice — I\'m deep in the work.',
        description: 'Your focus is real, but small bids live or die on reception. Missed often enough, they stop being sent.',
        weight: { affection_daily: 0.2, listening_first: -0.2 },
      },
      {
        id: 'c',
        label: 'I get up and follow them — steal a hug, see if they want anything.',
        description: 'You don\'t just receive the bid; you return it with interest. Connection compounds around people like you.',
        weight: { affection_daily: 0.9, care_initiation: 0.4, desire: 0.2 },
      },
      {
        id: 'd',
        label: 'Honestly, it interrupts me. I\'d rather we do this properly later.',
        description: 'You prefer affection to be an event with full attention. Understandable — but the tiny passes are how most affection actually travels.',
        weight: { affection_daily: -0.5, autonomy_connection: 0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q10',
    layer: 1,
    format: 'scenario',
    prompt: [
      'Your partner looks at you across the room and says, out of nowhere, "You look really good today."',
      'What happens internally?',
    ],
    options: [
      {
        id: 'a',
        label: 'It lands cleanly. I feel seen, and it makes my whole day.',
        description: 'Compliments reach you — which matters more than most people realize. Receiving is half of any compliment\'s existence.',
        weight: { receiving_comfort: 0.8, desire: 0.4 },
      },
      {
        id: 'b',
        label: '"What did I do to deserve that?" — part of me searches for the catch.',
        description: 'Praise trips a quiet scan for the catch before the warmth arrives — often learned somewhere specific, and worth noticing.',
        weight: { receiving_comfort: -0.6, scorekeeping: 0.3 },
      },
      {
        id: 'c',
        label: 'I enjoy it — and immediately think about what I should say back.',
        description: 'Warmth with a reflex to rebalance. You receive, but the counterweight leaves your hand almost before it lands.',
        weight: { receiving_comfort: 0.3, scorekeeping: 0.3 },
      },
      {
        id: 'd',
        label: 'I appreciate it, but I\'d rather they just tell me what they actually need.',
        description: 'You discount unearned warmth in favor of "real" information. Flattery feels like static to you.',
        weight: { receiving_comfort: -0.4, desire: -0.3, direct_communication: 0.3 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q11',
    layer: 1,
    format: 'scenario',
    prompt: [
      'You\'re both carrying boxes on moving day. Your partner misjudges a doorway and a box rips — something you cared about is broken on the floor.',
      'Your first sentence is closest to:',
    ],
    options: [
      {
        id: 'a',
        label: '"Hey — it\'s a thing. Are your hands okay?"',
        description: 'Person before property. Your partner learns that small disasters can be reported to you, which is how you find out about big ones early.',
        weight: { same_side_problems: 0.9, perspective_taking: 0.3 },
      },
      {
        id: 'b',
        label: '"Ugh — that was the good one. How did that happen?"',
        description: 'The object and the mechanics first. Fair in the moment; over years it teaches people to hide breakage.',
        weight: { same_side_problems: -0.6, perspective_taking: -0.2 },
      },
      {
        id: 'c',
        label: '"It\'s fine — let\'s figure out if it can be fixed."',
        description: 'Straight to team-mode on the problem itself. Solution-first; the person gets less attention than the project.',
        weight: { same_side_problems: 0.5, logic_emotion_integration: 0.2, listening_first: -0.1 },
      },
      {
        id: 'd',
        label: 'Nothing out loud — but I\'m annoyed, and they can tell.',
        description: 'The criticism goes silent, not away. Silence with a temperature is its own verdict, and everyone can read it.',
        weight: { same_side_problems: -0.4, direct_communication: -0.4 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q12',
    layer: 1,
    format: 'scenario',
    prompt: [
      'A friend asks how things are with your partner. Last night the two of you had a real argument — not a breakup-level one, but a real one.',
      'What comes out of your mouth?',
    ],
    options: [
      {
        id: 'a',
        label: '"We\'re good — we had a rough night last night, but we\'re working through it."',
        description: 'Honest without an indictment. Your partner exists in the retelling as a person, not a defendant.',
        weight: { direct_communication: 0.4, vulnerability_safety: 0.6, same_side_problems: 0.2 },
      },
      {
        id: 'b',
        label: '"We\'re fine." Full stop.',
        description: 'Privacy as a wall. Protected — but no one ever gets to help, and your own accounting stays sealed.',
        weight: { vulnerability_safety: 0.4, direct_communication: -0.3 },
      },
      {
        id: 'c',
        label: 'The full story, including the part they said and the part they did.',
        description: 'You process out loud. Your partner\'s worst moments may be living in other people\'s heads without their consent.',
        weight: { vulnerability_safety: -0.8 },
      },
      {
        id: 'd',
        label: '"Rough patch. I\'ll probably talk to someone about it — them included."',
        description: 'You\'re transparent about the process without publishing the contents. Support without exposure.',
        weight: { vulnerability_safety: 0.5, direct_communication: 0.3 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q13',
    layer: 1,
    format: 'scenario',
    prompt: [
      'You\'re cooking. Your partner walks through the kitchen, kisses your neck, and keeps walking to put their phone away.',
      'What\'s true for you in the next ten seconds?',
    ],
    options: [
      {
        id: 'a',
        label: 'I reach for them as they pass. Not to restart it — just because.',
        description: 'Touch is your ambient language. Bid received, bid returned, no agenda attached.',
        weight: { affection_daily: 0.9, desire: 0.3 },
      },
      {
        id: 'b',
        label: 'I smile and keep cooking. It was nice.',
        description: 'You receive touch with warmth, if not with pursuit. The bid lands; the return pass waits.',
        weight: { affection_daily: 0.5 },
      },
      {
        id: 'c',
        label: 'Part of me wonders if they wanted something more and I should follow up.',
        description: 'You read affection as a prelude with an obligation attached — turning a free moment into an expectation.',
        weight: { affection_daily: -0.2, desire: 0.3, scorekeeping: 0.2 },
      },
      {
        id: 'd',
        label: 'I barely register it; I\'m locked on dinner.',
        description: 'When absorbed, the channel closes. A partner who touches often may slowly learn how little it broadcasts to you.',
        weight: { affection_daily: -0.5 },
      },
    ],
    diagnosticWeight: 1.1,
  },
  {
    id: 'q14',
    layer: 1,
    format: 'scenario',
    prompt: [
      'It\'s 9pm. You\'re wrecked. Your partner says, "Come here — lie down, I\'ll rub your back."',
      'What\'s your honest response?',
    ],
    options: [
      {
        id: 'a',
        label: 'Take it. Fully. Let my brain switch off and just be taken care of.',
        description: 'You can receive without instantly paying. This is the rarer half of generosity — and it lets people love you properly.',
        weight: { receiving_comfort: 0.9, scorekeeping: -0.2 },
      },
      {
        id: 'b',
        label: 'Take it — but tomorrow I owe them one, and I\'ll make sure.',
        description: 'The care gets enjoyed — and instantly converted into something owed. Rest can wait until the books feel balanced.',
        weight: { receiving_comfort: 0.3, scorekeeping: 0.7 },
      },
      {
        id: 'c',
        label: '"You don\'t have to do that" — wave it off, I\'m fine.',
        description: 'Turning care away is a reflex: being attended to can feel like spending someone else\'s energy, so you decline first.',
        weight: { receiving_comfort: -0.8 },
      },
      {
        id: 'd',
        label: 'Take it, and ask if they want one too when it\'s done.',
        description: 'Generous instinct — the question is whether it\'s warmth or the debt-relief reflex wearing warmth\'s clothes.',
        weight: { receiving_comfort: 0.2, care_initiation: 0.4, scorekeeping: 0.3 },
      },
    ],
    diagnosticWeight: 1.2,
  },

  // ───────────────────── Layer 2 — Preference (forced pairs) ─────────────────────
  {
    id: 'q15',
    layer: 2,
    format: 'forced_pair',
    prompt: ['Which situation would genuinely be harder for you to deal with?'],
    options: [
      {
        id: 'a',
        label: 'A partner who\'s upset but won\'t say why and wants space.',
        description: 'Ambiguity is your tax: the unexplained feeling is what eats at you.',
        weight: { reassurance_security: 0.8, listening_first: 0.2 },
      },
      {
        id: 'b',
        label: 'A partner who explains exactly why they\'re upset — but the explanation comes out cold and analytical.',
        description: 'Delivery is your tax: you can handle the content of anything except receiving it at room temperature.',
        weight: { logic_emotion_integration: 0.8, listening_first: 0.3 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q16',
    layer: 2,
    format: 'forced_pair',
    prompt: ['Which would you find more frustrating to live with?'],
    options: [
      {
        id: 'a',
        label: 'A partner who wants to talk through an argument immediately, while it\'s hot.',
        description: 'You process on delay; their urgency feels like pressure to perform an understanding you don\'t have yet.',
        weight: { direct_communication: -0.4, repair_orientation: 0.3, autonomy_connection: 0.2 },
      },
      {
        id: 'b',
        label: 'A partner who needs several hours — sometimes days — before they\'re ready to talk.',
        description: 'The silence while they reset is where your imagination works against you.',
        weight: { direct_communication: 0.4, reassurance_security: 0.5 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q17',
    layer: 2,
    format: 'forced_pair',
    prompt: ['Which would be harder for you in a long relationship?'],
    options: [
      {
        id: 'a',
        label: 'Someone who needs a lot of reassurance, often.',
        description: 'Being someone\'s steady supply is draining to you — you\'d start to feel the relationship as a duty.',
        weight: { reassurance_security: -0.7, receiving_comfort: 0.2 },
      },
      {
        id: 'b',
        label: 'Someone who rarely asks for reassurance but sometimes goes distant without explanation.',
        description: 'You read their self-containment as disappearance. The asking you could handle; the quiet is worse.',
        weight: { reassurance_security: 0.7, care_initiation: 0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q18',
    layer: 2,
    format: 'forced_pair',
    prompt: ['Be honest — which one would mean more to you, over a whole relationship?'],
    options: [
      {
        id: 'a',
        label: 'Being deeply understood — someone who actually gets how your mind works.',
        description: 'Understanding is the substance of love for you. Admiration is nice; being known is the meal.',
        weight: { listening_first: 0.6, perspective_taking: 0.5, desire: -0.3 },
        channel: 'words',
      },
      {
        id: 'b',
        label: 'Being deeply wanted — someone who still looks at you like that, years in.',
        description: 'Desire is the substance of love for you. Understanding is nice; being wanted is the meal.',
        weight: { desire: 0.8, listening_first: -0.2 },
        channel: 'touch',
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q19',
    layer: 2,
    format: 'forced_pair',
    prompt: ['Which fade-out would you notice first — and feel most?'],
    options: [
      {
        id: 'a',
        label: 'The compliments and spoken appreciation drying up.',
        description: 'Words are your oxygen line. Silence in that channel reads as cooling, even when everything else stays warm.',
        weight: { desire: 0.4, receiving_comfort: 0.4 },
        channel: 'words',
      },
      {
        id: 'b',
        label: 'The casual touch disappearing — no more passing hugs, no more sitting close.',
        description: 'Touch is your oxygen line. When the everyday contact goes, the relationship starts feeling like a meeting.',
        weight: { affection_daily: 0.7, desire: 0.3 },
        channel: 'touch',
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q20',
    layer: 2,
    format: 'forced_pair',
    prompt: [
      'Every couple moves between two evening modes: doing things together, or being in the same room doing separate things. Most people sit somewhere in between — it depends on the week, the energy, what came before.',
      'But when you imagine a long relationship at its most typical, which mode is your gravitational center — the one the week defaults to, and the one you\'d miss if it disappeared?',
    ],
    options: [
      {
        id: 'a',
        label: 'Same room, separate worlds — each doing our own thing, sharing the air.',
        description: 'Parallel play as intimacy. Closeness doesn\'t require joint focus; it requires shared presence. Joint activities are the spice, not the meal.',
        weight: { autonomy_connection: 0.8 },
      },
      {
        id: 'b',
        label: 'Actually doing the thing together — one show, one game, one plan.',
        description: 'Shared experience is the point. Separate-but-present is comfortable, but a week of it feels like parallel lives rather than a shared one.',
        weight: { autonomy_connection: -0.6, affection_daily: 0.2 },
      },
    ],
    diagnosticWeight: 1.1,
    note: 'There\'s no wrong split here — we\'re after your center of gravity, not your whole range.',
  },
  {
    id: 'q21',
    layer: 2,
    format: 'scenario',
    prompt: [
      'Pick the statement you agree with more. Don\'t pick the one that sounds better — pick the one that\'s true.',
    ],
    options: [
      {
        id: 'a',
        label: '"If they loved me, I shouldn\'t have to ask for the things I need."',
        description: 'Love as anticipation: asking can feel like proof it doesn\'t count — a belief that quietly sets partners up to miss.',
        weight: { direct_communication: -0.7, care_initiation: 0.3, reassurance_security: 0.3 },
      },
      {
        id: 'b',
        label: '"Asking is how love stays honest — but I still want them to sometimes think of it first."',
        description: 'The mature version of the same wish: you\'ll use your words, and you still melt when the words aren\'t needed.',
        weight: { direct_communication: 0.6, care_initiation: 0.4 },
      },
      {
        id: 'c',
        label: '"Nobody\'s a mind reader. If I need something, I ask. Full stop."',
        description: 'Clean directness with no nostalgia for telepathy. Your partners always know where they stand — and what you want.',
        weight: { direct_communication: 0.8, reassurance_security: -0.3 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q22',
    layer: 2,
    format: 'scenario',
    prompt: ['And this one — which is closer to what you actually believe?'],
    options: [
      {
        id: 'a',
        label: '"Generosity that never comes back isn\'t love, it\'s self-erasure."',
        description: 'You protect the giver in you — a real guardrail, as long as it doesn\'t start tracking every act of care.',
        weight: { scorekeeping: 0.6, receiving_comfort: -0.2 },
      },
      {
        id: 'b',
        label: '"Care is care even when nothing comes back — but over years, both people should want to carry."',
        description: 'Communal at the core with a long memory for patterns. You don\'t tally Tuesdays; you notice decades.',
        weight: { scorekeeping: 0.2, care_initiation: 0.3, same_side_problems: 0.2 },
      },
      {
        id: 'c',
        label: '"You give because someone needs something. The account evens out over a life, not a week."',
        description: 'The communal orientation, stated outright: reciprocity lives at the level of the relationship, not the transaction.',
        weight: { scorekeeping: -0.8, care_initiation: 0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q23',
    layer: 2,
    format: 'forced_pair',
    prompt: ['A partner you\'ve been with for years has changed in one way. Which loss would quietly change the relationship more for you?'],
    options: [
      {
        id: 'a',
        label: 'They stopped being curious about your inner world — your ideas, your projects, your days.',
        description: 'For you, interest is the lifeblood. Without it, the relationship starts feeling inhabited rather than shared.',
        weight: { curiosity_worlds: 0.8, listening_first: 0.2 },
      },
      {
        id: 'b',
        label: 'They stopped needing you — perfectly capable, never asking, never leaning.',
        description: 'For you, being needed is part of being loved. A self-contained partner reads as a closed door.',
        weight: { receiving_comfort: 0.4, care_initiation: 0.5, autonomy_connection: -0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q24',
    layer: 2,
    format: 'forced_pair',
    prompt: ['Which partner would be easier for you to love well over the long run?'],
    options: [
      {
        id: 'a',
        label: 'One whose desire runs hotter than their words — all-initiation, low-verbal.',
        description: 'You\'re fed by touch and pursuit; speeches would sit unused on the shelf.',
        weight: { affection_daily: 0.4, desire: 0.6, receiving_comfort: 0.2 },
      },
      {
        id: 'b',
        label: 'One whose words run hotter than their initiation — says it constantly, reaches less.',
        description: 'You\'re fed by being told. The unsent message would eventually be felt as absence.',
        weight: { receiving_comfort: 0.5, desire: 0.3, affection_daily: -0.2 },
      },
    ],
    diagnosticWeight: 1.1,
  },

  // ───────────────────── Layer 3 — Tradeoffs ─────────────────────
  {
    id: 'q25',
    layer: 3,
    format: 'scenario',
    prompt: [
      'Your partner gets a haircut they clearly love. They ask what you think. You think it genuinely doesn\'t suit them.',
      'What comes out?',
    ],
    options: [
      {
        id: 'a',
        label: '"I\'m glad you love it — it\'s not my favorite on you, but your happiness wins."',
        description: 'Honesty wrapped in warmth. They get the truth and the priority in the same sentence.',
        weight: { direct_communication: 0.6, vulnerability_safety: 0.3, perspective_taking: 0.2 },
      },
      {
        id: 'b',
        label: '"It looks great." Their joy matters more than my opinion of a haircut.',
        description: 'Kindness chosen over precision on something small. A lie with good aim — sustainable only for small stakes.',
        weight: { perspective_taking: 0.4, direct_communication: -0.4 },
      },
      {
        id: 'c',
        label: 'The truth, plainly. They asked.',
        description: 'Respect for their question as a real request. Some partners feel respected by this; others feel ambushed by it.',
        weight: { direct_communication: 0.7, vulnerability_safety: -0.2 },
      },
      {
        id: 'd',
        label: 'Something honest but angled — "I liked it a bit shorter" — without a verdict on this one.',
        description: 'You steer by preference without delivering judgment. Smooth, though the truth arrives in installments.',
        weight: { direct_communication: 0.3, perspective_taking: 0.4 },
      },
    ],
    diagnosticWeight: 1.1,
  },
  {
    id: 'q26',
    layer: 3,
    format: 'scenario',
    prompt: [
      'Your partner has been venting about the same friend situation for the third evening in a row. They\'re on the same paragraph you\'ve heard twice.',
      'What do you do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Listen again. Being heard the third time matters more than being efficient.',
        description: 'You understand that repetition is processing. The story shrinks each night it\'s told — if someone keeps hearing it.',
        weight: { listening_first: 0.8, perspective_taking: 0.3 },
      },
      {
        id: 'b',
        label: 'Ask if they want ideas this time — say so gently.',
        description: 'You offer the fork honestly instead of silently stewing or silently fixing. Naming the choice is the skill.',
        weight: { direct_communication: 0.6, listening_first: 0.3, logic_emotion_integration: 0.2 },
      },
      {
        id: 'c',
        label: 'Start problem-solving out loud — three nights of this means the ideas aren\'t landing.',
        description: 'Efficiency over empathy. Useful if asked for; premature almost every other time.',
        weight: { listening_first: -0.6, logic_emotion_integration: 0.4 },
      },
      {
        id: 'd',
        label: 'Listen, but I\'d be honest later that the loop is wearing on me.',
        description: 'You sustain the listening, then close the loop with your own truth instead of letting resentment stockpile.',
        weight: { listening_first: 0.4, direct_communication: 0.5, scorekeeping: 0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q27',
    layer: 3,
    format: 'scenario',
    prompt: [
      'You\'re both completely exhausted. It\'s been that kind of month. The sink is full, laundry is everywhere, and neither of you has anything left.',
      'What\'s the move?',
    ],
    options: [
      {
        id: 'a',
        label: 'Declare a truce — order food, leave the mess, watch something, deal tomorrow.',
        description: 'You can coexist at 20%. Preserving each other outranks preserving standards tonight, without guilt attached.',
        weight: { shared_home_effort: 0.8, same_side_problems: 0.4 },
      },
      {
        id: 'b',
        label: 'Do a 20-minute blitz together, then collapse guilt-free.',
        description: 'Standards with mercy: a bounded effort you both join, then permission to stop.',
        weight: { shared_home_effort: 0.6, same_side_problems: 0.3 },
      },
      {
        id: 'c',
        label: 'Whoever has slightly more in the tank handles the essentials; the other rests.',
        description: 'Flexible carrying without scorekeeping — the strong-for-you-now arrangement your document calls natural.',
        weight: { shared_home_effort: 0.7, scorekeeping: -0.3, care_initiation: 0.2 },
      },
      {
        id: 'd',
        label: 'Keep a quiet tally of who\'s carried more — and if it keeps running one way, say so.',
        description: 'Fairness matters most when you\'re running on empty. The tally is usually protection against being taken for granted — saying it out loud works better than carrying it quietly.',
        weight: { scorekeeping: 0.8, shared_home_effort: -0.3 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q28',
    layer: 3,
    format: 'scenario',
    prompt: [
      'Your partner forgot something that mattered to you — a plan you\'d talked about twice, not a birthday. When you bring it up, they\'re defensive: "I\'ve had a lot going on."',
      'Where do you go from there?',
    ],
    options: [
      {
        id: 'a',
        label: 'Acknowledge their week is genuinely heavy — and still finish the conversation about the thing.',
        description: 'Both truths held: their load is real, and so is the miss. Compassion without cancellation of the issue.',
        weight: { perspective_taking: 0.6, direct_communication: 0.5, repair_orientation: 0.3 },
      },
      {
        id: 'b',
        label: 'Drop it. If their plate is full, pressing makes me the extra weight.',
        description: 'You yield to their capacity. Kind — but the thing never gets resolved and quietly joins the unspoken pile.',
        weight: { direct_communication: -0.6, perspective_taking: 0.4 },
      },
      {
        id: 'c',
        label: '"Busy is an explanation, not an excuse." Hold the line.',
        description: 'You keep accountability non-negotiable. Clear — though delivered as a verdict, it ends the conversation it needed to start.',
        weight: { direct_communication: 0.5, perspective_taking: -0.4 },
      },
      {
        id: 'd',
        label: 'Feel it, say it\'s fine, and privately note that my things come last.',
        description: 'The withdrawal pattern: outward grace, inward tally. The resentment is real but never gets its day in court.',
        weight: { scorekeeping: 0.6, direct_communication: -0.5, receiving_comfort: -0.2 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q29',
    layer: 3,
    format: 'scenario',
    prompt: [
      'You unexpectedly get a free evening. Your partner has their own plans.',
      'What do you do with it?',
    ],
    options: [
      {
        id: 'a',
        label: 'My own thing, happily — then find them before bed for twenty minutes.',
        description: 'Solitude plus a deliberate reconnect. Independence that returns home.',
        weight: { autonomy_connection: 0.8, affection_daily: 0.3 },
      },
      {
        id: 'b',
        label: 'Tag along with them if I can — free time is better spent together.',
        description: 'Togetherness as default. Warm — worth checking whether your own interests survive the merge.',
        weight: { autonomy_connection: -0.7, care_initiation: 0.2 },
      },
      {
        id: 'c',
        label: 'My own thing, fully. The evening is mine.',
        description: 'Clean independence. The question your other answers will settle: does the return trip happen?',
        weight: { autonomy_connection: 0.6, affection_daily: -0.3 },
      },
      {
        id: 'd',
        label: 'Do something for us — cook ahead, fix the thing, set up the weekend.',
        description: 'You spend love on infrastructure. Caring expressed as preparation; just make sure some evenings are simply yours.',
        weight: { care_initiation: 0.5, shared_home_effort: 0.5 },
      },
    ],
    diagnosticWeight: 1.1,
  },
  {
    id: 'q30',
    layer: 3,
    format: 'scenario',
    prompt: [
      'Your partner is dealing with a family crisis — theirs, not yours. They say, "I\'ve got this one. You don\'t need to be in it."',
      'What do you do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Respect the line, stay close anyway — food, rides, an ear when wanted.',
        description: 'You support without annexing. Their crisis, your presence — the distinction your document draws about family.',
        weight: { care_initiation: 0.7, perspective_taking: 0.4, same_side_problems: 0.3 },
      },
      {
        id: 'b',
        label: 'Step in. "Ours" means our problems — I\'d want them in mine.',
        description: 'Full merger as loyalty. Powerful when welcomed; heavy when the other person needed to carry their own thing.',
        weight: { same_side_problems: 0.6, autonomy_connection: -0.3, care_initiation: 0.3 },
      },
      {
        id: 'c',
        label: 'Accept it at face value and stay out of it.',
        description: 'Boundaries respected literally. Safe — though "I\'ve got this" sometimes means "I don\'t know how to ask."',
        weight: { autonomy_connection: 0.4, care_initiation: -0.4, perspective_taking: -0.2 },
      },
      {
        id: 'd',
        label: 'Check what part they\'d actually like help with — and offer for that part only.',
        description: 'You negotiate support precisely. No overreach, no absence.',
        weight: { care_initiation: 0.6, direct_communication: 0.5, perspective_taking: 0.3 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q31',
    layer: 3,
    format: 'scenario',
    prompt: [
      'Money is fine but not loose. Your partner just spent real money on their hobby. You spend real money on yours.',
      'They bring up your spending first, as a concern.',
      'What\'s your honest internal response?',
    ],
    options: [
      {
        id: 'a',
        label: '"Fair — let\'s look at both our spends together." No flinch, no counterattack.',
        description: 'You treat the budget as a shared map, not an accusation. Discretionary money with mutual respect, exactly as written.',
        weight: { same_side_problems: 0.8, shared_home_effort: 0.3 },
      },
      {
        id: 'b',
        label: 'Defensive first — my hobbies are not the problem here.',
        description: 'Their concern lands as an indictment of what you love. The conversation about money becomes a trial about legitimacy.',
        weight: { same_side_problems: -0.7 },
      },
      {
        id: 'c',
        label: 'Counter with their spending. Fair is fair.',
        description: 'Fairness, for you, means the same rules both ways — you want the scrutiny to run in both directions or neither.',
        weight: { scorekeeping: 0.7, same_side_problems: -0.4 },
      },
      {
        id: 'd',
        label: 'Take it seriously, but check quietly whether their hobby gets the same audit.',
        description: 'You engage — while testing for a double standard. Discernment, or the opening move of a ledger war.',
        weight: { same_side_problems: 0.2, scorekeeping: 0.4 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q32',
    layer: 3,
    format: 'scenario',
    prompt: [
      'Mid-argument, your partner says: "You always do this," and brings up something you told them privately, months ago, when you were at a low point.',
      'What does that moment do to you — and what do you do with it?',
    ],
    options: [
      {
        id: 'a',
        label: 'It stings badly — I name it, in the moment, as off-limits: "Not that. That\'s not for this fight."',
        description: 'You protect the vault out loud, immediately. Boundary-setting that keeps vulnerability safe in both directions.',
        weight: { vulnerability_safety: 0.8, direct_communication: 0.5 },
      },
      {
        id: 'b',
        label: 'I note it for later — we\'ll talk about what just happened when we\'re calmer.',
        description: 'You refuse to fight on that ground now, but the violation gets its own conversation. Repair deferred, not abandoned.',
        weight: { vulnerability_safety: 0.5, repair_orientation: 0.5 },
      },
      {
        id: 'c',
        label: 'Match it — reach for something of theirs. They escalated first.',
        description: 'The vault opens in both directions — a wounded reflex, not a strategy. The original topic disappears; the wounds become the argument.',
        weight: { vulnerability_safety: -0.9, repair_orientation: -0.4 },
      },
      {
        id: 'd',
        label: 'Something closes. The fight ends for me here — trust took the hit.',
        description: 'You exit via shutdown. The disclosure-as-weapon gets no counterpunch, but also no repair — just a door that locks.',
        weight: { vulnerability_safety: 0.3, repair_orientation: -0.5, listening_first: -0.3 },
      },
    ],
    diagnosticWeight: 1.4,
  },

  // ───────────────────── Layer 4 — Self-reflection ─────────────────────
  {
    id: 'q33',
    layer: 4,
    format: 'rank_most',
    prompt: [
      'After something goes wrong between you and someone you love — an argument, a misread, a bad night — which thought tends to stay with you the longest?',
    ],
    options: [
      {
        id: 'a',
        label: '"What actually happened there, step by step?"',
        description: 'The analyst: you metabolize friction by reconstructing it. Understanding is how you get peace.',
        weight: { logic_emotion_integration: 0.5, repair_orientation: 0.3 },
      },
      {
        id: 'b',
        label: '"Are we okay? Do they know we\'re okay?"',
        description: 'The repairer: your priority is the bridge, not the autopsy.',
        weight: { repair_orientation: 0.8, reassurance_security: 0.2 },
      },
      {
        id: 'c',
        label: '"What I should have said was—"',
        description: 'The replay: you rehearse better versions of yourself. Growth engine, rumination engine — same machine.',
        weight: { repair_orientation: 0.3, reassurance_security: 0.3, logic_emotion_integration: 0.2 },
      },
      {
        id: 'd',
        label: '"The things they said. Those are still in the room."',
        description: 'The archivist: what was said to you outlives the argument. Words land and stay.',
        weight: { vulnerability_safety: 0.4, scorekeeping: 0.4 },
      },
    ],
    diagnosticWeight: 1.0,
  },
  {
    id: 'q34',
    layer: 4,
    format: 'rank_most',
    prompt: [
      'Suppose that over a year, one of these quietly became rare in a relationship you cared about. Which one would hollow it out most for you?',
    ],
    options: [
      {
        id: 'a',
        label: 'Being told I\'m wanted — compliments, flirtation, the words.',
        description: 'Words of desire are your deep channel. Their absence starves you even when acts remain.',
        weight: { desire: 0.7, receiving_comfort: 0.3 },
        channel: 'words',
      },
      {
        id: 'b',
        label: 'Casual everyday touch — the passing kind, the no-reason kind.',
        description: 'Ambient touch is your deep channel. Its absence makes the home feel like a shared office.',
        weight: { affection_daily: 0.8, desire: 0.2 },
        channel: 'touch',
      },
      {
        id: 'c',
        label: 'Being taken care of when I\'m depleted — meals, back rubs, "rest, I\'ve got this."',
        description: 'Being nurtured is your deep channel. Carrying everything alone reads as being alone.',
        weight: { receiving_comfort: 0.7, care_initiation: 0.2 },
        channel: 'service',
      },
      {
        id: 'd',
        label: 'Real conversations — the kind where someone actually wants to know what\'s in your head.',
        description: 'Depth of attention is your deep channel. Logistics-only intimacy is your version of starvation.',
        weight: { listening_first: 0.5, curiosity_worlds: 0.5 },
        channel: 'words',
      },
    ],
    diagnosticWeight: 1.1,
  },
  {
    id: 'q35',
    layer: 4,
    format: 'agreement',
    // No "with a partner in mind" frame needed — the item itself is about "the
    // person I love", which is answerable with or without a current partner.
    prompt: ['"I notice when I haven\'t touched the person I love in a while — and I do something about it."'],
    options: [
      { id: '1', label: 'Not really me', value: 1, description: 'Touch runs on momentum; it comes and goes without your tracking.', weight: { affection_daily: -0.5 } },
      { id: '2', label: 'Rarely', value: 2, description: 'You enjoy touch when it happens but rarely notice its absence.', weight: { affection_daily: -0.25 } },
      { id: '3', label: 'Sometimes', value: 3, description: 'The awareness flickers; the follow-through is inconsistent.', weight: { affection_daily: 0 } },
      { id: '4', label: 'Usually', value: 4, description: 'You track the physical temperature of the relationship and tend to it.', weight: { affection_daily: 0.35 } },
      { id: '5', label: 'That\'s exactly me', value: 5, description: 'Ambient touch is something you actively maintain, not something that happens to you.', weight: { affection_daily: 0.55 } },
    ],
    diagnosticWeight: 0.8,
  },
  {
    id: 'q36',
    layer: 4,
    format: 'agreement',
    prompt: ['"When someone does something kind for me, part of my mind asks what they\'ll want in return."'],
    options: [
      { id: '1', label: 'Never — kindness is just kindness', value: 1, description: 'You receive without the debt-scan. Care lands as care.', weight: { scorekeeping: 0.5, receiving_comfort: 0.2 } },
      { id: '2', label: 'Almost never', value: 2, description: 'A flicker of the ledger, easily dismissed.', weight: { scorekeeping: 0.25 } },
      { id: '3', label: 'Sometimes, honestly', value: 3, description: 'The auditor wakes for big gestures, sleeps through small ones.', weight: { scorekeeping: 0 } },
      { id: '4', label: 'More often than I\'d like', value: 4, description: 'Generosity arrives pre-invoiced in your accounting, even when the giver meant it freely.', weight: { scorekeeping: -0.3 } },
      { id: '5', label: 'That\'s the default', value: 5, description: 'Receiving comes with a quiet \'owing\' feeling attached — less mistrust than a strong need to stay even.', weight: { scorekeeping: -0.5 } },
    ],
    diagnosticWeight: 0.8,
  },
  {
    id: 'q37',
    layer: 4,
    format: 'agreement',
    prompt: ['"I would rather be told an uncomfortable truth than be spared one."'],
    options: [
      { id: '1', label: 'Disagree strongly', value: 1, description: 'Protection over information. You want kindness first — and partners learn to edit for you.', weight: { direct_communication: -0.4 } },
      { id: '2', label: 'Lean disagree', value: 2, description: 'Truth, but heavily padded. Fine — as long as you know padding is being applied.', weight: { direct_communication: -0.2 } },
      { id: '3', label: 'Depends on the day', value: 3, description: 'Your tolerance for truth is weather-dependent. Worth knowing which days to bring you the hard version.', weight: { direct_communication: 0 } },
      { id: '4', label: 'Lean agree', value: 4, description: 'You mostly want the real thing, delivered with care.', weight: { direct_communication: 0.25 } },
      { id: '5', label: 'Agree completely', value: 5, description: 'You treat information as respect. Partners who soften everything will frustrate you more than they protect you.', weight: { direct_communication: 0.45 } },
    ],
    diagnosticWeight: 0.8,
  },
  {
    id: 'q38',
    layer: 4,
    format: 'agreement',
    // Dispositional phrasing ("someone I'm close to", not "my partner") —
    // measures the taker's interpretation habit, not a current relationship.
    prompt: ['"When someone I\'m close to goes quiet or distant, my first assumption is that it\'s about their own life — not about me."'],
    options: [
      { id: '1', label: 'Not my first assumption', value: 1, description: 'Distance points at you by default. The story gets built before the question gets asked.', weight: { reassurance_security: -0.5, perspective_taking: -0.3 } },
      { id: '2', label: 'Rarely', value: 2, description: 'The self-story usually wins the first hour.', weight: { reassurance_security: -0.25, perspective_taking: -0.15 } },
      { id: '3', label: 'About half the time', value: 3, description: 'The interpretation race is a coin flip — and you know it.', weight: { reassurance_security: 0, perspective_taking: 0 } },
      { id: '4', label: 'Mostly', value: 4, description: 'Curiosity usually beats conclusion. You ask before you author.', weight: { reassurance_security: 0.25, perspective_taking: 0.2 } },
      { id: '5', label: 'That\'s my reflex', value: 5, description: 'Benefit of the doubt as a structural setting. People feel safe being complicated around you.', weight: { reassurance_security: 0.45, perspective_taking: 0.35 } },
    ],
    diagnosticWeight: 0.8,
  },
  {
    id: 'q39',
    layer: 4,
    format: 'agreement',
    prompt: ['"I find it harder to receive care than to give it."'],
    options: [
      { id: '1', label: 'Opposite for me', value: 1, description: 'Receiving comes easily; giving is where you have to be deliberate.', weight: { receiving_comfort: 0.4, care_initiation: -0.2 } },
      { id: '2', label: 'Slightly', value: 2, description: 'A mild asymmetry — you give a bit more fluently than you take.', weight: { receiving_comfort: 0.2 } },
      { id: '3', label: 'Balanced', value: 3, description: 'Both directions feel natural. Uncommon, and quietly valuable.', weight: { receiving_comfort: 0, care_initiation: 0 } },
      { id: '4', label: 'Yes, clearly', value: 4, description: 'The classic giver\'s asymmetry: loving is easy, being loved is work.', weight: { receiving_comfort: -0.3, care_initiation: 0.15 } },
      { id: '5', label: 'Strongly — receiving is hard for me', value: 5, description: 'Being attended to creates visible discomfort. The people who love you need permission to push past your deflection.', weight: { receiving_comfort: -0.5 } },
    ],
    diagnosticWeight: 0.8,
  },
  {
    id: 'q40',
    layer: 4,
    format: 'agreement',
    prompt: ['"I keep track of what I do for people — even if I never mention it."'],
    options: [
      { id: '1', label: 'No — I genuinely don\'t track', value: 1, description: 'Giving leaves no residue in you. The communal orientation, embodied.', weight: { scorekeeping: 0.5 } },
      { id: '2', label: 'Barely', value: 2, description: 'A faint trace of the ledger, mostly forgotten by Friday.', weight: { scorekeeping: 0.25 } },
      { id: '3', label: 'Patterns, maybe — not counts', value: 3, description: 'You notice long arcs, not individual trades. Probably healthy.', weight: { scorekeeping: 0 } },
      { id: '4', label: 'Yes, quietly', value: 4, description: 'The awareness runs even if it never speaks — it quietly shapes what feels safe to give next.', weight: { scorekeeping: -0.3 } },
      { id: '5', label: 'Always — it\'s just how my mind works', value: 5, description: 'The accounting is automatic — most often a quiet protection against being taken for granted.', weight: { scorekeeping: -0.5 } },
    ],
    diagnosticWeight: 0.8,
  },
  {
    id: 'q41',
    layer: 4,
    format: 'rank_most',
    prompt: [
      'You just won an argument. Completely, objectively, undeniably. Your partner has gone quiet.',
      'Which thought follows?',
    ],
    options: [
      {
        id: 'a',
        label: '"Glad that\'s settled."',
        description: 'The scoreboard is the satisfaction. Worth asking what gets settled besides the point.',
        weight: { repair_orientation: -0.6, same_side_problems: -0.4 },
      },
      {
        id: 'b',
        label: '"Did I win it too hard?"',
        description: 'You audit your victories for collateral damage. The instinct that keeps winning from costing more than it pays.',
        weight: { repair_orientation: 0.7, perspective_taking: 0.3 },
      },
      {
        id: 'c',
        label: '"Why did that matter so much to me?"',
        description: 'You turn the lens inward after the dust settles. Self-inquiry as the aftermath habit.',
        weight: { logic_emotion_integration: 0.4, repair_orientation: 0.2 },
      },
      {
        id: 'd',
        label: '"Okay — how do we make them feel like my teammate again, tonight."',
        description: 'Repair as the immediate agenda. You treat the win as the beginning of the next move: coming back.',
        weight: { repair_orientation: 0.8, same_side_problems: 0.4 },
      },
    ],
    diagnosticWeight: 1.0,
  },
  {
    id: 'q42',
    layer: 4,
    format: 'agreement',
    prompt: ['"When I\'ve been handling something difficult that nobody sees, what I want most is for the person closest to me to notice."'],
    options: [
      { id: '1', label: 'Not important to me', value: 1, description: 'You carry visibly or invisibly without needing it witnessed. Self-contained — just make sure partners know praise isn\'t your currency.', weight: { shared_home_effort: -0.4, receiving_comfort: 0.1 } },
      { id: '2', label: 'A little', value: 2, description: 'Nice when it happens, not expected.', weight: { shared_home_effort: -0.2 } },
      { id: '3', label: 'Somewhat', value: 3, description: 'It would mean something. You wouldn\'t ask, but you\'d feel it.', weight: { shared_home_effort: 0 } },
      { id: '4', label: 'A lot', value: 4, description: '"I know you\'ve had a lot going on" is one of the sentences that would actually reach you.', weight: { shared_home_effort: 0.3 } },
      { id: '5', label: 'Enormously — noticing is everything', value: 5, description: 'Invisible effort unnoticed becomes loneliness for you. You need a partner who watches for what doesn\'t show.', weight: { shared_home_effort: 0.45 } },
    ],
    diagnosticWeight: 0.8,
  },

  // ───────────────────── Layer 5 — Behavior ─────────────────────
  {
    id: 'q43',
    layer: 5,
    format: 'scenario',
    prompt: [
      'Your partner says, out of the blue: "Honestly, I\'ve been needing more reassurance lately. I know that\'s not fun to hear."',
      'What do you actually do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Thank them for saying it, and ask what reassurance actually looks like for them.',
        description: 'You receive a need as a gift of information. No defensiveness, no mockery — just a request for the manual.',
        weight: { reassurance_security: 0.5, direct_communication: 0.6, perspective_taking: 0.4 },
      },
      {
        id: 'b',
        label: 'Reassure in the moment — but privately wonder if I\'ve been doing something wrong.',
        description: 'You meet the need and absorb the blame. Generous, with a side of unnecessary self-indictment.',
        weight: { care_initiation: 0.4, reassurance_security: 0.3, perspective_taking: -0.2 },
      },
      {
        id: 'c',
        label: 'Point out all the reassurance that\'s already there.',
        description: 'You answer the need with the record — accurate, perhaps, but the reassurance itself still hasn\'t arrived.',
        weight: { direct_communication: -0.4, listening_first: -0.5, perspective_taking: -0.3 },
      },
      {
        id: 'd',
        label: 'Feel a flicker of "is this ever enough?" — and say something careful.',
        description: 'The demand alarm rings quietly. Your response stays kind, but the question now lives in the room.',
        weight: { reassurance_security: -0.5, direct_communication: 0.2 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q44',
    layer: 5,
    format: 'scenario',
    prompt: [
      'It\'s Thursday. You realize you\'ve been short and distant with your partner since Monday, and you know why — it\'s your work stress, and they\'ve done nothing wrong.',
      'What do you do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Name it tonight: "I\'ve been off all week and it isn\'t about you. Here\'s what\'s going on."',
        description: 'You close the gap yourself, unprompted, with the exact sentence that prevents the story-building. The "it isn\'t about you" is the whole move.',
        weight: { direct_communication: 0.8, perspective_taking: 0.5, repair_orientation: 0.4 },
      },
      {
        id: 'b',
        label: 'Show it through action — be warm tonight, and let it speak.',
        description: 'Repair by behavior. It works when they notice; it doesn\'t give them the information they were missing.',
        weight: { care_initiation: 0.4, direct_communication: -0.2 },
      },
      {
        id: 'c',
        label: 'Wait for them to mention it, then explain.',
        description: 'The explanation arrives after the story has already been written — by them, about them.',
        weight: { direct_communication: -0.6, perspective_taking: -0.3 },
      },
      {
        id: 'd',
        label: 'Give myself the week to get through it, then come back and talk about it.',
        description: 'You schedule your own repair. Self-aware and deliberate — just note the four days of unexplained cold in the ledger.',
        weight: { autonomy_connection: 0.3, direct_communication: 0.1, repair_orientation: 0.3 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q45',
    layer: 5,
    format: 'scenario',
    prompt: [
      'The morning of something you\'d looked forward to for months, your partner\'s family has a crisis and they need to drop everything.',
      'What happens?',
    ],
    options: [
      {
        id: 'a',
        label: '"Go. I\'m okay. What do you need from me to make this easier?"',
        description: 'Disappointment expressed honestly once, then full team-mode. Their people matter to them, so they matter to you.',
        weight: { same_side_problems: 0.8, care_initiation: 0.4, perspective_taking: 0.3 },
      },
      {
        id: 'b',
        label: 'Support them, and be honest that I\'m disappointed — both at once.',
        description: 'You refuse the false choice between truth and support. Harder conversation, healthier ledger.',
        weight: { same_side_problems: 0.5, direct_communication: 0.6 },
      },
      {
        id: 'c',
        label: 'Support them — but it shows, all day, in ways I don\'t say.',
        description: 'The disappointment leaks sideways. You never make them wrong out loud; you make them feel it anyway.',
        weight: { same_side_problems: -0.3, direct_communication: -0.5 },
      },
      {
        id: 'd',
        label: 'Feel my own plans slip away again — and let it show without saying it.',
        description: '"Again" is doing heavy lifting — the quiet sense that your plans always lose. That pattern is worth putting into words together.',
        weight: { scorekeeping: 0.6, same_side_problems: -0.5 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q46',
    layer: 5,
    format: 'scenario',
    prompt: [
      'Your partner asks, a little sheepishly, if you can handle the dishes tonight — the chore you hate most — because their day flattened them.',
      'What\'s the honest sequence inside you?',
    ],
    options: [
      {
        id: 'a',
        label: '"Yeah, I\'ve got it." No drama, no invoice.',
        description: 'The two-word answer your document names as the ideal. Carried without a receipt.',
        weight: { shared_home_effort: 0.8, scorekeeping: -0.3 },
      },
      {
        id: 'b',
        label: '"Yeah — but you\'re on bathroom duty this weekend."',
        description: 'Support with a rider: the household runs, and keeping the exchanges visible is how you stay fair.',
        weight: { shared_home_effort: 0.3, scorekeeping: 0.6 },
      },
      {
        id: 'c',
        label: '"I can\'t tonight — but I can handle dinner." Trade instead.',
        description: 'Honest capacity plus a real alternative. Sometimes that\'s the healthiest possible answer.',
        weight: { shared_home_effort: 0.6, direct_communication: 0.4 },
      },
      {
        id: 'd',
        label: 'Say yes, and a small part of me closes off — this is the chore that gets me.',
        description: 'You follow through while the feeling goes underground. Naming which chores hit hardest keeps the close-off from calcifying.',
        weight: { shared_home_effort: -0.2, direct_communication: -0.5, scorekeeping: 0.4 },
      },
    ],
    diagnosticWeight: 1.1,
  },
  {
    id: 'q47',
    layer: 5,
    format: 'scenario',
    prompt: [
      'You knock over a glass of wine — onto your partner\'s laptop. Their work laptop. It won\'t turn on.',
      'What actually happens in the next five minutes?',
    ],
    options: [
      {
        id: 'a',
        label: 'Own it immediately, plainly — no softening the story of how it happened.',
        description: 'Clean accountability: the accident is yours, the report is honest, the panic is managed out loud.',
        weight: { direct_communication: 0.6, same_side_problems: 0.5, repair_orientation: 0.4 },
      },
      {
        id: 'b',
        label: 'Tell them — and start researching fixes before they\'re even fully upset.',
        description: 'Accountability plus momentum toward the fix. Action as apology.',
        weight: { same_side_problems: 0.6, care_initiation: 0.3 },
      },
      {
        id: 'c',
        label: 'Soften it first — lead with the circumstances, get to the laptop in a minute.',
        description: 'The truth in installments. Protection for you, delay for them; the facts arrive pre-defended.',
        weight: { direct_communication: -0.4, same_side_problems: -0.2 },
      },
      {
        id: 'd',
        label: 'Panic quietly, try to fix it myself tonight, tell them only if it fails.',
        description: 'Consideration with a hidden cost: you\'d rather absorb the risk than deliver bad news — and the delay usually makes the problem bigger.',
        weight: { direct_communication: -0.7, vulnerability_safety: -0.2 },
      },
    ],
    diagnosticWeight: 1.1,
  },
  {
    id: 'q48',
    layer: 5,
    format: 'scenario',
    prompt: [
      'Your partner, unprompted, one night: "Do you still find me attractive? Like actually — not just because you\'re supposed to."',
      'Your response is closest to:',
    ],
    options: [
      {
        id: 'a',
        label: 'Stop what I\'m doing, answer with specifics — what I actually find attractive about them — and hold eye contact while I say it.',
        description: 'Desire delivered on demand, with evidence. The answer to their real question, which was never yes-or-no.',
        weight: { desire: 0.8, vulnerability_safety: 0.4, listening_first: 0.3 },
      },
      {
        id: 'b',
        label: '"Of course I do" — warm, immediate, and then back to the evening.',
        description: 'Reassurance given, but at the altitude the question was asked from. They wanted depth; they got confirmation.',
        weight: { desire: 0.3, listening_first: -0.2 },
      },
      {
        id: 'c',
        label: 'Answer honestly — including the parts that are true and complicated. Attraction has seasons.',
        description: 'Radical honesty about desire\'s texture. Trust-building if they\'re secure; destabilizing if they needed simple.',
        weight: { direct_communication: 0.6, desire: 0.2, vulnerability_safety: 0.3 },
      },
      {
        id: 'd',
        label: 'Deflect with a joke — the question embarrasses us both.',
        description: 'Humor as an exit. The vulnerability offered got converted into a bit, and they noticed.',
        weight: { vulnerability_safety: -0.5, desire: -0.4, listening_first: -0.3 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q49',
    layer: 5,
    format: 'rank_most',
    prompt: [
      'No anniversary. No occasion. Ordinary Tuesday. You want your partner to feel genuinely wanted by you tonight.',
      'What would you most likely actually do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Send a message mid-day that leaves no ambiguity about what I want them for later.',
        description: 'Anticipation, built in writing. Desire made explicit with hours to simmer.',
        weight: { desire: 0.9, care_initiation: 0.2 },
        channel: 'words',
      },
      {
        id: 'b',
        label: 'Initiate — clearly, physically, tonight.',
        description: 'Wanting expressed as pursuit. Unmistakable in the only language that never hedges.',
        weight: { desire: 0.9, affection_daily: 0.3 },
        channel: 'touch',
      },
      {
        id: 'c',
        label: 'Flirt with them in person all evening — the look, the touch, the commentary.',
        description: 'Desire as atmosphere. You make the room feel charged without any single move carrying the message.',
        weight: { desire: 0.8, affection_daily: 0.4 },
        channel: 'touch',
      },
      {
        id: 'd',
        label: 'Tell them directly, in words, what I find attractive about them.',
        description: 'Desire verbalized. Specific, unambiguous, and for some people the only channel that fully lands.',
        weight: { desire: 0.8, receiving_comfort: 0.1 },
        channel: 'words',
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q50',
    layer: 5,
    format: 'scenario',
    prompt: [
      'Your partner, overwhelmed, hands you a written list of things they need help with this week — then apologizes for "dumping it on you."',
      'What\'s your move?',
    ],
    options: [
      {
        id: 'a',
        label: 'Take the list, take the apology away — "This is what teams do" — and split it realistically.',
        description: 'You receive the ask as trust, not burden, and answer the apology by retiring it.',
        weight: { shared_home_effort: 0.7, same_side_problems: 0.6, receiving_comfort: 0.3 },
      },
      {
        id: 'b',
        label: 'Take it all this week. They\'re drowning; I\'m not.',
        description: 'Full carrying when it\'s needed. Watch what happens next month when the roles reverse — that\'s the real test.',
        weight: { care_initiation: 0.6, shared_home_effort: 0.5, scorekeeping: -0.2 },
      },
      {
        id: 'c',
        label: 'Go item by item and negotiate what\'s actually necessary.',
        description: 'Efficiency first. Possibly useful triage — delivered at the exact moment they needed lifting, not auditing.',
        weight: { shared_home_effort: 0.2, listening_first: -0.4 },
      },
      {
        id: 'd',
        label: 'Feel the weight of it, say yes anyway, and mention later that the week was a lot.',
        description: 'You carry it, and the cost surfaces later in quieter ways. Saying \'this week is heavy for me too\' in the moment works better.',
        weight: { scorekeeping: 0.5, shared_home_effort: 0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q51',
    layer: 5,
    format: 'scenario',
    prompt: [
      'It\'s 2am. You\'re replaying tonight\'s argument and you realize — honestly — that you handled one part badly. You said something you\'d defend in the moment and can\'t defend now.',
      'What happens tomorrow?',
    ],
    options: [
      {
        id: 'a',
        label: 'I bring it up myself, first thing, with the specific thing I got wrong.',
        description: 'Unprompted, specific repair. The pride tax paid in full, by morning, without being billed.',
        weight: { repair_orientation: 0.9, direct_communication: 0.3 },
      },
      {
        id: 'b',
        label: 'I\'m extra warm and present — and let the moment carry the apology I can\'t quite say.',
        description: 'Repair by gesture. It works on people who read behavior; the words still never arrive.',
        weight: { repair_orientation: 0.5, direct_communication: -0.2, affection_daily: 0.2 },
      },
      {
        id: 'c',
        label: 'I wait for a natural opening in conversation, then circle to it.',
        description: 'You get there — through a side door, on their watch, if the weather holds.',
        weight: { repair_orientation: 0.4, direct_communication: 0.2 },
      },
      {
        id: 'd',
        label: 'By daylight I can defend most of it again. The 2am version was just tired.',
        description: 'The morning reframe protects the ego and loses the information. The thing you knew at 2am was probably true.',
        weight: { repair_orientation: -0.6, perspective_taking: -0.3 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q52',
    layer: 5,
    format: 'scenario',
    prompt: [
      'Your partner announces they\'ve booked a solo weekend in a cabin. Just them, their book, their silence. They\'re excited about it.',
      'What\'s your honest internal weather?',
    ],
    options: [
      {
        id: 'a',
        label: 'Genuinely happy for them — and I\'ll miss them a little, which is nice.',
        description: 'Their independence reads as health, and your own miss reads as love, not alarm. The secure template.',
        weight: { autonomy_connection: 0.8, reassurance_security: 0.4 },
      },
      {
        id: 'b',
        label: 'Fine with it — though I notice I want to know when they\'ll text.',
        description: 'Approval with a tether. The cabin is fine; the radio silence is the thing you\'d negotiate.',
        weight: { autonomy_connection: 0.4, reassurance_security: 0.2 },
      },
      {
        id: 'c',
        label: 'A knot forms. "The whole weekend? Without me? Is something wrong?"',
        description: 'Their solitude registers as a referendum on you. Worth separating the need for closeness from the fear of space.',
        weight: { autonomy_connection: -0.7, reassurance_security: -0.6 },
      },
      {
        id: 'd',
        label: 'Slightly stung — I\'d have chosen us for the weekend.',
        description: 'You read their solo plans as preference against you, rather than preference for themselves.',
        weight: { autonomy_connection: -0.4, care_initiation: 0.1 },
      },
    ],
    diagnosticWeight: 1.2,
  },

  // ───────────────────── Layer 6 — Mirrors & consistency checks ─────────────────────
  {
    id: 'q53',
    layer: 6,
    format: 'rank_most',
    prompt: [
      'It\'s been a long day. You walk in and your partner, unexpectedly, has done one of these.',
      'Which one would probably affect you the most?',
    ],
    options: [
      { id: 'a', label: 'Made your favorite dinner, plated like they cared.', description: 'Care through food and effort.', weight: { receiving_comfort: 0.2 }, channel: 'service' },
      { id: 'b', label: 'Sat beside you, put their head on your shoulder, and stayed there.', description: 'Care through presence and touch.', weight: { affection_daily: 0.2 }, channel: 'touch' },
      { id: 'c', label: 'Told you they appreciate everything you\'ve been doing lately.', description: 'Care through spoken recognition.', weight: { receiving_comfort: 0.2 }, channel: 'words' },
      { id: 'd', label: 'Took care of the one errand you\'ve been dreading all week.', description: 'Care through lifting a weight you were carrying.', weight: { shared_home_effort: 0.2 }, channel: 'service' },
      { id: 'e', label: 'Sent you to take a long bath alone and kept the kids/pets/chaos out of your hair.', description: 'Care through giving you your own space.', weight: { autonomy_connection: 0.2 }, channel: 'space' },
    ],
    diagnosticWeight: 1.2,
    mirrorSide: 'receive',
    pairWith: 'q54',
  },
  {
    id: 'q54',
    layer: 6,
    format: 'rank_most',
    prompt: [
      'Now flip it. Your partner has been drained for days. Tonight, out of nowhere, you decide to do one thing for them.',
      'Which would you most likely do?',
    ],
    options: [
      { id: 'a', label: 'Cook their favorite meal without being asked.', description: 'You give through food and effort.', weight: { care_initiation: 0.2 }, channel: 'service' },
      { id: 'b', label: 'Sit close, pull them against your shoulder, and just stay.', description: 'You give through presence and touch.', weight: { affection_daily: 0.2 }, channel: 'touch' },
      { id: 'c', label: 'Tell them what you\'ve appreciated about them this week.', description: 'You give through spoken recognition.', weight: { care_initiation: 0.2 }, channel: 'words' },
      { id: 'd', label: 'Quietly handle the errand they keep putting off.', description: 'You give by lifting a weight they\'re carrying.', weight: { care_initiation: 0.2 }, channel: 'service' },
      { id: 'e', label: 'Take the chaos for the evening and send them to have an hour to themselves.', description: 'You give through granting their own space.', weight: { autonomy_connection: 0.2 }, channel: 'space' },
    ],
    diagnosticWeight: 1.2,
    mirrorSide: 'express',
    pairWith: 'q53',
  },
  {
    id: 'q55',
    layer: 6,
    format: 'scenario',
    prompt: [
      'You\'re deep in something at your desk. Your partner walks in, sets your favorite snack next to you without a word, and walks out.',
      'Your first internal reaction is closest to:',
    ],
    options: [
      { id: 'a', label: '"That\'s really sweet." Warmth, received, no strings detected.', description: 'Care lands as care. The simplest and rarest reception.', weight: { receiving_comfort: 0.8, scorekeeping: -0.2 } },
      { id: 'b',        label: '"What did I do to deserve this?" — part gratitude, part scanning.', description: 'Kindness triggers the audit before the gratitude.', weight: { receiving_comfort: -0.5, scorekeeping: 0.4 } },
      { id: 'c', label: '"Now I should do something for them."', description: 'Receiving converts instantly into owing. Generous — and unable to let a gift stay a gift.', weight: { scorekeeping: 0.6, receiving_comfort: 0.1 } },
      { id: 'd', label: 'I appreciate it, but I\'d rather they just tell me what they actually need.', description: 'You discount unconditional gestures in favor of explicit requests.', weight: { receiving_comfort: -0.3, direct_communication: 0.4 } },
    ],
    diagnosticWeight: 1.2,
    note: 'Small thing, honest answer.',
  },
  {
    id: 'q56',
    layer: 6,
    format: 'scenario',
    prompt: [
      'You pass your partner\'s desk on the way to the kitchen. They\'re rubbing their eyes, visibly stressed about something on the screen.',
      'What do you do?',
    ],
    options: [
      { id: 'a', label: 'Stop. Hands on their shoulders, a kiss on the head, "I know that look — I\'m around if you want me."', description: 'Presence plus permission: comfort offered without an agenda attached.', weight: { care_initiation: 0.7, affection_daily: 0.4, listening_first: 0.2 } },
      { id: 'b', label: 'Keep walking — interrupting them mid-problem doesn\'t actually help.', description: 'Respect for focus. Considerate, possibly; also possibly the third bid this week you didn\'t answer.', weight: { care_initiation: -0.4, autonomy_connection: 0.2 } },
      { id: 'c', label: 'Ask what\'s wrong and dig in — let\'s solve it together right now.', description: 'You meet stress with engagement. Sometimes rescue; sometimes added pressure to explain before they\'re ready.', weight: { care_initiation: 0.5, logic_emotion_integration: 0.3, listening_first: -0.2 } },
      { id: 'd', label: 'Bring them a drink and a snack, no questions, and keep moving.', description: 'Anticipatory care, delivered wordlessly. You answer stress with logistics of comfort.', weight: { care_initiation: 0.6, affection_daily: 0.2 } },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q57',
    layer: 6,
    format: 'scenario',
    prompt: [
      'Your partner has secretly planned an entire day for you. Reservations, timing, everything. They hand you the morning and say, "Just be ready by noon."',
      'What does this day actually give you?',
    ],
    options: [
      { id: 'a', label: 'Everything — being planned for is being cared for. I\'d love every minute.', description: 'You can be swept up. Receiving effort feels like being valued, not managed.', weight: { receiving_comfort: 0.7, care_initiation: 0.2 } },
      { id: 'b', label: 'A lot — and I\'d spend part of it hoping I react well enough.', description: 'Enjoyment with a performance review attached. Their effort becomes your obligation to display gratitude correctly.', weight: { receiving_comfort: 0.2, scorekeeping: 0.3 } },
      { id: 'c', label: 'The gesture matters more than the itinerary — I\'d rather have the impulse than the schedule.', description: 'You value being wanted but resist being arranged. Spontaneity is your preferred dialect of desire.', weight: { desire: 0.4, autonomy_connection: 0.3 } },
      { id: 'd', label: 'A fully scheduled day would make me restless — I\'d rather choose things together.', description: 'Receiving organized care can feel like losing agency. Worth knowing — partners who plan for you are trying to speak your language.', weight: { receiving_comfort: -0.5, autonomy_connection: 0.5 } },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q58',
    layer: 6,
    format: 'rank_most',
    prompt: [
      'Your partner is having a mediocre, nothing-special week. You want to remind them they matter.',
      'What\'s the most you, of these?',
    ],
    options: [
      { id: 'a', label: 'A text in the middle of the day telling them one specific thing I admire about them.', description: 'You remind through words, made specific.', weight: { care_initiation: 0.2 }, channel: 'words' },
      { id: 'b', label: 'Something small and physical — their favorite snack, their drink, delivered without ceremony.', description: 'You remind through small material care.', weight: { care_initiation: 0.2 }, channel: 'service' },
      { id: 'c', label: 'A longer hold when they walk in — one hug that runs a few seconds past ordinary.', description: 'You remind through touch and presence.', weight: { care_initiation: 0.2 }, channel: 'touch' },
      { id: 'd', label: 'Taking one thing off their plate entirely, so the evening is lighter.', description: 'You remind through subtraction of burden.', weight: { care_initiation: 0.2 }, channel: 'service' },
    ],
    diagnosticWeight: 1.1,
    mirrorSide: 'express',
    pairWith: 'q19',
  },
  {
    id: 'q59',
    layer: 6,
    format: 'scenario',
    prompt: [
      'For the third weekend running, your partner has bowed out of plans with your friends — "too tired" — and stayed home while you went without them.',
      'What\'s the story you tell yourself on the way there?',
    ],
    options: [
      { id: 'a', label: '"Three weekends is a pattern. Something\'s going on — I\'m asking tonight, gently."', description: 'You update on evidence and plan a direct conversation. Pattern-notice plus directness, without accusation.', weight: { perspective_taking: 0.4, direct_communication: 0.6, care_initiation: 0.3 } },
      { id: 'b', label: '"They\'re just tired. Work has been brutal. Let it breathe."', description: 'Generous interpretation, possibly accurate — though three data points have now been explained away.', weight: { perspective_taking: 0.7, direct_communication: -0.3 } },
      { id: 'c', label: '"They don\'t like my friends, and they\'re phasing me out socially."', description: 'The worried author: your mind fills the gap with the story that hurts most. Worth checking it against what they\'d actually say.', weight: { perspective_taking: -0.6, reassurance_security: -0.5 } },
      { id: 'd', label: '"Fine by me — I prefer going alone anyway."', description: 'The disappointment is real but gets assigned to nobody — self-reliance quietly absorbing the hit.', weight: { direct_communication: -0.5, autonomy_connection: 0.2 } },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q60',
    layer: 6,
    format: 'scenario',
    prompt: [
      'A week later. Your partner has been quieter than usual for days — you\'ve watched it, not imagined it. Work has been heavy; they mentioned it once. Tonight, again: "I\'m fine."',
      'Now what do you do?',
    ],
    options: [
      { id: 'a', label: 'Say what I\'ve seen: "You\'ve been flat all week. I\'m not pushing — I just want you to know I\'ve noticed, and I\'m here."', description: 'You name the pattern with care and without demand. The updating question wants exactly this: more context, more response.', weight: { care_initiation: 0.7, direct_communication: 0.5, listening_first: 0.4 } },
      { id: 'b', label: 'Same as before — take "fine" at its word. They know where I am.', description: 'Consistent restraint. Respectful of their stated capacity; also the same answer to a different question, which is worth noticing.', weight: { perspective_taking: 0.4, care_initiation: -0.3 } },
      { id: 'c', label: 'Push harder this time — a week of this means fine isn\'t the truth.', description: 'You escalate on evidence. Direct, sometimes needed — and pressure is a coin flip for someone preserving their composure.', weight: { direct_communication: 0.6, listening_first: -0.3 } },
      { id: 'd', label: 'Change their environment instead — food, couch, low light. Comfort before conversation.', description: 'You answer accumulation with care rather than inquiry. The body gets fed before the mind gets asked.', weight: { care_initiation: 0.6, listening_first: 0.2 } },
    ],
    diagnosticWeight: 1.4,
    pairWith: 'q03',
    note: 'Same door, opened again — what changed?',
  },
  {
    id: 'q61',
    layer: 6,
    format: 'scenario',
    prompt: [
      'Your partner had a high-stakes presentation today. You can hear from the doorway that it went badly — their voice has that flattened thing it gets.',
      'They come in, put their bag down, and say: "Long one."',
      'First thirty seconds. Go.',
    ],
    options: [
      { id: 'a', label: '"Come sit. Tell me the worst part." Let them unpack it at their own speed.', description: 'You invite the story without scripting its ending. Witness first, analysis never forced.', weight: { listening_first: 0.8, care_initiation: 0.2 } },
      { id: 'b', label: 'Food, water, couch. No questions yet — the body first, the story later if they want it.', description: 'You treat depletion as the primary event. Care that doesn\'t require them to narrate anything.', weight: { care_initiation: 0.8, listening_first: 0.3 } },
      { id: 'c', label: '"What happened? Walk me through it — start to finish."', description: 'You request the full debrief. Useful for you; potentially a second performance for them.', weight: { logic_emotion_integration: 0.4, listening_first: 0.1 } },
      { id: 'd', label: '"It\'s one presentation. You\'re good at this. Next one will go better."', description: 'Cheerleading as first aid. Reassuring to some, dismissive of the actual feeling to most.', weight: { listening_first: -0.6, care_initiation: 0.2 } },
    ],
    diagnosticWeight: 1.2,
    note: 'A familiar shape, wearing different clothes.',
  },
  {
    id: 'q62',
    layer: 6,
    format: 'scenario',
    prompt: [
      'You\'ve cooked every night for two weeks — it just worked out that way. Tonight your partner thanks you warmly for dinner and starts clearing their own plate, relaxed.',
      'What happens inside you?',
    ],
    options: [
      // receiving_comfort micro-weights added: this question is the declared
      // echo of q14 on that dimension, and its options previously carried no
      // weights there — which made the pair's tension direction one-sided.
      { id: 'a', label: 'Nothing that needs answering. I cooked because they needed it; the carrying shifts around.', description: 'Two weeks of giving leaves no invoice. The communal orientation, under exactly the test that breaks it.', weight: { scorekeeping: -0.8, shared_home_effort: 0.3, receiving_comfort: 0.25 } },
      { id: 'b', label: 'Warmth — and a thought: "I wouldn\'t mind them taking a night soon."', description: 'A wish, not a bill. You notice the arc and hope for rotation without demanding it.', weight: { scorekeeping: -0.2, shared_home_effort: 0.3, receiving_comfort: 0.1 } },
      { id: 'c', label: 'A small ache: I\'ve been carrying this alone a while, and I\'d like a turn being taken care of.', description: 'Sustained one-way giving wakes the fairness watcher in you — and underneath it often sits something tenderer: wanting your own turn to be cared for.', weight: { scorekeeping: 0.8, receiving_comfort: -0.2 } },
      { id: 'd', label: 'I\'d say something tonight, lightly: "Your turn tomorrow, chef." Honest, in the moment.', description: 'You surface the imbalance verbally instead of silently tallying. Direct about the rotation, not resentful of the past.', weight: { scorekeeping: 0.2, direct_communication: 0.6, shared_home_effort: 0.2 } },
    ],
    diagnosticWeight: 1.3,
    note: 'Two weeks of dinners, one quiet evening.',
  },

  // ───────────────────── Domain F — Boundaries & privacy ─────────────────────
  {
    id: 'q63',
    layer: 1,
    format: 'scenario',
    prompt: [
      'You and your partner had a loud argument last night. You worked through most of it before bed, and this morning the air is almost normal.',
      'A close friend texts: "Hey, you seemed off yesterday — everything okay?"',
      'What do you most naturally do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Reply honestly but privately: "We had a rough night, but we\'re good — thanks for checking."',
        description: 'You calibrate honesty to what the relationship owns: the conflict stays inside, the friendship stays real.',
        weight: { relational_privacy: 0.7, direct_communication: 0.2 },
      },
      {
        id: 'b',
        label: 'Give the real story, lightly edited: the argument happened, their side heard in full.',
        description: 'You let a trusted voice in when something real is moving — close friends get substance, not just headlines.',
        weight: { relational_privacy: 0.1, care_initiation: 0.2 },
      },
      {
        id: 'c',
        label: 'Vent it properly — you need to process out loud with someone who knows you.',
        description: 'For you, conflict metabolized is conflict talked through with your person outside the relationship; the friendship is where the pressure releases.',
        weight: { relational_privacy: -0.6, listening_first: 0.2 },
      },
      {
        id: 'd',
        label: 'Answer light — "all good!" — the argument was yesterday and belongs to yesterday.',
        description: 'You close the loop inside and reset outwardly fast; watch that this reads as privacy rather than distance to the person you love.',
        weight: { relational_privacy: 0.3, same_side_problems: 0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q64',
    layer: 2,
    format: 'forced_pair',
    prompt: [
      'Which would sting more?',
    ],
    options: [
      {
        id: 'a',
        label: 'A partner who takes a hard week to their closest friend — real content, discussed in detail.',
        description: 'The discomfort is exposure: your private life narrated by someone else\'s mouth, even to one person you trust.',
        weight: { relational_privacy: 0.7, direct_communication: 0.2 },
      },
      {
        id: 'b',
        label: 'A partner who tells nobody anything — and you find out things last, through other people.',
        description: 'The discomfort is exclusion: privacy that has hardened into a wall you are standing outside of.',
        weight: { relational_privacy: -0.5, vulnerability_safety: 0.2 },
      },
    ],
    diagnosticWeight: 1.1,
  },
  {
    id: 'q65',
    layer: 4,
    format: 'agreement',
    // General-principle phrasing — states the two-person frame as a belief,
    // answerable without a current relationship.
    prompt: ['"Whatever happens in a relationship should be worked out between the two people in it before anyone else hears the details."'],
    options: [
      { id: '1', label: 'Strongly disagree', value: 1, description: 'Processing out loud with your circle is part of how you metabolize a relationship — the boundary lives elsewhere for you.', weight: { relational_privacy: -0.5 } },
      { id: '2', label: 'Lean disagree', value: 2, description: 'A trusted voice gets the real story early; the relationship is not a sealed room in your operating model.', weight: { relational_privacy: -0.25 } },
      { id: '3', label: 'Depends on the topic', value: 3, description: 'You sort by stakes: heavy things stay home, ordinary things circulate. Worth knowing where your own line actually sits.', weight: { relational_privacy: 0 } },
      { id: '4', label: 'Lean agree', value: 4, description: 'Details are mostly yours to keep; outside voices enter by invitation, not by default.', weight: { relational_privacy: 0.25 } },
      { id: '5', label: 'Strongly agree', value: 5, description: 'The two-person frame is near-absolute for you — counsel is welcomed only when you choose to ask, never taken by default.', weight: { relational_privacy: 0.45 } },
    ],
    diagnosticWeight: 0.8,
  },
  {
    id: 'q66',
    layer: 4,
    format: 'agreement',
    prompt: ['"When I\'m upset with a partner, talking it through with a close friend first usually helps before I bring it to them."'],
    options: [
      { id: '1', label: 'Not my pattern at all', value: 1, description: 'You bring it to the source first — the circle hears about it later, if ever, and only as a finished story.', weight: { relational_privacy: 0.45, direct_communication: 0.2 } },
      { id: '2', label: 'Rarely', value: 2, description: 'A rehearsal sometimes helps you find your words; the real conversation still happens between you two, first and mostly.', weight: { relational_privacy: 0.25 } },
      { id: '3', label: 'Sometimes it helps', value: 3, description: 'Mid-conflict is exactly where your doors open: a friend gets the story while it is still hot and one-sided.', weight: { relational_privacy: 0 } },
      { id: '4', label: 'Often', value: 4, description: 'Outside processing is a load-bearing step for you — the partner often receives a version already shaped by the retelling.', weight: { relational_privacy: -0.25 } },
      { id: '5', label: 'That\'s my standard sequence', value: 5, description: 'By the time your partner hears it, the conflict has already been lived with other people — the two-person frame arrives last.', weight: { relational_privacy: -0.45 } },
    ],
    diagnosticWeight: 0.8,
  },
  {
    id: 'q67',
    layer: 5,
    format: 'scenario',
    prompt: [
      'A group chat you\'re in is trading screenshots of a friend\'s text arguments, everyone picking sides for fun.',
      'Your partner\'s messages from last night\'s disagreement are sitting right there in your phone.',
      'What do you do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Nothing goes in. I scroll past — my relationship\'s texts aren\'t content.',
        description: 'The two-person frame holds even as entertainment; what your partner wrote to you is not community property.',
        weight: { relational_privacy: 0.8, vulnerability_safety: 0.3 },
      },
      {
        id: 'b',
        label: 'Share one harmless screenshot — it\'s funny, nothing identifying, and this is what the chat is for.',
        description: 'For you the boundary is identifying detail, not membership — the chat is a trusted room and you share inside it.',
        weight: { relational_privacy: -0.2, vulnerability_safety: -0.1 },
      },
      {
        id: 'c',
        label: 'Join in with your own story about last night — same energy as everyone else.',
        description: 'The group is where your conflicts go to be processed; the boundary between chat and relationship barely registers for you.',
        weight: { relational_privacy: -0.7, vulnerability_safety: -0.2 },
      },
      {
        id: 'd',
        label: 'Say the group is getting mean, and change the subject.',
        description: 'You decline the genre entirely and protect someone else\'s privacy too — the boundary is a value, not just a preference about your own stuff.',
        weight: { relational_privacy: 0.5, vulnerability_safety: 0.4, repair_orientation: 0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },

  // ───────────────────── Coverage debt: curiosity_worlds ─────────────────────
  {
    id: 'q68',
    layer: 1,
    format: 'scenario',
    prompt: [
      'Your partner has gotten deep into something you don\'t understand — a craft, a game, a subject. They ask if you want to come see what they\'ve been working on.',
      'What most naturally happens?',
    ],
    options: [
      {
        id: 'a',
        label: 'I go, and I ask the second question — the one that gets past the surface.',
        description: 'You enter their world on purpose. The second question is where interest stops being polite and becomes love.',
        weight: { curiosity_worlds: 0.9, autonomy_connection: 0.2 },
      },
      {
        id: 'b',
        label: 'I go, happy to be near their excitement, even if the thing itself floats past me.',
        description: 'Warm presence without deep entry — their joy registers, the mechanics don\'t.',
        weight: { curiosity_worlds: 0.3, affection_daily: 0.2 },
      },
      {
        id: 'c',
        label: 'I suggest a time later when I can actually pay attention, and I mean it.',
        description: 'You\'d rather give real attention later than thin attention now — honest, as long as "later" actually arrives.',
        weight: { curiosity_worlds: 0.5, direct_communication: 0.2 },
      },
      {
        id: 'd',
        label: 'I stay with what I was doing — my evening is already spoken for.',
        description: 'Your worlds run in parallel. Fair, and common — but a partner whose world is never visited eventually stops extending invitations.',
        weight: { curiosity_worlds: -0.7, autonomy_connection: 0.3 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q69',
    layer: 2,
    format: 'forced_pair',
    prompt: [
      'You\'re explaining something you genuinely care about. Which would sting more?',
    ],
    options: [
      {
        id: 'a',
        label: 'They nod along but never ask a single follow-up.',
        description: 'The absence of curiosity is the wound — you were talking into a polite wall.',
        weight: { curiosity_worlds: 0.7, listening_first: 0.2 },
      },
      {
        id: 'b',
        label: 'They ask questions, but you can see they\'re bored while asking.',
        description: 'Performed interest. You\'d rather have none than theater — which says curiosity, for you, must be real to count.',
        weight: { curiosity_worlds: -0.6, direct_communication: 0.2 },
      },
    ],
    diagnosticWeight: 1.1,
  },
  {
    id: 'q70',
    layer: 4,
    format: 'agreement',
    prompt: ['"When someone I love is explaining something they care about, I usually ask at least one question I don\'t know the answer to."'],
    options: [
      { id: '1', label: 'Not my habit', value: 1, description: 'You listen politely and move on — the explanation gets received, but the topic never deepens.', weight: { curiosity_worlds: -0.5 } },
      { id: '2', label: 'Rarely', value: 2, description: 'A question surfaces sometimes, usually when their excitement is contagious enough to reach you.', weight: { curiosity_worlds: -0.25 } },
      { id: '3', label: 'About half the time', value: 3, description: 'Your curiosity runs on fuel — it shows up when you\'re rested, engaged, or already half-interested.', weight: { curiosity_worlds: 0 } },
      { id: '4', label: 'Usually', value: 4, description: 'The second question is your reflex — people leave conversations with you feeling interesting.', weight: { curiosity_worlds: 0.3 } },
      { id: '5', label: 'Almost always', value: 5, description: 'You treat their enthusiasm as an open door and walk through it. Interest, for you, is a form of love.', weight: { curiosity_worlds: 0.5 } },
    ],
    diagnosticWeight: 0.8,
  },

  // ───────────────────── Coverage debt: relational_privacy ─────────────────────
  {
    id: 'q71',
    layer: 1,
    format: 'scenario',
    prompt: [
      'You two skipped a family gathering to have a rare night alone. Now their parent is calling your partner, clearly a little hurt, wanting to know why.',
      'What do you most naturally do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Let them handle their family however they usually do — I stay out of the call.',
        description: 'Family lanes are distinct in your model. Respectful of their autonomy — though worth checking they agree on where the line sits.',
        weight: { relational_privacy: 0.3, autonomy_connection: 0.3 },
      },
      {
        id: 'b',
        label: 'Afterward, we decide together what the family version of the story is.',
        description: 'The two-person frame in action: what gets shared outward is a decision, not a reflex.',
        weight: { relational_privacy: 0.6, same_side_problems: 0.3 },
      },
      {
        id: 'c',
        label: 'The honest reason goes out — we skipped for us, and that\'s the whole answer.',
        description: 'Transparency as default. Boundaries live in tone here, not in what\'s disclosed.',
        weight: { relational_privacy: -0.4, direct_communication: 0.2 },
      },
      {
        id: 'd',
        label: 'I offer a soft excuse to end the call faster — the truth is nobody\'s business but ours.',
        description: 'Privacy taken into your own hands. Protective — though a partner may want the decision to have been shared.',
        weight: { relational_privacy: 0.2, direct_communication: -0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q72',
    layer: 4,
    format: 'agreement',
    // Hypothetical, indefinite-article phrasing — a boundary preference, not a
    // current-relationship report.
    prompt: ['"Even the people closest to me should only ever get the finished story of my love life — never the drafts."'],
    options: [
      { id: '1', label: 'Not how I see it', value: 1, description: 'Your circle hears things while they\'re still raw — processing out loud is part of how you metabolize a relationship.', weight: { relational_privacy: -0.5 } },
      { id: '2', label: 'Lean away — though I\'d probably tell one trusted person', value: 2, description: 'A near-absolute: the story travels settled, with a single understood exception.', weight: { relational_privacy: -0.25 } },
      { id: '3', label: 'Depends on the story', value: 3, description: 'You sort by stakes: some chapters stay home, some get told early. Worth knowing your own sorting rule.', weight: { relational_privacy: 0 } },
      { id: '4', label: 'Mostly true for me', value: 4, description: 'What leaves the relationship is curated — outside voices get the settled version.', weight: { relational_privacy: 0.25 } },
      { id: '5', label: 'Exactly my line', value: 5, description: 'The two of you are the authors; everyone else reads published work. A near-absolute two-person frame.', weight: { relational_privacy: 0.45 } },
    ],
    diagnosticWeight: 0.8,
  },
  {
    id: 'q73',
    layer: 5,
    format: 'scenario',
    prompt: [
      'Your partner confided something painful about their sibling. Now the sibling has asked you — directly, in person — "What\'s going on with them?"',
      'What do you actually do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Hold it, fully: "That\'s theirs to tell. I\'m not keeping anything from you out of spite — I\'m keeping my word."',
        description: 'Confidence as a vow. The sibling may bristle; your partner will never find out that they couldn\'t.',
        weight: { relational_privacy: 0.7, vulnerability_safety: 0.4 },
      },
      {
        id: 'b',
        label: 'Redirect: encourage the sibling to ask directly, and offer to help mend things between them.',
        description: 'You decline the leak and try to fix the source of the question — privacy plus repair in one move.',
        weight: { relational_privacy: 0.4, repair_orientation: 0.3 },
      },
      {
        id: 'c',
        label: 'Give the sanitized outline — enough to be kind, none of the substance.',
        description: 'A middle path that satisfies no one entirely: the confidence bends without fully breaking.',
        weight: { relational_privacy: 0.1, vulnerability_safety: -0.1 },
      },
      {
        id: 'd',
        label: 'Tell them — the sibling is close to you too, and family shouldn\'t hear things from strangers.',
        description: 'Loyalty runs wider than the couple in your model. Understandable — and your partner may find out what got shared.',
        weight: { relational_privacy: -0.6, vulnerability_safety: -0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },

  // ───────────────────── Expansion: conflict_engagement ─────────────────────
  {
    id: 'q74',
    layer: 1,
    format: 'scenario',
    prompt: [
      'A disagreement is accelerating. Your partner\'s voice has gone up a notch, and you feel the heat rising in your own chest.',
      'In the moment, what actually happens?',
    ],
    options: [
      {
        id: 'a',
        label: 'I name the temperature: "Okay — we\'re both spiking. Slow down with me for a second."',
        description: 'You can reach for the brake mid-swerve. De-escalation as a skill you actually use, not just admire.',
        weight: { conflict_engagement: 0.7, repair_orientation: 0.2 },
      },
      {
        id: 'b',
        label: 'I ask a question to understand their point before answering mine.',
        description: 'Curiosity as a pressure valve — staying engaged without escalating.',
        weight: { conflict_engagement: 0.6, listening_first: 0.3 },
      },
      {
        id: 'c',
        label: 'I go quiet and hold my ground — I\'m not giving more fuel, but I\'m not conceding either.',
        description: 'Withdrawal as shelter. It lowers the volume, but a partner who can\'t find you in there will read the silence as a wall.',
        weight: { conflict_engagement: -0.5, autonomy_connection: 0.2 },
      },
      {
        id: 'd',
        label: 'I press my point while it\'s hot — I want it resolved, not shelved.',
        description: 'Pursuit as engagement. Resolution matters to you — the risk is that heat wins points it shouldn\'t.',
        weight: { conflict_engagement: -0.5, direct_communication: 0.3 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q79',
    layer: 2,
    format: 'forced_pair',
    prompt: ['Which is more like you in a heated disagreement?'],
    options: [
      {
        id: 'a',
        label: 'I want to resolve it now — leaving it hanging eats at me worse than the argument does.',
        description: 'The pursuer\'s instinct: closeness restored on a deadline. Powerful when paired with patience, corrosive when not.',
        weight: { conflict_engagement: 0.6, direct_communication: 0.2 },
      },
      {
        id: 'b',
        label: 'I need to step away and process alone before I can say anything useful.',
        description: 'The processor\'s instinct: quality comes later, after the storm passes through you privately.',
        weight: { conflict_engagement: -0.5, logic_emotion_integration: 0.2 },
      },
    ],
    diagnosticWeight: 1.1,
  },
  {
    id: 'q84',
    layer: 4,
    format: 'agreement',
    prompt: ['"When a disagreement heats up, I can stay curious about their side even while defending mine."'],
    options: [
      { id: '1', label: 'No — heat closes the door', value: 1, description: 'Once lit, the argument becomes a defense. Their side goes unheard until you cool down alone.', weight: { conflict_engagement: -0.5 } },
      { id: '2', label: 'Rarely', value: 2, description: 'Curiosity returns only after the temperature drops — sometimes days later.', weight: { conflict_engagement: -0.25 } },
      { id: '3', label: 'Sometimes', value: 3, description: 'A coin flip that depends on the topic — worth knowing which topics spend your curiosity first.', weight: { conflict_engagement: 0 } },
      { id: '4', label: 'Usually', value: 4, description: 'You can hold your ground and their perspective at once — the rarest conflict skill.', weight: { conflict_engagement: 0.3 } },
      { id: '5', label: 'Even mid-argument', value: 5, description: 'Two things true at once: your position, and genuine interest in theirs. Your preferred style is one where disagreement does not have to become relational damage.', weight: { conflict_engagement: 0.5 } },
    ],
    diagnosticWeight: 0.8,
  },

  // ───────────────────── Expansion: sexual_communication ─────────────────────
  {
    id: 'q75',
    layer: 4,
    format: 'agreement',
    // Hypothetical self-prediction (per user review): same construct and weights,
    // phrased as "if X, I'd say so" so it needs no current partner — and it now
    // echoes q85's scenario directly. Option 2 is the user's "wait for them to
    // pick up on the vibe" disclosure style.
    prompt: ['"If something wasn\'t working for me in bed, I\'d say so out loud."'],
    options: [
      { id: '1', label: 'No — that conversation feels too risky to start', value: 1, description: 'The preference stays internal, and silence quietly becomes the answer.', weight: { sexual_communication: -0.5 } },
      { id: '2', label: 'Unlikely — I\'d hope they\'d pick up on it first', value: 2, description: 'Communication by signal: it asks the other person to read a language they don\'t know is being spoken.', weight: { sexual_communication: -0.25 } },
      { id: '3', label: 'Depends how long it went on', value: 3, description: 'A threshold exists — small things stay unspoken, the ones that matter eventually surface.', weight: { sexual_communication: 0 } },
      { id: '4', label: 'Probably, once I\'d worked up to it', value: 4, description: 'Saying it is a deliberation, not a reflex — the words come, at a cost.', weight: { sexual_communication: 0.3 } },
      { id: '5', label: 'Yes — plainly, and sooner rather than later', value: 5, description: 'Preference stated as information, not accusation. The trait meta-analyses tie to both sexual and relationship satisfaction.', weight: { sexual_communication: 0.5 } },
    ],
    diagnosticWeight: 0.9,
  },
  {
    id: 'q80',
    layer: 1,
    format: 'scenario',
    prompt: [
      'Mid-intimacy, your partner has gone noticeably quiet — something shifted, and you can feel it.',
      'What\'s your most natural move?',
    ],
    options: [
      {
        id: 'a',
        label: 'Pause and ask, gently: "Hey — you went somewhere. You okay?"',
        description: 'You check in inside the moment, where the feeling actually is. Zero tolerance for unspoken drift.',
        weight: { sexual_communication: 0.8, vulnerability_safety: 0.2 },
      },
      {
        id: 'b',
        label: 'Ease off, stay warm, and bring it up later when we\'re both clothed and calm.',
        description: 'You read the room and pick a lower-pressure arena for the conversation. Respectful — as long as later really happens.',
        weight: { sexual_communication: 0.5, direct_communication: 0.3 },
      },
      {
        id: 'c',
        label: 'Stop for tonight — turn it toward closeness instead: hold them, no expectations.',
        description: 'You trade the moment for connection without demanding an explanation first — generous, though the cause goes unasked.',
        weight: { sexual_communication: 0.2, affection_daily: 0.3 },
      },
      {
        id: 'd',
        label: 'Carry on — not every silence means something, and asking would make it a thing.',
        description: 'You let the signal pass unanswered. Sometimes that\'s grace; as a habit, it teaches partners their signals won\'t be received.',
        weight: { sexual_communication: -0.6 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q85',
    layer: 5,
    format: 'scenario',
    prompt: [
      'The same thing hasn\'t been working for you in bed for weeks. Your partner has no idea there\'s anything to notice.',
      'What would you actually do?',
    ],
    options: [
      {
        id: 'a',
        label: 'Say it this week — framed as what I want more of, not as a complaint.',
        description: 'The move the research rewards: preference stated as invitation. Uncomfortable once, useful for years.',
        weight: { sexual_communication: 0.8, direct_communication: 0.3 },
      },
      {
        id: 'b',
        label: 'Try steering in the moment — redirect without ever naming it.',
        description: 'Communication by gesture. It can work, but it asks your partner to read a language they don\'t know they\'re being tested in.',
        weight: { sexual_communication: -0.2, care_initiation: 0.1 },
      },
      {
        id: 'c',
        label: 'Wait for a natural opening — the right conversation can\'t be scheduled.',
        description: 'Openings, in practice, rarely arrive on their own; weeks have a way of becoming the baseline.',
        weight: { sexual_communication: -0.3 },
      },
      {
        id: 'd',
        label: 'Keep it to myself — telling them would wound more than the silence does.',
        description: 'Protection as kindness. The cost is invisible to you: your partner keeps performing a script they can\'t improve.',
        weight: { sexual_communication: -0.6 },
      },
    ],
    diagnosticWeight: 1.2,
    note: 'Whatever you picked, nothing here is a grade — the question is whether the channel exists, not what it carries.',
  },

  // ───────────────────── Expansion: capitalization ─────────────────────
  {
    id: 'q77',
    layer: 1,
    format: 'scenario',
    prompt: [
      'You\'re mid-evening when your partner bursts in: "Okay, you won\'t believe what happened today—"',
      'What\'s your genuine first move?',
    ],
    options: [
      {
        id: 'a',
        label: 'Put down whatever I\'m holding, turn to face them: "Wait — start from the beginning."',
        description: 'Full-body attention. In capitalization research this is the move that turns a good day into a bond.',
        weight: { capitalization: 0.9, listening_first: 0.2 },
      },
      {
        id: 'b',
        label: 'Light up with them first, then pull the story out with questions.',
        description: 'Enthusiasm plus curiosity — you celebrate and investigate at once.',
        weight: { capitalization: 0.7, curiosity_worlds: 0.3 },
      },
      {
        id: 'c',
        label: 'Respond warmly from where I am, then hear the details as the evening goes.',
        description: 'Warm but not fully stopped — the news gets received, the moment gets less than all of you.',
        weight: { capitalization: 0.2, autonomy_connection: 0.2 },
      },
      {
        id: 'd',
        label: '"That\'s great!" — and back to what I was doing; the details can wait for dinner.',
        description: 'The passive-good-news response. Not cold — but the celebration quietly becomes their own project.',
        weight: { capitalization: -0.6 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q82',
    layer: 4,
    format: 'agreement',
    // Gable's capitalization, want-framed (per user review): an aspiration about
    // where good news should land — answerable with or without a current partner.
    prompt: ['"When something goes right in a partner\'s day, I want to be the first person they tell."'],
    options: [
      { id: '1', label: 'Honestly, no', value: 1, description: 'Their good news landing somewhere else wouldn\'t cost you much. Worth knowing whether that\'s independence or armor.', weight: { capitalization: -0.5 } },
      { id: '2', label: 'Not particularly', value: 2, description: 'First-telling isn\'t a position you\'re attached to — other signals carry the closeness for you.', weight: { capitalization: -0.25 } },
      { id: '3', label: 'Nice when it happens', value: 3, description: 'You\'d take it, but you wouldn\'t miss it — the door is open rather than expected.', weight: { capitalization: 0 } },
      { id: '4', label: 'Mostly, yes', value: 4, description: 'Being their first stop matters — where joy goes first is part of what closeness means to you.', weight: { capitalization: 0.3 } },
      { id: '5', label: 'Yes — that\'s exactly the shape of closeness I want', value: 5, description: 'One of the most honest closeness signals there is: you want to be where their joy lands first.', weight: { capitalization: 0.5 } },
    ],
    diagnosticWeight: 0.8,
  },

  // ───────────────────── Expansion: positivity_play ─────────────────────
  {
    id: 'q76',
    layer: 1,
    format: 'scenario',
    prompt: [
      'A gray Sunday. Nothing is wrong, nothing is planned, and the energy in the house has gone flat.',
      'What most naturally happens?',
    ],
    options: [
      {
        id: 'a',
        label: 'I invent something small and put it on the table — a walk somewhere specific, a dumb movie, a project.',
        description: 'You treat flatness as weather you can change. Fun, for you, is gardened, not foraged.',
        weight: { positivity_play: 0.8, care_initiation: 0.2 },
      },
      {
        id: 'b',
        label: 'I offer two or three options and let them pick — momentum without steering.',
        description: 'You bring the spark but hand over the match. Collaborative lift, shared initiative.',
        weight: { positivity_play: 0.5, direct_communication: 0.2 },
      },
      {
        id: 'c',
        label: 'A flat Sunday is fine — we each sink into our own things and that\'s its own comfort.',
        description: 'Parallel rest as its own pleasure. Genuinely healthy — as long as it\'s a choice, not the permanent default.',
        weight: { positivity_play: -0.3, autonomy_connection: 0.4 },
      },
      {
        id: 'd',
        label: 'I wait for energy to show up on its own — it usually does, eventually.',
        description: 'You outsource the plan to mood. Sometimes it works; as a pattern, the fun weeks start belonging to chance.',
        weight: { positivity_play: -0.5 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q81',
    layer: 4,
    format: 'agreement',
    // Conditional phrasing — a behavioral disposition whenever a relationship
    // exists or is forming, not a report about a current one.
    prompt: ['"When there\'s fun to be had in a relationship, I\'m usually the one who plants the seed — the plan, the joke, the outing."'],
    options: [
      { id: '1', label: 'Almost never me', value: 1, description: 'You enjoy things when they happen, but the cultivation falls to others — or to no one.', weight: { positivity_play: -0.5 } },
      { id: '2', label: 'Occasionally', value: 2, description: 'The seed-planting shows up in bursts, mostly when your own tank is full.', weight: { positivity_play: -0.25 } },
      { id: '3', label: 'Roughly half', value: 3, description: 'A genuine trade-off between you two — or a gap both of you have quietly noticed.', weight: { positivity_play: 0 } },
      { id: '4', label: 'Mostly me', value: 4, description: 'You carry the lightness portfolio. Partners read it as generosity — some also start to expect it.', weight: { positivity_play: 0.3 } },
      { id: '5', label: 'That\'s my role', value: 5, description: 'Cultivating fun is a duty you actually enjoy — the maintenance work nobody thanks you for until it stops.', weight: { positivity_play: 0.5, care_initiation: 0.15 } },
    ],
    diagnosticWeight: 0.8,
  },
  {
    id: 'q86',
    layer: 2,
    format: 'forced_pair',
    prompt: ['Which would wear on you more over a year of daily life?'],
    options: [
      {
        id: 'a',
        label: 'A partner who\'s steady and competent — but rarely playful, and hard to make laugh.',
        description: 'You\'d miss lightness the way you\'d miss a room going dim — slowly, then noticeably.',
        weight: { positivity_play: 0.6 },
      },
      {
        id: 'b',
        label: 'A partner who\'s great fun — but goes quiet and unavailable when things get serious.',
        description: 'You\'d trade some of the lightness for weight-bearing. Seriousness, for you, is the load-bearing wall.',
        weight: { positivity_play: -0.5, same_side_problems: 0.3 },
      },
    ],
    diagnosticWeight: 1.1,
  },

  // ───────────────────── Expansion: capitalization (cont.) ─────────────────────
  {
    id: 'q78',
    layer: 2,
    format: 'forced_pair',
    prompt: ['Which would sting more, happening repeatedly?'],
    options: [
      {
        id: 'a',
        label: 'You share exciting news. They say "that\'s great" — and change the subject.',
        description: 'The deflection: your joy got a doorway, not a room. Over time, you stop bringing the first telling here.',
        weight: { capitalization: 0.7, listening_first: 0.2 },
      },
      {
        id: 'b',
        label: 'You share a worry. They respond with a five-step plan you didn\'t ask for.',
        description: 'The fix-it miss — the classic distress-listening gap. Here it is as a sting, paired against celebration.',
        weight: { capitalization: 0.2, listening_first: 0.7 },
      },
    ],
    diagnosticWeight: 1.1,
  },
  {
    id: 'q83',
    layer: 5,
    format: 'scenario',
    prompt: [
      'Your partner worked weeks toward something that mattered to them — and it didn\'t happen. They get the call while you\'re both home.',
      'What\'s your most natural move?',
    ],
    options: [
      {
        id: 'a',
        label: 'Sit down next to them first — words can start whenever they\'re ready.',
        description: 'Presence before language. For disappointment, arrival is the message.',
        weight: { capitalization: 0.5, listening_first: 0.4 },
      },
      {
        id: 'b',
        label: 'Let them tell me what happened, then ask what it means for what they wanted next.',
        description: 'You engage the loss on its own terms — practical care in the shape their goal actually had.',
        weight: { capitalization: 0.4, curiosity_worlds: 0.3 },
      },
      {
        id: 'c',
        label: 'Comfort first, then quietly help them find the angle: what\'s still possible from here?',
        description: 'Ache and after-plan. You hold the feeling and refuse to let it be the whole story.',
        weight: { capitalization: 0.3, same_side_problems: 0.3 },
      },
      {
        id: 'd',
        label: 'Minimize the miss — the sincere "it wasn\'t that big a deal anyway" play.',
        description: 'Comfort as erasure. Meant kindly; lands as their weeks not having mattered as much as they did.',
        weight: { capitalization: -0.5, perspective_taking: -0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q87',
    layer: 5,
    format: 'scenario',
    prompt: [
      'Your partner has a real shot at something they want — a job across the country, a demanding program, a risk worth taking.',
      'It would cost you both something for a few years. You can see they want it.',
      'What happens inside you?',
    ],
    options: [
      {
        id: 'a',
        label: 'I start running the logistics — how do we make this actually work?',
        description: 'Commitment as verb. Your support arrives in the shape of a plan.',
        weight: { commitment_sacrifice: 0.8, same_side_problems: 0.3 },
      },
      {
        id: 'b',
        label: 'I feel the cost — and I want their want, loudly. We figure out the rest together.',
        description: 'You can hold both truths: the price is real, and their becoming matters more than your comfort.',
        weight: { commitment_sacrifice: 0.8, direct_communication: 0.2 },
      },
      {
        id: 'c',
        label: 'I need to sit with it honestly — and I\'d tell them exactly where I land, even if it\'s complicated.',
        description: 'Honest reservation over performed enthusiasm. It risks the moment; it protects the years that follow it.',
        weight: { commitment_sacrifice: 0.2, direct_communication: 0.5 },
      },
      {
        id: 'd',
        label: 'Honestly? A quiet dread — I grieve the stability we\'d be giving up.',
        description: 'The cost speaks first. Real — and worth watching whether stability has become the loudest voice in your decisions.',
        weight: { commitment_sacrifice: -0.6 },
      },
    ],
    diagnosticWeight: 1.3,
  },
  {
    id: 'q88',
    layer: 1,
    format: 'scenario',
    prompt: [
      'You come home carrying good news of your own. Your partner is absorbed in something — a screen, a task, their own day.',
      'What happens?',
    ],
    options: [
      {
        id: 'a',
        label: 'I share it anyway, and read how they receive it.',
        description: 'You still bring the first telling here — their reception is information you let yourself collect.',
        weight: { capitalization: 0.6, direct_communication: 0.2 },
      },
      {
        id: 'b',
        label: 'I wait for a better moment, then tell them properly.',
        description: 'You protect the news from a distracted reception — patience as care for the moment itself.',
        weight: { capitalization: 0.3, perspective_taking: 0.2 },
      },
      {
        id: 'c',
        label: 'I mention it in passing and let them ask if they want more.',
        description: 'The doorway held open an inch — enough to be honest, not enough to be received.',
        weight: { capitalization: -0.3 },
      },
      {
        id: 'd',
        label: 'I keep it — I\'ll tell people who\'ll actually light up.',
        description: 'The routing has already moved. This is what quiet capitalization loss looks like from inside.',
        weight: { capitalization: -0.6, relational_privacy: 0.2 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q89',
    layer: 4,
    format: 'agreement',
    prompt: ['"I can be fully happy for the wins of someone I love — even the ones that are inconvenient for me."'],
    options: [
      { id: '1', label: 'Hard to say honestly', value: 1, description: 'Envy or cost speaks first for you — their wins sometimes arrive as subtraction.', weight: { capitalization: -0.5 } },
      { id: '2', label: 'Mostly, with friction', value: 2, description: 'The happiness is real but arrives second, after the cost has had its say.', weight: { capitalization: -0.25 } },
      { id: '3', label: 'Usually', value: 3, description: 'Delight comes through more often than not, with occasional static from the price tag.', weight: { capitalization: 0 } },
      { id: '4', label: 'Almost always', value: 4, description: 'Their wins land as additions. The friction is rare enough to be an event.', weight: { capitalization: 0.3 } },
      { id: '5', label: 'That\'s genuinely me', value: 5, description: 'Their wins register as additions to your life. The rarest form of generosity — delight without invoice.', weight: { capitalization: 0.5 } },
    ],
    diagnosticWeight: 0.8,
  },

  // ───────────────────── Expansion: commitment_sacrifice ─────────────────────
  {
    id: 'q90',
    layer: 4,
    format: 'agreement',
    prompt: ['"When I sacrifice something for a relationship, I rarely find myself auditing whether it was worth it."'],
    options: [
      { id: '1', label: 'I audit constantly', value: 1, description: 'Sacrifice, for you, comes with a running internal invoice — worth knowing, because partners feel audits even unspoken.', weight: { commitment_sacrifice: -0.5, scorekeeping: -0.2 } },
      { id: '2', label: 'More than I\'d like', value: 2, description: 'The value-check runs quietly in the background of most giving.', weight: { commitment_sacrifice: -0.25 } },
      { id: '3', label: 'Sometimes', value: 3, description: 'Big choices get weighed, small ones don\'t — a fairly normal economy.', weight: { commitment_sacrifice: 0 } },
      { id: '4', label: 'Rarely', value: 4, description: 'When you give to the relationship, the giving mostly settles the question.', weight: { commitment_sacrifice: 0.3 } },
      { id: '5', label: 'Almost never — giving settles it', value: 5, description: 'Your investment closes its own books. Commitment as a settled way of being, not a running cost-benefit.', weight: { commitment_sacrifice: 0.5 } },
    ],
    diagnosticWeight: 0.8,
  },
  {
    id: 'q91',
    layer: 2,
    format: 'forced_pair',
    prompt: ['Which loss would genuinely be harder?'],
    options: [
      {
        id: 'a',
        label: 'Giving up something I wanted — quietly, for the good of us.',
        description: 'Self-erasure is your tax: costly, invisible, and it compounds if never named.',
        weight: { commitment_sacrifice: 0.5, perspective_taking: 0.2 },
      },
      {
        id: 'b',
        label: 'Watching them give up something they wanted — for me, without being asked.',
        description: 'Being the cause of their sacrifice weighs more than sacrificing. Your partner\'s unbilled debts trouble you.',
        weight: { commitment_sacrifice: 0.4, receiving_comfort: 0.3 },
      },
    ],
    diagnosticWeight: 1.1,
  },

  // ───────────────────── Expansion: money_coordination ─────────────────────
  {
    id: 'q92',
    layer: 1,
    format: 'scenario',
    prompt: [
      'Your partner comes home with something they bought — not reckless, but not discussed either. It\'s more than you\'d have spent on it.',
      'What actually happens next?',
    ],
    options: [
      {
        id: 'a',
        label: 'Nothing needs to happen — it\'s their money, the bills are paid, and they don\'t need my sign-off.',
        description: 'Discretionary freedom as the operating rule. Teammate trust — as long as the bills-paid part stays actually true.',
        weight: { money_coordination: 0.7, autonomy_connection: 0.3 },
      },
      {
        id: 'b',
        label: 'Curiosity first: what is it, do they love it? The receipt isn\'t the point.',
        description: 'You separate the purchase from the person — the money conversation never needs to become a judgment.',
        weight: { money_coordination: 0.6, curiosity_worlds: 0.2 },
      },
      {
        id: 'c',
        label: 'A flicker of check-the-ledger — then I let it go, mostly.',
        description: 'A soft audit reflex you mostly overrule. The flicker is worth noticing; acting on it is what partners feel.',
        weight: { money_coordination: 0.2, scorekeeping: 0.2 },
      },
      {
        id: 'd',
        label: 'It bothers me enough that it comes up — I\'d want that kind of spend discussed first.',
        description: 'Coordination as a norm. Reasonable — the test is whether "discussed" means consulted or cleared.',
        weight: { money_coordination: -0.5, direct_communication: 0.3 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q93',
    layer: 4,
    format: 'agreement',
    prompt: ['"In a shared life, both people\'s hobbies — mine included — would get equal seriousness when money comes up."'],
    options: [
      { id: '1', label: 'No — mine get judged', value: 1, description: 'You feel the scrutiny on your own spending. That asymmetry is exactly what resentment uses as kindling.', weight: { money_coordination: -0.5 } },
      { id: '2', label: 'Leaning no — I\'d like to think mine would be exempt', value: 2, description: 'An unspoken hierarchy exists — though your own interests feel like the exception to it.', weight: { money_coordination: -0.25 } },
      { id: '3', label: 'Roughly equal', value: 3, description: 'No active double standard — spending legitimacy is roughly symmetrical in your house.', weight: { money_coordination: 0 } },
      { id: '4', label: 'Mostly equal', value: 4, description: 'Both people\'s interests get benefit of the doubt when the card comes out.', weight: { money_coordination: 0.3 } },
      { id: '5', label: 'Completely equal', value: 5, description: 'Teammate symmetry as a lived rule: neither person\'s joys are on trial. Rare, and quietly protective.', weight: { money_coordination: 0.5 } },
    ],
    diagnosticWeight: 0.8,
  },
  {
    id: 'q94',
    layer: 5,
    format: 'scenario',
    prompt: [
      'Money\'s tighter than usual this month — nothing catastrophic, just a real squeeze.',
      'What\'s your most natural response?',
    ],
    options: [
      {
        id: 'a',
        label: 'Put it on the table plainly, and we adjust together — no blame assigned.',
        description: 'The teammate move: information shared early, framed as us-vs-the-problem.',
        weight: { money_coordination: 0.7, same_side_problems: 0.4 },
      },
      {
        id: 'b',
        label: 'Run the numbers alone first, then bring a plan — I don\'t bring problems, I bring options.',
        description: 'Carrying it quietly to protect the mood. Competent and loving — but it can leave a partner managing a problem they never saw.',
        weight: { money_coordination: 0.3, shared_home_effort: 0.2 },
      },
      {
        id: 'c',
        label: 'Cut back silently and hope the month just sorts itself.',
        description: 'Avoidance as protection. The squeeze stays private — and your partner can\'t help with a problem they can\'t see.',
        weight: { money_coordination: -0.4, direct_communication: -0.2 },
      },
      {
        id: 'd',
        label: 'Mentally trace whose spending got us here.',
        description: 'The audit reflex under stress. Understandable — and exactly where "same side" most needs to beat "whose fault."',
        weight: { money_coordination: -0.6, same_side_problems: -0.3 },
      },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q95',
    layer: 2,
    format: 'forced_pair',
    prompt: ['Which arrangement would trouble you more?'],
    options: [
      {
        id: 'a',
        label: 'Every larger purchase requires both people\'s sign-off, no exceptions.',
        description: 'Over-coordination as your tax: security bought at the price of autonomy — having to ask reads as having to justify.',
        weight: { money_coordination: 0.5, autonomy_connection: 0.3 },
      },
      {
        id: 'b',
        label: 'Fully separate spending with no visibility — you find out about big things when they arrive.',
        description: 'Under-coordination as your tax: autonomy purchased with surprises — no monitoring, but no shared picture either.',
        weight: { money_coordination: 0.4, relational_privacy: 0.2 },
      },
    ],
    diagnosticWeight: 1.1,
  },

  // ───────────── Instrument-state checks (meta) — end-of-run state survey ─────────────
  // Three single-item affect/state measures (PANAS logic: positive and negative
  // affect are partially independent axes, not one good–bad dial). No diagnostic
  // weights — these read the reader, not the traits. They are NOT part of the
  // scored questionnaire: after the blueprint is generated, a short three-item
  // state survey asks how the taker felt (see app StateSurvey stage).

  // ───────────── Bonus (conflict-clarifying) pool — scored only when offered ─────────────
  // One question per dimension that echo-pair analysis can flag as self-in
  // conflict. NOT part of the core bank: offered only when that dimension's
  // pair agreement is low (see domain/bonus.ts), then scored like any other
  // item (BONUS_MAP in scoring.ts). Written per the hypothetical-not-
  // retrospective rule — every option tone-parity checked.

  {
    id: 'q99',
    layer: 6,
    format: 'agreement',
    meta: false,
    diagnosticWeight: 0.8,
    prompt: [
      'One last question, and it\'s a real one — the closest thing to an honest answer is the one that arrives before you polish it.',
      '"I know what I need from the people close to me — and I can say it out loud when it matters."',
    ],
    options: [
      { id: '1', label: 'Neither, honestly', value: 1, description: 'Needs and words both live underground. The blueprint\'s translation notes matter double here.', weight: { direct_communication: -0.4, reassurance_security: -0.3 } },
      { id: '2', label: 'I know them, but saying them is hard', value: 2, description: 'Self-knowledge without the voice — the signal exists but doesn\'t leave the building.', weight: { direct_communication: -0.2, reassurance_security: -0.1 } },
      { id: '3', label: 'I can say the easy ones', value: 3, description: 'Some needs are speakable, others stay internal — a partially drawn map.', weight: { direct_communication: 0 } },
      { id: '4', label: 'Mostly, with effort', value: 4, description: 'The important ones get said, at a cost — directness as discipline rather than reflex.', weight: { direct_communication: 0.3, reassurance_security: 0.15 } },
      { id: '5', label: 'Both, reliably', value: 5, description: 'Needs known and voiced — the premise the whole instrument assumes is learnable.', weight: { direct_communication: 0.45, reassurance_security: 0.3 } },
    ],
  },
  {
    id: 'q100',
    layer: 6, // deep-pattern self-reflection in spirit; pinned near the end
    // NOTE: q100's meta-state flag is set dynamically in scoring.ts (the
    // picture-specificity check is treated as a state item for scoring purposes).
    format: 'agreement',
    meta: false,
    diagnosticWeight: 0.8,
    prompt: ['"When I imagine the relationship I actually want, the picture is specific — I could describe it in detail right now."'],
    options: [
      { id: '1', label: 'Still vague — I\'d know it when I saw it', value: 1, description: 'A felt sense without edges. The blueprint may be more specific than your current picture — useful as a mirror.', weight: {} },
      { id: '2', label: 'A shape, not a picture', value: 2, description: 'Some features are clear, most are silhouette.', weight: {} },
      { id: '3', label: 'Clear in places', value: 3, description: 'Certain rooms are furnished; others are studs and drywall.', weight: {} },
      { id: '4', label: 'Mostly specific', value: 4, description: 'You could sketch it — the load-bearing walls are known.', weight: {} },
      { id: '5', label: 'Fully specific', value: 5, description: 'Detailed, and held openly enough to revise when real life complicates it.', weight: {} },
    ],
  },
];

// ───────────── Exported pools ─────────────

/**
 * End-of-run state survey (3 PANAS-logic items): how the taker felt after the
 * instrument. Presented AFTER the blueprint exists, in its own stage — never
 * counted toward the 115 scored questions.
 */
export const STATE_SURVEY: Question[] = [
  {
    id: 'q96',
    layer: 6,
    format: 'agreement',
    meta: true,
    diagnosticWeight: 0,
    prompt: ['"Right now, I feel settled and calm."'],
    options: [
      { id: '1', label: 'Not at all', value: 1, description: '', weight: {} },
      { id: '2', label: 'A little', value: 2, description: '', weight: {} },
      { id: '3', label: 'Somewhat', value: 3, description: '', weight: {} },
      { id: '4', label: 'Mostly', value: 4, description: '', weight: {} },
      { id: '5', label: 'Very much', value: 5, description: '', weight: {} },
    ],
  },
  {
    id: 'q97',
    layer: 6,
    format: 'agreement',
    meta: true,
    diagnosticWeight: 0,
    prompt: ['"Right now, I feel stirred up — things came up while answering."'],
    options: [
      { id: '1', label: 'Not at all', value: 1, description: '', weight: {} },
      { id: '2', label: 'A little', value: 2, description: '', weight: {} },
      { id: '3', label: 'Somewhat', value: 3, description: '', weight: {} },
      { id: '4', label: 'Mostly', value: 4, description: '', weight: {} },
      { id: '5', label: 'Very much', value: 5, description: '', weight: {} },
    ],
  },
  {
    id: 'q98',
    layer: 6,
    format: 'agreement',
    meta: true,
    diagnosticWeight: 0,
    prompt: ['"Something I answered touched something real."'],
    options: [
      { id: '1', label: 'Not really', value: 1, description: '', weight: {} },
      { id: '2', label: 'Slightly', value: 2, description: '', weight: {} },
      { id: '3', label: 'Somewhat', value: 3, description: '', weight: {} },
      { id: '4', label: 'Very', value: 4, description: '', weight: {} },
      { id: '5', label: 'Deeply — it stayed with me', value: 5, description: '', weight: {} },
    ],
  },
  // ── Wave 4 (q101–q122): four new dimensions + six thin-coverage deepeners. ──
  // Lives in WAVE4_QUESTIONS (defined below) and is merged into QUESTIONS at
  // export time. Defined separately only because the retired state survey sits
  // textually between the core bank and this block in this file.
];

/** Wave-4 bank: 4 new dimensions (desire_initiation, intimacy_attunement, feedback_receiving, external_processing) + 6 thin-coverage deepeners. */
const WAVE4_QUESTIONS: Question[] = [
  // desire_initiation: being the one who moves, and handling “not tonight.”
  {
    id: 'q101',
    layer: 2,
    format: 'forced_pair',
    prompt: ['In a new relationship, who tends to initiate the first kiss?'],
    options: [
      { id: 'a', label: 'I do — waiting for it is worse than the risk of misreading the moment.', description: 'You move when you want something; initiation is how wanting stays honest.', weight: { desire_initiation: 0.8, desire: 0.2 } },
      { id: 'b', label: 'They usually do — I want to be the one somebody cannot wait to kiss.', description: 'Being pursued is the signal of being wanted; your initiation is the response.', weight: { desire: 0.6, desire_initiation: -0.4 } },
      { id: 'c', label: 'Whoever gets there first — the reading of the moment matters more than the move.', description: 'Initiative is situational; the attunement matters more than who moves.', weight: { intimacy_attunement: 0.5, desire_initiation: 0.1 } },
      { id: 'd', label: 'It builds slowly — I would rather the first kiss be obviously mutual.', description: 'Mutuality before initiative; you move when it is unmistakably shared.', weight: { desire_initiation: 0.2, vulnerability_safety: 0.2 } },
    ],
    diagnosticWeight: 1.1,
  },
  {
    id: 'q102',
    layer: 1,
    format: 'agreement',
    prompt: ['"I am comfortable being the one who initiates — the kiss, the plan, the text that starts it."'],
    options: [
      { id: '1', label: 'Strongly disagree', value: 1, description: 'Moving first in desire is not your post — and telling a partner that matters.', weight: { desire_initiation: -0.7 } },
      { id: '2', label: 'Disagree', value: 2, description: 'You occasionally move first, but the wanting usually waits to be invited.', weight: { desire_initiation: -0.35 } },
      { id: '3', label: 'Neutral', value: 3, description: 'It depends on the day and the dynamic more than on any rule of yours.', weight: { desire_initiation: 0 } },
      { id: '4', label: 'Agree', value: 4, description: 'Moving first is part of how you show want.', weight: { desire_initiation: 0.35 } },
      { id: '5', label: 'Strongly agree', value: 5, description: 'Initiation is your native expression of want — wanting that never moves reads as absent.', weight: { desire_initiation: 0.7, desire: 0.1 } },
    ],
  },
  {
    id: 'q103',
    layer: 3,
    format: 'scenario',
    prompt: [
      'You initiate — clearly, warmly — and your partner says, “Honestly? Not tonight. I am wiped out.”',
      'What is actually going through you in the moment after?',
    ],
    options: [
      { id: 'a', label: 'A brief sting that fades fast — “okay, come here,” and I mean the cuddle that follows.', description: 'Rejection registers and metabolizes; the warmth survives the no.', weight: { desire_initiation: 0.5, receiving_comfort: 0.2 } },
      { id: 'b', label: 'I am fine with it, but I notice a small accounting starts — how long since they moved toward me?', description: 'The no is fine; the pattern of noes is what you track.', weight: { desire_initiation: 0.3, scorekeeping: 0.3 } },
      { id: 'c', label: 'It lands harder than I want it to — the no says something about me, and I know that is not fair.', description: 'A no touches desirability directly; you know the story is unearned but it plays anyway.', weight: { reassurance_security: 0.5, desire_initiation: -0.2 } },
      { id: 'd', label: 'Genuinely nothing — “not tonight” is just information, like being tired anywhere else.', description: 'A no is a data point about their energy, not a verdict about you.', weight: { desire_initiation: 0.2, vulnerability_safety: 0.3 } },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q104',
    layer: 5,
    format: 'agreement',
    prompt: ['"When I want someone, they know it — I do not keep it ambiguous for safety."'],
    options: [
      { id: '1', value: 1, label: 'Not me — the wanting stays mine until I am sure of the landing.', description: 'Want is revealed only after safety; ambiguity is the protection.', weight: { desire_initiation: -0.6, vulnerability_safety: -0.1 } },
      { id: '2', label: 'Rarely that legible', value: 2, description: 'Hints, proximity, atmosphere — the want is real but never quite said.', weight: { desire_initiation: -0.3, direct_communication: 0.1 } },
      { id: '3', label: 'Sometimes', value: 3, description: 'It depends how exposed the saying feels.', weight: { desire_initiation: 0 } },
      { id: '4', label: 'Mostly legible', value: 4, description: 'You usually make the want plain enough that nobody has to decode it.', weight: { desire_initiation: 0.3 } },
      { id: '5', value: 5, label: 'Completely — wanting in code is not wanting out loud.', description: 'You say it; a partner never has to guess whether they are wanted.', weight: { desire_initiation: 0.6, direct_communication: 0.2 } },
    ],
  },
  // intimacy_attunement: reading each other in real time, in and out of the moment.
  {
    id: 'q105',
    layer: 3,
    format: 'scenario',
    prompt: [
      'Things are intimate. A few minutes in, you can tell your partner is somewhere else — not rejecting you, just not here.',
    ],
    options: [
      { id: 'a', label: 'I say it gently — “hey, where did you go? Come back to me.”', description: 'You name the drift in the moment; attunement includes inviting them back.', weight: { intimacy_attunement: 0.7, direct_communication: 0.2 } },
      { id: 'b', label: 'I shift — slower, closer, change the rhythm — and see if their body comes back before any words.', description: 'You read and respond with your body first; words can come later.', weight: { intimacy_attunement: 0.6, affection_daily: 0.2 } },
      { id: 'c', label: 'I stop and ask properly — “do you want to keep going, or be close another way?”', description: 'The moment matters less than the person in it; you opt for clarity.', weight: { intimacy_attunement: 0.5, listening_first: 0.3 } },
      { id: 'd', label: 'I keep going and hope they rejoin — naming it feels like breaking something.', description: 'You noticed — that is attunement — but the naming is where yours stops.', weight: { intimacy_attunement: 0.2, direct_communication: -0.2 } },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q106',
    layer: 5,
    format: 'agreement',
    prompt: ['"Bodies do not always cooperate. When it happens to me or my partner, I can take it as information rather than rejection or failure."'],
    options: [
      { id: '1', value: 1, label: 'Strongly disagree — it always lands as something about me.', description: 'The mismatch reads as verdict; worth knowing that about yourself.', weight: { intimacy_attunement: -0.7, reassurance_security: 0.2 } },
      { id: '2', label: 'Disagree', value: 2, description: 'You know it should be information, but the sting arrives first.', weight: { intimacy_attunement: -0.3 } },
      { id: '3', label: 'Sometimes', value: 3, description: 'Depends on the night and the history around it.', weight: { intimacy_attunement: 0 } },
      { id: '4', label: 'Mostly', value: 4, description: 'You usually get to the information-reading, just not always immediately.', weight: { intimacy_attunement: 0.35 } },
      { id: '5', value: 5, label: 'Fully — bodies have weather; nothing about them is a verdict.', description: 'Non-judgment as a practiced skill; mismatch never becomes meaning.', weight: { intimacy_attunement: 0.7 } },
    ],
  },
  {
    id: 'q107',
    layer: 4,
    format: 'agreement',
    prompt: ['"The moments right after intimacy matter to me as much as the intimacy itself."'],
    options: [
      { id: '1', value: 1, label: 'Strongly disagree — the moment ending is the moment ending.', description: 'No afterglow investment; the connection is the act itself.', weight: { intimacy_attunement: -0.5, affection_daily: -0.1 } },
      { id: '2', label: 'Disagree', value: 2, description: 'Nice when it happens, not something you need.', weight: { intimacy_attunement: -0.2 } },
      { id: '3', label: 'Neutral', value: 3, description: 'It varies more than any principle of yours.', weight: { intimacy_attunement: 0 } },
      { id: '4', label: 'Agree', value: 4, description: 'The settling-in afterward is part of what the whole thing is for.', weight: { intimacy_attunement: 0.35 } },
      { id: '5', value: 5, label: 'Strongly agree — that is where I feel it the most.', description: 'Afterglow as the deepest register of the connection itself.', weight: { intimacy_attunement: 0.6, affection_daily: 0.2 } },
    ],
  },
  // feedback_receiving: hearing it without armor.
  {
    id: 'q108',
    layer: 3,
    format: 'scenario',
    prompt: [
      'Your partner tells you, carefully and kindly, that something you have been doing for months has been bothering them.',
      'What happens in the first ten seconds inside?',
    ],
    options: [
      { id: 'a', label: 'A flash of defense — and I let it pass without acting on it, then actually take the point in.', description: 'Armor rises and is set down; the feedback gets through anyway.', weight: { feedback_receiving: 0.5, perspective_taking: 0.2 } },
      { id: 'b', label: 'Almost nothing defensive — I am mostly curious what took them so long to tell me.', description: 'Feedback lands as information; your first instinct is the conversation, not the armor.', weight: { feedback_receiving: 0.7, curiosity_worlds: 0.2 } },
      { id: 'c', label: 'I start building my case before they finish — what I was dealing with, why it made sense.', description: 'Defense as immediate reflex; the explanation arrives before the hearing does.', weight: { feedback_receiving: -0.6, perspective_taking: -0.1 } },
      { id: 'd', label: 'It stings, I agree to work on it — and privately it takes weeks to stop feeling like an indictment.', description: 'You receive the content but the sting keeps; receiving takes longer than agreeing.', weight: { feedback_receiving: 0.2, repair_orientation: 0.2 } },
    ],
    diagnosticWeight: 1.2,
  },
  {
    id: 'q109',
    layer: 5,
    format: 'agreement',
    prompt: ['"When someone I love gives me hard feedback, I can hear the whole thing before I respond."'],
    options: [
      { id: '1', value: 1, label: 'No — I am composing my reply before their sentence ends.', description: 'The listening is interrupted by the defense; worth knowing.', weight: { feedback_receiving: -0.7, listening_first: -0.2 } },
      { id: '2', label: 'Rarely', value: 2, description: 'The first half gets heard; the second half gets defended against.', weight: { feedback_receiving: -0.3 } },
      { id: '3', label: 'About half the time', value: 3, description: 'Depends on how exposed the feedback finds you.', weight: { feedback_receiving: 0 } },
      { id: '4', label: 'Usually', value: 4, description: 'You mostly hear it all before responding.', weight: { feedback_receiving: 0.35 } },
      { id: '5', value: 5, label: 'Yes — hearing it fully is the respect; my reply can wait its turn.', description: 'Receiving as a discipline: the whole thing, before anything back.', weight: { feedback_receiving: 0.7, listening_first: 0.2 } },
    ],
  },
  {
    id: 'q110',
    layer: 6,
    format: 'forced_pair',
    prompt: ['Which would genuinely be harder to hear from your partner?'],
    options: [
      { id: 'a', label: '“The way you shut down when we argue is the thing that hurts the most.”', description: 'Feedback that names a defense mechanism you cannot see from inside.', weight: { conflict_engagement: 0.3, vulnerability_safety: 0.2 } },
      { id: 'b', label: '“I do not feel taken care of by you lately.”', description: 'Feedback that questions the thing you believe you are good at.', weight: { care_initiation: 0.3, receiving_comfort: 0.2 } },
    ],
    diagnosticWeight: 1.0,
  },
  // external_processing: outside voices, on purpose.
  {
    id: 'q111',
    layer: 4,
    format: 'agreement',
    prompt: ['"When something in the relationship is hard, I need to talk it through with someone outside it before I know what I think."'],
    options: [
      { id: '1', value: 1, label: 'Not at all — talking outside muddies what I already know inside.', description: 'You process internally first; outside voices arrive after your own clarity, if at all.', weight: { external_processing: -0.7 } },
      { id: '2', label: 'Rarely', value: 2, description: 'Occasionally useful, rarely necessary.', weight: { external_processing: -0.3 } },
      { id: '3', label: 'Sometimes', value: 3, description: 'Depends on how tangled the thing is.', weight: { external_processing: 0 } },
      { id: '4', label: 'Often', value: 4, description: 'An outside perspective is how you untangle most hard things.', weight: { external_processing: 0.35 } },
      { id: '5', value: 5, label: 'Almost always — I think out loud, and the loud version needs another person.', description: 'Processing as dialogue; the trusted voice is part of your thinking apparatus.', weight: { external_processing: 0.7 } },
    ],
  },
  {
    id: 'q112',
    layer: 3,
    format: 'scenario',
    prompt: [
      'A hard week in the relationship. Your partner finds out you have been talking it through with a close friend.',
      'Which reaction is closest to yours — as the one who talked?',
    ],
    options: [
      { id: 'a', label: 'I would have told them myself first — the openness is the whole point, and I stand by the talking.', description: 'No concealment; the processing is declared and you own it.', weight: { external_processing: 0.5, direct_communication: 0.2 } },
      { id: 'b', label: 'A twinge of guilt — I needed the perspective, but I see why they would want to have been asked first.', description: 'Processing needs the outside, and you feel the pull of the inside claim.', weight: { external_processing: 0.3, relational_privacy: 0.2 } },
      { id: 'c', label: 'I would be fine with them doing the same — mutual trusted voices, openly held.', description: 'Two-way external processing, framed as openly as you would want it.', weight: { external_processing: 0.5, receiving_comfort: 0.2 } },
      { id: 'd', label: 'It would bother me that it got discovered — I would rather keep my processing to myself until it is resolved.', description: 'Processing is private until finished; discovery feels like a violation of method.', weight: { external_processing: -0.5, relational_privacy: 0.3 } },
    ],
    diagnosticWeight: 1.1,
  },
  // ── Deepeners: one extra answer per thin dimension. ──
  {
    id: 'q113',
    layer: 4,
    format: 'forced_pair',
    prompt: ['When you are upset and your partner asks what is wrong — which is more truly you?'],
    options: [
      { id: 'a', label: 'I explain the logic of it first — the situation, the chain of events — and the feeling arrives in the explaining.', description: 'Analysis as the path to the feeling, not around it.', weight: { logic_emotion_integration: 0.5, listening_first: 0.2 } },
      { id: 'b', label: 'I lead with the feeling — “this hurt” — and we can look at the chain of events after it settles.', description: 'Feeling first, structure after; you know which order you need.', weight: { logic_emotion_integration: 0.4, vulnerability_safety: 0.2 } },
    ],
    diagnosticWeight: 1.0,
  },
  {
    id: 'q114',
    layer: 5,
    format: 'agreement',
    prompt: ['"In intimacy, I can tell the difference between my partner\'s want and my own — and I check when I am not sure."'],
    options: [
      { id: '1', value: 1, label: 'Not reliably — in the moment the two blur.', description: 'The blur is common and worth knowing about; attunement starts with noticing it.', weight: { intimacy_attunement: -0.5 } },
      { id: '2', label: 'Sometimes', value: 2, description: 'You catch the blur after the fact more often than during.', weight: { intimacy_attunement: -0.2 } },
      { id: '3', label: 'Half the time', value: 3, description: 'The checking happens, inconsistently.', weight: { intimacy_attunement: 0 } },
      { id: '4', label: 'Mostly', value: 4, description: 'You can usually separate the two currents, and ask when you cannot.', weight: { intimacy_attunement: 0.35, curiosity_worlds: 0.1 } },
      { id: '5', value: 5, label: 'Yes — separating the currents is half the intimacy.', description: 'Attunement as an active practice, not an assumption.', weight: { intimacy_attunement: 0.6, listening_first: 0.2 } },
    ],
  },
  {
    id: 'q115',
    layer: 5,
    format: 'agreement',
    prompt: ['"Mid-conflict, I can locate what I am feeling while it is happening — not just afterward."'],
    options: [
      { id: '1', value: 1, label: 'No — the feeling report always comes in after the argument, in debrief.', description: 'Heat blurs everything; your self-knowledge is retrospective.', weight: { conflict_engagement: -0.5 } },
      { id: '2', label: 'Rarely', value: 2, description: 'Occasionally, in the calmer stretches of an argument.', weight: { conflict_engagement: -0.2 } },
      { id: '3', label: 'Sometimes', value: 3, description: 'The locator works when the heat is moderate.', weight: { conflict_engagement: 0 } },
      { id: '4', label: 'Mostly', value: 4, description: 'You can usually name the feeling mid-heat, and it helps.', weight: { conflict_engagement: 0.35 } },
      { id: '5', value: 5, label: 'Yes — naming it mid-heat is one of my main tools.', description: 'Real-time emotional location as a conflict skill.', weight: { conflict_engagement: 0.5, direct_communication: 0.2 } },
    ],
  },
  {
    id: 'q116',
    layer: 5,
    format: 'agreement',
    prompt: ['"I have given up something large for a relationship and, looking back, I would make the same trade again."'],
    options: [
      { id: '1', value: 1, label: 'Never made one large enough to count.', description: 'No data on the large trades yet — worth noticing, not judging.', weight: { commitment_sacrifice: 0 } },
      { id: '2', value: 2, label: 'Made one, and part of me still resents the cost.', description: 'The trade happened; the books did not settle.', weight: { commitment_sacrifice: -0.4 } },
      { id: '3', value: 3, label: 'Made one, mixed — I would again, with some wincing.', description: 'The trade settled, mostly, over time.', weight: { commitment_sacrifice: 0.15 } },
      { id: '4', value: 4, label: 'Made one, and it settled cleanly.', description: 'Giving that closed its own books, proven by hindsight.', weight: { commitment_sacrifice: 0.4 } },
      { id: '5', value: 5, label: 'Yes — the trade IS the proof of what it was.', description: 'Commitment as constitutive; the cost was the point.', weight: { commitment_sacrifice: 0.6 } },
    ],
  },
  {
    id: 'q117',
    layer: 4,
    format: 'agreement',
    prompt: ['"I have specific playful things I do with a partner — bits, jokes, rituals — that I would miss if they stopped."'],
    options: [
      { id: '1', value: 1, label: 'Not really — my playfulness is more general mood than specific bits.', description: 'Play as atmosphere rather than repertoire.', weight: { positivity_play: -0.4 } },
      { id: '2', label: 'A little', value: 2, description: 'One or two, more accidental than cultivated.', weight: { positivity_play: -0.15 } },
      { id: '3', label: 'Some', value: 3, description: 'A few real ones, not a repertoire.', weight: { positivity_play: 0 } },
      { id: '4', label: 'Yes, several', value: 4, description: 'A repertoire you tend without thinking about it.', weight: { positivity_play: 0.35 } },
      { id: '5', value: 5, label: 'Deeply — the bits ARE the relationship texture.', description: 'Play as infrastructure; you know exactly which rituals you would mourn.', weight: { positivity_play: 0.6 } },
    ],
  },
  {
    id: 'q118',
    layer: 4,
    format: 'agreement',
    prompt: ['"Money disagreements are about the thing being bought as often as they are about something underneath."'],
    options: [
      { id: '1', value: 1, label: 'Always about the thing — money is just money.', description: 'Surface-level reading; the ledger never carries other freight for you.', weight: { money_coordination: 0.3 } },
      { id: '2', label: 'Usually about the thing', value: 2, description: 'Mostly the purchase itself; occasionally something else underneath.', weight: { money_coordination: 0.1 } },
      { id: '3', label: 'Half and half', value: 3, description: 'Sometimes it is the vacuum cleaner; sometimes it is what the vacuum cleaner means.', weight: { money_coordination: -0.1 } },
      { id: '4', label: 'Usually underneath', value: 4, description: 'You read money arguments as carrying other information more often than not.', weight: { money_coordination: -0.3 } },
      { id: '5', value: 5, label: 'Almost always underneath — money is the visible part of something else.', description: 'You treat money conflict as diagnostic; the purchase is the messenger.', weight: { money_coordination: -0.5, listening_first: 0.2 } },
    ],
  },
];

/**
 * Bonus (conflict-clarifying) pool. Offered after the blueprint when a
 * dimension's echo-pair agreement is low; scored like any other item once
 * answered. See domain/bonus.ts for the selection logic.
 */
export const BONUS_POOL: Question[] = [
  {
    id: 'b_receiving_comfort',
    bonusFor: 'receiving_comfort',
    layer: 6,
    format: 'scenario',
    diagnosticWeight: 1.2,
    prompt: [
      'Someone who loves you has planned an entire day around you — your favorite things, no occasion, no reason given.',
      'What runs through your head in the first thirty seconds?',
    ],
    options: [
      {
        id: 'a',
        label: 'Pure warmth — I let it land and enjoy being on the receiving end.',
        description: 'Receiving as nourishment. Nothing to pay back, nothing to manage.',
        weight: { receiving_comfort: 0.7, scorekeeping: -0.2 },
      },
      {
        id: 'b',
        label: 'Warmth with a hitch — part of me is already planning the return favor.',
        description: 'Reception opens a tab. Generous instinct, running ledger.',
        weight: { receiving_comfort: 0.15, scorekeeping: 0.4 },
      },
      {
        id: 'c',
        label: 'A flicker of discomfort — being the center of that much care feels exposed.',
        description: 'The spotlight cost: attention lands, but exposure comes with it.',
        weight: { receiving_comfort: -0.5, vulnerability_safety: -0.15 },
      },
      {
        id: 'd',
        label: 'Honest resistance — I would rather we dial it down to something ordinary.',
        description: 'Grand receiving is harder than grand giving. Worth naming which side of care is the harder one for you.',
        weight: { receiving_comfort: -0.7, care_initiation: 0.1 },
      },
    ],
  },
  {
    id: 'b_direct_communication',
    bonusFor: 'direct_communication',
    layer: 6,
    format: 'scenario',
    diagnosticWeight: 1.2,
    prompt: [
      'A friend asks why you have been distant lately. The real answer involves something they did that hurt — and they have no idea.',
      'You have one sentence before the moment closes. Which sentence is it?',
      'It always depends on the day — pick the one that\'s true more often than not, or the one whose absence you\'d feel first.',
    ],
    options: [
      {
        id: 'a',
        label: '"Honestly? Something happened a while back and I have been carrying it. Can we talk about it?"',
        description: 'Directness with the door held open — names the thing and invites repair.',
        weight: { direct_communication: 0.7, repair_orientation: 0.2 },
      },
      {
        id: 'b',
        label: '"No reason — work has been a lot."',
        description: 'Protection by misdirection. The moment closes, the weight stays.',
        weight: { direct_communication: -0.6, relational_privacy: 0.15 },
      },
      {
        id: 'c',
        label: '"Just tired." Then you bring it up weeks later, if it ever comes up.',
        description: 'Delay as regulation. Sometimes the delay is processing; sometimes it is avoidance wearing processing\'s clothes.',
        weight: { direct_communication: -0.3, repair_orientation: 0.1 },
      },
      {
        id: 'd',
        label: 'Something warm that ends the conversation without opening it.',
        description: 'Kindness as a drawbridge. The relationship stays pleasant; the subject stays buried.',
        weight: { direct_communication: -0.45, perspective_taking: 0.1 },
      },
    ],
  },
  {
    id: 'b_scorekeeping',
    bonusFor: 'scorekeeping',
    layer: 6,
    format: 'scenario',
    diagnosticWeight: 1.2,
    prompt: [
      'The mental tally in a relationship is not always about resentment — sometimes it is just arithmetic running in the background.',
      'Which of these is closest to your actual inner bookkeeping?',
    ],
    options: [
      {
        id: 'a',
        label: 'No books — I give when I can and receive when it comes, and the mix works itself out.',
        description: 'The communal setting: giving is need-responsive, not invoiced.',
        weight: { scorekeeping: -0.7, care_initiation: 0.1 },
      },
      {
        id: 'b',
        label: 'A quiet awareness of the pattern — I notice, but I never bring it up.',
        description: 'The watcher: the account runs, the mouth stays shut. Awareness without billing.',
        weight: { scorekeeping: -0.1 },
      },
      {
        id: 'c',
        label: 'An honest ledger — I keep track, and sometimes the track colors how generous I feel.',
        description: 'The ledger that bills. Fairness as an organ, turned up — with the cost named.',
        weight: { scorekeeping: 0.55 },
      },
      {
        id: 'd',
        label: 'The ledger runs, and I have learned to say so out loud before it sours.',
        description: 'Accounting with a voice — the healthiest version of keeping score.',
        weight: { scorekeeping: 0.3, direct_communication: 0.3 },
      },
    ],
  },
];

// Wave 5 — the evidence-depth wave. The sensitivity audit (scripts/sensitivity.ts)
// showed seven constructs carried by only 2–4 questions each, where one answer can
// swing the score 9–20 points (a full tier). These items double their evidence so
// their 7-tier display is earned rather than borrowed: external_processing,
// feedback_receiving, sexual_communication, conflict_engagement, intimacy_attunement,
// positivity_play, commitment_sacrifice — plus one negative-weight item for
// logic_emotion_integration, whose every other option in the bank weights it
// positively (structural floor of 70; its lower-tier prose was unreachable).
const WAVE5_QUESTIONS: Question[] = [
  {
    id: 'q123',
    layer: 4,
    format: 'agreement',
    prompt: ['"Most of what I think about a relationship only takes its real shape once I have said it out loud to someone outside it."'],
    options: [
      { id: '1', label: 'Not how I work — my thinking happens inside, on its own', value: 1, description: 'Your positions form privately; by the time you speak, your mind is already made up.', weight: { external_processing: -0.6, relational_privacy: 0.1 } },
      { id: '2', label: 'Rarely — the shape exists before the saying', value: 2, description: 'Talking it out can help, but the thinking itself is done beforehand.', weight: { external_processing: -0.3 } },
      { id: '3', label: 'Depends how tangled the thought is', value: 3, description: 'Light convictions arrive fully formed; complicated ones need a listener to take shape.', weight: { external_processing: 0 } },
      { id: '4', label: 'Often — saying it is part of thinking it', value: 4, description: 'The out-loud version is where your position sharpens, and you know it.', weight: { external_processing: 0.3 } },
      { id: '5', label: 'Almost always — the voice is how I untangle', value: 5, description: 'You genuinely cannot locate your own position on something until it has been spoken to someone.', weight: { external_processing: 0.6, relational_privacy: -0.1 } },
    ],
  },
  {
    id: 'q124',
    layer: 4,
    format: 'scenario',
    prompt: [
      'Mid-argument, you realize you are out of your depth — the fight has layers you did not see coming.',
      'What do you actually want to do?',
    ],
    options: [
      { id: 'a', label: 'Pause it, and bring in a trusted friend\'s perspective before we go further', description: 'The outside voice as a resource — declared, aimed at understanding, not at winning.', weight: { external_processing: 0.7, relational_privacy: -0.2 } },
      { id: 'b', label: 'Pause it and sit with it alone until my head is straight', description: 'Solo processing as the reset: the tangle gets your attention before it gets anyone else\'s.', weight: { external_processing: -0.4, autonomy_connection: 0.2 } },
      { id: 'c', label: 'Keep going — the tangle is ours, and we untangle it or it stays tangled', description: 'The argument itself is the work; outsourcing it would make the resolution less yours.', weight: { external_processing: -0.6, same_side_problems: 0.2 } },
      { id: 'd', label: 'Pause it, tell my partner exactly who I would want to talk to and why, and ask if they are okay with it', description: 'Processing declared is collaboration — you use the voice, but never as a hidden channel.', weight: { external_processing: 0.4, direct_communication: 0.3 } },
    ],
  },
  {
    id: 'q125',
    layer: 3,
    format: 'scenario',
    prompt: [
      'You give a presentation you cared about. A colleague — one whose opinion actually matters to you — finds one real flaw in it.',
      'The first ten minutes inside:',
    ],
    options: [
      { id: 'a', label: 'Replay the flaw on a loop; everything else about the presentation goes quiet', description: 'Criticism crowds the room: the one flaw becomes the whole verdict, and the armor never came off.', weight: { feedback_receiving: -0.6, vulnerability_safety: -0.2 } },
      { id: 'b', label: 'Argue with it internally — find the three reasons they are wrong', description: 'The case-building starts mid-sentence: defense first, hearing later.', weight: { feedback_receiving: -0.5, perspective_taking: -0.2 } },
      { id: 'c', label: 'Feel the sting, then get genuinely curious what they saw that I did not', description: 'Sting first is human; the curiosity is the tell. The flaw becomes information instead of attack.', weight: { feedback_receiving: 0.7, perspective_taking: 0.2 } },
      { id: 'd', label: 'Thank them, mean it, and ask the follow-up question on the spot', description: 'Reception so open it becomes collaboration — you harvest the flaw while it is fresh.', weight: { feedback_receiving: 0.5, curiosity_worlds: 0.3, direct_communication: 0.2 } },
    ],
  },
  {
    id: 'q126',
    layer: 3,
    format: 'agreement',
    prompt: ['"When someone I respect gives me hard feedback, my first instinct is to explain — the context, the reasons, what they are missing."'],
    options: [
      { id: '1', label: 'Never — I take it in whole first', value: 1, description: 'The hearing comes before any accounting; the whole thing lands before you respond to parts of it.', weight: { feedback_receiving: 0.7 } },
      { id: '2', label: 'Rarely', value: 2, description: 'A reflex you mostly keep in check until they have finished.', weight: { feedback_receiving: 0.35 } },
      { id: '3', label: 'Sometimes', value: 3, description: 'Depends on how exposed the feedback finds you.', weight: { feedback_receiving: 0 } },
      { id: '4', label: 'Often', value: 4, description: 'The context arrives before the point does more often than not.', weight: { feedback_receiving: -0.35, perspective_taking: -0.1 } },
      { id: '5', label: 'Almost always — the explanation arrives before I have heard the whole thing', value: 5, description: 'Defense as reflex: people learn to package anything hard for you carefully.', weight: { feedback_receiving: -0.7 } },
    ],
  },
  {
    id: 'q127',
    layer: 3,
    format: 'scenario',
    prompt: [
      'A mentor you trust tells you the thing about you that holds you back. It is half unfair — you can name the exact context they are missing.',
      'What do you do with it?',
    ],
    options: [
      { id: 'a', label: 'Weigh it fully anyway — the half-truth usually contains the whole useful part', description: 'You separate the delivery from the content and keep the content. The rarest move in the set.', weight: { feedback_receiving: 0.6, perspective_taking: 0.3 } },
      { id: 'b', label: 'Correct the record first; the useful part can wait until I am not mischaracterized', description: 'Fairness first — but the correction often eats the window in which feedback can actually land.', weight: { feedback_receiving: -0.4, direct_communication: 0.2 } },
      { id: 'c', label: 'Take it to someone who will tell me I am right', description: 'The audience as armor: you process the sting by outsourcing the verdict.', weight: { feedback_receiving: -0.6, external_processing: 0.2 } },
      { id: 'd', label: 'Sit with it for a day before deciding how much was true', description: 'Processing time as the legitimate middle: neither swallowing it nor defending against it.', weight: { feedback_receiving: 0.3, logic_emotion_integration: 0.2 } },
    ],
  },
  {
    id: 'q128',
    layer: 3,
    format: 'agreement',
    prompt: ['"In intimacy, saying what I actually want — out loud, plainly — is easy for me."'],
    options: [
      { id: '1', label: 'Not at all', value: 1, description: 'Wants stay legible only to you; a partner has to guess, and you know they are guessing.', weight: { sexual_communication: -0.6 } },
      { id: '2', label: 'Rarely', value: 2, description: 'The sayable list is short and the important things are not on it.', weight: { sexual_communication: -0.3 } },
      { id: '3', label: 'Sometimes', value: 3, description: 'Comfortable with the known; the newer territory goes unsaid.', weight: { sexual_communication: 0 } },
      { id: '4', label: 'Mostly', value: 4, description: 'Most wants are speakable; the silence around the rest is shrinking.', weight: { sexual_communication: 0.3 } },
      { id: '5', label: 'Yes — plainly is the only way I know how', value: 5, description: 'The conversation is part of the pleasure; nothing has to survive as a guess.', weight: { sexual_communication: 0.6 } },
    ],
  },
  {
    id: 'q129',
    layer: 3,
    format: 'scenario',
    prompt: [
      'Something in your intimate life has been quietly not-working for a while. Your partner has not noticed.',
      'When does it come up?',
    ],
    options: [
      { id: 'a', label: 'It does not — I would hope they eventually sense it', description: 'Waiting to be noticed: the want stays real, and stays unspeakable.', weight: { sexual_communication: -0.6, direct_communication: -0.2 } },
      { id: 'b', label: 'Only if it gets worse — why open a door that is holding', description: 'Threshold management: the conversation happens only when the cost of silence exceeds the cost of saying.', weight: { sexual_communication: -0.4 } },
      { id: 'c', label: 'At a neutral moment, gently and specifically — not in the act, not as a complaint', description: 'The raised-as-information move: the most load-bearing timing there is.', weight: { sexual_communication: 0.7, direct_communication: 0.2 } },
      { id: 'd', label: 'In the moment if it is fixable right then; otherwise at a calm time', description: 'Situational honesty: the moment is for adjustments, the calm is for architecture.', weight: { sexual_communication: 0.5, intimacy_attunement: 0.2 } },
    ],
  },
  {
    id: 'q130',
    layer: 3,
    format: 'scenario',
    prompt: [
      'A partner tells you a want of theirs you did not know — something they have been shy to bring up.',
      'Your honest first response?',
    ],
    options: [
      { id: 'a', label: 'Delight — the fact that they said it is the thing', description: 'Receptiveness as the message: the saying gets rewarded, so the next thing also gets said.', weight: { sexual_communication: 0.7, receiving_comfort: 0.2 } },
      { id: 'b', label: 'Curiosity — questions, so I actually understand it', description: 'Interest before verdict; the want becomes a shared territory instead of a test.', weight: { sexual_communication: 0.5, curiosity_worlds: 0.3 } },
      { id: 'c', label: 'A flicker of worry about what it implies, before I can get to glad', description: 'The want reads as information about you first — receptiveness arrives, but late.', weight: { sexual_communication: -0.3, vulnerability_safety: -0.2 } },
      { id: 'd', label: 'Quiet discomfort I would probably not show them', description: 'The hidden reception: the script can no longer be edited, because the editor never said anything.', weight: { sexual_communication: -0.6, vulnerability_safety: -0.2 } },
    ],
  },
  {
    id: 'q131',
    layer: 5,
    format: 'agreement',
    prompt: ['"When a disagreement gets heated, I get more focused, not less."'],
    options: [
      { id: '1', label: 'The opposite — heat scatters me entirely', value: 1, description: 'Flooding arrives fast: past a certain volume, the thinking part of you leaves the room.', weight: { conflict_engagement: -0.6, vulnerability_safety: -0.1 } },
      { id: '2', label: 'I get less focused', value: 2, description: 'The heat costs you precision before it costs you anything else.', weight: { conflict_engagement: -0.3 } },
      { id: '3', label: 'About the same', value: 3, description: 'Volume does not change your clarity much either way.', weight: { conflict_engagement: 0 } },
      { id: '4', label: 'Somewhat more focused', value: 4, description: 'Heat sharpens you up to a point — and you know roughly where that point is.', weight: { conflict_engagement: 0.3 } },
      { id: '5', label: 'Much more focused — heat is where I am sharpest', value: 5, description: 'Full-voice engagement without losing the thread; arguments become places you work.', weight: { conflict_engagement: 0.6 } },
    ],
  },
  {
    id: 'q132',
    layer: 5,
    format: 'scenario',
    prompt: [
      'An argument over something real is picking up volume. Twenty minutes in, you are both at full voice and nothing is landing.',
      'What is true of you in that moment?',
    ],
    options: [
      { id: 'a', label: 'I am sharper — the heat focuses me, and I want to see it through', description: 'Durability under heat: you can stay in the work at full volume without losing the thread.', weight: { conflict_engagement: 0.7 } },
      { id: 'b', label: 'I am reaching for the brake — naming the temperature, slowing it down', description: 'The brake-reaching reflex: a real skill, and it scores as lower heat-tolerance because it is.', weight: { conflict_engagement: -0.4, repair_orientation: 0.2, listening_first: 0.2 } },
      { id: 'c', label: 'I am gone — not walking out, but the lights are off behind my eyes', description: 'Shutdown: present in the room, absent from the argument. The most expensive exit there is.', weight: { conflict_engagement: -0.6, vulnerability_safety: -0.2 } },
      { id: 'd', label: 'Still in it, but only barely — one more round and I would be gone too', description: 'The edge of flooding: your engagement is real and rationed.', weight: { conflict_engagement: 0.2 } },
    ],
  },
  {
    id: 'q133',
    layer: 2,
    format: 'scenario',
    prompt: [
      'You reach for them; they are not in the mood — no words, just a slight turning away.',
      'What happens in you in the next minute?',
    ],
    options: [
      { id: 'a', label: 'I notice it immediately and adjust — the reach changes, the closeness does not have to die', description: 'Attunement without verdict: the signal is received, and it is not taken as a ruling on you.', weight: { intimacy_attunement: 0.7, receiving_comfort: 0.1 } },
      { id: 'b', label: 'I notice a beat too late — I am still reaching while they have already answered', description: 'Half-speed tracking: the signal lands, just not in time to matter to the moment.', weight: { intimacy_attunement: -0.2 } },
      { id: 'c', label: 'I miss it in the moment and replay it later, reading it as something about me', description: 'Missed signal plus personalization: attunement arrives at 2am, wearing doubt.', weight: { intimacy_attunement: -0.5, reassurance_security: 0.3 } },
      { id: 'd', label: 'I probably would not register it at all until they said something', description: 'The unworded channel is mostly closed: what is not said aloud does not reach you.', weight: { intimacy_attunement: -0.6 } },
    ],
  },
  {
    id: 'q134',
    layer: 2,
    format: 'agreement',
    prompt: ['"I can tell when a partner\'s quiet means something is wrong — and when it just means they are resting."'],
    options: [
      { id: '1', label: 'No — quiet is ambiguous, and it eats at me', value: 1, description: 'Ambiguity reads as threat: every silence has to be resolved before you can settle.', weight: { intimacy_attunement: -0.6, reassurance_security: 0.2 } },
      { id: '2', label: 'Not usually — I guess, and my guesses skew worried', value: 2, description: 'The unworded channel is mostly closed; you infer, and the inferences lean anxious.', weight: { intimacy_attunement: -0.3 } },
      { id: '3', label: 'Sometimes — depends on the day and how known they are', value: 3, description: 'Discrimination that comes and goes: good weeks read clearly, strained ones blur.', weight: { intimacy_attunement: 0 } },
      { id: '4', label: 'Usually — the misreads are exceptions I catch', value: 4, description: 'The channel mostly works: wrong-quiet and resting-quiet feel different to you.', weight: { intimacy_attunement: 0.3 } },
      { id: '5', label: 'Yes — their weather is legible to me', value: 5, description: 'Reading the room in the dark: drift, hesitation, and rest are distinguishable signals.', weight: { intimacy_attunement: 0.6 } },
    ],
  },
  {
    id: 'q135',
    layer: 2,
    format: 'scenario',
    prompt: [
      'A completely flat Tuesday evening. Nothing is wrong — there is just nothing.',
      'What do you catch yourself doing?',
    ],
    options: [
      { id: 'a', label: 'Inventing something — a walk with a destination, a ridiculous movie, a project nobody planned', description: 'Flat time as material: the invention reflex that treats lightness as maintenance you enjoy.', weight: { positivity_play: 0.7, affection_daily: 0.1 } },
      { id: 'b', label: 'Content to let it be flat — not every evening owes anyone an event', description: 'Genuine comfort with quiet: rest is rest, not a problem to solve.', weight: { positivity_play: -0.3, autonomy_connection: 0.2 } },
      { id: 'c', label: 'Wishing one of us would invent something, and being a little resentful neither does', description: 'Passive resentment: the want exists, waits, and quietly bills.', weight: { positivity_play: -0.4, scorekeeping: 0.2 } },
      { id: 'd', label: 'Making the flatness itself pleasant — food, blankets, parallel couch time — without needing it to be more', description: 'Warmth without invention: comfortable and content, but not what builds the shared joke library.', weight: { positivity_play: 0.2, affection_daily: 0.3 } },
    ],
  },
  {
    id: 'q136',
    layer: 2,
    format: 'agreement',
    prompt: ['"Inside a relationship, silliness — the deliberately dumb voice, the running joke, the bit — is a need, not a garnish."'],
    options: [
      { id: '1', label: 'Garnish — nice when it happens', value: 1, description: 'Play is decoration: pleasant, optional, and the first thing a busy season eats.', weight: { positivity_play: -0.6 } },
      { id: '2', label: 'Mostly garnish', value: 2, description: 'You enjoy the bit when it arrives; you do not miss it when it does not.', weight: { positivity_play: -0.3 } },
      { id: '3', label: 'Somewhere in between', value: 3, description: 'You would notice its absence within a season, not within a week.', weight: { positivity_play: 0 } },
      { id: '4', label: 'Mostly a need', value: 4, description: 'A week without the bit registers; you would be the one to restart it.', weight: { positivity_play: 0.3 } },
      { id: '5', label: 'A need — the shared joke is part of the architecture', value: 5, description: 'Silliness as infrastructure: it is how the relationship stays light enough to be safe.', weight: { positivity_play: 0.6 } },
    ],
  },
  {
    id: 'q137',
    layer: 1,
    format: 'scenario',
    prompt: [
      'Someone you love is crying in front of you — genuinely crying.',
      'What is running the first minute?',
    ],
    options: [
      { id: 'a', label: 'Feeling first — I am in it with them before any part of me starts figuring', description: 'Feeling-led presence: the joining comes first, and it is genuine.', weight: { logic_emotion_integration: 0.7, listening_first: 0.2 } },
      { id: 'b', label: 'Both at once — I am with them AND a quiet part of me is mapping what is actually wrong', description: 'The integrated stance: analysis that carries feeling, feeling that carries structure.', weight: { logic_emotion_integration: 0.6, perspective_taking: 0.2 } },
      { id: 'c', label: 'Figuring first — I need the structure before I can be any real use to them', description: 'Structure as prerequisite: you can be present, but only after the problem has a shape.', weight: { logic_emotion_integration: -0.3, listening_first: -0.2 } },
      { id: 'd', label: 'Almost pure figuring — the feeling is theirs; my job is the solution', description: 'Analysis as distance: the feeling is treated as the problem instead of the context.', weight: { logic_emotion_integration: -0.7, listening_first: -0.3 } },
    ],
  },
  {
    id: 'q138',
    layer: 3,
    format: 'agreement',
    prompt: ['"I almost always understand my own feelings by analyzing them — and I trust the analysis more than the feeling."'],
    options: [
      { id: '1', label: 'No — the feeling is the data; analysis is the footnotes', value: 1, description: 'Feeling-led self-knowledge: you trust what arises, and think about it afterwards.', weight: { logic_emotion_integration: 0.4 } },
      { id: '2', label: 'I use both, roughly equally', value: 2, description: 'The integrated default: neither instrument outranks the other.', weight: { logic_emotion_integration: 0.5 } },
      { id: '3', label: 'Slightly the analysis', value: 3, description: 'A mild tilt: you check the feeling against the map before trusting the territory.', weight: { logic_emotion_integration: 0.1 } },
      { id: '4', label: 'Mostly the analysis', value: 4, description: 'The map outranks the territory more often than not.', weight: { logic_emotion_integration: -0.2 } },
      { id: '5', label: 'Almost entirely the analysis — feelings are noisy inputs', value: 5, description: 'The dis-integration pole: the feeling is treated as noise, and noise does not get listened to.', weight: { logic_emotion_integration: -0.6, listening_first: -0.1 } },
    ],
  },
  {
    id: 'q139',
    layer: 5,
    format: 'scenario',
    prompt: [
      'To be with them, you would have to give up something real — a city you love, a career shape, a version of your life you had finished building.',
      'After the deciding:',
    ],
    options: [
      { id: 'a', label: 'It does not feel like giving something up — the choosing is the point, and the book closes', description: 'The settled form: the giving itself settles the question, and no audit runs afterwards.', weight: { commitment_sacrifice: 0.7 } },
      { id: 'b', label: 'I give it, and I would be lying if I said I never look back at it', description: 'The honest ledger: real commitment with a quiet running total you mostly do not bill.', weight: { commitment_sacrifice: 0.2, scorekeeping: 0.2 } },
      { id: 'c', label: 'I would need to know it was noticed — a sacrifice unseen becomes a debt uncollected', description: 'Recognition as the condition: the giving is real, and contingent on being seen as giving.', weight: { commitment_sacrifice: -0.4, scorekeeping: 0.4 } },
      { id: 'd', label: 'I would shrink from it — the life I built is not a bargaining chip', description: 'Self-preservation as the ceiling: commitment stops where the built life starts.', weight: { commitment_sacrifice: -0.6, autonomy_connection: 0.3 } },
    ],
  },
  {
    id: 'q140',
    layer: 5,
    format: 'agreement',
    prompt: ['"When I commit to someone, I stop running the arithmetic — what I gave up stops being a thing I count."'],
    options: [
      { id: '1', label: 'No — the arithmetic runs, and it is honest to say so', value: 1, description: 'The visible ledger: commitment with accounting attached, and you know it.', weight: { commitment_sacrifice: -0.6 } },
      { id: '2', label: 'It slows down but never fully stops', value: 2, description: 'A quiet audit in the background: low volume, always on.', weight: { commitment_sacrifice: -0.3 } },
      { id: '3', label: 'It depends what I gave up', value: 3, description: 'Selective accounting: some costs close their books, others stay open for years.', weight: { commitment_sacrifice: 0 } },
      { id: '4', label: 'Mostly stops', value: 4, description: 'The books close for most things; the big ones take longer to settle.', weight: { commitment_sacrifice: 0.35 } },
      { id: '5', label: 'Yes — the giving itself settles the question', value: 5, description: 'Investment that closes its own books: a way of being, not a running cost-benefit.', weight: { commitment_sacrifice: 0.7 } },
    ],
  },
];

export const QUESTIONS: Question[] = [...CORE_QUESTIONS, ...WAVE4_QUESTIONS, ...WAVE5_QUESTIONS];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);
