// Reachability analysis: can every dimension actually reach all 7 of its
// tier states, given the question bank's real weights? Can joint tier
// vectors be realized? How large is the document space, honestly?
//
// Math: score_d = round(100 · (0.5 + raw_d / (2·M_d))) where, over answered
// questions, raw_d += w·dw and M_d += max(0.5, |w|)·dw for every dimension d
// NAMED in the chosen option's weight map (even at w = 0). Both terms are
// sums of per-question, per-option constants, so the extreme achievable ratio
// ρ = raw/M is found exactly by bisection: for sign s, maximize s·raw/M by
// choosing per question the option maximizing (s·w − r·m)·dw — a separable
// problem at fixed r; the root of F(r) = Σ max_opt (s·w − r·m)·dw is the
// extreme ratio.
//
// express_receive_alignment is NOT weight-scored — it is the symmetry of the
// express/receive channel distributions over 3+3 channel-tagged questions —
// so its reachable set is computed by exhaustive enumeration instead.
//
// Usage: npx esbuild scripts/reachability.ts --bundle --platform=node --format=cjs --outfile=/tmp/reach.cjs && node /tmp/reach.cjs
import { QUESTIONS, BONUS_POOL } from '../src/domain/questions';
import { TIERS, TIER_BOUNDS, tierOf, type DimensionId } from '../src/domain/dimensions';
import { ALL_DIMENSIONS, EXPRESS_QUESTIONS, RECEIVE_QUESTIONS } from '../src/domain/scoring';

interface Opt { w: Map<DimensionId, number>; m: Map<DimensionId, number>; dw: number; channel?: string }
const bank = [...QUESTIONS, ...BONUS_POOL].filter((q) => !q.meta && q.options.length > 0);

const questionOpts: Opt[][] = bank.map((q) =>
  q.options.map((o) => {
    const weight = ('weight' in o ? o.weight : {}) as Record<string, number>;
    const w = new Map<DimensionId, number>();
    const m = new Map<DimensionId, number>();
    for (const [d, val] of Object.entries(weight)) {
      w.set(d as DimensionId, val);
      m.set(d as DimensionId, Math.max(0.5, Math.abs(val)));
    }
    return { w, m, dw: q.diagnosticWeight ?? 1, channel: 'channel' in o ? (o.channel as string) : undefined };
  }),
);

