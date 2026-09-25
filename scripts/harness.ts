// Randomization harness (calibration phase): generate many seeded answer sets,
// run them through the full engine, and aggregate firing rates — which patterns
// never fire (dead), which always fire (overfiring), interplay winner spread,
// variance-note rates, channel-tie rates, tension-card mix, headline counts.
// Usage: npx esbuild scripts/harness.ts --bundle --platform=node --format=cjs --outfile=/tmp/harness.cjs && node /tmp/harness.cjs
import { QUESTIONS } from '../src/domain/questions';
import { scoreProfile, isInternallyDivided } from '../src/domain/scoring';
import { generateBlueprint } from '../src/domain/blueprint';
import { PATTERNS } from '../src/domain/patterns';
import { DIMENSIONS, TIERS, tierOf } from '../src/domain/dimensions';
import type { Answers, DimensionId, ScoredProfile } from '../src/domain/types';

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** bias -1 → pole A (first options / low scale), +1 → pole B, 0 → uniform. */
function makeAnswers(rng: () => number, bias: number): Answers {
  const a: Answers = {};
  const skew = (u: number) =>
    bias === 0 ? u : bias > 0 ? Math.pow(u, 1 / (1 + Math.abs(bias))) : Math.pow(u, 1 + Math.abs(bias));
  for (const q of QUESTIONS) {
    if (q.format === 'agreement') {
      const v = Math.max(1, Math.min(5, 1 + Math.floor(skew(rng()) * 5)));
      a[q.id] = { kind: 'scale', value: v };
    } else {
      const n = q.options.length;
      const idx = Math.min(n - 1, Math.floor(skew(rng()) * n));
      a[q.id] = { kind: 'option', optionId: q.options[idx].id };
    }
  }
  return a;
}

/** Replicates blueprint.ts interplay selection: first applicable key per dimension. */
function interplayWinners(p: ScoredProfile): string[] {
  const out: string[] = [];
  for (const d of DIMENSIONS) {
    if (!d.interplay) continue;
    for (const [key] of Object.entries(d.interplay)) {
      const idx = key.lastIndexOf(':');
      const other = key.slice(0, idx) as DimensionId;
      const spec = key.slice(idx + 1);
      const dir = spec.endsWith('-') ? -1 : 1;
      const n = Number(spec.replace(/[+-]$/, ''));
      const s = p.dimensions[other]?.score;
      if (s === undefined || p.dimensions[other]?.unmeasured) continue;
      const t = TIERS.indexOf(tierOf(s));
      if (dir === -1 ? t <= n : t >= n) { out.push(`${d.id}|${key}`); break; }
    }
  }
  return out;
}

const N_UNIFORM = 300, N_BIASED = 60;
const patternFires = new Map<string, number>();
const interplayFires = new Map<string, number>();
const tensionKinds = new Map<string, number>();
let varianceDocs = 0, varianceNotes = 0;
let crosscurrents = 0, headlineTotal = 0;
let expressNull = 0, receiveNull = 0, receiveBreadth3 = 0, receiveAnswered = 0;
let twoReadings = 0;
const epigraphs = new Map<string, number>();
let docs = 0;

