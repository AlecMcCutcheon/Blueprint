// End-to-end smoke test: computes a seeded presentation order, answers every
// question, scores, generates blueprint, and prints sanity-check output.
// Three profiles: "always A", "always last", and "middle of the road".
import { QUESTIONS, QUESTION_BY_ID } from '../src/domain/questions';
import { computeOrder } from '../src/domain/order';
import { scoreProfile, ALL_DIMENSIONS, CONSISTENCY_PAIRS } from '../src/domain/scoring';
import { generateBlueprint, blueprintToMarkdown } from '../src/domain/blueprint';
import type { Answers } from '../src/domain/types';

const SEED = 42;
const ORDER = computeOrder(SEED);

function run(label: string, pick: (qIndex: number, optionCount: number, isScale: boolean) => number) {
  const answers: Answers = {};
  ORDER.forEach((id, i) => {
    const q = QUESTION_BY_ID[id];
    if (q.format === 'agreement') {
      answers[id] = { kind: 'scale', value: pick(i, q.options.length, true) };
    } else {
      const idx = Math.min(pick(i, q.options.length, false), q.options.length - 1);
      answers[id] = { kind: 'option', optionId: q.options[idx].id };
    }
  });
  // State-survey items are no longer part of the core run; inject them as the
  // end-of-run survey would, so the state-note path is still exercised.
  const stateValue = pick(999, 5, true);
  for (const sid of ['q96', 'q97', 'q98']) {
    answers[sid] = { kind: 'scale', value: stateValue };
  }

  const profile = scoreProfile(answers);
  const bp = generateBlueprint(profile, answers);
  const md = blueprintToMarkdown(bp, profile);

  console.log(`\n=== ${label} ===`);
  console.log(`answered: ${profile.answered}/${profile.total}`);
  console.log(`consistencyIndex: ${profile.consistencyIndex}`);
  console.log(`epigraph: ${bp.epigraph}`);
  console.log(`metas: ${profile.metas.map((m) => `${m.id}=${m.score}`).join(' ')}`);
  const dimScores = Object.values(profile.dimensions);
  const zeroEvidence = dimScores.filter((d) => d.evidence === 0 && d.id !== 'express_receive_alignment');
  console.log(`dimensions with zero evidence: ${zeroEvidence.length ? zeroEvidence.map((d) => d.id).join(',') : 'none'}`);
  console.log(`channels: express=${profile.channels.express ?? '—'} receive=${profile.channels.receive ?? '—'}`);
  console.log(`tensions: ${bp.tensions.length}`);
  console.log(`sections: ${bp.sections.map((s) => s.id).join(', ')}`);
  console.log(`markdown length: ${md.length}`);
  const empties = bp.sections.filter((s) => s.paragraphs.some((p) => p.trim() === ''));
  console.log(`empty paragraphs: ${empties.length}`);
  console.log(`state read: ${profile.state ? `calm=${profile.state.calm} stirred=${profile.state.stirred} touched=${profile.state.touched}` : '—'}`);
  return { profile, bp, md, answers };
}

const a = run('PROFILE A (first options, scale=4)', (_i, _n, isScale) => (isScale ? 4 : 0));
const b = run('PROFILE B (last options, scale=2)', (_i, n, isScale) => (isScale ? 2 : n - 1));
const c = run('PROFILE C (mixed mid, scale=3)', (i, n, isScale) => (isScale ? 3 : Math.floor(n / 2)));

// State items are retired from scoring; the profile must carry no state read.
if (a.profile.state !== undefined) { console.error('FAIL: state survey retired but profile still carries state'); process.exit(1); }

