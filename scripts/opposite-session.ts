// Builds the "opposite" session: every answer pushes AGAINST the source
// profile, dimension by dimension.
//
// v2 objective (after the first BP6 compare test exposed the flaw): pass 1
// picks the option minimizing Σ w_d · (score_d − 50) — anti-aligned with the
// real profile's DEVIATION from neutral, not its raw level. The old
// raw-level objective let dimensions ride as collateral: an option negative
// on the real profile's 90s could still carry positive weight on desire, and
// "Being Wanted" came out HIGHER than the real person. A repair pass then
// re-answers questions specifically to hunt down dimensions that failed to
// diverge (target: ≥60 points of separation in the opposing direction, both
// ways — low real scores get pushed UP).
//
// Usage: npx esbuild scripts/opposite-session.ts --bundle --platform=node --format=cjs --outfile=/tmp/opp.cjs && node /tmp/opp.cjs [sourceSession] [outPath]
import { readFileSync, writeFileSync } from 'fs';
import { importSessionJson } from '../src/domain/session';
import { scoreProfile } from '../src/domain/scoring';
import { QUESTIONS, BONUS_POOL, type Question } from '../src/domain/questions';
import { profileToCode6 } from '../src/domain/share';

const srcPath = process.argv[2] ?? 'blueprint-session-alec NEW.json';
const outPath = process.argv[3] ?? 'blueprint-session-OPPOSITE.json';

const parsed = importSessionJson(readFileSync(srcPath, 'utf8'));
const profile = scoreProfile(parsed.answers);
const realScore = new Map<string, number>();
for (const d of Object.values(profile.dimensions)) realScore.set(d.id, d.score);
const dev = (dim: string) => (realScore.get(dim) ?? 50) - 50;

const bank = [...QUESTIONS, ...BONUS_POOL].filter((q) => q.options.length > 0);

/** Anti-alignment with the real profile's deviation from neutral. */
function antiAgreement(q: Question, optionId: string): number {
  const opt = q.options.find((o) => o.id === optionId);
  if (!opt || !('weight' in opt)) return 0;
  let sum = 0;
  for (const [dim, w] of Object.entries(opt.weight as Record<string, number>)) {
    sum += w * dev(dim);
  }
  return sum;
}

const answers: Record<string, { kind: 'option'; optionId: string }> = {};
for (const q of bank) {
  let best = q.options[0].id;
  let bestA = Infinity;
  for (const opt of q.options) {
    const a = antiAgreement(q, opt.id);
    if (a < bestA) { bestA = a; best = opt.id; }
  }
  answers[q.id] = { kind: 'option', optionId: best };
}

/** Dimensions still short of the 60-point separation target. */
function offendersOf(p: ReturnType<typeof scoreProfile>): string[] {
  const out: string[] = [];
  for (const d of Object.values(p.dimensions)) {
    const real = realScore.get(d.id);
    if (real === undefined) continue;
    const sep = real >= 50 ? real - d.score : d.score - real;
    if (sep < 60) out.push(d.id);
  }
  return out;
}

// ── Repair pass: re-answer questions to fix dims that failed to diverge ──
// Urgency-weighted, target-aware, keep-best. A dim's separation target is
// min(60, reachable maximum) — a dim whose real score is 57 can only ever
// reach ~43 separation, so demanding 60 there means the repair never ends and
// it outbids everything forever. Best-snapshot keeps earlier wins from being
// spent as collateral by later passes (the frozen-pass churn lesson).
const targetFor = (real: number, pushingDown: boolean): number =>
  Math.min(60, (pushingDown ? real : 100 - real) - 2);
const meetsTarget = (d: { id: string; score: number }): boolean => {
  const real = realScore.get(d.id);
  if (real === undefined) return true;
  const pushingDown = real >= 50;
  const sep = pushingDown ? real - d.score : d.score - real;
  return sep >= targetFor(real, pushingDown);
};
const scoreAnswers = (a: Record<string, { kind: 'option'; optionId: string }>): number =>
  Object.values(scoreProfile(a).dimensions).filter(meetsTarget).length;

