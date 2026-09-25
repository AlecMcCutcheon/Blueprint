// Sensitivity analysis: how much evidence does each dimension actually have,
// how far can ONE answer move it, and which dimensions move together —
// read psychologically, not just mathematically.
//
// Engine model (scoring.ts): a question contributes to dimension d ONLY when
// the chosen option names d — adding w·dw to raw_d and max(0.5,|w|)·dw to M_d.
// Options that never name d contribute nothing. So a dimension's M is built
// exclusively from the questions that can touch it, and single-answer swings
// are 50·Δraw/M — potentially large when few questions name d.
//
// Section A builds an exact balanced baseline (per question, the option
// naming d closest to 0) and measures every single-question flip EXACTLY,
// by re-scoring d from the flipped state.
//
// Usage: npx esbuild scripts/sensitivity.ts --bundle --platform=node --format=cjs --outfile=/tmp/sens.cjs && node /tmp/sens.cjs [sessionJson]
import { readFileSync } from 'fs';
import { QUESTIONS, BONUS_POOL } from '../src/domain/questions';
import { ALL_DIMENSIONS, scoreProfile } from '../src/domain/scoring';
import { TIERS, TIER_BOUNDS } from '../src/domain/dimensions';
import { importSessionJson } from '../src/domain/session';

type Dim = (typeof ALL_DIMENSIONS)[number];
interface Opt { w: Record<string, number> }
const bank = [...QUESTIONS, ...BONUS_POOL].filter((q) => !q.meta && q.options.length > 0);
const options: Opt[][] = bank.map((q) =>
  q.options.map((o) => ({ w: ('weight' in o ? o.weight : {}) as Record<string, number> })),
);
const qdw: number[] = bank.map((q) => q.diagnosticWeight ?? 1);

const widths = TIERS.map((t) => {
  const i = TIERS.indexOf(t as never);
  return TIER_BOUNDS[i] - (i > 0 ? TIER_BOUNDS[i - 1] : 0);
});
console.log(`Tier widths: ${widths.join(', ')} pts — a swing comparable to a tier width means one answer can cross a band\n`);

console.log('═ A. Bank-level evidence structure (exact balanced-baseline flips) ═');
console.log('dim                        touching  n_eff  median-swing  max-swing  max-flip-question');
for (const d of ALL_DIMENSIONS) {
  if (d === 'express_receive_alignment') {
    console.log(`${d.padEnd(26)}         —      —             —          —  (channel-derived, not weight-scored)`);
    continue;
  }
  // Baseline: per question, the option whose |w_d| is smallest (unnamed = 0).
  const baseIdx: number[] = [];
  const baseRaw: number[] = [];
  const baseM: number[] = [];
  for (let qi = 0; qi < bank.length; qi++) {
    let best = -1, bestAbs = Infinity;
    for (let oi = 0; oi < options[qi].length; oi++) {
      const w = d in options[qi][oi].w ? options[qi][oi].w[d] : 0;
      const abs = Math.abs(w);
      if (abs < bestAbs) { bestAbs = abs; best = oi; }
    }
    baseIdx.push(best);
    const w = best >= 0 && d in options[qi][best].w ? options[qi][best].w[d] : 0;
    baseRaw.push(w * qdw[qi]);
    baseM.push(best >= 0 && d in options[qi][best].w ? Math.max(0.5, Math.abs(options[qi][best].w[d])) * qdw[qi] : 0);
  }
  let raw = 0, M = 0;
  for (let qi = 0; qi < bank.length; qi++) { raw += baseRaw[qi]; M += baseM[qi]; }
  const score = (r: number, m: number) => (m > 0 ? Math.max(0, Math.min(100, Math.round(50 + 50 * (r / m)))) : 50);
  const baseScore = score(raw, M);
  // Exact single-flip swings.
  const swings: { pts: number; id: string }[] = [];
  let touching = 0;
  for (let qi = 0; qi < bank.length; qi++) {
    for (let oi = 0; oi < options[qi].length; oi++) {
      if (oi === baseIdx[qi]) continue;
      const w = d in options[qi][oi].w ? options[qi][oi].w[d] : 0;
      const newRaw = raw - baseRaw[qi] + w * qdw[qi];
      const newM = M - baseM[qi] + (d in options[qi][oi].w ? Math.max(0.5, Math.abs(w)) * qdw[qi] : 0);
      const s = score(newRaw, newM);
      const pts = Math.abs(s - baseScore);
      if (pts > 0) {
        swings.push({ pts, id: bank[qi].id });
        if (w !== 0 || baseRaw[qi] !== 0) touching++;
      }
    }
  }
  swings.sort((a, b) => b.pts - a.pts);
  const max = swings[0] ?? { pts: 0, id: '—' };
  const sorted = swings.map((s) => s.pts).sort((a, b) => a - b);
  const med = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  // n_eff over the d-touching questions only (baseline M contributors).
  let Msum = 0, m2sum = 0;
  for (let qi = 0; qi < bank.length; qi++) {
    if (baseM[qi] > 0) { Msum += baseM[qi]; m2sum += baseM[qi] * baseM[qi]; }
  }
  const nEff = m2sum > 0 ? (Msum * Msum) / m2sum : 0;
  console.log(
    `${d.padEnd(26)} ${String(touching).padStart(8)}  ${nEff.toFixed(1).padStart(5)}  ${med.toFixed(1).padStart(10)}  ${max.pts.toFixed(1).padStart(9)}  ${max.id}`,
  );
}

