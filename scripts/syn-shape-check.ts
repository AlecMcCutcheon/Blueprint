/* One-off shape check for the synthesis sentences (not committed):
 * - topSyn carrying title-case chip labels (vhigh "Designed, named, owned" / "Want as thermometer")
 * - lowSyn thin-evidence hedge (the old form produced "— lightly held… —: want waits")
 * Asserts: no em-dash immediately followed by a colon anywhere in any document.
 */
import { QUESTIONS } from '../src/domain/questions';
import { scoreProfile } from '../src/domain/scoring';
import { generateBlueprint } from '../src/domain/blueprint';
import type { Answers, Question } from '../src/domain/types';

type Opt = Question['options'][number];
const wOf = (o: Opt, dim: string): number => ('weight' in o ? ((o.weight as Record<string, number | undefined>)[dim] ?? 0) : 0);

function run(label: string, pick: (q: Question) => number) {
  const answers: Answers = {};
  for (const q of QUESTIONS) {
    if (q.meta) continue;
    const o = q.options[pick(q)];
    answers[q.id] = 'value' in o ? { kind: 'scale', value: (o as { value: number }).value } : { kind: 'option', optionId: o.id };
  }
  const bp = generateBlueprint(scoreProfile(answers));
  const syn = bp.sections.find((s) => s.id === '__synthesis');
  console.log(`\n=== ${label} ===`);
  for (const para of syn?.paragraphs ?? []) {
    if (/would probably involve|would not ask of you|spine of this document|doing the most work/.test(para)) {
      console.log('· ' + para);
    }
  }
  const all = bp.sections.flatMap((s) => s.paragraphs).join('\n');
  if (/—\s*:/.test(all)) throw new Error(`${label}: em-dash-colon collision still present`);
}

// A: push shared_home_effort + desire to the top — vhigh chip labels in the spine
run('vhigh chip pair (shared_home_effort + desire)', (q) => {
  let best = 0, bestW = -Infinity;
  for (let i = 0; i < q.options.length; i++) {
    const w = wOf(q.options[i], 'shared_home_effort') + wOf(q.options[i], 'desire');
    if (w > bestW) { bestW = w; best = i; }
  }
  return best;
});

// B: first option everywhere; minimize desire_initiation where touched — thin, low dimension
run('thin low (desire_initiation)', (q) => {
  if (!q.options.some((o) => 'weight' in o && (o.weight as Record<string, number | undefined>).desire_initiation !== undefined)) return 0;
  let best = 0, bestW = Infinity;
  for (let i = 0; i < q.options.length; i++) {
    const w = wOf(q.options[i], 'desire_initiation');
    if (w < bestW) { bestW = w; best = i; }
  }
  return best;
});

// C: all-first baseline
run('baseline (first option everywhere)', () => 0);

console.log('\nSHAPE CHECK PASSED: no em-dash-colon collisions in any generated document');