function runSet(answers: Answers): void {
  docs += 1;
  const p = scoreProfile(answers);
  const bp = generateBlueprint(p, answers);
  const allParas = bp.sections.flatMap((s) => s.paragraphs);
  const allText = allParas.join('\n');

  // Patterns: headline by frame marker, inline by narrative opener.
  for (const pat of PATTERNS) {
    const headline = allText.includes(`**${pat.frame}**`);
    const inline = allParas.some((t) => t.startsWith(pat.narrative[0]?.slice(0, 40) ?? '\u0000'));
    if (headline || inline) patternFires.set(pat.id, (patternFires.get(pat.id) ?? 0) + 1);
  }
  // Interplay winners.
  for (const k of interplayWinners(p)) interplayFires.set(k, (interplayFires.get(k) ?? 0) + 1);
  // Variance.
  let vn = 0;
  for (const [dim, v] of Object.entries(p.variance ?? {})) {
    const d = p.dimensions[dim as DimensionId];
    if (!d || d.unmeasured) continue;
    const t = tierOf(d.score);
    if (t !== 'mid' && t !== 'mlow' && t !== 'mhigh') continue;
    if (isInternallyDivided(v!)) vn += 1;
  }
  if (vn > 0) { varianceDocs += 1; varianceNotes += vn; }
  // Tension kinds.
  for (const t of bp.tensions) {
    const kind = t.title.startsWith('Two readings') ? 'two_readings'
      : t.title.startsWith('You give in one language') ? 'channel_mismatch'
      : t.title.startsWith('You respond differently') ? 'ambiguity_update'
      : t.title.startsWith('Your answers agreed') ? 'high_consistency'
      : t.title.startsWith('This blueprint is built from a partial run') ? 'partial_run'
      : t.title.startsWith('One thing this document cannot see') || t.title.startsWith('Things this document cannot see') ? 'unmeasured'
      : 'other';
    tensionKinds.set(kind, (tensionKinds.get(kind) ?? 0) + 1);
    if (kind === 'two_readings') twoReadings += 1;
  }
  // Channels.
  const recAny = Object.values(p.variance ?? {}).length > 0; // raw answers were scored
  if (recAny) {
    if (!p.channels.express) expressNull += 1;
    if (!p.channels.receive) receiveNull += 1;
    if ((p.receiveBreadth ?? 0) >= 3) receiveBreadth3 += 1;
    receiveAnswered += 1;
  }
  // Structure.
  const cross = bp.sections.find((s) => s.id === '__crosscurrents');
  if (cross) { crosscurrents += 1; headlineTotal += cross.paragraphs.length; }
  epigraphs.set(bp.epigraph, (epigraphs.get(bp.epigraph) ?? 0) + 1);
}

const rngU = mulberry32(1234);
for (let i = 0; i < N_UNIFORM; i++) runSet(makeAnswers(rngU, 0));
for (const [label, bias] of [['low', -1], ['high', 1], ['mild-low', -0.4], ['mild-high', 0.4]] as const) {
  const rng = mulberry32(1000 + label.length * 7);
  for (let i = 0; i < N_BIASED; i++) runSet(makeAnswers(rng, bias));
}

console.log(`docs: ${docs} (uniform ${N_UNIFORM} + biased ${N_BIASED * 4})`);
console.log(`\n— patterns (fires / docs) —`);
const patSorted = [...patternFires.entries()].sort((a, b) => b[1] - a[1]);
for (const [id, n] of patSorted) console.log(`  ${String(n).padStart(4)}  ${(100 * n / docs).toFixed(1)}%  ${id}`);
const dead = PATTERNS.filter((p) => !patternFires.has(p.id)).map((p) => p.id);
console.log(`  NEVER FIRED (${dead.length}): ${dead.join(', ') || 'none'}`);

console.log(`\n— interplay winners (top 15) —`);
const ipSorted = [...interplayFires.entries()].sort((a, b) => b[1] - a[1]);
for (const [k, n] of ipSorted.slice(0, 15)) console.log(`  ${String(n).padStart(4)}  ${(100 * n / docs).toFixed(1)}%  ${k}`);
const allKeys = DIMENSIONS.flatMap((d) => Object.keys(d.interplay ?? {}).map((k) => `${d.id}|${k}`));
const deadIp = allKeys.filter((k) => !interplayFires.has(k));
console.log(`  NEVER WON (${deadIp.length}/${allKeys.length}): ${deadIp.join(', ') || 'none'}`);

console.log(`\n— structure —`);
console.log(`  crosscurrents present: ${(100 * crosscurrents / docs).toFixed(1)}% · avg headlines when present: ${(headlineTotal / Math.max(1, crosscurrents)).toFixed(2)}`);
console.log(`  variance: ${(100 * varianceDocs / docs).toFixed(1)}% of docs have ≥1 note · avg ${(varianceNotes / Math.max(1, varianceDocs)).toFixed(2)} notes when present`);
console.log(`  tension cards/doc: two_readings avg ${(twoReadings / docs).toFixed(2)}`);
for (const [k, n] of [...tensionKinds.entries()].sort((a, b) => b[1] - a[1])) console.log(`    ${k}: ${n} (${(100 * n / docs).toFixed(0)}% of docs)`);
console.log(`  channels (raw-answer docs: ${receiveAnswered}): express null ${(100 * expressNull / Math.max(1, receiveAnswered)).toFixed(1)}% · receive null ${(100 * receiveNull / Math.max(1, receiveAnswered)).toFixed(1)}% · receive breadth≥3 ${(100 * receiveBreadth3 / Math.max(1, receiveAnswered)).toFixed(1)}%`);
console.log(`  distinct epigraphs: ${epigraphs.size} · top: ${[...epigraphs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e, n]) => `${n}× "${e.slice(0, 30)}"`).join(' · ')}`);
