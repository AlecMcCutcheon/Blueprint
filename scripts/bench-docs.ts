// Benchmarks over generated documents: statistical structure, stitching
// quality, and mechanical defects across hundreds of seeded random full-bank
// runs. This measures what the engine actually emits, not what we hope:
//   A. Tier shape — distribution of tier labels across dimensions/runs.
//   B. Cross-run overlap — % of paragraphs two random docs share (target: low).
//   C. Stitch defects — the same 6-word clause appearing twice inside one
//      paragraph (modifier/continuation echoes), opener reuse within a section,
//      adjacent paragraphs starting with the same 3 words.
//   D. Mechanical defects — double spaces, spaced punctuation, repeated words,
//      unbalanced smart quotes.
//   E. Opener diversity — share of dimension paragraphs led by the single most
//      common opener (flagging monotone sections).
//
// Usage: npx esbuild scripts/bench-docs.ts --bundle --platform=node --format=cjs --outfile=/tmp/bench.cjs && node /tmp/bench.cjs [runs]
import { QUESTIONS, BONUS_POOL } from '../src/domain/questions';
import { scoreProfile, type Answers } from '../src/domain/scoring';
import { generateBlueprint } from '../src/domain/blueprint';
import { TIERS, TIER_LABELS } from '../src/domain/dimensions';

const RUNS = Number(process.argv[2] ?? 300);

