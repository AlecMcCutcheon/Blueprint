// Synthesis closer audit: the closing section composes conditional signal
// families, so the way to test it is corpus-wide structure stats plus the
// edge cases where signals go absent — no highs, partial runs, legacy share
// codes with unmeasured dimensions, and a three-answer run. Mechanical
// defects (render leaks, double spaces, lowercase standalone "i" from
// note-lowercasing) fail the audit.
// Usage: npx esbuild scripts/synthesis-audit.ts --bundle --platform=node --format=cjs --outfile=/tmp/syna.cjs && node /tmp/syna.cjs [runs]
import { QUESTIONS, BONUS_POOL } from '../src/domain/questions';
import { scoreProfile } from '../src/domain/scoring';
import { generateBlueprint } from '../src/domain/blueprint';
import { encodeLegacyCode, decodeProfile } from '../src/domain/share';
import type { Answers } from '../src/domain/types';

let s = 0x2545f491;
const rand = () => {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function randomAnswers(): Answers {
  const answers: Answers = {};
  for (const q of [...QUESTIONS, ...BONUS_POOL]) {
    const o = q.options[Math.floor(rand() * q.options.length)];
    answers[q.id] = 'value' in o ? { kind: 'scale', value: (o as { value: number }).value } : { kind: 'option', optionId: o.id };
  }
  return answers;
}

const RUNS = Number(process.argv[2] ?? 300);
let noHighs = 0, withLow = 0, withSpine = 0, withDivided = 0, withChannel = 0, fallbackWord = 0;
let minShape = 99, maxShape = 0;
const finalWords = new Map<string, number>();
let moduleSum = 0, moduleMax = 0;
const defects: string[] = [];
let sampleNoHighs: string | null = null;

for (let run = 0; run < RUNS; run++) {
  const profile = scoreProfile(randomAnswers());
  const bp = generateBlueprint(profile);
  const syn = bp.sections.find((x) => x.id === '__synthesis');
  if (!syn) { defects.push('missing synthesis section'); continue; }
  const shape = syn.paragraphs.slice(1, -1);
  minShape = Math.min(minShape, shape.length);
  maxShape = Math.max(maxShape, shape.length);
  const all = syn.paragraphs.join('\n');
  const fw = syn.paragraphs[syn.paragraphs.length - 1] ?? '';
  finalWords.set(fw, (finalWords.get(fw) ?? 0) + 1);
  const nMod = (fw.match(/One complication this dynamic|A second current held|Worth one more layer/g) ?? []).length;
  moduleSum += nMod;
  moduleMax = Math.max(moduleMax, nMod);
  if (/is still more assembly than inheritance/.test(all)) {
    noHighs += 1;
    if (!sampleNoHighs) sampleNoHighs = shape.join('\n\n');
  }
  if (all.includes('What it would not ask of you')) withLow += 1;
  if (/spine of this document|has a spine|doing the most work/.test(all)) withSpine += 1;
  if (/two-valued rather than settled|still negotiating rather than settled|negotiating than settled/.test(all)) withDivided += 1;
  if (all.includes('two different languages')) withChannel += 1;
  if (all.includes('cannot yet do is name')) fallbackWord += 1;
  for (const p of syn.paragraphs) {
    if (p.includes('undefined') || p.includes('[object')) defects.push(`render leak: ${p.slice(0, 70)}`);
    if (/  +/.test(p)) defects.push(`double space: ${p.slice(0, 70)}`);
    if (/\bi\b/.test(p)) defects.push(`lowercase standalone i: ${p.slice(0, 70)}`);
    if (/  ?[.,;!?]/.test(p)) defects.push(`spaced punctuation: ${p.slice(0, 70)}`);
  }
}

console.log(`═ Synthesis closer audit over ${RUNS} seeded full-bank runs ═`);
console.log(`shape sentences per doc: min ${minShape} · max ${maxShape}`);
console.log(`no-highs fallback (assembly-not-inheritance): ${noHighs} (${((100 * noHighs) / RUNS).toFixed(0)}%)`);
console.log(`low bound ("would not ask of you"): ${withLow} (${((100 * withLow) / RUNS).toFixed(0)}%)`);
console.log(`spine sentence (dominant interaction): ${withSpine} (${((100 * withSpine) / RUNS).toFixed(0)}%)`);
console.log(`divided-dimension sentence: ${withDivided} (${((100 * withDivided) / RUNS).toFixed(0)}%)`);
console.log(`channel-asymmetry sentence: ${withChannel} (${((100 * withChannel) / RUNS).toFixed(0)}%)`);
console.log(`fallback final word (no headline to key on): ${fallbackWord} (${((100 * fallbackWord) / RUNS).toFixed(0)}%)`);
console.log(`composed endings: ${finalWords.size} distinct across ${RUNS} docs · modules per ending avg ${(moduleSum / RUNS).toFixed(2)} max ${moduleMax} · top: ${[...finalWords.entries()].sort((a, b) => b[1] - a[1])[0]?.[1]}×`);
if (sampleNoHighs) console.log(`\n— sample no-highs closer —\n${sampleNoHighs.slice(0, 600)}`);

// Edge case: legacy share codes (BP1–BP3) — many dimensions unmeasured, so
// the highs/lows/spine signals vanish; the closer must still render honestly.
{
  const full = scoreProfile(randomAnswers());
  for (const ver of [0, 1, 2] as const) {
    const legacy = decodeProfile(encodeLegacyCode(full, ver));
    if (!legacy) { defects.push(`BP${ver + 1} decode failed`); continue; }
    const bp = generateBlueprint(legacy);
    const syn = bp.sections.find((x) => x.id === '__synthesis');
    if (!syn) { defects.push(`BP${ver + 1}: missing synthesis`); continue; }
    if (syn.paragraphs.some((p) => p.includes('undefined'))) defects.push(`BP${ver + 1}: render leak`);
    console.log(`BP${ver + 1} legacy closer: ${syn.paragraphs.length} paragraphs · fallback branch ${/assembly than inheritance/.test(syn.paragraphs.join(' ')) ? 'used' : 'not needed'}`);
  }

  // Edge case: a three-answer run — no consistency pairs, mostly unmeasured,
  // partial-run tension present. Nothing may crash, leak, or fabricate.
  const tinyAnswers: Answers = {};
  for (const q of QUESTIONS.slice(0, 3)) {
    const o = q.options[0];
    tinyAnswers[q.id] = 'value' in o
      ? { kind: 'scale', value: (o as { value: number }).value }
      : { kind: 'option', optionId: o.id };
  }
  const tiny = scoreProfile(tinyAnswers);
  const tinyBp = generateBlueprint(tiny);
  const tinySyn = tinyBp.sections.find((x) => x.id === '__synthesis');
  if (!tinySyn) { defects.push('tiny run: missing synthesis'); } else {
    if (tinySyn.paragraphs.some((p) => p.includes('undefined') || p.includes('NaN'))) defects.push('tiny run: leak/NaN');
    console.log(`tiny run (3 answers): ${tinySyn.paragraphs.length} paragraphs · ${tinySyn.paragraphs[1]?.slice(0, 90)}…`);
  }
}

if (defects.length > 0) {
  console.error(`\nFAIL (${defects.length}):`);
  for (const d of [...new Set(defects)].slice(0, 8)) console.error(`  ${d}`);
  process.exit(1);
}
console.log('\nSYNTHESIS AUDIT PASSED');
