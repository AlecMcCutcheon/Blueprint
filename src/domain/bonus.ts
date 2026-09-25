// Conflict detection for the end-of-run clarifying questions.
//
// When two echo-pair answers disagree, the blueprint names the trade-off — and
// a clarifying question for the conflicted territory can help decide which
// pull actually leads. These questions are NOT a post-hoc patch anymore: they
// are appended to the tail of the run (after the core 100, before review) and
// scored in the main pass like any other item (see scoring.ts). This module
// only decides WHICH clarifiers are worth asking, and in what order.
//
// Selection: pair-level disagreement, weighted by the pair's magnitude and the
// dimension's tier extremity — a conflict on a dimension the person genuinely
// inhabits is more informative than one on a mid dimension. Deterministic for
// a given profile: no randomness in what gets offered. Every profile gets the
// full complement of clarifiers where the bank has one — mild-or-no-conflict
// dimensions still contribute evidence ("resolution" data), following the
// ranked order.

import { BONUS_POOL } from './questions';
import { TIERS, tierOf } from './dimensions';
import type { DimensionId, ScoredProfile } from './types';

export interface ConflictSignal {
  dimension: DimensionId;
  /** Worst pair agreement feeding this signal (0–100, lower = worse). */
  worstAgreement: number;
  /** How many disagreeing pairs feed this dimension. */
  pairCount: number;
  /** Bonus question id for this dimension (when one exists). */
  qId: string | null;
}

/** How far the dimension sits from the middle tier, 0 (mid) → 1 (extreme). */
function tierWeight(id: DimensionId, p: ScoredProfile): number {
  const s = p.dimensions[id]?.score;
  if (s === undefined) return 0;
  return Math.abs(TIERS.indexOf(tierOf(s)) - 3) / 3;
}

/**
 * Rank dimensions whose echo-pair agreements are low enough to warrant a
 * clarifying question. Up to 3 returned, worst first. A pair must be below
 * 50 to count at all (mild disagreements are signal, not crisis).
 */
export function findConflicts(p: ScoredProfile): ConflictSignal[] {
  const byDim = new Map<DimensionId, { worst: number; count: number }>();
  for (const c of p.consistency) {
    if (c.dimension === 'ambiguity_update') continue;
    if (c.agreement >= 50) continue;
    const dim = c.dimension as DimensionId;
    const cur = byDim.get(dim) ?? { worst: 100, count: 0 };
    cur.worst = Math.min(cur.worst, c.agreement);
    cur.count += 1;
    byDim.set(dim, cur);
  }
  const signals: ConflictSignal[] = [];
  for (const [dim, { worst, count }] of byDim) {
    const q = BONUS_POOL.find((b) => b.bonusFor === dim);
    signals.push({
      dimension: dim,
      worstAgreement: worst,
      pairCount: count,
      qId: q ? q.id : null,
    });
  }
  signals.sort((a, b) => {
    const ea = (50 - a.worstAgreement) * (1 + tierWeight(a.dimension, p)) * (1 + 0.25 * (a.pairCount - 1));
    const eb = (50 - b.worstAgreement) * (1 + tierWeight(b.dimension, p)) * (1 + 0.25 * (b.pairCount - 1));
    return eb - ea;
  });
  return signals.filter((s) => s.qId !== null).slice(0, 3);
}

/**
 * The clarifying questions to append to this run, in priority order: real
 * conflicts first (most meaningful clarification potential), then remaining
 * bank items as evidence-collecting resolution questions — every profile
 * reaches the advertised 100, and a clean run's answers still sharpen three
 * territories.
 */
export function bonusQuestionsFor(p: ScoredProfile) {
  const ranked = findConflicts(p)
    .map((sig) => BONUS_POOL.find((q) => q.id === sig.qId))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));
  const rest = BONUS_POOL.filter((q) => !ranked.includes(q));
  return [...ranked, ...rest];
}
