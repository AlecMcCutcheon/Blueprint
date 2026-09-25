# Pattern Catalog

The interpretation layer, formalized: what combination of dimensions
produces each passage, what relationship type it represents, and how
strong the evidence must be before it is said. Generated from source —
regenerate with `npx esbuild scripts/catalog.ts --bundle --platform=node --format=cjs --outfile=/tmp/catalog.cjs && node /tmp/catalog.cjs` after any change.

Rendered: 2026-09-25

## Scales

- 7 tiers: vlow < 22 ≤ low < 35 ≤ mlow < 48 ≤ mid < 62 ≤ mhigh < 75 ≤ high < 88 ≤ vhigh
- Evidence rule (patterns): confidence from the RAW score margin past the crossed boundary — ≥7 → 0.92, ≥4 → 0.85, ≥2 → 0.78, else 0.68; capped at 0.72 within 3 points of a boundary (soft); −0.06/−0.12 on partial runs; < 0.55 never renders; any unmeasured input drops the pattern
- Selection: ranked confidence × priority; 3 headline max (Crosscurrents), 2 per placement spot, 1 tension / 2 augments per section; dedup drops patterns whose combination an interplay passage owns, whose frame echoes a section heading, or whose opener stutters on the tier paragraph
- Gap conditions additionally require the leading dimension to clear 55 raw (a gap from a non-high base is not a finding)

## Derived patterns (36)

### space_and_certainty

- **Type:** synthesis · **Priority:** 95
- **Trigger:** Independence Within Closeness tier mhigh+ (≥62 raw) AND Reassurance & Security tier mhigh+ (≥62 raw)
- **Placement:** Crosscurrents (headline)
- **Frame:** Space and certainty are different things for you.
- **Claims:** “Your answers hold two things side by side that are often mistaken for a contradiction: real comfort with a partner having their own life, and a real sensitivity to not knowing what that life means while it happens. Distance itself appears to be affordable to you. It is the unexplained part that costs — the shift you can see but cannot read. This is not the pattern of someone who needs constant company; it is the pattern of someone who needs enough information to know what reality they are standing in. A partner who narrates their distance ("work is eating me, it is not you") buys enormous steadiness cheaply.”

### noticed_not_managing

- **Type:** synthesis · **Priority:** 86
- **Trigger:** Instinct to Care tier mid+ (≥48 raw) AND Reassurance & Security tier mid+ (≥48 raw) AND Directness Without Games tier mid+ (≥48 raw)
- **Placement:** Crosscurrents (headline)
- **Frame:** The want underneath: to be noticed without being managed.
- **Claims:** “Three scores point at the same appetite from different directions. You can say what you need — you believe asking is how love stays honest. You also know people are not mind-readers, and you mean it. And yet the care that lands hardest in your answers is the kind that arrived before the asking. That is not a demand for telepathy. It is a demand for attentiveness: "tell me what you need" is the requirement, "I noticed before you had to" is the reward. The practical translation: a partner who asks is doing it right, and a partner who occasionally notices first is doing something extra — and you will feel the difference even if you never name it.”

### team_of_two

- **Type:** synthesis · **Priority:** 84
- **Trigger:** Independence Within Closeness tier mhigh+ (≥62 raw) AND Same Side of Problems tier mhigh+ (≥62 raw)
- **Placement:** Crosscurrents (headline)
- **Frame:** Own orbits, one shared gravity.
- **Claims:** “You want considerable space for your own life, and you want problems faced as a team rather than assigned to a person. Those are not in tension — together they describe a specific architecture: two whole people who deliberately operate as one unit when it matters. Your partner can have their own weekend, their own crisis, their own ambitions, without the relationship reading it as rejection. But when something genuinely touches the shared life, you want the two of you on the same side of it. The failure mode to watch is not the independence — it is the drift where separate lives stop reporting to each other.”

### shared_reality

- **Type:** synthesis · **Priority:** 82
- **Trigger:** Directness Without Games tier mid+ (≥48 raw) AND Benefit of the Doubt tier mid+ (≥48 raw)
- **Placement:** Crosscurrents (headline)
- **Frame:** Honesty as shared reality, not as weapon or ritual.
- **Claims:** “Your directness and your benefit-of-the-doubt belong to the same project: keeping the two of you standing in the same reality. You say the true thing while it is small, and you give other people room to explain themselves before you conclude — which means information stays flowing in both directions. In your model, honesty is not bluntness and charity is not denial; they are two halves of not-making-each-other-guess. The tell that this is load-bearing for you: concealment bothers you more than disagreement. A partner can fight with you and be fine; a partner who curates what you know is harder to forgive.”

### separate_worlds_curious

- **Type:** synthesis · **Priority:** 78
- **Trigger:** Independence Within Closeness tier mhigh+ (≥62 raw) AND Curiosity for Each Other tier mhigh+ (≥62 raw)
- **Placement:** Crosscurrents (headline)
- **Frame:** Compatibility through curiosity, not sameness.
- **Claims:** “You do not appear to want the same life as your person — you want to be interested in each other's lives. Wide personal space on one side, genuine appetite for their inner world on the other: the combination reads less like "couple" and more like two people who keep choosing to visit each other. This is a different compatibility model from shared-everything, and it fails differently: not from merging, but from drifting into polite strangers who no longer tour each other's worlds. The maintenance is small and specific — keep being invited in, keep inviting.”

### interpreting_room

- **Type:** reinterpret · **Priority:** 90
- **Trigger:** Benefit of the Doubt tier mhigh+ (≥62 raw) AND Reassurance & Security tier mhigh+ (≥62 raw)
- **Placement:** understanding section, after Benefit of the Doubt
- **Frame:** You give interpretive room easily; patience for not-knowing is thinner.
- **Claims:** “But patience for interpreting people is not the same as comfort with not-knowing. What you are generous with is interpretation; what you find hard is the interval where there is nothing yet to interpret. Space with a story attached is fine. Silence with no story is where your imagination starts filling the blank. The distinction matters, because the fix is not reassurance — it is information, delivered before you have to ask.”

### witness_and_carry

