import type {
  AgreementOption,
  Answers,
  AnswerValue,
  DimensionId,
  DimensionVariance,
  Question,
  QuestionOption,
  ScoredProfile,
  ConsistencyPair,
  Weight,
} from './types';
import { QUESTIONS, QUESTION_BY_ID, BONUS_POOL } from './questions';

export const CHANNEL_LABELS: Record<string, string> = {
  words: 'words — being told',
  touch: 'presence & touch',
  service: 'acts & practical care',
  space: 'space & freedom',
};

/** Questions that reveal the channel you like to RECEIVE care in. */
export const RECEIVE_QUESTIONS = new Set(['q53', 'q34', 'q19', 'q18']);

/** The six hidden echo pairs, in encoding order for share codes. */
export const CONSISTENCY_PAIRS: [string, string, DimensionId | 'ambiguity_update'][] = [
  ['q03', 'q60', 'ambiguity_update'],
  ['q53', 'q54', 'express_receive_alignment'],
  ['q10', 'q55', 'receiving_comfort'],
  ['q04', 'q61', 'listening_first'],
  ['q14', 'q62', 'scorekeeping'],
  ['q63', 'q67', 'relational_privacy'],
  ['q65', 'q72', 'relational_privacy'],
  ['q06', 'q69', 'curiosity_worlds'],
  ['q74', 'q84', 'conflict_engagement'],
  ['q78', 'q88', 'capitalization'],
  ['q75', 'q85', 'sexual_communication'],
  ['q87', 'q90', 'commitment_sacrifice'],
];

/** Questions that reveal the channel you most naturally EXPRESS care in. */
export const EXPRESS_QUESTIONS = new Set(['q54', 'q58', 'q49']);

/** Ordered dimension list — also used by the share-code encoder. */
export const ALL_DIMENSIONS: DimensionId[] = [
  'affection_daily', 'desire', 'desire_initiation', 'intimacy_attunement', 'vulnerability_safety', 'reassurance_security',
  'sexual_communication', 'positivity_play',
  'care_initiation', 'receiving_comfort', 'scorekeeping', 'express_receive_alignment',
  'listening_first', 'logic_emotion_integration', 'curiosity_worlds', 'perspective_taking',
  'capitalization', 'feedback_receiving',
  'direct_communication', 'repair_orientation', 'same_side_problems', 'conflict_engagement',
  'autonomy_connection', 'shared_home_effort', 'commitment_sacrifice', 'money_coordination',
  'relational_privacy', 'external_processing',
];

function optionWeight(q: Question, v: AnswerValue): { weight: Weight; channel?: string } {
  if (v.kind === 'scale') {
    const opt = q.options.find((o): o is AgreementOption => 'value' in o && o.id === String(v.value));
    if (!opt) return { weight: {} };
    return { weight: opt.weight };
  }
  const opt = q.options.find((o): o is QuestionOption => 'label' in o && o.id === v.optionId);
  if (!opt) return { weight: {} };
  return { weight: opt.weight, channel: 'channel' in opt ? opt.channel : undefined };
}

/** Seeded pick so the same scores regenerate the same blueprint every time. */
export function seededPick<T>(arr: T[], seed: number): T {
  const x = Math.sin(seed) * 10000;
  return arr[Math.floor(Math.abs(x)) % arr.length];
}

export function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Strict-plurality mode: the most common channel only when it is strictly
 * ahead. A tie (two channels level, or every answer naming a different one)
 * returns null — a modal channel invented by iteration order would then drive
 * tension cards and translation notes the answers never actually supported.
 */