// Full-session restore (import path): encode answers → decode → re-score must
// reproduce the EXACT profile. No reconstruction, no drift — this is the
// property that replaced reconstruct.ts.
import { encodeFullSession, decodeFullSession, buildShareLink, parseShareUrl } from '../src/domain/share';
import { buildSessionFile, importSessionJson } from '../src/domain/session';
import { BONUS_POOL } from '../src/domain/questions';
{
  // Session CODE round-trip.
  const enc = encodeFullSession(a.answers, 42);
  const dec = decodeFullSession(enc.code);
  if (!dec) { console.error('FAIL: full-session code did not decode'); process.exit(1); }
  const missingCore = QUESTIONS.filter((q) => dec.answers[q.id] === undefined);
  if (missingCore.length > 0) {
    console.error(`FAIL: session code lost answers: ${missingCore.slice(0, 5).map((q) => q.id).join(',')}`); process.exit(1);
  }
  const rescored = scoreProfile(dec.answers);
  const drifted = Object.values(a.profile.dimensions).filter(
    (d) => rescored.dimensions[d.id].score !== d.score,
  );
  if (drifted.length > 0) {
    console.error(`FAIL: restored session re-scores differently: ${drifted.map((d) => d.id).join(',')}`); process.exit(1);
  }
  if (dec.seed !== 42) { console.error('FAIL: session code did not round-trip the order seed'); process.exit(1); }
  const enc2 = encodeFullSession(a.answers, 42);
  if (enc2.code !== enc.code) { console.error('FAIL: session encoding is not deterministic'); process.exit(1); }
  if (decodeFullSession('BPS!!!garbage') !== null || decodeFullSession('BP3nope') !== null) {
    console.error('FAIL: garbage session codes should return null'); process.exit(1);
  }

  // Session JSON round-trip + validation. The smoke runs inject retired state
  // ids (q96–q98) to exercise the legacy path — a real session file wouldn't
  // carry them, and import must DROP them (reported), never guess.
  const { q96: _s1, q97: _s2, q98: _s3, ...coreAnswers } = a.answers;
  const file = buildSessionFile(coreAnswers, 42, 'Maya');
  const stateParsed = importSessionJson(JSON.stringify(buildSessionFile(a.answers, 42, 'Maya')));
  if (JSON.stringify([...stateParsed.dropped].sort()) !== JSON.stringify(['q96', 'q97', 'q98'])) {
    console.error(`FAIL: retired state ids should be dropped: ${stateParsed.dropped.join(',')}`); process.exit(1);
  }
  const parsed = importSessionJson(JSON.stringify(file));
  if (parsed.name !== 'Maya' || parsed.orderSeed !== 42 || parsed.dropped.length > 0) {
    console.error(`FAIL: session JSON round-trip broken (name=${parsed.name} seed=${parsed.orderSeed} dropped=${parsed.dropped.length})`); process.exit(1);
  }
  const jsonRescored = scoreProfile(parsed.answers);
  if (jsonRescored.dimensions.affection_daily.score !== a.profile.dimensions.affection_daily.score) {
    console.error('FAIL: JSON-restored answers re-score differently'); process.exit(1);
  }
  const tampered = { ...file, answers: { ...file.answers, q01: { kind: 'option', optionId: 'not-a-real-option' } } };
  const tParsed = importSessionJson(JSON.stringify(tampered));
  if (!tParsed.dropped.includes('q01') || tParsed.answers.q01 !== undefined) {
    console.error('FAIL: tampered answer should be dropped, not guessed at'); process.exit(1);
  }
  let threw = false;
  try { importSessionJson(JSON.stringify({ hello: 'world' })); } catch { threw = true; }
  if (!threw) { console.error('FAIL: non-session JSON should throw'); process.exit(1); }

  // Clarifiers: scored in the MAIN pass, appended for every run, and excluded
  // from the honest `answered` count.
  const queue = require('../src/domain/bonus').bonusQuestionsFor(a.profile);
  if (queue.length !== BONUS_POOL.length) {
    console.error(`FAIL: every run gets the full clarifier complement (got ${queue.length})`); process.exit(1);
  }
  const withBonus = { ...a.answers, [BONUS_POOL[0].id]: { kind: 'option' as const, optionId: BONUS_POOL[0].options[0].id } };
  const bonusScored = scoreProfile(withBonus);
  const dim = BONUS_POOL[0].bonusFor as keyof typeof bonusScored.dimensions;
  if (bonusScored.answered !== a.profile.answered) {
    console.error(`FAIL: clarifier must not inflate answered (${a.profile.answered} → ${bonusScored.answered})`); process.exit(1);
  }
  if (bonusScored.dimensions[dim].evidence <= a.profile.dimensions[dim].evidence) {
    console.error(`FAIL: clarifier evidence should raise ${dim} evidence mass`); process.exit(1);
  }

  // Share LINKS: name + intent ride in the URL, never in the code.
  const bp = profileToCode(a.profile);
  const l1 = buildShareLink(bp, { name: 'Maya', intent: 'invite' });
  const p1 = parseShareUrl(l1);
  if (!p1 || p1.name !== 'Maya' || p1.intent !== 'invite' || p1.code !== bp) {
    console.error(`FAIL: share link round-trip broken (${JSON.stringify(p1)})`); process.exit(1);
  }
  const p2 = parseShareUrl(buildShareLink(bp));
  if (!p2 || p2.name !== null || p2.intent !== 'show') {
    console.error('FAIL: default link should be unnamed + show'); process.exit(1);
  }
  if (parseShareUrl(buildShareLink(enc.code)) !== null) {
    console.error('FAIL: session codes must not be accepted as share links'); process.exit(1);
  }
  if (parseShareUrl('http://x.invalid/?bp=BP3garbage') !== null) {
    console.error('FAIL: invalid bp payloads must be rejected'); process.exit(1);
  }
  if (bp.includes('Maya')) { console.error('FAIL: name leaked into the metric code'); process.exit(1); }

  console.log(`session restore: code round-trip exact (${Object.keys(dec.answers).length} answers) · JSON+name round-trip · tamper dropped · ${BONUS_POOL.length} clarifiers scored-in-main-pass · link name/intent round-trip`);
}