console.log("\n═ B. Session-grounded — same numbers from a real run's contributions ═");
const srcPath = process.argv[2] ?? 'blueprint-session-alec NEW.json';
const parsed = importSessionJson(readFileSync(srcPath, 'utf8'));
const profile = scoreProfile(parsed.answers);
console.log('dim                        answers  n_eff  mean-swing  score');
for (const d of ALL_DIMENSIONS) {
  const v = profile.variance[d];
  const dim = profile.dimensions[d];
  if (!v) { console.log(`${d.padEnd(26)}        0     —           —   ${dim.score}`); continue; }
  const sAbs = v.contributions.reduce((s, c) => s + Math.abs(c), 0);
  const sSq = v.contributions.reduce((s, c) => s + c * c, 0);
  const M = dim.evidence || 1;
  const nEff = sSq > 0 ? (sAbs * sAbs) / sSq : 0;
  const meanSwing = (50 * v.typical) / M;
  console.log(`${d.padEnd(26)} ${String(v.contributions.length).padStart(7)}  ${nEff.toFixed(1).padStart(5)}  ${meanSwing.toFixed(1).padStart(10)}   ${dim.score}`);
}

console.log('\n═ C. Cross-dimension couplings (same answers decide multiple dims) ═');
const pair = new Map<string, { n: number; same: number }>();
for (const opts of options) {
  for (const o of opts) {
    const named = Object.entries(o.w).filter(([, w]) => w !== 0);
    for (let i = 0; i < named.length; i++) {
      for (let j = i + 1; j < named.length; j++) {
        const [a, wa] = named[i];
        const [b, wb] = named[j];
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        const e = pair.get(key) ?? { n: 0, same: 0 };
        e.n++;
        if (Math.sign(wa) === Math.sign(wb)) e.same++;
        pair.set(key, e);
      }
    }
  }
}
const top = [...pair.entries()].sort((x, y) => y[1].n - x[1].n).slice(0, 15);
console.log('pair                                        co-answers  same-direction');
for (const [key, e] of top) {
  const [a, b] = key.split('|');
  console.log(`${`${a} × ${b}`.padEnd(52)} ${String(e.n).padStart(6)}      ${Math.round((e.same / e.n) * 100)}%`);
}