- **Type:** reinterpret · **Priority:** 76
- **Trigger:** Listening Before Solving tier mhigh+ (≥62 raw) AND Shared Home & Invisible Effort tier mid+ (≥48 raw)
- **Placement:** understanding section, after Listening Before Solving
- **Frame:** You witness first, then lighten the load — in that order.
- **Claims:** “Your support has two stages, and the order is the finding: first you hear the story out, then you take something off the plate. You are not the fixer who interrupts with solutions, and not the pure witness who leaves the burden untouched — the listening is real AND the load gets lighter. For you, support appears to work best in that order: understand what someone is carrying first, then help make the load lighter.”

### problem_direct

- **Type:** reinterpret · **Priority:** 76
- **Trigger:** Directness Without Games tier mid+ (≥48 raw) AND Vulnerability as Safety tier mlow− (≤47 raw)
- **Placement:** communication section, after Directness Without Games
- **Frame:** Direct about problems; less direct about exposure.
- **Claims:** “Your directness has a shape worth naming precisely. Problems, logistics, dissatisfaction — you will say those plainly, and sooner than most. What costs more is the sentence that exposes you: the "I was hurt because I wanted to matter to you" kind. So the useful dimension is not direct versus indirect — it is problem-directness versus vulnerability-directness, and yours are not the same size. A partner should know the plain feedback is safe to receive; the quieter work is making it safe for you to be the one exposed.”

### open_inside_sealed_out

- **Type:** reinterpret · **Priority:** 78
- **Trigger:** Vulnerability as Safety tier mhigh+ (≥62 raw) AND Kept Between the Two of You tier mhigh+ (≥62 raw)
- **Placement:** safety section, after Vulnerability as Safety
- **Frame:** Sealed from the world, wide open inside it.
- **Claims:** “Your openness and your privacy are not opposites — they are the same boundary drawn correctly. Inside the two-person room you are unusually willing to be seen; outside it, the relationship's contents are not public property. The failure mode is only one: when the person inside the room stops knowing they are the only one in it. As long as that is clear, this is one of the more protective architectures a relationship can have.”

### touch_as_weather

- **Type:** reinterpret · **Priority:** 82
- **Trigger:** Everyday Affection tier mhigh+ (≥62 raw) AND Talking About Intimacy tier mlow− (≤47 raw)
- **Placement:** closeness section, after Everyday Affection
- **Frame:** Ambient affection is fluent; the explicit conversation stays quiet.
- **Claims:** “Your touch runs as ambient weather — constant, unforced, its own language. But the everyday fluency and the explicit fluency are different channels, and your answers say the second one carries less traffic. Lots of physical affection can coexist with a mostly-undrawn map of desire. That is a coherent combination, not a contradiction — but it means a partner may assume the touch is the whole conversation. Worth telling them it is the greeting, not the agenda.”

### competent_and_carried

- **Type:** reinterpret · **Priority:** 92
- **Trigger:** Shared Home & Invisible Effort tier mhigh+ (≥62 raw) AND Instinct to Care tier mhigh+ (≥62 raw)
- **Placement:** hard_days section, after Shared Home & Invisible Effort
- **Frame:** The invisible load and the want to be seen carrying it are the same subject.
- **Claims:** “Two strong scores point at one quiet risk. You notice what needs doing, and you do it — much of it before anyone knows it was done. That competence is a gift, but it has a known cost: work that goes unseen reads, to the person doing it, as work that does not count. People who carry this way usually also want the carrying to be seen — worth checking whether that is true of you. If it is, the warning is not "carry less": self-sufficiency can mute the very recognition you want. "I've got this" is true, and it can still cost you the acknowledgment that would make the having-it worth more.”

### independent_but_connected

- **Type:** synthesis · **Priority:** 84
- **Trigger:** Independence Within Closeness tier mhigh+ (≥62 raw) AND Everyday Affection tier mhigh+ (≥62 raw)
- **Placement:** Crosscurrents (headline)
- **Frame:** Independence here doesn't mean distance — the touch points the other way.
- **Claims:** “Read together, your independence and your affection change each other's meaning: you want wide personal space AND frequent physical closeness, which means the independence was never a request for distance. The combination works when closeness is dense in the time you are together rather than constant across the week — separate orbits, high contact. The risk is only when a partner reads your space as cooling; your touch says otherwise, and it is worth saying out loud that both are true at once.”

### understanding_over_wanting

- **Type:** augment · **Priority:** 82
- **Trigger:** Being Wanted tier mid+ (≥48 raw) AND Listening Before Solving leads Being Wanted by ≥1 raw points (and itself ≥55)
- **Placement:** closeness section, after Being Wanted
- **Frame:** Wanting matters to you — but forced to choose, you kept being understood.
- **Claims:** “One forced choice in your answers settles the hierarchy: offered understanding or being deeply wanted, you kept being understood — even though wanting to be wanted runs hot in everything else you chose. That ordering matters. Physical affection and desire are your ambient languages, but the definition of being known, for you, is someone who gets how your mind works. A relationship high on touch and low on understanding would starve you differently than the reverse.”

### clarity_over_reassurance

- **Type:** reinterpret · **Priority:** 86
- **Trigger:** Reassurance & Security tier mid+ (≥48 raw) AND Directness Without Games tier mid+ (≥48 raw)
- **Placement:** safety section, after Reassurance & Security
- **Frame:** Not more reassurance — better information.
- **Claims:** “Your reassurance need is real, and your answers are precise about what would actually meet it: not repeated comforting, but proportionate, reality-based information — "I'm having a bad day; it isn't about you" lands where ten "are we sure?"s would not. You even ask what reassurance looks like for someone rather than guessing, which is exactly the right instinct. And you know the flip side from the inside: a partner who needs constant reassuring would exhaust you — which is why what you want to be met with is information, not volume. Clarity, not more.”

### bedroom_vulnerability_cost

- **Type:** reinterpret · **Priority:** 84
- **Trigger:** Talking About Intimacy tier mlow− (≤47 raw) AND Directness Without Games tier mid+ (≥48 raw)
- **Placement:** closeness section, after Talking About Intimacy
- **Frame:** Direct in every other room — which is what makes the quiet here meaningful.
- **Claims:** “Your plain speech is structural everywhere else, so the quieter register in this one is not a communication deficit — it is a vulnerability cost specific to desire. The words exist; the risk is what they reveal. That makes this the one channel where a partner's patience is worth more than their questions: the map gets drawn when drawing it feels safe, not when it is requested.”