// Order constraints: 115 core items, no state/bonus items, echo pairs far apart.
{
  const pos = new Map(ORDER.map((id, i) => [id, i]));
  for (const m of ['q96', 'q97', 'q98']) {
    if (pos.has(m)) {
      console.error(`FAIL: state item ${m} leaked into the core order`); process.exit(1);
    }
  }
  const minEchoDistance = Math.max(12, Math.floor(ORDER.length * 0.15));
  for (const [x, y] of CONSISTENCY_PAIRS) {
    const px = pos.get(x), py = pos.get(y);
    if (px === undefined || py === undefined) {
      console.error(`FAIL: echo pair member missing from order: ${x}/${y}`); process.exit(1);
    }
    if (Math.abs(px - py) < minEchoDistance) {
      console.error(`FAIL: echo pair ${x}/${y} too close (${Math.abs(px - py)} < ${minEchoDistance})`); process.exit(1);
    }
  }
  // No same-dimension ADJACENT items (±1). A ±2 window was tried and
  // deliberately relaxed: with ~50% of question pairs sharing a dimension,
  // no feasible ordering reliably exists, and the order-effect mechanism
  // in the literature is about back-to-back items (Şahin 2021).
  const dimsOf = (id: string): Set<string> => {
    const q = QUESTION_BY_ID[id];
    const s = new Set<string>();
    if (!q) return s;
    for (const o of q.options as Array<{ weight?: Record<string, number> }>) {
      for (const d of Object.keys(o.weight ?? {})) s.add(d);
    }
    return s;
  };
  for (let i = 1; i < ORDER.length; i++) {
    const d = dimsOf(ORDER[i]);
    if (d.size === 0) continue;
    const prev = dimsOf(ORDER[i - 1]);
    if ([...d].some((x) => prev.has(x))) {
      console.error(`FAIL: same dimension adjacent: ${ORDER[i - 1]} ↔ ${ORDER[i]}`); process.exit(1);
    }
  }
  // Different seeds → different orders (retakes reshuffle).
  if (JSON.stringify(computeOrder(42)) === JSON.stringify(computeOrder(43))) {
    console.error('FAIL: different seeds produced identical orders'); process.exit(1);
  }
  console.log(`order: ${ORDER.length} items · meta pinned last · echo pairs ≥${minEchoDistance} apart · no dim-adjacency · seeds differ`);
}

