/* Local verification: run compareProfiles on Alec's real retake vs the opposite-run
 * profile and print exactly what the Compare screen now renders. Not committed tooling —
 * a one-off check for the compare overhaul. Usage: npx esbuild ... && node /tmp/cmp.cjs
 */
import * as fs from 'fs';
import { importSessionJson } from '../src/domain/session';
import { scoreProfile } from '../src/domain/scoring';
import { compareProfiles, decodeProfile } from '../src/domain/share';
import { DIMENSION_LABELS } from '../src/domain/types';
import { tierOf, TIER_LABELS } from '../src/domain/dimensions';

const load = (p: string) => scoreProfile(importSessionJson(fs.readFileSync(p, 'utf8')).answers);

const me = load('blueprint-session-alec NEW 2.json');
const them = load('blueprint-session-OPPOSITE.json');
const who = 'opposite';

const r = compareProfiles(me, them);
console.log(`alignment index: ${r.alignmentIndex}`);
console.log(
  `${r.measuredCount} of 29 dimensions measured` +
    (r.unmeasuredCount > 0 ? ` · ${r.unmeasuredCount} not carried by this share code` : '') +
    ` · ${r.sameTierCount} sit in the same tier band`,
);

console.log('\nWHERE YOU MATCH');
for (const m of r.matches) console.log(`  ${DIMENSION_LABELS[m.dimension]}  ${m.a} · ${m.b}`);
console.log('\nWHERE THE TRANSLATION IS NEEDED');
for (const g of r.gaps) console.log(`  ${DIMENSION_LABELS[g.dimension]}  ${g.a} · ${g.b}  Δ${g.delta}`);

console.log(`\nWHERE THE BAND CHANGES (${r.tierGaps.length} total, first 6 shown)`);
for (const g of r.tierGaps.slice(0, 6)) {
  console.log(
    `  ${DIMENSION_LABELS[g.dimension]}  ${g.a} · ${g.b}  Δ${g.delta}  ` +
      `you: ${TIER_LABELS[tierOf(g.a)].toLowerCase()} · ${who}: ${TIER_LABELS[tierOf(g.b)].toLowerCase()}`,
  );
}

console.log('\nWHOLE PICTURE (domain order; rows flagged = tier gap)');
const byFit = [...r.domains].sort((x, y) => x.meanDelta - y.meanDelta);
console.log(`  closest: ${byFit[0].label} (Δ${byFit[0].meanDelta}) · widest: ${byFit[byFit.length - 1].label} (Δ${byFit[byFit.length - 1].meanDelta})`);
for (const dom of r.domains) {
  console.log(`  ${dom.label}  (Δ${dom.meanDelta} avg, ${dom.rows.length} rows)`);
  for (const row of dom.rows) {
    console.log(
      `    ${row.tierGap ? '*' : row.delta <= 5 ? '.' : ' '} ${DIMENSION_LABELS[row.dimension]}  ${row.a} · ${row.b}  Δ${row.delta}` +
        `  [${TIER_LABELS[row.tierA].toLowerCase()} vs ${TIER_LABELS[row.tierB].toLowerCase()}]`,
    );
  }
}

console.log('\nCROSS-CHECK');
for (const c of r.crossChannels) {
  console.log(`  ${c.youGive ?? 'no single channel'} → ${c.theyHear ?? 'in any channel'} : ${c.state}`);
}

// Sanity: totals line up, no unmeasured rows leaked in, determinism
const rowCount = r.domains.reduce((s, d) => s + d.rows.length, 0);
if (rowCount !== r.measuredCount) throw new Error(`row count ${rowCount} != measuredCount ${r.measuredCount}`);
if (r.measuredCount + r.unmeasuredCount !== 29) throw new Error('29-way split broken');
const again = compareProfiles(me, them);
if (JSON.stringify(again) !== JSON.stringify(r)) throw new Error('compareProfiles not deterministic');
// The BP6 share-code entry path must produce the identical comparison
const oppositeCode =
  'BP6BgYYVAoMACEoAAM7HhVLSy0vLSwPABMUEwtIKREXEmBZU2RjXD5gZGFgJWRgYZERBwEVBgUYBAAABgEPBAAAEQQkDQVKBgAABgAADAlEEAUrBAErDgsqAAAAEwhWBQNcBwNZEAZSBwEOBQAAFQQVBQEbBgEVBwERDw0fBQJABgEhBQErDAIQBgYA_36FcLZ3foV-RneFfgNj';
const decoded = decodeProfile(oppositeCode);
if (!decoded) throw new Error('opposite BP6 code failed to decode');
const rFromCode = compareProfiles(me, decoded);
if (JSON.stringify(rFromCode) !== JSON.stringify(r)) {
  throw new Error('BP6 code path and session-file path disagree');
}
console.log('VERIFY OK: row total == measuredCount, 29-way split exact, deterministic');
console.log('VERIFY OK: BP6 share-code entry path matches session-file path exactly');
