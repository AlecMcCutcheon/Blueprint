// Presentation order: seeded per-run shuffle with psychometric constraints.
//
// Why not a fixed order: item-order effects (priming, carryover, context) are
// a documented source of bias in self-report instruments — randomization
// "does not eliminate order effects, but it does ensure that this type of bias
// is spread randomly" (Pew Research Center), and avoiding same-dimension
// adjacency reduces dimension-priming streaks (Şahin 2021, "Effect of Item
// Order on Certain Psychometric Properties").
// Why constrained + seeded:
//   - echo pairs (q_a/q_b measuring the same territory twice) always sit far
//     apart — their diagnostic value lives in the distance, so the distance is
//     guaranteed STRUCTURALLY (reserved slot pairs), never left to repair;
//   - same-dimension items don't sit adjacent → the taker's brain can't lock
//     into one mindset and answer on momentum;
//   - affect checks (q96–q98) always come last — they measure *state after
//     the instrument*, which is meaningless if asked up front;
//   - the shuffle is seeded and persisted, so a half-finished run resumes in
//     exactly the same order, and a retake gets a genuinely fresh order.

import { QUESTIONS } from './questions';
import { CONSISTENCY_PAIRS } from './scoring';
import type { DimensionId } from './types';

/** Dimensions each question touches (any option's weights). */
function questionDims(qId: string): Set<DimensionId> {
  const q = QUESTIONS.find((x) => x.id === qId);
  const dims = new Set<DimensionId>();
  if (!q) return dims;
  for (const o of q.options as Array<{ weight?: Record<string, number> }>) {
    for (const d of Object.keys(o.weight ?? {})) dims.add(d as DimensionId);
  }
  return dims;
}

/**
 * Constrained seeded order of the 115 scored core questions. The three state
 * items live in the end-of-run survey and the bonus questions are
 * conflict-triggered — neither belongs to the core presentation order.
 */
export function computeOrder(seed: number): string[] {
  const pool = QUESTIONS.map((q) => q.id);
  const dimsFor = new Map(pool.map((id) => [id, questionDims(id)]));

  // Mulberry32 PRNG — small, fast, stable for a given seed.
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const minEchoDistance = Math.max(12, Math.floor(pool.length * 0.15));
  // Same-dimension items may not sit in ADJACENT positions — items sharing a
  // construct back-to-back are what primes a mindset (Şahin 2021). A wider
  // window was tried and rejected: with ~50% of question pairs sharing at
  // least one dimension, a ±2 window makes the constraint graph dense enough
  // that no feasible ordering reliably exists.
  const minDimensionGap = 1;

  /** Would placing `id` at `at` conflict with an occupied neighbor? */
  const conflictsWithNeighbors = (id: string, at: number, arr: (string | undefined)[]): boolean => {
    const d = dimsFor.get(id);
    if (!d || d.size === 0) return false;
    for (let k = -minDimensionGap; k <= minDimensionGap; k++) {
      if (k === 0) continue;
      const j = at + k;
      if (j < 0 || j >= arr.length) continue;
      const other = arr[j] !== undefined ? dimsFor.get(arr[j] as string) : undefined;
      if (other && [...d].some((x) => other.has(x))) return true;
    }
    return false;
  };

  /** Number of positions violating the adjacency preference. */
  const adjacencyConflicts = (arr: (string | undefined)[]): number => {
    let n = 0;
    for (let i = 0; i < arr.length; i++) {
      const id = arr[i];
      if (id !== undefined && conflictsWithNeighbors(id, i, arr)) n += 1;
    }
    return n;
  };

  const sizeOf = (id: string) => dimsFor.get(id)?.size ?? 0;

  // ── Stage 1: reserve echo-pair slots ──
  // Each consistency pair gets two positions exactly `offset` apart — echo
  // distance holds for every seed by construction. Pair members never move
  // again; everything else is arranged around them.
  const pairs = CONSISTENCY_PAIRS.filter(([a, b]) => pool.includes(a) && pool.includes(b));
  const pairIds = new Set(pairs.flat());
  const nonPair = pool.filter((id) => !pairIds.has(id));
  const arranged = pairs.map(([a, b]) => (rand() < 0.5 ? [a, b] : [b, a]));
  for (let i = arranged.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arranged[i], arranged[j]] = [arranged[j], arranged[i]];
  }

  const N = arranged.length;
  // Preferred geometry: first members every 4 slots, seconds `offset` later.
  // Fallbacks keep the invariants (distinct slots, within-pair distance =
  // offset ≥ minEchoDistance) if the bank changes shape.
  let spacing = 4;
  let offset = minEchoDistance * 3;
  while (spacing > 1 && (N - 1) * spacing + offset > pool.length - 1) spacing--;
  if ((N - 1) * spacing + offset > pool.length - 1 || offset % spacing === 0) {
    offset = pool.length - 2 * N; // always ≥ minEchoDistance for this bank
    spacing = 2;
    if ((N - 1) * spacing + offset > pool.length - 1) spacing = 1;
  }

  const result: (string | undefined)[] = new Array(pool.length);
  arranged.forEach(([a, b], i) => {
    result[i * spacing] = a;
    result[i * spacing + offset] = b;
  });

  // ── Stage 2: fill the remaining slots with adjacency-aware greedy ──
  // Ascending fill; at each slot prefer candidates that conflict with no
  // occupied neighbor, heaviest dim-sets first (entangled questions are hard
  // to place late, flexible fillers are easy). When nothing is clean, take
  // the least-damaging placement.
  // NB: `result` is sparse — `map`/`forEach` skip holes, so enumerate with an
  // explicit index loop.
  const nonPairSlots: number[] = [];
  for (let i = 0; i < result.length; i++) {
    if (result[i] === undefined) nonPairSlots.push(i);
  }
  const remaining = new Set(nonPair);
  for (const at of nonPairSlots) {
    const cands = [...remaining];
    const clean = cands.filter((id) => !conflictsWithNeighbors(id, at, result));
    let tier: string[];
    if (clean.length > 0) {
      const heaviest = Math.max(...clean.map(sizeOf));
      tier = clean.filter((id) => sizeOf(id) === heaviest);
    } else {
      let bestC = Infinity;
      let bestS = -1;
      let best: string[] = [];
      for (const id of cands) {
        result[at] = id;
        const c = adjacencyConflicts(result);
        result[at] = undefined;
        const sz = sizeOf(id);
        if (c < bestC || (c === bestC && sz > bestS)) {
          if (c < bestC) best = [];
          bestC = c;
          bestS = sz;
          best.push(id);
        }
      }
      tier = best;
    }
    const chosen = tier[Math.floor(rand() * tier.length)];
    remaining.delete(chosen);
    result[at] = chosen;
  }

  // ── Stage 3: adjacency polish ──
  // Strict-improvement swaps among NON-pair slots only — pair members are
  // immovable, so the structural echo guarantee is untouched.
  for (let iter = 0; iter < 8000 && adjacencyConflicts(result) > 0; iter++) {
    const conflicted = nonPairSlots.filter((i) => conflictsWithNeighbors(result[i] as string, i, result));
    if (conflicted.length === 0) break;
    const i = conflicted[Math.floor(rand() * conflicted.length)];
    const j = nonPairSlots[Math.floor(rand() * nonPairSlots.length)];
    if (i === j) continue;
    const before = adjacencyConflicts(result);
    [result[i], result[j]] = [result[j], result[i]];
    const after = adjacencyConflicts(result);
    if (after < before) continue;
    [result[i], result[j]] = [result[j], result[i]]; // revert
  }

  return result as string[];
}