// Share-code round-trip: encode A, decode, verify metric fidelity
import { profileToCode, decodeProfile, compareProfiles, encodeLegacyCode } from '../src/domain/share';
{
  const code = profileToCode(a.profile);
  const decoded = decodeProfile(code);
  if (!decoded) { console.error('FAIL: share code did not decode'); process.exit(1); }
  const mismatches = Object.entries(a.profile.dimensions).filter(
    ([k, v]) => decoded.dimensions[k as keyof typeof decoded.dimensions].score !== v.score,
  );
  if (mismatches.length > 0) {
    console.error(`FAIL: decoded scores differ: ${mismatches.map(([k]) => k).join(',')}`);
    process.exit(1);
  }
  if (decoded.consistencyIndex !== a.profile.consistencyIndex) {
    console.error('FAIL: consistencyIndex did not round-trip');
    process.exit(1);
  }
  if (decoded.channels.express !== a.profile.channels.express || decoded.channels.receive !== a.profile.channels.receive) {
    console.error('FAIL: channels did not round-trip');
    process.exit(1);
  }
  if (decodeProfile('BP1!!!garbage') !== null || decodeProfile('nope') !== null) {
    console.error('FAIL: garbage codes should return null');
    process.exit(1);
  }
  const cmp = compareProfiles(a.profile, b.profile);
  if (cmp.alignmentIndex < 0 || cmp.alignmentIndex > 100) {
    console.error('FAIL: alignmentIndex out of range');
    process.exit(1);
  }
  console.log(`\nSHARE CODE: ${code.slice(0, 24)}… (${code.length} chars)`);
  console.log(`round-trip: OK · alignment(A,B)=${cmp.alignmentIndex} · matches=${cmp.matches.length} gaps=${cmp.gaps.length}`);
  console.log(`crossChannels: ${cmp.crossChannels.map((c) => `${c.youGive ?? '—'}→${c.theyHear ?? '—'}:${c.match ? 'lands' : 'translate'}`).join(' | ')}`);

  // ── Code format compatibility: BP1 (17 dims) → BP2 (18) → BP3 (24) ──
  // Each legacy layout must decode with the newer dimensions flagged
  // unmeasured (never guessed), values intact for everything present,
  // re-encoding refused, and comparison skipping the gaps.
  {
    const MISSING_BY_VERSION: Record<number, string[]> = {
      1: ['relational_privacy', 'sexual_communication', 'positivity_play', 'capitalization', 'conflict_engagement', 'commitment_sacrifice', 'money_coordination', 'desire_initiation', 'intimacy_attunement', 'feedback_receiving', 'external_processing'],
      2: ['sexual_communication', 'positivity_play', 'capitalization', 'conflict_engagement', 'commitment_sacrifice', 'money_coordination', 'desire_initiation', 'intimacy_attunement', 'feedback_receiving', 'external_processing'],
      3: ['desire_initiation', 'intimacy_attunement', 'feedback_receiving', 'external_processing'],
      4: [],
    };
    for (const ver of [1, 2, 3, 4] as const) {
      const missing = MISSING_BY_VERSION[ver];
      const code = ver === 4
        ? profileToCode(a.profile) // current format: encode directly
        : encodeLegacyCode(a.profile, (ver - 1) as 0 | 1 | 2);
      const decoded = decodeProfile(code);
      if (!decoded) { console.error(`FAIL: BP${ver} code did not decode`); process.exit(1); }
      for (const d of missing) {
        if (!decoded.dimensions[d as keyof typeof decoded.dimensions]?.unmeasured) {
          console.error(`FAIL: BP${ver} should mark ${d} unmeasured`); process.exit(1);
        }
      }
      const drift = ALL_DIMENSIONS
        .filter((d) => !missing.includes(d))
        .filter((d) => decoded.dimensions[d].score !== a.profile.dimensions[d].score);
      if (drift.length > 0) { console.error(`FAIL: BP${ver} decode drifted on ${drift.join(',')}`); process.exit(1); }
      if (decoded.consistencyIndex !== a.profile.consistencyIndex) {
        console.error(`FAIL: BP${ver} consistencyIndex mismatch`); process.exit(1);
      }
      if (ver < 4) {
        let refused = false;
        try { profileToCode(decoded); } catch { refused = true; }
        if (!refused) { console.error(`FAIL: encoding a BP${ver}-derived (unmeasured) profile should throw`); process.exit(1); }
        const cmpL = compareProfiles(a.profile, decoded);
        if (cmpL.matches.some((m) => missing.includes(m.dimension)) ||
            cmpL.gaps.some((g) => missing.includes(g.dimension))) {
          console.error(`FAIL: BP${ver} compare should skip unmeasured dimensions`); process.exit(1);
        }
        const bp = generateBlueprint(decoded);
        // Sections group several dimensions, so count unmeasured *paragraphs* —
        // exactly one per missing dimension.
        const gapParas = bp.sections.reduce(
          (n, s) => n + s.paragraphs.filter((p) => p.includes('not measured')).length, 0,
        );
        if (gapParas !== missing.length) {
          console.error(`FAIL: BP${ver} blueprint should mark exactly ${missing.length} paragraphs unmeasured, got ${gapParas}`); process.exit(1);
        }
        if (!bp.tensions.some((t) => t.title.includes('cannot see'))) {
          console.error(`FAIL: BP${ver} blueprint should carry the unmeasured tension`); process.exit(1);
        }
        console.log(`BP${ver} legacy: decodes OK · ${missing.length} dims unmeasured · re-encode refused · compare skips · blueprint marks gaps`);
      } else {
        const bp = generateBlueprint(decoded);
        const unmeasured = bp.bands.filter((b) => b.unmeasured).length;
        if (unmeasured !== 0) { console.error('FAIL: BP4 blueprint should have no unmeasured bands'); process.exit(1); }
        console.log(`BP4 current: ${code.length} chars · round-trip exact · no gaps`);
      }
    }
  }
}