### generous_ledger

- **Type:** tension · **Priority:** 88
- **Trigger:** Instinct to Care tier mid+ (≥48 raw) AND Care Without Scorekeeping tier mlow− (≤47 raw)
- **Placement:** reciprocity section, after Care Without Scorekeeping
- **Frame:** You give readily — and your fairness clock runs on weeks, not years.
- **Claims:** “You move first for people, and your fairness tracking runs close to the surface: an unreciprocated stretch registers within weeks, not months. That pairing has a real upside — imbalance rarely compounds on you silently, because you surface it while it is still small. The watch-item is how the tracking reads from the outside: a partner on a longer horizon can experience quick noticing as an invoice. Tell them your clock runs on weeks because you would rather name a small thing than bank a resentment — that reframe turns the audit into care.”

### givers_asymmetry

- **Type:** tension · **Priority:** 80
- **Trigger:** Instinct to Care tier mid+ (≥48 raw) AND Receiving Care tier mlow− (≤47 raw)
- **Placement:** reciprocity section, after Receiving Care
- **Frame:** The giver's asymmetry: moving first is easy; letting care land is not.
- **Claims:** “You move first for everyone, and wave off the same when it is offered back. The imbalance is not generosity running out — it is the receiving half still practicing. Left alone, this pattern quietly starves the people around you: they cannot feed you, so they learn you do not need feeding, and the relationship tilts. Letting care land is a skill, and it is the one your people are most quietly asking you to learn.”

### fast_conclusions_anxious

- **Type:** tension · **Priority:** 70
- **Trigger:** Benefit of the Doubt tier mlow− (≤47 raw) AND Reassurance & Security tier mhigh+ (≥62 raw)
- **Placement:** understanding section, after Benefit of the Doubt
- **Frame:** The conclusion arrives faster than the clarity does.
- **Claims:** “Two scores compound in a way worth knowing about. Ambiguity already sits uncomfortably with you — and your interpretation engine moves fast, which means the blank gets filled quickly, and the fill is not always charitable. Unexplained distance tends to become a story before anyone has told you the true one. The lever is small: build the habit of asking one question before believing the first conclusion. Not because the conclusions are always wrong — because they arrive too early to be checked.”

### repair_the_why

- **Type:** tension · **Priority:** 68
- **Trigger:** Coming Back to Repair tier mid+ (≥48 raw) AND Vulnerability as Safety tier mlow− (≤47 raw)
- **Placement:** hard_days section, after Coming Back to Repair
- **Frame:** You return quickly — the why sometimes stays home.
- **Claims:** “The return is fast: you come back after conflict, reliably, before things set. But your answers hint the return can outrun the accounting — repair covers the distance without always naming the cause. "We're okay" is real, and it can also be a door closing gently on a subject that still had weight. The upgrade is not more apology; it is letting one repair include the sentence about what actually happened, even when that sentence exposes you.”

### repair_only_giver

- **Type:** tension · **Priority:** 70
- **Trigger:** In the Middle of Disagreement tier mlow− (≤47 raw) AND Coming Back to Repair tier mid+ (≥48 raw)
- **Placement:** hard_days section, after In the Middle of Disagreement
- **Frame:** Storms and returns: you go quiet mid-conflict, and you always come back.
- **Claims:** “Mid-argument you go somewhere quieter — heat narrows you, and the disagreement can resolve by forfeit. But you reliably return. Partners learn to read the pattern: the withdrawal is temporary, the return is certain. It is a workable architecture, with one condition — the person waiting has to know it is temporary. Telling them, once, calmly, outside of any argument, is what converts a confusing pattern into a trusted one.”

### listening_without_celebrating

- **Type:** tension · **Priority:** 72
- **Trigger:** Listening Before Solving tier mid+ (≥48 raw) AND Showing Up for Good News tier mlow− (≤47 raw)
- **Placement:** understanding section, after Showing Up for Good News
- **Frame:** You make real room for what goes wrong — and far less for what goes right.
- **Claims:** “There is an asymmetry worth naming: you make real room for the people you love when something goes wrong — and far less when something goes right. Both are attention; only one of them is celebration. People notice this asymmetry faster than you would think: they learn their crises have a landing place and their wins do not. The repair is small and strange: treat good news like distress, as something worth stopping for.”

### sealed_ledgers

- **Type:** tension · **Priority:** 66
- **Trigger:** Care Without Scorekeeping tier mlow− (≤47 raw) AND Money as Teamwork tier mlow− (≤47 raw)
- **Placement:** independence section, after Money as Teamwork
- **Frame:** The audit shows up in two ledgers — care and money.
- **Claims:** “The accounting reflex appears in two places at once: reciprocity and spending. When the same auditor wakes in both ledgers, it is rarely about the favor or the purchase — it is about how safe the books themselves feel. Worth asking what would have to be true for the auditing to relax, because the answer is usually about control and predictability, not arithmetic.”

### first_telling_intimacy

- **Type:** augment · **Priority:** 74
- **Trigger:** Showing Up for Good News tier mid+ (≥48 raw) AND Curiosity for Each Other tier mid+ (≥48 raw)
- **Placement:** understanding section, after Showing Up for Good News
- **Frame:** Good news has a full room in your answers.
- **Claims:** “The compounding effect is worth naming on its own: because your celebrating is also curious, joy told to you tends to grow a second life — the win becomes a conversation, the conversation becomes an invitation, and the person learns their happiness has somewhere to go. That combination could make you someone people naturally want to bring their good news to.”

### play_want_loop

- **Type:** augment · **Priority:** 68
- **Trigger:** Cultivating Lightness & Play tier mid+ (≥48 raw) AND Being Wanted tier mid+ (≥48 raw)
- **Placement:** closeness section, after Cultivating Lightness & Play
- **Frame:** Play and want feed each other in your answers.
- **Claims:** “The couple that laughs together stays charged — lightness keeps attraction unserious enough to be safe, and attraction keeps the playfulness pointed at each other. Your answers suggest you run on that loop naturally. The maintenance implication is pleasant but real: the laughter is not a luxury beside the wanting; it is one of the things feeding it.”

### agency_preserving

