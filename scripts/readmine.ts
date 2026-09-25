// Rebuilds a blueprint from a session JSON export and prints the document —
// lets the engine's output be read directly instead of pasted by hand.
// Usage: npx esbuild scripts/readmine.ts --bundle --platform=node --format=cjs --outfile=/tmp/readmine.cjs && node /tmp/readmine.cjs [path]
import { readFileSync } from 'fs';
import { importSessionJson } from '../src/domain/session';
import { scoreProfile } from '../src/domain/scoring';
import { generateBlueprint } from '../src/domain/blueprint';

const path = process.argv[2] ?? 'blueprint-session-alec NEW.json';
const parsed = importSessionJson(readFileSync(path, 'utf8'));
const profile = scoreProfile(parsed.answers);
const bp = generateBlueprint(profile, parsed.answers);

console.log(`— ${path} · ${profile.answered}/${profile.total} answered · consistency ${profile.consistencyIndex}% —`);
console.log(`channels: express=${profile.channels.express ?? '—'} receive=${profile.channels.receive ?? '—'}`);
console.log('');
console.log(`EPIGRAPH: ${bp.epigraph}`);
console.log('');

for (const s of bp.sections) {
  console.log(`## ${s.heading}`);
  for (const p of s.paragraphs) {
    console.log(p);
    console.log('');
  }
}

if (bp.tensions.length > 0) {
  console.log(`## Where Your Answers Suggest Some Tension`);
  for (const t of bp.tensions) {
    console.log(`**${t.title}**`);
    console.log(t.body);
    console.log('');
  }
}