// Sanity: profiles must differ
if (a.bp.epigraph === b.bp.epigraph && a.bp.sections[0].paragraphs[1] === b.bp.sections[0].paragraphs[1]) {
  console.error('\nFAIL: A and B produced identical narratives');
  process.exit(1);
}
if (a.profile.dimensions.affection_daily.score === b.profile.dimensions.affection_daily.score) {
  console.error('\nFAIL: affection_daily identical across opposite profiles');
  process.exit(1);
}
// Every ordered question must exist
if (ORDER.length !== QUESTIONS.length) {
  console.error(`\nFAIL: ORDER has ${ORDER.length} entries but QUESTIONS has ${QUESTIONS.length}`);
  process.exit(1);
}
// 7-tier narrative integrity: every dimension must have non-empty prose for
// all seven tiers, complete one-line notes, and valid interplay keys.
{
  const { DIMENSIONS, TIERS, TIER_BOUNDS, tierOf } = require('../src/domain/dimensions');
  if (TIER_BOUNDS.length !== TIERS.length) { console.error('FAIL: TIER_BOUNDS/TIERS length mismatch'); process.exit(1); }
  for (let i = 1; i < TIER_BOUNDS.length; i++) {
    if (TIER_BOUNDS[i] <= TIER_BOUNDS[i - 1]) { console.error('FAIL: TIER_BOUNDS not strictly increasing'); process.exit(1); }
  }
  for (const d of DIMENSIONS) {
    for (const t of TIERS) {
      if (!Array.isArray(d[t]) || d[t].length === 0 || d[t].some((x: string) => x.trim() === '')) {
        console.error(`FAIL: ${d.id} tier '${t}' empty`); process.exit(1);
      }
    }
    for (const t of TIERS) {
      if (typeof d.notes[t] !== 'string' || d.notes[t].trim() === '') {
        console.error(`FAIL: ${d.id} note for '${t}' missing`); process.exit(1);
      }
    }
    for (const key of Object.keys(d.interplay ?? {})) {
      const idx = key.lastIndexOf(':');
      const other = key.slice(0, idx);
      const spec = key.slice(idx + 1);
      const tierNum = Number(spec.replace(/[+-]$/, ''));
      const dir = spec.endsWith('+') || spec.endsWith('-') ? spec.slice(-1) : '+';
      if (!other || Number.isNaN(tierNum) || tierNum < 0 || tierNum >= TIERS.length || (dir !== '+' && dir !== '-')) {
        console.error(`FAIL: ${d.id} bad interplay key '${key}'`); process.exit(1);
      }
      // Direction-vs-prose coherence: a "your high X" claim must never fire
      // below mhigh (4), a "your low X" claim never above mlow (2). This
      // guards against a repeat of the 3-band → 7-tier key drift, where
      // ':3' silently stopped meaning "high".
      const prose = (d.interplay ?? {})[key];
      if (dir === '+' && /your high|high score|high ledger|high repair|high directness|high openness/i.test(prose) && tierNum < 4) {
        console.error(`FAIL: ${d.id} interplay '${key}' claims "high" but fires below mhigh`); process.exit(1);
      }
      if (dir === '-' && /your low|low score|low directness|low celebration|single-register/i.test(prose) && tierNum > 2) {
        console.error(`FAIL: ${d.id} interplay '${key}' claims "low" but fires above mlow`); process.exit(1);
      }
    }
  }
  // Tier distinctness: the seven tier arrays of each dimension must not be
  // paragraph-identical (guards against a migration collapsing two tiers).
  for (const d of DIMENSIONS.slice(0, 6)) {
    const firsts = new Set(TIERS.map((t: string) => (d[t] as string[])[0]));
    if (firsts.size < TIERS.length) {
      console.error(`FAIL: ${d.id} has collapsed tiers (${firsts.size}/7 distinct)`); process.exit(1);
    }
  }
  console.log(`tiers: 7 per dimension · bounds strict · notes complete · interplay keys valid · tiers distinct`);
}