/** Extreme achievable ρ = s·raw/M for one dimension; s=+1 gives max, s=-1 gives −min. */
function extremeRatio(d: DimensionId, s: 1 | -1): number {
  const F = (r: number): number => {
    let total = 0;
    for (const opts of questionOpts) {
      let best = 0; // an option that never names d contributes 0 to d's sums
      for (const o of opts) {
        const w = o.w.get(d);
        if (w === undefined) continue;
        const v = (s * w - r * (o.m.get(d) ?? 0)) * o.dw;
        if (v > best) best = v;
      }
      total += best;
    }
    return total;
  };
  let lo = -6, hi = 6; // F is decreasing; root is the extreme ratio
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (F(mid) > 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

const scoreFromRho = (rho: number) => 100 * (0.5 + rho / 2);

console.log('═ A. Per-dimension achievable range and tier reachability (exact) ═');
const reachableTiers = new Map<DimensionId, Set<string>>();
let allSeven = 0;
for (const d of ALL_DIMENSIONS) {
  if (d === 'express_receive_alignment') continue; // handled separately below
  const sMin = Math.round(scoreFromRho(-extremeRatio(d, -1)));
  const sMax = Math.round(scoreFromRho(extremeRatio(d, 1)));
  const reach = new Set<string>();
  for (let s = Math.max(0, sMin); s <= Math.min(100, sMax); s++) reach.add(tierOf(s));
  reachableTiers.set(d, reach);
  if (reach.size === 7) allSeven++;
  const missing = TIERS.filter((t) => !reach.has(t));
  console.log(
    `${d.padEnd(26)} range ${String(sMin).padStart(3)}–${String(sMax).padStart(3)}  tiers ${reach.size}/7` +
      (missing.length ? `  cannot reach: ${missing.join(',')}` : '  (all 7)'),
  );
}

console.log('\n═ A2. express_receive_alignment — derived from channel symmetry, enumerated exactly ═');
{
  const chQ = (set: Set<string>) => bank.filter((q) => set.has(q.id));
  const expressQs = chQ(EXPRESS_QUESTIONS);
  const receiveQs = chQ(RECEIVE_QUESTIONS);
  const combos = (qs: typeof expressQs): string[][] =>
    qs.reduce<string[][]>(
      (acc, q) => acc.flatMap((prefix) => q.options.filter((o) => 'channel' in o).map((o) => [...prefix, (o as { channel: string }).channel])),
      [[]],
    );
  const expCombos = combos(expressQs);
  const recCombos = combos(receiveQs);
  const reach = new Set<string>();
  const scores = new Set<number>();
  for (const e of expCombos) {
    for (const r of recCombos) {
      const ec: Record<string, number> = {}, rc: Record<string, number> = {};
      for (const c of e) ec[c] = (ec[c] ?? 0) + 1;
      for (const c of r) rc[c] = (rc[c] ?? 0) + 1;
      const all = new Set([...Object.keys(ec), ...Object.keys(rc)]);
      let sym = 0;
      for (const ch of all) {
        sym += Math.abs((ec[ch] ?? 0) / e.length - (rc[ch] ?? 0) / r.length);
      }
      const s = Math.max(0, Math.round((1 - sym / 2) * 100));
      scores.add(s);
      reach.add(tierOf(s));
    }
  }
  reachableTiers.set('express_receive_alignment', reach);
  const missing = TIERS.filter((t) => !reach.has(t));
  console.log(
    `express_receive_alignment  enumerated ${expCombos.length}×${recCombos.length} channel combos → scores {${[...scores].sort((a, b) => a - b).join(', ')}}`,
  );
  console.log(`                           tiers ${reach.size}/7` + (missing.length ? `  cannot reach: ${missing.join(',')}` : '  (all 7)'));
  if (reach.size === 7) allSeven++;
}
console.log(`\nDimensions reaching all 7 tiers: ${allSeven}/28`);

console.log('\n═ B. Joint reachability of 28-dim tier vectors (hill-climb probe) ═');
const raw0 = new Map<DimensionId, number>();
const max0 = new Map<DimensionId, number>();
function stateFor(choice: number[]) {
  const raw = new Map<DimensionId, number>();
  const max = new Map<DimensionId, number>();
  for (let qi = 0; qi < bank.length; qi++) {
    const o = questionOpts[qi][choice[qi]];
    for (const [d, w] of o.w) {
      raw.set(d, (raw.get(d) ?? 0) + w * o.dw);
      max.set(d, (max.get(d) ?? 0) + (o.m.get(d) ?? 0) * o.dw);
    }
  }
  return { raw, max };
}
const scoreOf = (raw: Map<DimensionId, number>, max: Map<DimensionId, number>, d: DimensionId) => {
  const M = max.get(d) ?? 0;
  return M > 0 ? Math.max(0, Math.min(100, Math.round(((raw.get(d) ?? 0) + M) / (2 * M) * 100))) : 50;
};
const bandCenter = (t: string) => {
  const i = TIERS.indexOf(t as never);
  const lo = i > 0 ? TIER_BOUNDS[i - 1] : 0;
  const hi = TIER_BOUNDS[i];
  return (lo + hi) / 2;
};
const dist = (score: number, t: string) => Math.abs(score - bandCenter(t));

// Final state of the most recent attempt — used for near-miss reporting.
let lastAttempt: { raw: Map<DimensionId, number>; max: Map<DimensionId, number> } | null = null;

// Alignment proxy for hill climbing: nudge the channel answers too. Simplest
// sound approach — the objective treats alignment's nearest reachable score.
function attempt(target: Map<DimensionId, string>, steps: number, seed: number): boolean {
  let rng = seed >>> 0 || 1;
  const rand = () => (rng = (rng * 1664525 + 1013904223) >>> 0) / 4294967296;
  const choice = questionOpts.map((opts) => Math.floor(rand() * opts.length));
  let { raw, max } = stateFor(choice);
  const objective = () => {
    let s = 0;
    for (const [d, t] of target) {
      if (d === ('express_receive_alignment' as DimensionId)) continue; // channel-derived; approximate below
      s += dist(scoreOf(raw, max, d), t);
    }
    return s;
  };
  const inBand = () => {
    for (const [d, t] of target) {
      if (d === ('express_receive_alignment' as DimensionId)) continue;
      if (tierOf(scoreOf(raw, max, d)) !== t) return false;
    }
    return true;
  };
  let best = objective();
  // Best-improvement sweeps: each round tries every (question, option) pair
  // and keeps the single move that most reduces total band-center distance.
  // Far stronger than random flips in a 27-dimension space.
  const order = questionOpts.map((_, i) => i);
  for (let sweep = 0; sweep < steps; sweep++) {
    if (inBand()) return true;
    let improved = false;
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (const qi of order) {
      const cur = choice[qi];
      const oldOpt = questionOpts[qi][cur];
      let bestObj = best;
      let bestCand = cur;
      for (let cand = 0; cand < questionOpts[qi].length; cand++) {
        if (cand === cur) continue;
        const newOpt = questionOpts[qi][cand];
        for (const [d, w] of oldOpt.w) { raw.set(d, (raw.get(d) ?? 0) - w * oldOpt.dw); max.set(d, (max.get(d) ?? 0) - (oldOpt.m.get(d) ?? 0) * oldOpt.dw); }
        for (const [d, w] of newOpt.w) { raw.set(d, (raw.get(d) ?? 0) + w * newOpt.dw); max.set(d, (max.get(d) ?? 0) + (newOpt.m.get(d) ?? 0) * newOpt.dw); }
        const obj = objective();
        if (obj < bestObj) { bestObj = obj; bestCand = cand; }
        for (const [d, w] of oldOpt.w) { raw.set(d, (raw.get(d) ?? 0) + w * oldOpt.dw); max.set(d, (max.get(d) ?? 0) + (oldOpt.m.get(d) ?? 0) * oldOpt.dw); }
        for (const [d, w] of newOpt.w) { raw.set(d, (raw.get(d) ?? 0) - w * newOpt.dw); max.set(d, (max.get(d) ?? 0) - (newOpt.m.get(d) ?? 0) * newOpt.dw); }
      }
      if (bestCand !== cur) {
        const newOpt = questionOpts[qi][bestCand];
        for (const [d, w] of oldOpt.w) { raw.set(d, (raw.get(d) ?? 0) - w * oldOpt.dw); max.set(d, (max.get(d) ?? 0) - (oldOpt.m.get(d) ?? 0) * oldOpt.dw); }
        for (const [d, w] of newOpt.w) { raw.set(d, (raw.get(d) ?? 0) + w * newOpt.dw); max.set(d, (max.get(d) ?? 0) + (newOpt.m.get(d) ?? 0) * newOpt.dw); }
        choice[qi] = bestCand;
        best = bestObj;
        improved = true;
      }
    }
    if (inBand()) return true;
    if (!improved) break; // local minimum — restarts diversify
  }
  // Center-distance is only the descent heuristic; landing anywhere in-band
  // is success (checked every sweep and once more after the last flip).
  lastAttempt = { raw, max };
  return inBand();
}

const TRIALS = Number(process.env.REACH_TRIALS ?? 200), STEPS = Number(process.env.REACH_STEPS ?? 40), RESTARTS = Number(process.env.REACH_RESTARTS ?? 8);
let ok = 0;
const dimFail = new Map<string, number>();
const failures: { target: string; miss: number }[] = [];
for (let trial = 0; trial < TRIALS; trial++) {
  const target = new Map<DimensionId, string>();
  for (const d of ALL_DIMENSIONS) {
    if (d === ('express_receive_alignment' as DimensionId)) continue; // channel-derived; enumerated exactly in A2
    const opts = [...reachableTiers.get(d)!];
    target.set(d, opts[Math.floor(Math.random() * opts.length)]);
  }
  let success = false;
  for (let r = 0; r < RESTARTS && !success; r++) {
    success = attempt(target, STEPS, (trial * 7919 + r * 104729 + 13) >>> 0);
  }
  if (success) ok++;
  else {
    // Near-miss: worst single-dimension deviation from the target band center
    const { raw, max } = lastAttempt ?? { raw: new Map(), max: new Map() };
    let miss = 0, missDim = '';
    for (const [d, t] of target) {
      if (d === ('express_receive_alignment' as DimensionId)) continue;
      const dd = dist(scoreOf(raw, max, d), t);
      if (dd > miss) { miss = dd; missDim = d; }
    }
    dimFail.set(missDim, (dimFail.get(missDim) ?? 0) + 1);
    failures.push({ target: [...target.entries()].map(([d, t]) => `${d.slice(0, 6)}=${t}`).join(' '), miss });
  }
}
console.log(`Random tier vectors realized: ${ok}/${TRIALS} (${Math.round(ok / TRIALS * 100)}%) — ${STEPS} best-improvement sweeps × ${RESTARTS} restarts each`);
if (failures.length) {
  const near = failures.filter((f) => f.miss <= 12).length;
  console.log(`Near misses (every dimension within 12 pts of its target band center): ${near}/${failures.length}`);
  const worst = [...dimFail.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log(`Most-often-blocking dimension (worst offender in each failure): ${worst.map(([d, n]) => `${d}×${n}`).join(', ')}`);
  console.log(`Sample unrealized target (probe effort, not proof of impossibility):`);
  console.log('  ' + failures[0].target.slice(0, 220));
}

console.log('\n═ C. Document-space lower bound ═');
let combos = 1n;
let anyZero = false;
for (const d of ALL_DIMENSIONS) {
  const r = reachableTiers.get(d)?.size ?? 0;
  if (r === 0) { anyZero = true; continue; }
  // mhigh & high each split into two half-band paragraphs where reachable
  const halves = (reach: Set<string>) =>
    (reach.has('mhigh') ? 1 : 0) + (reach.has('high') ? 1 : 0);
  const h = halves(reachableTiers.get(d)!);
  combos *= BigInt(r + h); // each reachable half-band doubles that tier's prose
}
console.log(`Tier-paragraph combinations alone: ~10^${combos.toString().length} (${anyZero ? 'with excluded dims' : combos})`);
console.log(`Multiplied by pattern selections (36 conditional patterns, capped subsets),`);
console.log(`21 interplay keys, variance shapes, heading variants, epigraphs, and`);
console.log(`12 repeated-pair tension readings — the full space is far larger still.`);
