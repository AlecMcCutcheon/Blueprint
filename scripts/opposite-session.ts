// Builds the "opposite" session: for every question, pick the option whose
// weight vector is most anti-aligned with the source session's actual
// dimension scores (argmin of Σ w_d · score_d). This is the strongest possible
// divergence test — every answer pushes every dimension away from where the
// real profile sits, instead of random clicks which can accidentally agree.
//
// Usage: npx esbuild scripts/opposite-session.ts --bundle --platform=node --format=cjs --outfile=/tmp/opp.cjs && node /tmp/opp.cjs [sourceSession] [outPath]
import { readFileSync, writeFileSync } from 'fs';
import { importSessionJson } from '../src/domain/session';
import { scoreProfile } from '../src/domain/scoring';
import { QUESTIONS, BONUS_POOL, type Question } from '../src/domain/questions';

const srcPath = process.argv[2] ?? 'blueprint-session-alec NEW.json';
const outPath = process.argv[3] ?? 'blueprint-session-OPPOSITE.json';

const parsed = importSessionJson(readFileSync(srcPath, 'utf8'));
const profile = scoreProfile(parsed.answers);
const realScore = new Map<string, number>();
for (const d of Object.values(profile.dimensions)) realScore.set(d.id, d.score);

/** Agreement of an option's weights with the real profile (lower = more opposite). */
function agreement(q: Question, optionId: string): number {
  const opt = q.options.find((o) => o.id === optionId);
  if (!opt || !('weight' in opt)) return 0;
  let sum = 0;
  for (const [dim, w] of Object.entries(opt.weight as Record<string, number>)) {
    sum += w * (realScore.get(dim) ?? 50);
  }
  return sum;
}

const answers: Record<string, { kind: 'option'; optionId: string }> = {};
const bank = [...QUESTIONS, ...BONUS_POOL];
for (const q of bank) {
  if (q.options.length === 0) continue;
  let best = q.options[0].id;
  let bestAgreement = Infinity;
  for (const opt of q.options) {
    const a = agreement(q, opt.id);
    if (a < bestAgreement) {
      bestAgreement = a;
      best = opt.id;
    }
  }
  answers[q.id] = { kind: 'option', optionId: best };
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
console.log(`wrote ${outPath}: ${Object.keys(answers).length} answers from ${bank.length} questions`);

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