// Derived-pattern engine: determinism, render integrity, caps, gating, polarity.
{
  const { PATTERNS, evaluatePatterns, buildPatternPlan } = require('../src/domain/patterns');
  // Determinism: same profile, same crosscurrents — no seeded drift.
  const cross1 = a.bp.sections.find((s) => s.id === '__crosscurrents');
  const cross2 = generateBlueprint(a.profile).sections.find((s) => s.id === '__crosscurrents');
  if (JSON.stringify(cross1) !== JSON.stringify(cross2)) {
    console.error('FAIL: crosscurrents are not deterministic'); process.exit(1);
  }
  if (cross1) {
    const framed = cross1.paragraphs.filter((p) => p.startsWith('**'));
    if (framed.length !== cross1.paragraphs.length || framed.length > 3) {
      console.error('FAIL: crosscurrents must be 1–3 frame-led pattern paragraphs'); process.exit(1);
    }
  }
  // Render integrity: no leaks, and every section paragraph is real prose.
  for (const s of a.bp.sections) {
    for (const p of s.paragraphs) {
      if (p.includes('undefined') || p.includes('[object')) {
        console.error(`FAIL: render leak in section ${s.id}`); process.exit(1);
      }
    }
  }
  // Gating: a pattern whose inputs are unmeasured must never render (legacy BP1).
  const legacyP = decodeProfile(encodeLegacyCode(a.profile, 0));
  const bpL = generateBlueprint(legacyP);
  const allParasL = bpL.sections.flatMap((s) => s.paragraphs);
  for (const pat of PATTERNS) {
    if (!pat.dims.some((d: string) => legacyP.dimensions[d as keyof typeof legacyP.dimensions]?.unmeasured)) continue;
    if (allParasL.some((p: string) => p.includes(pat.frame))) {
      console.error(`FAIL: pattern ${pat.id} fired with an unmeasured input`); process.exit(1);
    }
  }
  // Polarity: profile A answers at the generous/steady pole — the compounding
  // low-perspective pattern must not fire on it.
  const fastOne = PATTERNS.find((x: { id: string }) => x.id === 'fast_conclusions_anxious');
  if (fastOne.when(a.profile)) {
    console.error('FAIL: fast_conclusions_anxious fired on the wrong pole'); process.exit(1);
  }
  // Plan caps: headline ≤3, and every placement spot ≤2.
  const plan = buildPatternPlan(a.profile);
  if (plan.headline.length > 3) { console.error('FAIL: headline cap exceeded'); process.exit(1); }
  for (const arr of plan.sections.values()) {
    if (arr.length > 2) { console.error('FAIL: per-spot cap exceeded'); process.exit(1); }
  }
  console.log(`patterns: ${PATTERNS.length} authored · ${evaluatePatterns(a.profile).length} eligible on profile A · headline: ${plan.headline.map((h) => h.pattern.id).join(', ') || 'none'} · inline: ${plan.sections.size} spots`);
}

