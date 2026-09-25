// Audit helper: how much real evidence does each dimension draw from, and how
// large is the distinct-output space? Answers the "are the claims recycled?"
// question with numbers instead of vibes.
import { QUESTIONS } from '../src/domain/questions';
import { ALL_DIMENSIONS } from '../src/domain/scoring';
import { DIMENSIONS } from '../src/domain/dimensions';
import type { DimensionId } from '../src/domain/types';

const perDim: Record<string, { qs: number; scenarios: number; maxEvidence: number }> = {};
for (const d of ALL_DIMENSIONS) perDim[d] = { qs: 0, scenarios: 0, maxEvidence: 0 };

for (const q of QUESTIONS) {
  const touched = new Set<DimensionId>();
  for (const o of q.options as Array<{ weight?: Record<string, number> }>) {
    for (const [d, w] of Object.entries(o.weight ?? {})) {
      touched.add(d as DimensionId);
      const perUnit = Math.abs(w) * (q.diagnosticWeight ?? 1);
      if (perUnit > (perDim[d]?.maxEvidence ?? 0)) perDim[d].maxEvidence = perUnit;
    }
  }
  for (const d of touched) {
    perDim[d].qs += 1;
    if (touched.size > 0) perDim[d].scenarios += 1;
  }
}

console.log('dimension | questions touching it | max per-answer evidence');
for (const d of ALL_DIMENSIONS) {
  const p = perDim[d];
  console.log(`${d.padEnd(28)} ${String(p.qs).padStart(3)}  ${p.maxEvidence.toFixed(2)}`);
}
const counts = ALL_DIMENSIONS.map((d) => perDim[d].qs);
console.log(`\nmin ${Math.min(...counts)} · median ${counts.sort((a, b) => a - b)[Math.floor(counts.length / 2)]} · max ${Math.max(...counts)} questions per dimension`);
console.log(`total questions: ${QUESTIONS.length} · total dimensions: ${ALL_DIMENSIONS.length}`);
const multiDim = QUESTIONS.filter((q) => {
  const s = new Set<string>();
  for (const o of q.options as Array<{ weight?: Record<string, number> }>)
    for (const d of Object.keys(o.weight ?? {})) s.add(d);
  return s.size >= 2;
}).length;
console.log(`questions weighing 2+ dimensions (interwoven): ${multiDim}/${QUESTIONS.length}`);

// Output variation space
let variants = 0;
let interplayCount = 0;
for (const d of DIMENSIONS) {
  variants += d.vlow.length + d.low.length + d.mlow.length + d.mid.length + d.mhigh.length + d.high.length + d.vhigh.length;
  interplayCount += Object.keys(d.interplay ?? {}).length;
}
console.log(`\nnarrative variants: ${variants} paragraphs across ${DIMENSIONS.length} dimensions (7 tiers)`);
console.log(`cross-dimension interplay passages: ${interplayCount} (per-dimension, condition on co-occurring tiers)`);
console.log(`document space: 24 tier choices (7^24 before constraint) + ${interplayCount} interplay conditions + epigraph keys + crosscurrents + pair cards + 3 closing tracks`);