- **Type:** augment · **Priority:** 72
- **Trigger:** Independence Within Closeness tier mhigh+ (≥62 raw) AND Instinct to Care tier mid+ (≥48 raw)
- **Placement:** independence section, after Independence Within Closeness
- **Frame:** Care that expands your life lands; care that runs it does not.
- **Claims:** “You give and receive a lot of anticipatory care, and you also hold real ground for your own life — which together draw a clean line: care that expands the life is welcome; care that quietly takes over its operation is not. Planning done as affection reads as love. Planning done as management reads as removal. Most people never articulate this line even to themselves; having it crisp makes it possible to tell a partner exactly where it runs.”

### reciprocity_horizon

- **Type:** augment · **Priority:** 80
- **Trigger:** Care Without Scorekeeping tier mid+ (≥48 raw) AND Instinct to Care tier mid+ (≥48 raw)
- **Placement:** reciprocity section, after Care Without Scorekeeping
- **Frame:** Your fairness horizon is long — the years balance, not the weeks.
- **Claims:** “Your generosity runs on a long ledger: individual gestures are not billed, seasons of imbalance are expected to bend back, and the accounting that matters happens at the scale of years. That is the communal form of fairness — rarer than people claim. Its one failure mode is silent: because every individual imbalance is explainable, a chronic one can normalize before you ever say it. The long horizon still needs an occasional voice — name the pattern when it becomes a season, not a history.”

### competence_transparency

- **Type:** tension · **Priority:** 76
- **Trigger:** Shared Home & Invisible Effort tier mid+ (≥48 raw) AND Instinct to Care tier mid+ (≥48 raw)
- **Placement:** hard_days section, after Shared Home & Invisible Effort
- **Frame:** You bring plans, not problems — which protects them and excludes them at once.
- **Claims:** “Your instinct under load is to work it through alone first and arrive with the plan — competence offered as care, sparing them the raw worry. The cost hides inside the kindness: a partner who only ever sees the finished plan cannot participate in the decision, only ratify it. The upgrade is small: bring the fork instead of the conclusion — "here is what I found, here is where I am leaning, where do you see it differently." Letting someone into the unsolved version is its own form of intimacy.”

### privacy_outward_only

- **Type:** augment · **Priority:** 72
- **Trigger:** Kept Between the Two of You tier mid+ (≥48 raw)
- **Placement:** privacy section, after Kept Between the Two of You
- **Frame:** Your privacy wall faces outward only.
- **Claims:** “The boundary in your answers protects the two-person room from the world — it does not seal the room off from itself. The violation that stings is not a friend hearing too much; it is learning something about your person late, through someone else. Which makes the rule simple to state: a partner telling nobody is not the same as telling you first. Your privacy stance is a claim about audiences, never a license for distance inside.”

### givers_gap_raw

- **Type:** tension · **Priority:** 88 · **Supersedes:** `givers_asymmetry`
- **Trigger:** Instinct to Care leads Receiving Care by ≥20 raw points (and itself ≥55)
- **Placement:** reciprocity section, after Receiving Care
- **Frame:** The daylight between your giving and your receiving is wide enough to measure.
- **Claims:** “The gap is not a mood — it is a measured distance between how far your care runs out and how far it lets itself be run to. You give well past the point where you stop receiving; care offered back has to get past a debt-check your own giving never faces. This is the pattern that quietly exhausts the people who love you: they cannot feed you, so they learn to stop offering. The practice is unglamorous and specific — once a week, let something land without repaying it, and notice what the debt-check actually says.”

### bedroom_directness_gap

- **Type:** reinterpret · **Priority:** 84 · **Supersedes:** `bedroom_vulnerability_cost`
- **Trigger:** Directness Without Games leads Talking About Intimacy by ≥20 raw points (and itself ≥55)
- **Placement:** closeness section, after Talking About Intimacy
- **Frame:** Direct in every other room — which is what makes the quiet here meaningful.
- **Claims:** “The distance between your plain speech everywhere else and your quieter register here is not a communication deficit — it is a vulnerability cost specific to desire. The words exist; the risk is what they reveal. That makes this the one channel where a partner's patience is worth more than their questions: the map gets drawn when drawing it feels safe, not when it is requested.”

### certainty_gap

- **Type:** tension · **Priority:** 70 · **Supersedes:** `fast_conclusions_anxious`
- **Trigger:** Reassurance & Security leads Benefit of the Doubt by ≥15 raw points (and itself ≥55)
- **Placement:** understanding section, after Benefit of the Doubt
- **Frame:** The checking runs measurably ahead of the charity.
- **Claims:** “Your need for emotional information leads your benefit-of-the-doubt by a real margin — which means when ambiguity hits, the story-arriving machinery gets there before the charitable pass does. Unexplained distance tends to become a conclusion before anyone has told you the true one. The lever is small and repeatable: one question, asked before the first conclusion is believed. Not because the conclusions are always wrong — because they arrive too early to have been checked.”

### space_over_touch

- **Type:** augment · **Priority:** 66
- **Trigger:** Independence Within Closeness leads Everyday Affection by ≥25 raw points (and itself ≥55)
- **Placement:** independence section, after Independence Within Closeness
- **Frame:** Space leads touch by a wide margin in your answers.
- **Claims:** “The distance between how much room you need and how much ambient contact you want is wide — your architecture leans deliberately toward the spacious end: closeness at chosen temperatures, contact that arrives as event rather than weather. None of that is coldness; the measurement gives the priority order, not the absence of warmth. Worth saying plainly to a high-touch partner: your quiet is design, not withdrawal.”

### touch_over_space

- **Type:** augment · **Priority:** 66
- **Trigger:** Everyday Affection leads Independence Within Closeness by ≥25 raw points (and itself ≥55)
- **Placement:** closeness section, after Everyday Affection
- **Frame:** Touch leads space by a wide margin in your answers.
- **Claims:** “The distance between how much ambient contact you want and how much room you need is wide — your architecture leans toward the dense end: frequent touch, low distance, closeness as the background state rather than a scheduled event. Worth saying plainly to a space-heavy partner: your reach is design, not neediness — and their separation is likely design too, not cooling.”

### carry_into_money

