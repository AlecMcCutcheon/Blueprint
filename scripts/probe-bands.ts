import { readFileSync } from 'fs';
import { importSessionJson } from '../src/domain/session';
import { scoreProfile } from '../src/domain/scoring';
import { generateBlueprint } from '../src/domain/blueprint';
const parsed = importSessionJson(readFileSync(process.argv[2] ?? 'blueprint-session-alec NEW.json', 'utf8'));
const profile = scoreProfile(parsed.answers);
const bp = generateBlueprint(profile, parsed.answers);
for (const b of bp.bands) {
  if (b.tierLabel?.includes('lightly held')) console.log(`${b.id.padEnd(26)} ${b.score}  ${b.tierLabel}`);
}
console.log('---');
for (const d of Object.values(profile.dimensions)) {
  const n = profile.variance?.[d.id]?.contributions.length ?? 0;
  if (n <= 3 && n > 0) console.log(`thin: ${d.id} n=${n} score=${d.score}`);
}
