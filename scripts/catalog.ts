// Pattern catalog generator (calibration review, final section): renders the
// full interpretation layer as a machine-checkable catalog — every pattern's
// triggering combination, relationship type, evidence rule, and placement —
// plus the interplay and variance libraries. Output: PATTERN_CATALOG.md.
// Usage: npx esbuild scripts/catalog.ts --bundle --platform=node --format=cjs --outfile=/tmp/catalog.cjs && node /tmp/catalog.cjs
import { writeFileSync } from 'fs';
import { PATTERNS, marginFor } from '../src/domain/patterns';
import { DIMENSIONS, VARIANCE_LIBRARY, GENERIC_VARIANCE, TIER_BOUNDS } from '../src/domain/dimensions';
import { DIMENSION_LABELS, type ScoredProfile, type DimensionId } from '../src/domain/types';

const dimName = (d: string) => DIMENSION_LABELS[d as DimensionId] ?? d;
const bandText: Record<string, string> = {
  high: 'tier mhigh+ (≥62 raw)',
  lowish: 'tier mlow− (≤47 raw)',
  midPlus: 'tier mid+ (≥48 raw)',
};
function conditionText(specs: ReturnType<typeof Object.values> extends never ? never : any[]): string {
  return specs
    .map((s: any) => {
      if (s.band === 'gap') return `${dimName(s.dim)} leads ${dimName(s.other!)} by ≥${s.min} raw points (and itself ≥55)`;
      if (s.band === 'rawmin') return `${dimName(s.dim)} ≥${s.min} raw`;
      return `${dimName(s.dim)} ${bandText[s.band] ?? s.band}`;
    })
    .join(' AND ');
}

const lines: string[] = [];
lines.push('# Pattern Catalog');
lines.push('');
lines.push('The interpretation layer, formalized: what combination of dimensions');
lines.push('produces each passage, what relationship type it represents, and how');
lines.push('strong the evidence must be before it is said. Generated from source —');
lines.push('regenerate with `npx esbuild scripts/catalog.ts --bundle --platform=node --format=cjs --outfile=/tmp/catalog.cjs && node /tmp/catalog.cjs` after any change.');
lines.push('');
lines.push(`Rendered: ${new Date().toISOString().slice(0, 10)}`);
lines.push('');
lines.push('## Scales');
lines.push('');
lines.push(`- 7 tiers: vlow < ${TIER_BOUNDS[0]} ≤ low < ${TIER_BOUNDS[1]} ≤ mlow < ${TIER_BOUNDS[2]} ≤ mid < ${TIER_BOUNDS[3]} ≤ mhigh < ${TIER_BOUNDS[4]} ≤ high < ${TIER_BOUNDS[5]} ≤ vhigh`);
lines.push('- Evidence rule (patterns): confidence from the RAW score margin past the crossed boundary — ≥7 → 0.92, ≥4 → 0.85, ≥2 → 0.78, else 0.68; capped at 0.72 within 3 points of a boundary (soft); −0.06/−0.12 on partial runs; < 0.55 never renders; any unmeasured input drops the pattern');
lines.push('- Selection: ranked confidence × priority; 3 headline max (Crosscurrents), 2 per placement spot, 1 tension / 2 augments per section; dedup drops patterns whose combination an interplay passage owns, whose frame echoes a section heading, or whose opener stutters on the tier paragraph');
lines.push('- Gap conditions additionally require the leading dimension to clear 55 raw (a gap from a non-high base is not a finding)');
lines.push('');
lines.push('## Derived patterns (' + PATTERNS.length + ')');
lines.push('');
for (const p of PATTERNS) {
  const mode = p.mode;
  const where = mode === 'synthesis'
    ? 'Crosscurrents (headline)'
    : p.placement
      ? `${p.placement.section} section, after ${dimName(p.placement.after)}`
      : '—';
  lines.push(`### ${p.id}`);
  lines.push('');
  lines.push(`- **Type:** ${mode} · **Priority:** ${p.priority}${p.supersedes ? ` · **Supersedes:** \`${p.supersedes}\`` : ''}`);
  lines.push(`- **Trigger:** ${p.conditions.length ? conditionText(p.conditions) : '—'}`);
  lines.push(`- **Placement:** ${where}`);
  lines.push(`- **Frame:** ${p.frame}`);
  lines.push(`- **Claims:** ${p.narrative.map((n) => `“${n}”`).join(' ')}`);
  lines.push('');
}
lines.push('## Interplay library (per-dimension conditional passages)');
lines.push('');
for (const d of DIMENSIONS) {
  const keys = Object.keys(d.interplay ?? {});
  if (keys.length === 0) continue;
  lines.push(`### ${d.id} — ${dimName(d.id)}`);
  lines.push('');
  for (const [key, text] of Object.entries(d.interplay ?? {})) {
    const idx = key.lastIndexOf(':');
    const other = key.slice(0, idx);
    const spec = key.slice(idx + 1);
    const dir = spec.endsWith('-') ? 'at most' : 'at least';
    lines.push(`- **When ${dimName(other)} is ${dir} tier ${spec.replace(/-$/, '')}** (${key}): ${text}`);
  }
  lines.push('');
}
lines.push('## Variance library (within-dimension tug-of-war notes)');
lines.push('');
lines.push('Gate: mid/leaning tier AND cancellation ≥ 0.4 AND ≥2 opposing answers among ≥5 contributions. Raw answers required (never fires on share-code profiles).');
lines.push('');
for (const [id, text] of Object.entries(VARIANCE_LIBRARY)) {
  lines.push(`- **${id} — ${dimName(id)}:** ${text}`);
}
lines.push(`- **generic (seeded, ${GENERIC_VARIANCE.length} variants):** ${GENERIC_VARIANCE[0]}`);
lines.push('');

writeFileSync('PATTERN_CATALOG.md', lines.join('\n'), 'utf8');
console.log(`PATTERN_CATALOG.md written: ${PATTERNS.length} patterns, ${DIMENSIONS.reduce((n, d) => n + Object.keys(d.interplay ?? {}).length, 0)} interplay keys, ${Object.keys(VARIANCE_LIBRARY).length + 1} variance entries.`);