- **Type:** augment · **Priority:** 78
- **Trigger:** Willingness to Carry & Be Carried ≥65 raw AND Money as Teamwork ≥60 raw
- **Placement:** independence section, after Willingness to Carry & Be Carried
- **Frame:** The way you back people extends to the ledger the two of you share.
- **Claims:** “Two scores read together: the way you back people and the way shared money runs both come from the same trust. The willingness to carry is not rhetorical — it extends to the shared ledger, and that is the pairing that makes big joint gambles survivable. The watch-item is the reverse door: make sure the same lack of arithmetic applies to what a partner wants to carry for you.”

### appreciation_as_identity

- **Type:** tension · **Priority:** 78
- **Trigger:** Receiving Care leads Care Without Scorekeeping by ≥12 raw points (and itself ≥55) AND Receiving Care ≥65 raw AND Instinct to Care ≥55 raw
- **Placement:** reciprocity section, after Receiving Care
- **Frame:** Verbal appreciation is not a preference for you — it is identifying.
- **Claims:** “There is a specific hunger the receiving scores cannot see, because it is not about volume: praise lands somewhere deeper in you than merely pleasant. A compliment is not just a nice moment — it is someone saying they see who you actually are, and its absence can read the way being misread does. This coexists happily with a wide receiving dictionary: the care lands in every register, and the words still matter on their own channel. Most people can run months on scarcity of this; the ones for whom appreciation is identity cannot, and they rarely announce it. The practical upshot is small and load-bearing: telling you what someone admires about you is not a courtesy you enjoy — it is maintenance you need, and going long without it will not show up as missing it. It will show up as something quieter.”

### mutual_downshift

- **Type:** augment · **Priority:** 82
- **Trigger:** Same Side of Problems ≥62 raw AND Willingness to Carry & Be Carried ≥60 raw
- **Placement:** hard_days section, after Same Side of Problems
- **Frame:** You have a gear most couples never name: both engines down at once.
- **Claims:** “One skill your answers circle without quite naming: on the days both of you are depleted, the right move reads to you as a deliberate mutual downshift — not one person carrying at twenty percent while the other runs at full, but both engines consciously cut to match, the shared life idling in low gear without either of you filing it as failure. That is rarer than the crisis reflex, because it asks something harder than teamwork: agreeing together that today is an easy day, on purpose, with nobody owing anybody. Your same-side instinct supplies the we; the way you back people supplies the absence of arithmetic. What is left is only to say it out loud on the day — "we are both at twenty today; let's make it easy" — because the pact only works when both people know it is one.”

## Interplay library (per-dimension conditional passages)

### affection_daily — Everyday Affection

- **When Cultivating Lightness & Play is at most tier 1** (positivity_play:1-): Read against your low score for cultivating lightness: your affection arrives as steady warmth without much play in it — devotion expressed as maintenance. Some partners read that as deep reliability; some miss the spark and call it seriousness. Naming the blend out loud is what turns it from a mystery into a style.
- **When Cultivating Lightness & Play is at least tier 4** (positivity_play:4): Read against your high score for lightness and play: your affection and your fun feed each other — the touch carries jokes, the jokes carry touch. This combination is unusually self-sustaining; the two of you will rarely run out of shared weather.

### desire — Being Wanted

- **When Everyday Affection is at least tier 6** (affection_daily:6): Read against your high everyday-affection score: your ambient touch and your appetite for being desired are the same signal in two dialects — physical closeness is how you both give and measure want. A week of words without touch will read to you as a contradiction — want claimed but not enacted.
- **When Everyday Affection is at most tier 1** (affection_daily:1-): Read against your low everyday-affection score: wanting to be wanted while rarely initiating touch is a distinctive loop — you tend to read others' physical initiative as the thermometer of your own desirability. The useful upgrade is telling a partner which of their small gestures actually register.
- **When Independence Within Closeness is at least tier 4** (autonomy_connection:4): Read against your high independence score: you want to be wanted and also want wide open space — these are compatible, but only if want is expressed in yours-and-mine frequencies rather than constant togetherness.

### vulnerability_safety — Vulnerability as Safety

- **When Reassurance & Security is at least tier 4** (reassurance_security:4): Read against your high reassurance score: the vault opens and the checking continues — you show people your interior and then scan their faces for whether it cost you. Being seen and being reassured are different needs wearing similar clothes; separating them will tell you which one is actually hungry.

### reassurance_security — Reassurance & Security

- **When Vulnerability as Safety is at most tier 1** (vulnerability_safety:1-): Read against your low vulnerability score: you want reassurance you cannot quite ask for — the checking runs while the sharing stays shallow. This loop tends to produce reassurance that does not land, because it is aimed at a self the other person has never fully seen.
- **When Directness Without Games is at most tier 1** (direct_communication:1-): Read against your low directness score: reassurance needs and indirect speech compound — you signal instead of asking, and signals are easy to miss. The single highest-leverage sentence you could learn is a plain one: "I could use some reassurance today."

### listening_first — Listening Before Solving

- **When Two Processing Styles is at most tier 1** (logic_emotion_integration:1-): Read against your single-register processing: you listen well in your home channel, but problems that arrive in the other register may still get a mismatched reply. The listening is real; the translation is what to work on.
- **When Same Side of Problems is at least tier 4** (same_side_problems:4): Read against your high same-side score: listening plus externalizing is the gold-standard pair — you hear the problem out and then aim it at the world rather than each other.

### direct_communication — Directness Without Games

- **When Benefit of the Doubt is at most tier 1** (perspective_taking:1-): Read against your low benefit-of-the-doubt score: plain speech without the charity pass can land harder than you intend. The words were honest; the missing piece is the frame that makes them hearable.
- **When Coming Back to Repair is at least tier 4** (repair_orientation:4): Read against your high repair score: direct plus returning — you say the real thing and you come back to finish it, so disagreement stays something the two of you work through rather than something that costs you.

### repair_orientation — Coming Back to Repair

- **When Care Without Scorekeeping is at least tier 4** (scorekeeping:4): Read against your high ledger score: repair gets harder when the ledger is running — apologies land on an open account. The ledger is not wrong; it just needs closing before returning can work.

### autonomy_connection — Independence Within Closeness

- **When Willingness to Carry & Be Carried is at most tier 1** (commitment_sacrifice:1-): Read against your priced-giving score: independence plus a running internal audit means shared plans get costed before they get wanted. Naming that in advance is kinder than discovering it mid-plan.

### shared_home_effort — Shared Home & Invisible Effort