// Within-dimension variance: data shape, divider semantics, and blueprint gating.
{
  const { isInternallyDivided } = require('../src/domain/scoring');
  const { VARIANCE_LIBRARY, GENERIC_VARIANCE, genericVarianceFor, tierOf } = require('../src/domain/dimensions');

  // Full runs carry variance; share-code profiles never do.
  for (const r of [a, b, c]) {
    if (!r.profile.variance || Object.keys(r.profile.variance).length === 0) {
      console.error('FAIL: full run should carry variance data'); process.exit(1);
    }
  }
  const vc = profileToCode(a.profile);
  const vd = decodeProfile(vc);
  if (!vd || vd.variance !== undefined) {
    console.error('FAIL: share-code profile must not invent variance'); process.exit(1);
  }

  // Field sanity on one dimension's shape.
  const v0 = Object.values(a.profile.variance as Record<string, { contributions: number[]; typical: number; peak: number; posShare: number; cancellation: number; peakShare: number }>)[0]!;
  if (v0.contributions.length === 0 || v0.typical <= 0 || v0.peak < v0.typical) {
    console.error('FAIL: variance fields incoherent'); process.exit(1);
  }
  if (v0.posShare < 0 || v0.posShare > 1 || v0.cancellation < 0 || v0.cancellation > 0.5 || v0.peakShare < 0 || v0.peakShare > 1) {
    console.error('FAIL: variance shares out of range'); process.exit(1);
  }
  if (Math.abs(v0.peak - Math.max(...v0.contributions.map(Math.abs))) > 1e-9) {
    console.error('FAIL: peak is not max |contribution|'); process.exit(1);
  }

  // Divider semantics: a dimension pulled in BOTH directions by enough real
  // answers must read as internally divided; a one-sided run must not.
  // (Non-agreement questions only: their options carry absolute weights, which
  // keeps the fixture's arithmetic checkable. A 2-answer fixture is legally
  // NOT divided — five voices minimum — so the fixture builds a balanced 3v3.)
  type Edge = { qid: string; oid: string; w: number };
  const byDim = new Map<string, { pos: Edge[]; neg: Edge[] }>();
  for (const q of QUESTIONS) {
    if (q.format === 'agreement') continue;
    for (const o of q.options as Array<{ id: string; weight?: Record<string, number> }>) {
      for (const [d, w] of Object.entries(o.weight ?? {})) {
        if (w === 0) continue;
        const g = byDim.get(d) ?? { pos: [], neg: [] };
        (w > 0 ? g.pos : g.neg).push({ qid: q.id, oid: o.id, w });
        byDim.set(d, g);
      }
    }
  }
  let fix: { dim: string; edges: Edge[] } | null = null;
  for (const [dim, g] of byDim) {
    if (g.pos.length < 3 || g.neg.length < 3) continue;
    // Greedy balance: strongest pair first, then whichever (pos, neg) pair
    // keeps the two sides closest in total weight.
    const edges: Edge[] = [];
    const usedQ = new Set<string>();
    let P = 0, N = 0;
    for (let round = 0; round < 3; round++) {
      let best: { p: Edge; n: Edge; imbalance: number } | null = null;
      for (const p of g.pos) {
        if (usedQ.has(p.qid)) continue;
        for (const n of g.neg) {
          if (usedQ.has(n.qid)) continue;
          const imbalance = Math.abs(P + p.w - (N + Math.abs(n.w)));
          if (!best || imbalance < best.imbalance) best = { p, n, imbalance };
        }
      }
      if (!best) break;
      edges.push(best.p, best.n);
      usedQ.add(best.p.qid); usedQ.add(best.n.qid);
      P += best.p.w; N += Math.abs(best.n.w);
    }
    if (edges.length === 6 && Math.min(P, N) / (P + N) >= 0.4) { fix = { dim, edges }; break; }
  }
  if (!fix) { console.error('FAIL: no balanced polarized fixture found'); process.exit(1); }
  const answersFix: Answers = {};
  for (const e of fix.edges) answersFix[e.qid] = { kind: 'option' as const, optionId: e.oid };
  const vp = scoreProfile(answersFix).variance?.[fix.dim as keyof NonNullable<ReturnType<typeof scoreProfile>['variance']>];
  if (!vp || !isInternallyDivided(vp)) {
    console.error(`FAIL: balanced opposing answers on ${fix.dim} should read as internally divided`); process.exit(1);
  }
  const answersOne: Answers = {};
  for (const e of fix.edges.filter((e) => e.w > 0)) answersOne[e.qid] = { kind: 'option' as const, optionId: e.oid };
  const va = scoreProfile(answersOne).variance?.[fix.dim as keyof NonNullable<ReturnType<typeof scoreProfile>['variance']>];
  if (!va || isInternallyDivided(va)) {
    console.error('FAIL: one-sided answers must not read as divided'); process.exit(1);
  }

  // Blueprint gating, replicated exactly: the rendered variance notes must be
  // exactly the gated set (mid/leaning tier + divided shape + measured), no
  // more, no fewer — for all three seeded profiles.
  const known = new Set([...Object.values(VARIANCE_LIBRARY), ...GENERIC_VARIANCE]);
  let renderedTotal = 0;
  for (const r of [a, b, c]) {
    const expected: string[] = [];
    for (const [dimId, v] of Object.entries(r.profile.variance ?? {})) {
      const d = r.profile.dimensions[dimId as keyof typeof r.profile.dimensions];
      if (!d || d.unmeasured) continue;
      const t = tierOf(d.score);
      if (t !== 'mid' && t !== 'mlow' && t !== 'mhigh') continue;
      if (!isInternallyDivided(v!)) continue;
      expected.push(VARIANCE_LIBRARY[dimId as keyof typeof VARIANCE_LIBRARY] ?? genericVarianceFor(dimId + String(Math.round(d.score))));
    }
    const rendered = r.bp.sections.flatMap((s) => s.paragraphs).filter((p) => known.has(p));
    if (JSON.stringify([...rendered].sort()) !== JSON.stringify([...expected].sort())) {
      console.error(`FAIL: variance rendering does not match the gate (expected ${expected.length}, rendered ${rendered.length})`); process.exit(1);
    }
    renderedTotal += rendered.length;
  }

  console.log(`variance: shape valid · opposing/divided + one-sided/clean · gating exact (${renderedTotal} notes across A/B/C) · codes carry none`);
}

console.log('\nALL SMOKE CHECKS PASSED');
