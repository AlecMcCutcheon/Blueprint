// Domain types for the relationship blueprint questionnaire.

export type DimensionId =
  // Domain A — Closeness (8)
  | 'affection_daily'
  | 'desire'
  | 'desire_initiation'
  | 'intimacy_attunement'
  | 'vulnerability_safety'
  | 'reassurance_security'
  | 'sexual_communication'
  | 'positivity_play'
  // Domain B — Reciprocity (4)
  | 'care_initiation'
  | 'receiving_comfort'
  | 'scorekeeping'
  | 'express_receive_alignment'
  // Domain C — Emotional processing (6)
  | 'listening_first'
  | 'logic_emotion_integration'
  | 'curiosity_worlds'
  | 'perspective_taking'
  | 'capitalization'
  | 'feedback_receiving'
  // Domain D — Conflict & teamwork (4)
  | 'direct_communication'
  | 'repair_orientation'
  | 'same_side_problems'
  | 'conflict_engagement'
  // Domain E — Interdependence (4)
  | 'autonomy_connection'
  | 'shared_home_effort'
  | 'commitment_sacrifice'
  | 'money_coordination'
  // Domain F — Boundaries (2)
  | 'relational_privacy'
  | 'external_processing';

export type DomainId =
  | 'closeness'
  | 'reciprocity'
  | 'processing'
  | 'teamwork'
  | 'interdependence'
  | 'boundaries';

/** Signed weight an option contributes to a dimension. Positive = toward, negative = away. */
export type Weight = Partial<Record<DimensionId, number>>;

export type QuestionFormat =
  | 'scenario'      // "What do you most naturally do?" — multiple plausible options
  | 'forced_pair'   // "Which would bother you more?" — A/B tradeoff
  | 'agreement'     // 1–5 scale, framed behaviorally
  | 'rank_most'     // "Which would affect you most?" (pick one of a set)
  | 'mirror'        // paired question: receive vs. give version of the same scenario
  | 'update';       // ambiguity follow-up: same scenario, more context

export interface QuestionOption {
  id: string;
  label: string;
  /** What choosing this reveals (shown on the review screen and in alternatives). */
  description: string;
  weight: Weight;
  /** For the express/receive "love channel" questions: acts | touch | words | service | space. */
  channel?: string;
}

export interface AgreementOption {
  id: string;
  label: string;
  value: number; // 1..5 as rendered; weight computed via scale
  description: string;
  weight: Weight; // weight per unit value; effective weight = weight * value
}

export interface Question {
  id: string;
  layer: 1 | 2 | 3 | 4 | 5 | 6; // instinct, preference, tradeoff, self-reflection, behavior, contradiction
  format: QuestionFormat;
  /** Multi-line scenario text; each string is a paragraph. */
  prompt: string[];
  options: QuestionOption[] | AgreementOption[];
  /**
   * For `mirror` / `update` questions: links to the counterpart question so the
   * scoring engine can compute the paired delta (express vs. receive; update vs. baseline).
   */
  pairWith?: string;
  /** Which side of a mirror pair this is — used for express_receive_alignment. */
  mirrorSide?: 'express' | 'receive';
  /** Higher weight = more diagnostic. Situational questions weigh more than self-reflection. */
  diagnosticWeight?: number;
  /** Free-text nudge shown under the question (optional). */
  note?: string;
  /**
   * True for instrument-state checks: they read the reader, carry no trait
   * weights, and are excluded from the scored questionnaire. (The state
   * survey itself is retired; the flag remains for legacy saved runs.)
   */
  meta?: boolean;
  /**
   * A clarifying (formerly "bonus") question: scored with the core bank when
   * present, appended at the end of the run when echo-pair analysis flags its
   * dimension as self-disagreeing. Lives outside the main 100 so it never
   * pads the advertised count.
   */
  bonusFor?: DimensionId;
}

export type AnswerValue =
  | { kind: 'option'; optionId: string }
  | { kind: 'scale'; value: number };

export type Answers = Record<string, AnswerValue>;

/** Scored with real evidence, or marked 'unmeasured' when the evidence comes from a legacy code. */
export interface DimensionScore {
  id: DimensionId;
  /** 0–100 normalized. */
  score: number;
  /** How many diagnostic points contributed. */
  evidence: number;
  /** True when this score is a neutral placeholder (legacy code with no data for this dimension). */
  unmeasured?: boolean;
  /** Quantized variance shape reconstructed from a BP5 share code — enough to gate variance prose identically to the owner's document, without carrying any raw answer. */
  varianceShape?: { count: number; posCount: number; cancellation: number };
}

/**
 * How the answers behind one dimension's score actually distributed — a "mid"
 * built from opposing extremes is a different finding from a genuine middle.
 * Scores carry only the average; this keeps the shape underneath it.
 */
export interface DimensionVariance {
  id: DimensionId;
  /** Signed per-question contributions that produced the score. */
  contributions: number[];
  /** Mean of |contribution| — the typical voice size in this dimension's chorus. */
  typical: number;
  /** Largest |contribution|. */
  peak: number;
  /** Share of summed positive weight (0–1). ~1 one-sided, ~0.5 evenly split. */
  posShare: number;
  /** Share of summed |weight| that cancels — opposing answers in the same dimension. */
  cancellation: number;
  /** Share of total |weight| contributed by answers in the top third of sizes. */
  peakShare: number;
}