- **When Care Without Scorekeeping is at least tier 4** (scorekeeping:4): Read against your high ledger score: invisible work plus a running account is the exact recipe for kitchen-table resentment — the fix is moving the tally into speech before it becomes a bill.

### relational_privacy — Kept Between the Two of You

- **When Directness Without Games is at least tier 4** (direct_communication:4): Read against your high directness: inside the two-person room you are fully plain-spoken — the privacy boundary is not about avoidance but about audience control. Rare and coherent.

### sexual_communication — Talking About Intimacy

- **When Vulnerability as Safety is at least tier 4** (vulnerability_safety:4): Read against your high openness score: where you can be seen, you can also say — intimacy talk likely rides the same channel as your general openness, making you rarer than the population baseline.

### positivity_play — Cultivating Lightness & Play

- **When Instinct to Care is at least tier 4** (care_initiation:4): Read against your high care-initiation score: you plant both kinds of seeds — practical care and fun. Together they read as devotion with light in it. Watch the asymmetry risk: the caring seed gets noticed; the fun one gets expected.
- **When Showing Up for Good News is at most tier 1** (capitalization:1-): Read against your low celebration score: you create lightness but may not receive it — you garden fun while letting wins pass unmarked. The fix is mechanical: treat good news as its own bid, answered with the same energy you give a Saturday plan.

### capitalization — Showing Up for Good News

- **When Instinct to Care is at most tier 1** (care_initiation:1-): Read against your low care-initiation score: you celebrate others' news more reliably than you anticipate their needs — showing up for joy is easier for you than showing up for drudgery. A partner pairing you with the reverse type should trade roles deliberately.

### commitment_sacrifice — Willingness to Carry & Be Carried

- **When Care Without Scorekeeping is at least tier 4** (scorekeeping:4): Read against your high ledger score: sacrifice with a running audit — you give big and remember big. The accounting is not stinginess; it is a fairness organ turned all the way up.

## Variance library (within-dimension tug-of-war notes)

Gate: mid/leaning tier AND cancellation ≥ 0.4 AND ≥2 opposing answers among ≥5 contributions. Raw answers required (never fires on share-code profiles).

- **affection_daily — Everyday Affection:** Your everyday-affection score lands near the middle, but the middle is a negotiated settlement, not a resting point: some answers pull toward frequent ambient touch, others toward chosen, deliberate distance. Worth knowing which contexts activate which side — the average will mislead a partner; the pattern will not.
- **desire — Being Wanted:** Your score for wanting to be wanted sits near the middle, but the answers beneath it split: wanting to be visibly wanted in some registers, indifferent to it in others. The useful question is not how much you need desire expressed, but when — the switch between the two modes is the actual finding.
- **vulnerability_safety — Vulnerability as Safety:** Your openness score sits near the middle because two different instincts took turns answering: moments of real willingness to be seen next to moments of sealing. What exposes you varies more than how exposed you are — worth noticing which rooms open the vault and which keep it shut.
- **reassurance_security — Reassurance & Security:** Your reassurance score lands near the middle, but it is not a settled middle: some answers describe someone steady under silence, others someone counting the hours. Context, not constitution, is what moves you — naming the contexts is more useful than resolving the average.
- **care_initiation — Instinct to Care:** Your care-initiation score sits near the middle for a reason worth knowing: anticipatory care in some territories, care-on-request in others. You are not uniformly a mover-first or a responder — the map of where you move first is the finding.
- **receiving_comfort — Receiving Care:** Your receiving score sits near the middle because letting care land and waving it off both got real votes. Which one wins may depend on who is giving and what it would mean to owe them — that dependency is the actual pattern, and the average hides it.
- **scorekeeping — Care Without Scorekeeping:** Your ledger score lands near the middle, but the ledger itself is contested territory underneath: moments of genuinely free giving next to moments of quiet accounting. The scale you actually run on is likely situational — worth learning what tips it.
- **listening_first — Listening Before Solving:** Your listening score sits near the middle because witness and fixer both showed up strongly. Which one takes over likely tracks how urgent the other person's need reads — worth knowing, because the two modes land very differently on the receiving end.
- **direct_communication — Directness Without Games:** Your directness score lands near the middle, but the answers underneath pull from both ends: plain speech on some subjects, careful routing around others. The topics, not the trait, are what vary — the map of what you will and will not say plainly is the real document.
- **repair_orientation — Coming Back to Repair:** Your repair score sits near the middle because both instincts are real: the fast return and the longer, pride-taxed one. What decides is probably the argument's stakes — worth knowing your own switch, since partners mostly see only the outcome.
- **same_side_problems — Same Side of Problems:** Your same-side score lands near the middle because the team frame and the blame frame both answered. When you are resourced, you externalize the problem; when depleted, you look for its owner. The average hides that dependency — the condition is the finding.
- **conflict_engagement — In the Middle of Disagreement:** Your conflict score sits near the middle because engagement and retreat both carried weight in your answers. Heat is likely the switch: one person's raised voice draws you in, another's sends you quiet. Knowing your trigger matters more than the midpoint you average to.
- **autonomy_connection — Independence Within Closeness:** Your independence score lands near the middle, but the middle here is genuinely two-valued: strong comfort alone next to strong pull toward togetherness. That is not indecision — it is a real oscillation, and the calibration between its poles is the lifelong project the score flattens.
- **shared_home_effort — Shared Home & Invisible Effort:** Your shared-effort score sits near the middle, but the answers beneath it split between designed systems and running-on-noticing. Which mode you are in likely tracks how loaded your week already was — the average hides that your contribution has states, not a level.
- **relational_privacy — Kept Between the Two of You:** Your privacy score lands near the middle because two boundary rules both answered: the sealed two-person room and the wider-circle default. What gets shared probably depends on the audience more than the content — mapping that dependency is more honest than any single number.
- **sexual_communication — Talking About Intimacy:** Your intimacy-communication score sits near the middle, but it is not a uniform middle: some regions of desire are speakable in your answers and others are routed around. The map of where the channel opens is the actual finding — the average smooths it into fog.
- **positivity_play — Cultivating Lightness & Play:** Your play score lands near the middle, but the answers show planting lightness and foraging it both happened. You may be the gardener in some seasons and the guest in others — knowing which season activates which role is worth more than the midpoint.
- **capitalization — Showing Up for Good News:** Your celebration score sits near the middle, but the underneath is not lukewarm: stopping fully for some wins and letting others pass unmarked. The inconsistency is the pattern — worth learning which kind of good news reliably gets your full stop.
- **commitment_sacrifice — Willingness to Carry & Be Carried:** Your carry score lands near the middle because wholehearted backing and the value-check both answered. Size of the ask is likely the switch — small things ride free while the large ones get priced. Knowing that about yourself beats defending the average.
- **money_coordination — Money as Teamwork:** Your money score sits near the middle, but the answers beneath split between teammate framing and auditor framing. The trigger is probably legitimacy — spending that reads as obviously shared passes free while debatable purchases get a hearing. The average hides the courtroom.
- **desire_initiation — Wanting Out Loud:** Your initiation score lands near the middle, but the answers beneath it split: moving first in some registers of want, waiting to be invited in others. Which mode activates probably tracks how safe the landing feels — the map of where you move is the finding, not the average.
- **intimacy_attunement — Reading Each Other in the Dark:** Your attunement score sits near the middle because reading-the-moment and following-your-own-current both answered. You likely track well in calm moments and lose the thread in charged ones — the condition, not the midpoint, is the finding.
- **feedback_receiving — Hearing It Without Armor:** Your feedback score lands near the middle, but the underneath is contested: genuine curiosity about the point next to a reflex of defense. Which one wins probably depends on how exposed the feedback finds you — knowing your trigger beats defending the average.
- **external_processing — Outside Voices, On Purpose:** Your processing score sits near the middle because thinking-out-loud and working-it-through-alone both got real votes. What decides is probably the size of the tangle and whether you already know your own mind — the average hides that your method has states, not a level.
- **generic (seeded, 2 variants):** Your score here sits near the middle, but the answers underneath it were not all mild ones — pulls in both directions canceled into the average. That is a different situation from genuinely moderate feelings: you likely run strong in one context and opposite in another. The middle number will mislead a partner more than the pattern will.