// Deterministic RNG so every invocation benchmarks the same corpus.
let s = 0x2545f491;
const rand = () => {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function randomAnswers(): Answers {
  const answers: Answers = {};
  for (const q of QUESTIONS) {
    const o = q.options[Math.floor(rand() * q.options.length)];
    answers[q.id] = 'value' in o ? { kind: 'scale', value: (o as { value: number }).value } : { kind: 'option', optionId: o.id };
  }
  for (const q of BONUS_POOL) {
    const o = q.options[Math.floor(rand() * q.options.length)];
    answers[q.id] = 'value' in o ? { kind: 'scale', value: (o as { value: number }).value } : { kind: 'option', optionId: o.id };
  }
  return answers;
}

function shingles(text: string, n: number): Map<string, number> {
  const words = text.toLowerCase().replace(/[—–]/g, ' ').replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
  const map = new Map<string, number>();
  for (let i = 0; i + n <= words.length; i++) {
    const key = words.slice(i, i + n).join(' ');
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function paragraphEchoes(text: string): string[] {
  const hits: string[] = [];
  for (const n of [6, 5]) {
    for (const [key, count] of shingles(text, n)) {
      if (count > 1) hits.push(`[${n}-gram ×${count}] "${key}"`);
    }
    if (hits.length) break;
  }
  return hits;
}

const tierCounts = new Map<string, number>();
const defectEcho: { where: string; hits: string[]; text: string }[] = [];
const defectMech: { where: string; defect: string }[] = [];
const openerFirst = new Map<string, Map<string, number>>(); // "sectionId" -> opener(3w) -> count
const docParas: string[][] = [];
const epigraphsBench = new Map<string, number>();
const headingTexts = new Map<string, Map<string, number>>(); // "sectionId" -> heading -> count
let headingPoolDocs = 0, headingStaticDocs = 0, headingComboSum = 0;
let crossHeadingMode = 0; // Crosscurrents titles drawn from a mix-keyed pair pool
const crossHeadingTexts = new Map<string, number>();
const headingDupes: string[] = [];
let totalParas = 0, lightlyHeld = 0;

for (let run = 0; run < RUNS; run++) {
  const answers = randomAnswers();
  const profile = scoreProfile(answers);
  const bp = generateBlueprint(profile, answers);

  // Title/epigraph variety: distinct epigraphs, per-section heading spread,
  // and how often a content-aware pool heading (vs the static default) rendered.
  epigraphsBench.set(bp.epigraph, (epigraphsBench.get(bp.epigraph) ?? 0) + 1);
  const docHeadings = new Set<string>();
  let poolPicked = false;
  for (const sec of bp.sections) {
    const m = headingTexts.get(sec.id) ?? new Map<string, number>();
    m.set(sec.heading, (m.get(sec.heading) ?? 0) + 1);
    headingTexts.set(sec.id, m);
    docHeadings.add(sec.heading);
    if (sec.headingAdaptive) poolPicked = true;
  }
  if (poolPicked) headingPoolDocs += 1; else headingStaticDocs += 1;
  const cross = bp.sections.find((s) => s.id === '__crosscurrents');
  if (cross) {
    const nHead = cross.paragraphs.filter((p) => p.startsWith('**')).length;
    crossHeadingMode += nHead >= 2 ? 1 : 0;
    crossHeadingTexts.set(cross.heading, (crossHeadingTexts.get(cross.heading) ?? 0) + 1);
  }
  headingComboSum += docHeadings.size;
  if (docHeadings.size < bp.sections.length) headingDupes.push([...docHeadings].length + '/' + bp.sections.length);

  for (const b of bp.bands) {
    if (b.tierLabel?.includes('lightly held')) lightlyHeld++;
    if (b.tierLabel) {
      const base = b.tierLabel.replace(' · lightly held', '');
      const key = `${b.id}=${base}`;
      tierCounts.set(key, (tierCounts.get(key) ?? 0) + 1);
    }
  }

  const paras: string[] = [];
  for (const sec of bp.sections) {
    const secOpeners = openerFirst.get(sec.id) ?? new Map<string, number>();
    for (const p of sec.paragraphs) {
      totalParas++;
      paras.push(p);
      // stitch echo inside one paragraph
      const hits = paragraphEchoes(p);
      if (hits.length) defectEcho.push({ where: `${sec.id}`, hits, text: p.slice(0, 160) });
      // mechanical
      if (/  +/.test(p)) defectMech.push({ where: sec.id, defect: 'double space' });
      if (/ [.,;!?]/.test(p)) defectMech.push({ where: sec.id, defect: 'space before punctuation' });
      const rep = p.match(/\b(\w+)\s+\1\b/i);
      if (rep && !['had had', 'that that'].includes(rep[0].toLowerCase())) {
        defectMech.push({ where: sec.id, defect: `repeated word "${rep[0]}"` });
      }
      const smart = (p.match(/[""]/g) ?? []).length;
      if (smart % 2 !== 0) defectMech.push({ where: sec.id, defect: 'unbalanced quotes' });
      // opener tally (first 3 words, skip headers already separate)
      const opener = p.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
      secOpeners.set(opener, (secOpeners.get(opener) ?? 0) + 1);
    }
    openerFirst.set(sec.id, secOpeners);
  }
  docParas.push(paras);
}

// Regression gates — set GATE=1 to exit non-zero when a metric regresses
// past its threshold. Gates: accidental echo clusters, mechanical defects,
// cross-run overlap ceiling.
const GATE = process.env.GATE === '1';
const fail = (msg: string) => { if (GATE) { console.error(`GATE FAIL: ${msg}`); process.exit(1); } };

console.log(`═ Benchmark over ${RUNS} seeded random full-bank runs ═\n`);
console.log(`total paragraphs generated: ${totalParas} · "lightly held" chips: ${lightlyHeld} (${((lightlyHeld / (RUNS * 28)) * 100).toFixed(1)}% of all band chips)\n`);

console.log('═ B. Cross-run paragraph overlap (random doc pairs) ═');
{
  let sum = 0;
  const PAIRS = 60;
  for (let i = 0; i < PAIRS; i++) {
    const a = docParas[Math.floor(rand() * docParas.length)];
    const b = docParas[Math.floor(rand() * docParas.length)];
    const setB = new Set(b);
    const shared = a.filter((p) => setB.has(p)).length;
    sum += shared / a.length;
  }
  const overlap = (sum / PAIRS) * 100;
  console.log(`mean shared-paragraph rate between two random docs: ${overlap.toFixed(1)}%`);
  if (overlap > 50) fail(`cross-run overlap ${overlap.toFixed(1)}% > 50%`);
}

console.log('\n═ C. Stitch defects: echoed clauses inside one paragraph ═');
console.log(`instances: ${defectEcho.length}`);
// The three intentional anaphora figures account for the expected baseline
// (~1.17 clusters/run across the corpus); anything above 1.3×RUNS means a new
// accidental echo.
if (defectEcho.length > Math.ceil(RUNS * 1.3)) fail(`accidental echo clusters ${defectEcho.length} > ${Math.ceil(RUNS * 1.3)}`);
const byKey = new Map<string, number>();
for (const d of defectEcho) for (const h of d.hits) byKey.set(h, (byKey.get(h) ?? 0) + 1);
for (const [k, n] of [...byKey.entries()].sort((x, y) => y[1] - x[1]).slice(0, 10)) {
  console.log(`  ×${n} ${k}`);
}
if (defectEcho[0]) console.log(`  sample: "${defectEcho[0].text}…"`);

console.log('\n═ C2. Adjacent-paragraph opener collisions within sections ═');
{
  let collisions = 0, checks = 0;
  for (const [, m] of openerFirst) {
    for (const [, n] of m) if (n > 1) collisions += n - 1;
    checks++;
  }
  console.log(`sections checked: ${checks} · repeated opener instances (same 3-word lead, same section): ${collisions}`);
}

console.log('\n═ D. Mechanical defects ═');
console.log(`instances: ${defectMech.length}`);
if (defectMech.length > 0) fail(`${defectMech.length} mechanical defects`);
const mechKinds = new Map<string, number>();
for (const d of defectMech) mechKinds.set(d.defect.replace(/"[^"]*"/, '"…"'), (mechKinds.get(d.defect.replace(/"[^"]*"/, '"…"')) ?? 0) + 1);
for (const [k, n] of [...mechKinds.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6)) console.log(`  ×${n} ${k}`);
if (defectMech[0]) console.log(`  sample: [${defectMech[0].where}] ${defectMech[0].defect}`);

console.log('\n═ E. Opener monotony — most dominant 3-word lead per section ═');
for (const [sec, m] of openerFirst) {
  const [opener, n] = [...m.entries()].sort((x, y) => y[1] - x[1])[0];
  const total = [...m.values()].reduce((a, b) => a + b, 0);
  console.log(`  ${sec.padEnd(16)} "${opener}" leads ${(100 * n / total).toFixed(0)}% of ${total} paragraphs`);
}

console.log('\n═ F. Title & epigraph variety ═');
console.log(`distinct epigraphs across ${RUNS} runs: ${epigraphsBench.size}`);
{
  const topEpi = [...epigraphsBench.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topEpi) console.log(`  most common epigraph: ${topEpi[1]}× "${topEpi[0].slice(0, 44)}"`);
  console.log(`docs with ≥1 pool-picked heading: ${headingPoolDocs}/${RUNS} · fully static: ${headingStaticDocs}`);
  const distinctTotal = [...headingTexts.values()].reduce((n, m) => n + m.size, 0);
  console.log(`distinct heading texts across all sections: ${distinctTotal} · mean DISTINCT titles per doc: ${(headingComboSum / RUNS).toFixed(2)}`);
  if (headingDupes.length > 0) console.log(`  docs with a repeated title inside one document: ${headingDupes.length} ${headingDupes.slice(0, 4).join(' ')}`);
  for (const [id, m] of headingTexts) {
    const [txt, n] = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
    console.log(`  ${id.padEnd(16)} ${String(m.size).padStart(2)} distinct · top "${txt.slice(0, 38)}" ${n}×`);
  }
  console.log(`  crosscurrents titles: ${crossHeadingTexts.size} distinct · ${crossHeadingMode}/${RUNS} docs drew a pair-keyed title (≥2 frames) · top: ${[...crossHeadingTexts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `${n}× "${t.slice(0, 30)}"`).join(' · ')}`);
  // Gates: titles must stay unique WITHIN a document (any repeat is a naming
  // failure), and the epigraph pool must keep breathing (25+ tellings in use).
  if (headingDupes.length > 0) fail(`${headingDupes.length} docs carry a repeated title`);
  if (epigraphsBench.size < 25) fail(`epigraph variety ${epigraphsBench.size} < 25 distinct across ${RUNS} runs`);
}