function pluralityOf(arr: (string | undefined)[]): string | null {
  const counts = new Map<string, number>();
  for (const x of arr) if (x) counts.set(x, (counts.get(x) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0 || (sorted.length > 1 && sorted[0][1] === sorted[1][1])) return null;
  return sorted[0][0];
}

/** Agreement between two weighted option picks on a shared dimension, 0–100. */
function pairAgreement(qa: Question, qb: Question, va: AnswerValue, vb: AnswerValue): number {
  const wa = optionWeight(qa, va).weight;
  const wb = optionWeight(qb, vb).weight;
  const dims = new Set([...Object.keys(wa), ...Object.keys(wb)]) as Set<DimensionId>;
  let dot = 0, magA = 0, magB = 0;
  for (const d of dims) {
    const x = wa[d] ?? 0;
    const y = wb[d] ?? 0;
    dot += x * y;
    magA += x * x;
    magB += y * y;
  }
  if (magA === 0 || magB === 0) return 50;
  // cosine similarity in [-1, 1] → [0, 100]
  return Math.round(((dot / (Math.sqrt(magA) * Math.sqrt(magB))) + 1) * 50);
}

/**
 * Within-dimension variance: the average hides the shape. A 63 built from
 * opposing extremes canceling is a different finding from a comfortable
 * middle — and tier prose has no way to know. Accumulating signed per-question
 * contributions keeps the shape; these thresholds decide when that shape is
 * itself a finding (all provisional heuristics pending sample data):
 * cancellation ≥ 0.4 with two or more opposing answers among at least five
 * contributing answers — enough voices that the split is a pattern, not a
 * coin-flip between two data points.
 */
const DIVIDED_CANCELLATION = 0.4;
const DIVIDED_MIN_OPPOSING = 2;
/** A tug-of-war needs voices: below this many contributing answers, cancellation is noise. */
const DIVIDED_MIN_VOICES = 5;

/** True when a dimension's score is a middle built from opposing answers. */
export function isInternallyDivided(v: DimensionVariance): boolean {
  const opposing = v.contributions.filter((c) => c < 0).length;
  return (
    v.cancellation >= DIVIDED_CANCELLATION &&
    opposing >= DIVIDED_MIN_OPPOSING &&
    v.contributions.length >= DIVIDED_MIN_VOICES
  );
}

function varianceFor(id: DimensionId, contributions: number[]): DimensionVariance | null {
  if (contributions.length === 0) return null;
  const abs = contributions.map(Math.abs);
  const totalAbs = abs.reduce((s, x) => s + x, 0);
  if (totalAbs <= 0) return null;
  const pos = contributions.reduce((s, c) => s + Math.max(0, c), 0);
  const sorted = [...abs].sort((a, b) => b - a);
  const topN = Math.max(1, Math.ceil(sorted.length / 3));
  return {
    id,
    contributions,
    typical: totalAbs / contributions.length,
    peak: sorted[0],
    posShare: totalAbs > 0 ? pos / totalAbs : 0.5,
    // Quantized to 1/200 at the SOURCE so every consumer (isInternallyDivided,
    // variance notes, and the BP5 share-code reconstruction) sees the exact
    // same value — a share code stores this number losslessly, and owner and
    // shared documents gate their prose identically.
    cancellation: Math.round((Math.min(pos, totalAbs - pos) / totalAbs) * 200) / 200,
    peakShare: sorted.slice(0, topN).reduce((s, x) => s + x, 0) / totalAbs,
  };
}

export function scoreProfile(input: Answers): ScoredProfile {
  // Defensive copy with validation: drop any answer whose option/scale value
  // no longer exists in the bank (e.g. from an older question format), so a
  // stale entry can never silently contribute a zero or wrong signal. Each id
  // is validated against its OWN question (index-based, not via includes on a
  // merged pool — an imported answers file could otherwise carry a core id
  // "q42" and have it validated against an unrelated pool question).
  // Clarifying items are legitimate answer holders: when present they are
  // scored in the main pass below, so a session file rebuilds everything —
  // including the clarifier adjustments — from raw answers alone.
  const answers: Answers = {};
  const byId = new Map([...QUESTIONS, ...BONUS_POOL].map((q) => [q.id, q]));
  for (const [id, v] of Object.entries(input)) {
    const q = byId.get(id);
    if (!q) continue;
    if (v.kind === 'option') {
      if (q.options.some((o) => 'label' in o && o.id === v.optionId)) answers[id] = v;
    } else if (
      v.kind === 'scale' &&
      q.format === 'agreement' &&
      q.options.some((o) => 'value' in o && String(o.value) === String(v.value))
    ) {
      answers[id] = v;
    }
  }

  const raw: Record<DimensionId, number> = Object.fromEntries(
    ALL_DIMENSIONS.map((d) => [d, 0]),
  ) as Record<DimensionId, number>;
  const maxAbs: Record<DimensionId, number> = Object.fromEntries(
    ALL_DIMENSIONS.map((d) => [d, 0]),
  ) as Record<DimensionId, number>;

  // per-question channel tallies for express/receive analysis
  const expressChannels: (string | undefined)[] = [];
  const receiveChannels: (string | undefined)[] = [];
  // Signed per-question contributions per dimension — the shape behind the
  // average (see isInternallyDivided). Core + clarifier items accumulate alike.
  const contributions: Record<DimensionId, number[]> = Object.fromEntries(
    ALL_DIMENSIONS.map((d) => [d, [] as number[]]),
  ) as Record<DimensionId, number[]>;

  // Note: the instrument-state survey (q96–q98) is retired from scoring —
  // answers to those ids, if present in legacy saved runs, are ignored.

  for (const q of QUESTIONS) {
    const v = answers[q.id];
    if (!v) continue;
    if (q.meta) continue; // state reads never touch trait math
    const dw = q.diagnosticWeight ?? 1;
    const { weight, channel } = optionWeight(q, v);

    for (const [d, w] of Object.entries(weight)) {
      raw[d as DimensionId] += w * dw;
      maxAbs[d as DimensionId] += Math.max(0.5, Math.abs(w)) * dw;
      if (w !== 0) contributions[d as DimensionId].push(w * dw);
    }

    if (RECEIVE_QUESTIONS.has(q.id)) receiveChannels.push(channel);
    if (EXPRESS_QUESTIONS.has(q.id)) expressChannels.push(channel);
  }

  // Clarifying items (b_*): scored in the MAIN pass, not as a post-hoc patch —
  // their answers accumulate like any other evidence, so an imported session
  // rebuilds the adjusted profile by simply re-scoring. Consistency pairs are
  // computed on the core 100 only: a clarifier seen after a disagreeing pair
  // is a clarification, not another echo to score.
  for (const q of BONUS_POOL) {
    const v = answers[q.id];
    if (!v) continue;
    const dw = q.diagnosticWeight ?? 1;
    const { weight } = optionWeight(q, v);
    for (const [d, w] of Object.entries(weight)) {
      raw[d as DimensionId] += w * dw;
      maxAbs[d as DimensionId] += Math.max(0.5, Math.abs(w)) * dw;
      if (w !== 0) contributions[d as DimensionId].push(w * dw);
    }
  }

  const dimensions = Object.fromEntries(
    ALL_DIMENSIONS.map((d) => {
      const max = maxAbs[d];
      // Zero evidence (partial run, or a bank that grew since the answers were
      // given) is recorded honestly as unmeasured rather than as a fake 50.
      const score = max > 0
        ? Math.round(((raw[d] + max) / (2 * max)) * 100)
        : 50;
      return [d, { id: d, score: Math.max(0, Math.min(100, score)), evidence: max, unmeasured: max === 0 || undefined }];
    }),
  ) as ScoredProfile['dimensions'];

  // Express/receive channel symmetry
  const countChannel = (arr: (string | undefined)[]) => {
    const counts: Record<string, number> = {};
    for (const c of arr) if (c) counts[c] = (counts[c] ?? 0) + 1;
    return counts;
  };
  const expCounts = countChannel(expressChannels);
  const recCounts = countChannel(receiveChannels);
  const allCh = new Set([...Object.keys(expCounts), ...Object.keys(recCounts)]);
  let sym = 0, nCh = 0;
  for (const ch of allCh) {
    const e = (expCounts[ch] ?? 0) / Math.max(1, expressChannels.filter(Boolean).length);
    const r = (recCounts[ch] ?? 0) / Math.max(1, receiveChannels.filter(Boolean).length);
    sym += Math.abs(e - r);
    nCh += 1;
  }
  const alignmentScore = nCh > 0 ? Math.max(0, Math.round((1 - sym / 2) * 100)) : 50;
  dimensions.express_receive_alignment = {
    id: 'express_receive_alignment',
    score: alignmentScore,
    evidence: Math.max(1, expressChannels.filter(Boolean).length + receiveChannels.filter(Boolean).length),
  };

  // Consistency pairs (same territory, different clothes). Each answer's
  // signed weight on the pair's shared dimension is recorded so blueprint
  // tensions can name the DIRECTION of a disagreement, not just its existence.
  const consistency: ConsistencyPair[] = [];
  for (const [a, b, dim] of CONSISTENCY_PAIRS) {
    const va = answers[a], vb = answers[b];
    if (!va || !vb) continue;
    if (dim === 'ambiguity_update') {
      consistency.push({
        a, b,
        agreement: pairAgreement(QUESTION_BY_ID[a], QUESTION_BY_ID[b], va, vb),
        dimension: dim,
      });
      continue;
    }
    const wA = optionWeight(QUESTION_BY_ID[a], va).weight;
    const wB = optionWeight(QUESTION_BY_ID[b], vb).weight;
    consistency.push({
      a, b,
      agreement: pairAgreement(QUESTION_BY_ID[a], QUESTION_BY_ID[b], va, vb),
      dimension: dim,
      positionA: wA[dim] ?? 0,
      positionB: wB[dim] ?? 0,
    });
  }
  const consistencyIndex = consistency.length
    ? Math.round(consistency.reduce((s, c) => s + c.agreement, 0) / consistency.length)
    : 0;

  // Dominant love channel per direction — strictly dominant only; a tie is
  // reported as no modal channel rather than resolved arbitrarily. The number
  // of distinct receiving channels is kept so prose can tell "no data" apart
  // from "everything lands".
  const channels = {
    express: expressChannels.some(Boolean) ? pluralityOf(expressChannels) : null,
    receive: receiveChannels.some(Boolean) ? pluralityOf(receiveChannels) : null,
  };
  const receiveBreadth = receiveChannels.some(Boolean)
    ? new Set(receiveChannels.filter(Boolean)).size
    : undefined;

  // Meta-composites
  const avg = (ids: DimensionId[]) =>
    Math.round(ids.reduce((s, id) => s + dimensions[id].score, 0) / ids.length);

  // Shape behind the scores: recorded only when raw answers were scored.
  // Share-code profiles carry no reasoning, so they get no variance — prose
  // that depends on it is skipped downstream rather than guessed.
  const variance: Partial<Record<DimensionId, DimensionVariance>> = {};
  for (const d of ALL_DIMENSIONS) {
    const v = varianceFor(d, contributions[d]);
    if (v) variance[d] = v;
  }

  const metas = [
    { id: 'mutual_care' as const, score: avg(['care_initiation', 'receiving_comfort', 'scorekeeping']) },
    { id: 'emotional_safety' as const, score: avg(['vulnerability_safety', 'reassurance_security', 'listening_first']) },
    { id: 'teamwork' as const, score: avg(['same_side_problems', 'repair_orientation', 'direct_communication']) },
  ];

  return {
    dimensions,
    variance,
    metas,
    consistency,
    consistencyIndex,
    channels,
    receiveBreadth,
    // Honest count: core answers only. A clarifier is a response to a finding,
    // not part of the instrument's advertised 115 — otherwise a run that
    // answered all core + 2 clarifiers would claim 117/115.
    answered: QUESTIONS.reduce((n, q) => n + (answers[q.id] !== undefined ? 1 : 0), 0),
    total: QUESTIONS.length,
  };
}

export function topSignatureDimensions(p: ScoredProfile, count = 3): DimensionId[] {
  return (Object.values(p.dimensions) as ScoredProfile['dimensions'][DimensionId][])
    .sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
    .slice(0, count)
    .map((d) => d.id);
}