let bestAnswers = { ...answers };
let bestScore = scoreAnswers(bestAnswers);
for (let iter = 0; iter < 8; iter++) {
  const current = scoreProfile(answers);
  const urgency = new Map<string, number>();
  for (const d of Object.values(current.dimensions)) {
    const real = realScore.get(d.id);
    if (real === undefined) continue;
    const pushingDown = real >= 50;
    const sep = pushingDown ? real - d.score : d.score - real;
    const target = targetFor(real, pushingDown);
    const u = sep < target ? (target - sep) / 10 : 0;
    if (u > 0) urgency.set(d.id, u);
  }
  if (urgency.size === 0) break;
  const repairGain = (opt: { weight: unknown }): number => {
    let sum = 0;
    for (const [dim, w] of Object.entries(opt.weight as Record<string, number>)) {
      const u = urgency.get(dim);
      if (u) sum -= w * dev(dim) * u;
    }
    return sum;
  };
  let swaps = 0;
  for (const q of bank) {
    const cur = q.options.find((o) => o.id === answers[q.id].optionId);
    const curGain = cur ? repairGain(cur) : 0;
    let bestId = answers[q.id].optionId;
    let bestGain = curGain;
    for (const opt of q.options) {
      const g = repairGain(opt);
      if (g > bestGain + 1e-9) { bestGain = g; bestId = opt.id; }
    }
    if (bestId !== answers[q.id].optionId) {
      answers[q.id] = { kind: 'option', optionId: bestId };
      swaps++;
    }
  }
  const s = scoreAnswers(answers);
  if (s > bestScore) { bestScore = s; bestAnswers = { ...answers }; }
  if (swaps === 0 || s >= Object.keys(current.dimensions).length) break;
}
for (const k of Object.keys(bestAnswers)) answers[k] = bestAnswers[k];

// ── Last resort: single-dimension pursuit for whatever is still glued ──
// Some banks are almost uniformly pro-construct (desire: wanting is framed
// healthy nearly everywhere), so their few negative options lose every
// contested swap. This pass optimizes ONLY the worst straggler and accepts
// the result only if the victim actually crosses its target and collateral
// stays bounded.
for (let iter = 0; iter < 3; iter++) {
  const current = scoreProfile(answers);
  const stragglers = Object.values(current.dimensions).filter((d) => !meetsTarget(d));
  if (stragglers.length === 0) break;
  const victim = stragglers.sort((a, b) => {
    const ra = realScore.get(a.id) ?? 50;
    const rb = realScore.get(b.id) ?? 50;
    const sepA = ra >= 50 ? ra - a.score : a.score - ra;
    const sepB = rb >= 50 ? rb - b.score : b.score - rb;
    return sepA - sepB;
  })[0];
  const real = realScore.get(victim.id) ?? 50;
  const pushingDown = real >= 50;
  const wFor = (opt: { weight: unknown }): number => {
    const w = (opt.weight as Record<string, number>)[victim.id] ?? 0;
    return pushingDown ? w : -w;
  };
  const trial: Record<string, { kind: 'option'; optionId: string }> = {};
  for (const q of bank) {
    let bestId = q.options[0].id;
    let bestW = Infinity;
    for (const opt of q.options) {
      const w = wFor(opt);
      if (w < bestW) { bestW = w; bestId = opt.id; }
    }
    trial[q.id] = { kind: 'option', optionId: bestId };
  }
  const trialProfile = scoreProfile(trial);
  const trialMeets = Object.values(trialProfile.dimensions).filter(meetsTarget).length;
  if (meetsTarget(trialProfile.dimensions[victim.id]) && trialMeets >= bestScore - 2) {
    for (const k of Object.keys(trial)) answers[k] = trial[k];
    bestAnswers = { ...trial };
    bestScore = trialMeets;
  } else break;
}

const session = {
  format: 'blueprint-session',
  version: 1,
  exported: new Date().toISOString(),
  name: 'Opposite',
  orderSeed: 1,
  answers,
};

writeFileSync(outPath, JSON.stringify(session, null, 2) + '\n');

// Print the resulting profile vs the source for a quick flip check.
const oppProfile = scoreProfile(answers);
const rows: string[] = [];
for (const d of Object.values(oppProfile.dimensions)) {
  const real = profile.dimensions[d.id];
  rows.push(`${d.id.padEnd(26)} real=${String(real?.score ?? '—').padStart(3)}  opposite=${String(d.score).padStart(3)}  flipped=${(real && Math.abs(real.score - d.score) > 15) ? 'YES' : 'no'}`);
}
console.log(rows.join('\n'));
const flipped = rows.filter((r) => r.endsWith('YES')).length;
console.log(`\n${flipped}/${rows.length} dimensions moved by >15 points`);
const stuck = Object.values(oppProfile.dimensions).filter((d) => {
  const real = realScore.get(d.id);
  return real !== undefined && Math.abs(real - d.score) <= 15;
});
if (stuck.length) console.log(`still close to real: ${stuck.map((d) => d.id).join(', ')}`);
console.log(`\nBP6 code:\n${profileToCode6(oppProfile)}`);