export interface ConsistencyPair {
  a: string;
  b: string;
  /** 0–100: how much the two answers agreed. */
  agreement: number;
  dimension: DimensionId | 'ambiguity_update';
  /**
   * Each answer's signed weight on the pair's shared dimension — the DIRECTION
   * of the disagreement, when known. Undefined for profiles restored from share
   * codes (raw answers aren't encoded), where tension copy falls back to
   * territory-specific but non-directional wording.
   */
  positionA?: number;
  positionB?: number;
}

export interface MetaComposite {
  id: 'mutual_care' | 'emotional_safety' | 'teamwork';
  score: number;
}

export interface ScoredProfile {
  dimensions: Record<DimensionId, DimensionScore>;
  /** Shape behind each score — present only when raw answers were scored (not for share-code profiles). */
  variance?: Partial<Record<DimensionId, DimensionVariance>>;
  metas: MetaComposite[];
  consistency: ConsistencyPair[];
  /** Overall self-consistency 0–100, averaged across pairs. */
  consistencyIndex: number;
  /** Dominant love channel per direction, derived from channel-tagged answers. */
  channels: { express: string | null; receive: string | null };
  /** Distinct receiving channels named (present only when raw answers were scored). A high value with a null modal channel means breadth, not absence. */
  receiveBreadth?: number;
  /** Per-pair disagreement direction (lean = positionB − positionA), carried by BP5 share codes so shared documents can resolve tension cards exactly like the owner's. Values: −1, 0, or +1 (lean sign, 0 when |lean| < 0.05). Keyed 'qa|qb' in CONSISTENCY_PAIRS order. */
  pairLeans?: Record<string, number>;
  /** Questions answered / total, for confidence framing. */
  answered: number;
  total: number;
}

export interface BlueprintSection {
  id: string;
  heading: string;
  paragraphs: string[];
  /** True when the heading was chosen from score-keyed variants (not the static default). */
  headingAdaptive?: boolean;
}

export interface Blueprint {
  /** One-line distillation, e.g. "A generous instinct with a private interior." */
  epigraph: string;
  sections: BlueprintSection[];
  /** Dimension readouts for the visual band chart. */
  bands: { id: DimensionId; label: string; score: number; tierLabel?: string; unmeasured?: boolean }[];
  tensions: { title: string; body: string }[];
}

export const DIMENSION_LABELS: Record<DimensionId, string> = {
  sexual_communication: 'Talking About Intimacy',
  positivity_play: 'Cultivating Lightness & Play',
  capitalization: 'Showing Up for Good News',
  conflict_engagement: 'In the Middle of Disagreement',
  commitment_sacrifice: 'Willingness to Carry & Be Carried',
  money_coordination: 'Money as Teamwork',
  affection_daily: 'Everyday Affection',
  desire: 'Being Wanted',
  desire_initiation: 'Wanting Out Loud',
  intimacy_attunement: 'Reading Each Other in the Dark',
  vulnerability_safety: 'Vulnerability as Safety',
  reassurance_security: 'Reassurance & Security',
  care_initiation: 'Instinct to Care',
  receiving_comfort: 'Receiving Care',
  scorekeeping: 'Care Without Scorekeeping',
  express_receive_alignment: 'Express–Receive Harmony',
  listening_first: 'Listening Before Solving',
  logic_emotion_integration: 'Two Processing Styles',
  curiosity_worlds: 'Curiosity for Each Other',
  perspective_taking: 'Benefit of the Doubt',
  feedback_receiving: 'Hearing It Without Armor',
  direct_communication: 'Directness Without Games',
  repair_orientation: 'Coming Back to Repair',
  same_side_problems: 'Same Side of Problems',
  autonomy_connection: 'Independence Within Closeness',
  shared_home_effort: 'Shared Home & Invisible Effort',
  relational_privacy: 'Kept Between the Two of You',
  external_processing: 'Outside Voices, On Purpose',
};

export const DOMAIN_LABELS: Record<DomainId, string> = {
  closeness: 'Closeness',
  reciprocity: 'Reciprocity',
  processing: 'Emotional Processing',
  teamwork: 'Conflict & Teamwork',
  interdependence: 'Interdependence',
  boundaries: 'Boundaries & Privacy',
};

export const DOMAIN_DIMENSIONS: Record<DomainId, DimensionId[]> = {
  closeness: ['affection_daily', 'desire', 'desire_initiation', 'intimacy_attunement', 'vulnerability_safety', 'reassurance_security', 'sexual_communication', 'positivity_play'],
  reciprocity: ['care_initiation', 'receiving_comfort', 'scorekeeping', 'express_receive_alignment'],
  processing: ['listening_first', 'logic_emotion_integration', 'curiosity_worlds', 'perspective_taking', 'capitalization', 'feedback_receiving'],
  teamwork: ['direct_communication', 'repair_orientation', 'same_side_problems', 'conflict_engagement'],
  interdependence: ['autonomy_connection', 'shared_home_effort', 'commitment_sacrifice', 'money_coordination'],
  boundaries: ['relational_privacy', 'external_processing'],
};
