// Answer-level audit: for a session JSON, print every scored question's chosen
// label and its signed per-dimension contributions, grouped by dimension —
// so any prose claim in the generated document can be checked against the
// actual picks. Also prints channel evidence and echo-pair answers.
// Usage: npx esbuild scripts/auditmine.ts --bundle --platform=node --format=cjs --outfile=/tmp/auditmine.cjs && node /tmp/auditmine.cjs [path]
import { readFileSync } from 'fs';
import { importSessionJson } from '../src/domain/session';
import { scoreProfile, ALL_DIMENSIONS, isInternallyDivided } from '../src/domain/scoring';
import { QUESTIONS, QUESTION_BY_ID, BONUS_POOL } from '../src/domain/questions';
import { DIMENSION_LABELS } from '../src/domain/types';
import { tierOf } from '../src/domain/dimensions';
import type { Answers, Question } from '../src/domain/types';

const path = process.argv[2] ?? 'blueprint-session-alec.json';
const parsed = importSessionJson(readFileSync(path, 'utf8'));
const answers: Answers = parsed.answers;
const profile = scoreProfile(answers);

interface Pick { label: string; weights: Record<string, number>; }
function pickOf(q: Question, id: string): Pick | null {
  if (id === undefined) return null;
  for (const o of q.options as Array<{ id?: string; value?: number; label: string; weight: Record<string, number> }>) {
    if ('value' in o ? String(o.value) === id : o.id === id) return { label: o.label, weights: o.weight ?? {} };
  }
  return null;
}

const contrib = new Map<string, { qid: string; w: number; label: string }[]>();
for (const [qid, v] of Object.entries(answers)) {
  const q = QUESTION_BY_ID[qid];
  if (!q || q.meta) continue;
  const p = pickOf(q, v.kind === 'option' ? v.optionId : String(v.value));
  if (!p) continue;
  const dw = q.diagnosticWeight ?? 1;
  for (const [d, w] of Object.entries(p.weights)) {
    if (!w) continue;
    const arr = contrib.get(d) ?? [];
    arr.push({ qid, w: w * dw, label: p.label });
    contrib.set(d, arr);
  }
}

console.log(`— ${path} · ${profile.answered}/${profile.total} · consistency ${profile.consistencyIndex}% —`);
for (const d of ALL_DIMENSIONS) {
  const ds = profile.dimensions[d];
  const v = profile.variance?.[d];
  const list = (contrib.get(d) ?? []).sort((a, b) => Math.abs(b.w) - Math.abs(a.w));
  const flags = [ds.unmeasured ? 'UNMEASURED' : '', v && isInternallyDivided(v) ? 'DIVIDED' : ''].filter(Boolean).join(' · ');
  console.log(`\n== ${d} — ${ds.score} (${tierOf(ds.score)})${flags ? ' · ' + flags : ''} · ${list.length} contributions`);
  for (const c of list) console.log(`   ${c.w > 0 ? '+' : ''}${c.w.toFixed(2)}  ${c.qid}  "${c.label.slice(0, 76)}"`);
}

console.log('\n== channels');
console.log(`express=${profile.channels.express ?? '—'} receive=${profile.channels.receive ?? '—'}`);

console.log('\n== echo pairs (a → b, agreement)');
for (const c of profile.consistency) {
  const qa = QUESTION_BY_ID[c.a], qb = QUESTION_BY_ID[c.b];
  const pa = qa && answers[c.a] ? pickOf(qa, answers[c.a].kind === 'option' ? (answers[c.a] as { optionId: string }).optionId : String((answers[c.a] as { value: number }).value)) : null;
  const pb = qb && answers[c.b] ? pickOf(qb, answers[c.b].kind === 'option' ? (answers[c.b] as { optionId: string }).optionId : String((answers[c.b] as { value: number }).value)) : null;
  const dim = c.dimension === 'ambiguity_update' ? 'ambiguity' : c.dimension;
  const pos = c.positionA !== undefined ? ` · lean ${(c.positionB - c.positionA).toFixed(2)}` : '';
  console.log(`  [${dim}] ${c.agreement}%${pos}`);
  if (pa) console.log(`     A ${c.a}: "${pa.label.slice(0, 70)}"`);
  if (pb) console.log(`     B ${c.b}: "${pb.label.slice(0, 70)}"`);
}