## Band-variant paragraphs (alternate prose for the mhigh/high bands)

Selection: the lower half of a band reads the alternate (flat-band claim); the upper half reads the base paragraph (which carries the intensity suffix). The run seed breaks exact ties. Fallback: a dimension without a band-specific high variant uses its mhigh alternate.

- **affection_daily — Everyday Affection (mhigh):** Reaching comes naturally to you — the hand on the back in passing, the shoulder lean while something is on the stove. Your answers describe contact as a running background process: it does not wait for occasions, and a day or two without it is something you register and then correct. A partner rarely has to ask whether you are still glad they are there; they can feel it in the traffic — constant small evidence of proximity maintained.
- **desire — Being Wanted (mhigh):** For you, desire is not a mood that visits — it is a signal that has to keep being sent. The message in the middle of the day, the look across a room, the evidence of being chosen rather than merely accommodated: these read to you as the difference between a partner and a housemate. Your answers suggest a partner could love you steadily and still leave you hungry if the wanting went quiet — and that you would notice long before you said anything.
- **vulnerability_safety — Vulnerability as Safety (mhigh):** What people hand you in confidence stays handed. When an argument heats up, the temptation to reach for a disclosed soft spot is real, and your answers show you not reaching — declining the low blow even when it would have scored. That refusal is the thing people eventually describe as the reason they trusted you with the deep material: it never came back aimed at them.
- **reassurance_security — Reassurance & Security (mhigh):** Unanswered questions about where you stand have a way of growing. Your answers show you managing the quiet stretches — coping, functioning — while a background thread keeps checking whether the distance means anything. You do not want to be talked down from ledges; you want the information that prevents the ledge: a plain sentence about someone's bad day arriving before you had to ask. Proactive clarity is what actually settles you.
- **care_initiation — Instinct to Care (mhigh):** You move first. The snack that was not asked for, the massage offered on the hard day, the errand absorbed before anyone mentioned it — in your scenarios, noticing and acting were the same step. This reads to people as being truly seen in the practical register: not told "let me know if you need anything," but simply finding it already handled. The attention to watch is the reverse direction — making sure you still let people anticipate you too.
- **receiving_comfort — Receiving Care (mhigh):** Care offered to you gets to arrive. Your answers show no flinch at compliments, no reflex to split the bill on kindness, no need to repay a favor before it settles — being taken care of reads to you as love, not debt. That ease is rarer than it looks and it does real work: it lets the people who love you experience their own generosity landing, which is half of what anyone wants from giving.
- **scorekeeping — Care Without Scorekeeping (mhigh):** You run a long ledger, and mostly a closed one. Individual gestures in your answers carry no price tags — no one owes anyone for dinner or a favor — but the pattern over time is not invisible to you either: you notice when the giving runs one way for a season, and you expect it to bend back eventually without being invoiced. The fairness you practice is measured in years, and its one blind spot is silence — a chronic imbalance can normalize before you name it.
- **express_receive_alignment — Express–Receive Harmony (mhigh):** There is a symmetry to how you love: what you naturally give and what naturally lands on you belong to the same dialect family. A partner can learn you by watching you — the way you care for people is a readable map of how you want to be cared for. That legibility is a quiet gift in a relationship: fewer translation errors, fewer unmet needs hiding behind different vocabularies.
- **listening_first — Listening Before Solving (mhigh):** Your instinct is to hold the space open. When someone brings you something heavy, you do not reach for the fix, the reframe, or your own story — you let the sentence finish and then ask about what is inside it. People notice being heard at that level, and it changes what they bring you: more truth, earlier, less edited. The solutions can wait their turn, and in your answers, they usually do.
- **logic_emotion_integration — Two Processing Styles (mhigh):** You keep two registers running without forcing either to translate for the other. Something happens: you can think it through, and you can feel it through, and your answers suggest you know which mode a moment calls for — without treating the other one as a failure. It is a rare integration: analysis that has not lost its warmth, feeling that has not lost its structure.
- **curiosity_worlds — Curiosity for Each Other (mhigh):** Other people's enthusiasms pull you in. The explanation you do not understand and do not need to — you ask anyway, because the point is what it does to them when they talk about it. Your answers treat interest as a form of attention, and attention as a form of love: the person whose world you keep entering gets to feel worth entering. It is a quality people describe as feeling interesting for a lifetime rather than a season.
- **perspective_taking — Benefit of the Doubt (mhigh):** You give people room. Before a story forms about why someone did the thing, your instinct is to widen it — check the facts, hold the alternate explanations, assume there is more underneath than visible. It makes you hard to feel misjudged by: the people around you get to be complicated without bracing for a verdict. The charity is not naïveté; your answers pair it with checking, not wishful thinking.
- **direct_communication — Directness Without Games (mhigh):** You do not let things ferment. When something bothers you, your answers route it into speech while it is still manageable — "this bothered me" said on day one rather than archived into resentment on day forty. Directness, for you, appears to be a form of respect: the relationship deserves real information, not archaeology. And you seem to want it in both directions, which matters as much as the giving.
- **repair_orientation — Coming Back to Repair (mhigh):** You come back. After the blowup or the cold stretch, your answers show you re-opening the conversation — apologizing specifically, asking what actually landed, treating the bad interaction as information rather than a verdict on anyone. Conflicts around you tend to end faster and leave less residue, because someone keeps insisting on the return. That someone is usually you.
- **same_side_problems — Same Side of Problems (mhigh):** Problems in your answers get externalized fast. The broken thing, the tight month, the complicated relative — your first instinct reframes it as a shared situation before anyone has to become the defendant. Standing next to you in a crisis apparently feels like accompaniment rather than audit, and that is the quality partners describe as "we can get through anything" — earned, in your case, at the level of reflex.
- **autonomy_connection — Independence Within Closeness (mhigh):** You do not treat closeness and separateness as opposites. Your answers hold real comfort with a partner's separate life — their hobbies, their friendships, their quiet — right next to a strong pull toward connection. The combination reads as secure rather than avoidant: space does not register as rejection, and togetherness does not register as loss of self. Calibration, not commitment, is the ongoing work.
- **shared_home_effort — Shared Home & Invisible Effort (mhigh):** The household's invisible labor does not stay invisible to you. You notice what needs doing and mostly just do it — the researched fix, the phone call absorbed, the thing handled before it was announced as a task. Your answers also favor a home where the mental load is speakable: ask without shame, answer honestly, extend the same grammar back. The watch-item is the classic one — competence that never announces itself can mute its own recognition.
- **relational_privacy — Kept Between the Two of You (mhigh):** What happens between you stays between you by default. Your answers draw a firm frame around the relationship's contents: counsel from a trusted voice is welcome when genuinely needed, but there is no audience to perform for and no jury to poll. It reads as protection rather than secrecy — the privacy is what lets the people close to you risk being imperfect without becoming a story someone else tells.
- **sexual_communication — Talking About Intimacy (mhigh):** In your answers, nothing in intimacy has to go unsaid. Wants, limits, curiosities, the things that are not working — they are framed as conversation rather than confession, and the ease extends to hearing a partner's map without flinching. Research ties this speakability to both sexual and relationship satisfaction more strongly than almost anything else, and it comes with a corollary your answers already carry: nobody has to perform a script they cannot edit.
- **positivity_play — Cultivating Lightness & Play (mhigh):** Flat time does not stay flat around you. Your answers show you seeding lightness deliberately — the invented walk, the dumb movie, the project nobody planned — treating shared fun as something grown rather than waited for. Play, for you, is maintenance work you actually enjoy, and its payoff compounds: the couple that laughs keeps wanting each other, and you seem to know it.
- **capitalization — Showing Up for Good News (mhigh):** Good news gets a reception at your place. Your answers chose the full-body response to someone's win — put it down, turn around, start from the beginning — the active-constructive pattern that turns a report into a bond. People who live with you likely experience their victories as bigger for having told you, and they learn where joy goes to land.
- **conflict_engagement — In the Middle of Disagreement (mhigh):** You do not leave the ring. Your answers show you staying in hard conversations and defending your position while genuinely tracking theirs — and reaching for the brake ("let's name the temperature") rather than the counterattack when the temperature rises. Disagreement, in your make-up, does not have to become damage; it can just be the two of you working. That is a learnable skill, and your answers suggest you already learned it.
- **commitment_sacrifice — Willingness to Carry & Be Carried (mhigh):** When you give something up for the relationship, the giving settles it. Your answers show no running invoice, no background cost-benefit — sacrifice reads as constitutive, part of what choosing someone meant. The upside is a steadiness partners can build on; the caution is proportionality — make sure the same arithmetic-free door swings both ways, because one-way carrying is the only load this generosity cannot absorb.
- **money_coordination — Money as Teamwork (mhigh):** You frame money as a shared project rather than a private scoreboard. Equal seriousness for both people's spending when the bills are paid, early information when the month is tight, no trial for the unannounced purchase the foundation can absorb — your answers describe a teammate economy, revisable out loud, without double standards. It is rarer than it sounds, and it removes one of the standard couple fights before it starts.
- **desire_initiation — Wanting Out Loud (mhigh):** You are willing to move first — and you are willing to hear no. Your answers describe initiation without bracing: the move gets made, and when it does not land, the sting is brief and real and does not curdle into withdrawal or score-keeping. That recovery is the rare and load-bearing part; it is what makes you safe to want things around, because your wanting does not turn into pressure the moment it is not immediately matched.
- **intimacy_attunement — Reading Each Other in the Dark (mhigh):** You track the unworded. Drift, hesitation, the difference between want and willingness — your answers show you noticing, adjusting, and checking when unsure rather than hoping. Bodies' off days read to you as information, not verdicts, which is precisely the attunement the research links to lasting satisfaction. A partner never has to perform okay-ness with you; you would catch the performance anyway.
- **feedback_receiving — Hearing It Without Armor (mhigh):** Hard feedback gets a full hearing from you before anything fires back. Your answers suggest the defense reflex does not get the first word — curiosity does: what took them so long to tell me, what am I missing. The people close to you can say the true thing while it is still small, because they have learned it lands. That is among the rarer and more load-bearing skills a relationship can run on.
- **external_processing — Outside Voices, On Purpose (mhigh):** Your best untangling happens out loud, with someone you trust. Your answers treat talking something through — openly, declared, aimed at understanding — as a legitimate way to think, and they extend the same permission to a partner. The line you keep is not about silence; it is about consent: processing declared is collaboration, processing discovered is exclusion. You know the difference, and it shows.
