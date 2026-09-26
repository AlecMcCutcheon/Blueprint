import type { ScoredProfile, DimensionId, Answers, DomainId } from './types';
import { DOMAIN_LABELS, DOMAIN_DIMENSIONS } from './types';
import { ALL_DIMENSIONS, CONSISTENCY_PAIRS } from './scoring';
import { tierOf } from './dimensions';
import type { TierId } from './dimensions';
import { QUESTIONS } from './questions';

// Two carriers, two privacy levels:
//
//   Metric share codes (BP1/BP2/BP3/BP4) carry ONLY the derived metrics (dimension
//   scores, consistency index and per-pair agreements, dominant channels,
//   completion count) — never the raw answers. Anything that has the code can
//   regenerate the blueprint document deterministically, on their own device,
//   with no server involved. A code alone cannot be phrased with a name: the
//   code IS the payload, and adding fields to it would bloat it with data the
//   recipient didn't ask for. Names and intents live in the LINK.
//
//   Full-session codes (BPS) and JSON exports carry the raw answers — used to
//   restore YOUR OWN session (device migration, backup), not to hand someone
//   else your questionnaire. Everything downstream (scores, blueprint, review,
//   clarifiers) rebuilds naturally from answers.
//
// Version history:
//   v1 (BP1) — 17 dimensions, before relational_privacy existed.
//   v2 (BP2) — 18 dimensions, adds relational_privacy + its echo pair.
//   v3 (BP3) — 24 dimensions, adds sexual_communication, positivity_play,
//              capitalization, conflict_engagement, commitment_sacrifice,
//              money_coordination + three new echo pairs.
//   v4 (BP4) — 28 dimensions, adds desire_initiation, intimacy_attunement
//              (closeness), feedback_receiving (processing),
//              external_processing (boundaries) — keeping every domain even.//   v5 (BP5) — derived-evidence parity code: everything BP4 carries, plus a
//              QUANTIZED VARIANCE SHAPE per dimension (answering count,
//              positive count, cancellation — exactly what the variance-prose
//              gates consume), per-pair disagreement DIRECTION, and the
//              receiving-channel breadth. Deliberately still short of the
//              raw answers: the policy is that the code may carry exactly what
//              the shared document reveals, and nothing more. Billions of
//              answer-sets collapse into the same aggregates, so nothing here
//              is invertible back to how anyone answered any specific question.
//   v6 (BP6) — 30 dimensions, adds care_role_flexibility (reciprocity) and
//              desire_grace (closeness) from the founding document's
//              under-visible sections, + 1 new echo pair. Same derived-evidence
//              payload as BP5, sized to the 30-dim layout. BP1–BP5 decode with
//              the two newer dimensions flagged unmeasured (never guessed).
// Legacy codes decode with newer dimensions marked "unmeasured" (score 50,
// evidence 0) rather than guessed — the document renders the gap explicitly.

const CHANNELS = ['words', 'touch', 'service', 'space'] as const;

interface CodeVersion {
  prefix: string;
  dims: number;
  pairs: number;
  /** Dimensions absent from this version, in ALL_DIMENSIONS order. */
  missing: DimensionId[];
  /** Echo pairs absent from this version, in CONSISTENCY_PAIRS order. */
  missingPairs: number;
}

function versionFor(dims: number, pairs: number, missing: DimensionId[], missingPairs: number): CodeVersion {
  const prefix = dims === 17 ? 'BP1' : dims === 18 ? 'BP2' : dims === 24 ? 'BP3' : dims === 28 ? 'BP4' : dims === 30 ? 'BP6' : 'BP5';
  return { prefix, dims, pairs, missing, missingPairs };
}

/** Test/verification helper: encode a profile in a legacy layout (no unmeasured dims allowed). */
export function encodeLegacyCode(p: ScoredProfile, versionIndex: 0 | 1 | 2): string {
  const v = VERSIONS[versionIndex];
  const bytes: number[] = [Number(v.prefix[2])];
  for (const d of ALL_DIMENSIONS) {
    if (v.missing.includes(d)) continue;
    bytes.push(clamp(p.dimensions[d].score));
  }
  bytes.push(clamp(p.consistencyIndex));
  const presentPairs = CONSISTENCY_PAIRS.slice(0, CONSISTENCY_PAIRS.length - v.missingPairs);
  for (const [a, b] of presentPairs) {
    const found = p.consistency.find((c) => c.a === a && c.b === b);
    bytes.push(found ? clamp(found.agreement) : 0);
  }
  bytes.push(Math.max(0, Math.min(255, p.answered)));
  const ch = (c: string | null) => (c ? CHANNELS.indexOf(c as (typeof CHANNELS)[number]) + 1 : 0);
  bytes.push(((ch(p.channels.express) & 0xf) << 4) | (ch(p.channels.receive) & 0xf));
  return v.prefix + b64encode(new Uint8Array(bytes));
}

// The four historical layouts plus the current one. Dimensions are cumulative —
// v1 ⊂ v2 ⊂ v3 ⊂ v4 ⊂ v6 — so one decoder covers all of them: each version
// contributes its present dimensions and pairs in order, and the rest are
// marked unmeasured. (v4's layout is frozen at 28 dims even though the bank
// grew; v6 is the only version that encodes the wave-7 dimensions.)
const VERSIONS: CodeVersion[] = [
  versionFor(
    ALL_DIMENSIONS.length - 13,
    CONSISTENCY_PAIRS.length - 8,
    ['relational_privacy', 'sexual_communication', 'positivity_play', 'capitalization', 'conflict_engagement', 'commitment_sacrifice', 'money_coordination', 'desire_initiation', 'intimacy_attunement', 'feedback_receiving', 'external_processing', 'care_role_flexibility', 'desire_grace'],
    8,
  ),
  versionFor(
    ALL_DIMENSIONS.length - 12,
    CONSISTENCY_PAIRS.length - 7,
    ['sexual_communication', 'positivity_play', 'capitalization', 'conflict_engagement', 'commitment_sacrifice', 'money_coordination', 'desire_initiation', 'intimacy_attunement', 'feedback_receiving', 'external_processing', 'care_role_flexibility', 'desire_grace'],
    7,
  ),
  versionFor(
    ALL_DIMENSIONS.length - 6,
    CONSISTENCY_PAIRS.length - 1,
    ['desire_initiation', 'intimacy_attunement', 'feedback_receiving', 'external_processing', 'care_role_flexibility', 'desire_grace'],
    1,
  ),
  versionFor(
    ALL_DIMENSIONS.length - 2,
    CONSISTENCY_PAIRS.length - 1,
    ['care_role_flexibility', 'desire_grace'],
    1,
  ),
  versionFor(ALL_DIMENSIONS.length, CONSISTENCY_PAIRS.length, [], 0),
];

function expectedBytes(v: CodeVersion): number {
  // version + dims + consistencyIndex + pairs + answered + channel nibbles
  return 1 + v.dims + 1 + v.pairs + 1 + 1;
}

function b64encode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64decode(str: string): Uint8Array {
  const norm = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = norm + '='.repeat((4 - (norm.length % 4)) % 4);
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const quintize = (v: number) => Math.max(0, Math.min(200, Math.round(v * 200)));

/** Reconstructable variance shape for one dimension. */
interface VarShape { count: number; posCount: number; cancellation: number }

function shapeOf(p: ScoredProfile, d: DimensionId): VarShape | null {
  const v = p.variance?.[d];
  if (!v) return null;
  return { count: v.contributions.length, posCount: v.contributions.filter((c) => c > 0).length, cancellation: v.cancellation };
}

/** The BP4 body bytes (everything after the prefix), parameterized by layout version. */
function codeBody(p: ScoredProfile, version: CodeVersion, versionTag: number): number[] {
  const bytes: number[] = [versionTag];
  for (const d of ALL_DIMENSIONS) {
    if (version.missing.includes(d)) continue;
    bytes.push(clamp(p.dimensions[d].score));
  }
  bytes.push(clamp(p.consistencyIndex));
  for (const [a, b] of CONSISTENCY_PAIRS) {
    const found = p.consistency.find((x) => x.a === a && x.b === b);
    bytes.push(found ? clamp(found.agreement) : 0);
  }
  bytes.push(Math.max(0, Math.min(255, p.answered)));
  const ch = (c: string | null) => (c ? CHANNELS.indexOf(c as (typeof CHANNELS)[number]) + 1 : 0);
  bytes.push(((ch(p.channels.express) & 0xf) << 4) | (ch(p.channels.receive) & 0xf));
  return bytes;
}



/**
 * BP5 — the derived-evidence share code. Payload: [5][BP4 body][per-dimension
 * count/posCount/cancellation][per-pair lean signs, 2 bits each][receiving
 * breadth][FNV checksum]. Carries exactly what the shared document reveals and
 * nothing more — the variance gates and tension directions the prose consumes,
 * quantized so nothing is invertible back to specific answers.
 */
export function profileToCode5(p: ScoredProfile): string {
  return derivedEvidenceCode(p, VERSIONS[3], 5, 'BP5', () => profileToCode(p));
}

/**
 * BP6 — the current derived-evidence code: BP5's payload over the 30-dimension
 * layout (adds care_role_flexibility + desire_grace and the new echo pair).
 * Fallback when no variance data exists is a plain BP4 — the 28-dim layout
 * stays valid forever, and the two wave-7 dimensions decode unmeasured.
 */
export function profileToCode6(p: ScoredProfile): string {
  return derivedEvidenceCode(p, VERSIONS[4], 6, 'BP6', () => profileToCode(p));
}

/** Shared BP5/BP6 payload builder: [tag][layout body][per-dim shapes][pair leans][breadth][checksum]. */
function derivedEvidenceCode(
  p: ScoredProfile,
  version: CodeVersion,
  tag: number,
  prefix: string,
  fallback: () => string,
): string {
  const bytes: number[] = [tag, ...codeBody(p, version, tag)];
  let anyShape = false;
  for (const d of ALL_DIMENSIONS) {
    const s = shapeOf(p, d);
    if (s) {
      anyShape = true;
      bytes.push(Math.min(255, s.count), Math.min(255, s.posCount), quintize(s.cancellation));
    } else {
      bytes.push(0, 0, 0);
    }
  }
  const leanByte = (qa: string, qb: string): number => {
    const c = p.consistency.find((x) => x.a === qa && x.b === qb) ?? p.consistency.find((x) => x.a === qb && x.b === qa);
    const pa = c?.positionA;
    const pb = c?.positionB;
    if (pa === undefined || pb === undefined) return 0xff; // unknown
    const lean = c!.a === qa ? pb - pa : pa - pb;
    return Math.max(0, Math.min(252, Math.round((lean + 1.8) * 70)));
  };
  for (const [a, b] of CONSISTENCY_PAIRS) bytes.push(leanByte(a, b));
  bytes.push(Math.min(255, Math.max(0, p.receiveBreadth ?? 0)));
  bytes.push(fnv1aLow(new Uint8Array(bytes)));
  if (!anyShape) return fallback(); // no variance data at all → plain BP4
  return prefix + b64encode(new Uint8Array(bytes));
}

/**
 * Decode a BP5/BP6 derived-evidence code: reconstruct the layout profile from
 * its embedded body, then layer the derived evidence (varianceShape per
 * dimension, pairLeans, breadth) so prose gates evaluate exactly as they do
 * for the owner. A checksum failure or malformed tail returns null → the
 * caller falls back to legacy handling.
 */
function decodeDerivedEvidence(bytes: Uint8Array, version: CodeVersion): ScoredProfile | null {
  const bodyLen = expectedBytes(version);
  if (bytes.length < 1 + bodyLen + ALL_DIMENSIONS.length * 3 + 3 + 1 + 1) return null;
  if (bytes[bytes.length - 1] !== fnv1aLow(bytes.slice(0, bytes.length - 1))) return null;
  const base = decodeVersion(version, bytes.slice(1, 1 + bodyLen));
  if (!base) return null;
  let i = 1 + bodyLen;
  const shapes = new Map<DimensionId, VarShape>();
  for (const d of ALL_DIMENSIONS) {
    const count = bytes[i], posCount = bytes[i + 1], canc = bytes[i + 2];
    i += 3;
    if (count > 0) shapes.set(d, { count, posCount, cancellation: canc / 200 });
  }
  const leans: number[] = [];
  for (let k = 0; k < CONSISTENCY_PAIRS.length && i < bytes.length - 2; k++, i++) {
    const b = bytes[i];
    leans.push(b === 0xff || b > 252 ? NaN : b / 70 - 1.8); // NaN = unknown
  }
  const receiveBreadth = bytes[i];
  const dimensions = { ...base.dimensions };
  for (const [d, s] of shapes) {
    dimensions[d] = { ...dimensions[d], varianceShape: s };
  }
  const pairLeans: Record<string, number> = {};
  CONSISTENCY_PAIRS.forEach(([a, b], idx) => {
    const lean = leans[idx];
    if (lean !== undefined && !Number.isNaN(lean)) pairLeans[`${a}|${b}`] = lean;
  });
  return { ...base, dimensions, pairLeans, receiveBreadth: receiveBreadth > 0 ? receiveBreadth : undefined };
}

export function profileToCode(p: ScoredProfile): string {
  // Refuse to encode a profile with unmeasured dimensions — the document built
  // from such a code would look complete while silently guessing.
  const unmeasured = ALL_DIMENSIONS.filter((d) => p.dimensions[d]?.unmeasured);
  if (unmeasured.length > 0) {
    throw new Error(
      `Cannot share a code with unmeasured dimensions (${unmeasured.join(', ')}). ` +
      'Complete the newer questions first — your existing answers are kept.',
    );
  }
  const bytes: number[] = [4]; // version
  for (const d of ALL_DIMENSIONS) {
    if (VERSIONS[3].missing.includes(d)) continue;
    bytes.push(clamp(p.dimensions[d].score));
  }
  bytes.push(clamp(p.consistencyIndex));
  // Frozen BP4 layout: the wave-7 echo pair postdates it, so it is not on the
  // wire — legacy decoders expect exactly v.dims + v.pairs bytes.
  const bp4Pairs = CONSISTENCY_PAIRS.slice(0, CONSISTENCY_PAIRS.length - VERSIONS[3].missingPairs);
  for (const [a, b] of bp4Pairs) {
    const found = p.consistency.find((c) => c.a === a && c.b === b);
    bytes.push(found ? clamp(found.agreement) : 0);
  }
  bytes.push(Math.max(0, Math.min(255, p.answered)));
  const ch = (c: string | null) => (c ? CHANNELS.indexOf(c as (typeof CHANNELS)[number]) + 1 : 0);
  bytes.push(((ch(p.channels.express) & 0xf) << 4) | (ch(p.channels.receive) & 0xf));
  return VERSIONS[3].prefix + b64encode(new Uint8Array(bytes));
}

/** One generalized decoder for all four layouts — each is a prefix of the next. */
function decodeVersion(v: CodeVersion, bytes: Uint8Array): ScoredProfile | null {
  let i = 1;
  const dimensions = {} as ScoredProfile['dimensions'];
  for (const d of ALL_DIMENSIONS) {
    if (v.missing.includes(d)) {
      // Absent from this code version — neutral placeholder, explicitly flagged.
      dimensions[d] = { id: d, score: 50, evidence: 0, unmeasured: true };
      continue;
    }
    dimensions[d] = { id: d, score: bytes[i++], evidence: 1 };
  }
  const consistencyIndex = bytes[i++];
  const presentPairs = CONSISTENCY_PAIRS.slice(0, CONSISTENCY_PAIRS.length - v.missingPairs);
  const consistency = presentPairs.map(([a, b, dimension]) => ({
    a,
    b,
    agreement: bytes[i++],
    dimension,
  }));
  const answered = bytes[i++];
  const chByte = bytes[i++];
  const chDec = (n: number) => (n > 0 ? (CHANNELS[n - 1] as string) : null);
  const channels = {
    express: chDec((chByte >> 4) & 0xf),
    receive: chDec(chByte & 0xf),
  };

  const avg = (ids: DimensionId[]) =>
    Math.round(
      ids.filter((id) => !dimensions[id].unmeasured).reduce((s, id) => s + dimensions[id].score, 0) /
      Math.max(1, ids.filter((id) => !dimensions[id].unmeasured).length),
    );
  const metas = [
    { id: 'mutual_care' as const, score: avg(['care_initiation', 'receiving_comfort', 'scorekeeping']) },
    { id: 'emotional_safety' as const, score: avg(['vulnerability_safety', 'reassurance_security', 'listening_first']) },
    { id: 'teamwork' as const, score: avg(['same_side_problems', 'repair_orientation', 'direct_communication']) },
  ];

  return { dimensions, metas, consistency, consistencyIndex, channels, answered, total: QUESTIONS.length };
}

export function decodeProfile(code: string): ScoredProfile | null {
  try {
    const trimmed = code.trim();
    const prefix = trimmed.slice(0, 3).toUpperCase();
    const payload = trimmed.slice(3);
    const bytes = b64decode(payload);
    if (prefix === 'BP5') return decodeDerivedEvidence(bytes, VERSIONS[3]);
    if (prefix === 'BP6') return decodeDerivedEvidence(bytes, VERSIONS[4]);
    const version = VERSIONS.find((v) => v.prefix === prefix);
    if (!version) return null;
    if (bytes.length !== expectedBytes(version)) return null;
    if (bytes[0] !== Number(prefix[2])) return null;
    return decodeVersion(version, bytes);
  } catch {
    return null;
  }
}

// ─── Full-session codes ──────────────────────────────────────────────────────

/**
 * A full-session code packs the RAW ANSWERS + presentation order seed so the
 * real session restores anywhere: review shows the actual choices, the
 * blueprint rebuilds from evidence, and even the question order survives.
 * Name/intent stay out of the code — they belong in the link (they are
 * transport, not data).
 *
 * Layout: "BPS" + urlsafe base64 of [ 'S' tag byte, seed int32 LE ×4, then one
 * byte per core question: 0 = unanswered, 1..127 = option index +1 (scenario)
 * or 0x80|value (agreement scale). One byte per question keeps the code short
 * and makes it DETERMINISTIC for a given answer set — the export box doesn't
 * churn while the user reads it. Deterministic encoding requires that every
 * chosen option be findable by reverse index lookup, which encodeFullSession
 * validates (stale option ids throw rather than silently shifting indices).
 */
export interface SessionCodeResult {
  code: string;
  /** Questions whose stored answer didn't match the current bank (skipped). */
  skipped: string[];
}

export function encodeFullSession(answers: Answers, seed: number): SessionCodeResult {
  const skipped: string[] = [];
  const bytes: number[] = [0x53]; // 'S' payload tag
  const s = Math.max(1, Math.min(2147483647, Math.round(seed) || 1)) & 0x7fffffff;
  bytes.push(s & 0xff, (s >>> 8) & 0xff, (s >>> 16) & 0xff, (s >>> 24) & 0xff);

  for (const q of QUESTIONS) {
    const v = answers[q.id];
    if (!v) {
      bytes.push(0);
      continue;
    }
    if (v.kind === 'scale') {
      const opt = q.options.find((o) => 'value' in o && String((o as { value: number }).value) === String(v.value));
      if (!opt) throw new Error(`Scale answer for ${q.id} no longer matches the question bank`);
      bytes.push(0x80 | (Math.max(1, Math.min(127, v.value)) & 0x7f));
    } else {
      const idx = q.options.findIndex((o) => 'label' in o && o.id === v.optionId);
      if (idx < 0) throw new Error(`Option answer for ${q.id} no longer matches the question bank`);
      if (idx >= 127) throw new Error(`Too many options on ${q.id} for a session code`);
      bytes.push(idx + 1);
    }
  }
  return { code: 'BPS' + b64encode(new Uint8Array(bytes)), skipped };
}

/** Payload of a decoded full-session code. */
export interface DecodedSession {
  answers: Answers;
  seed: number;
  /** Core questions left unanswered in the encoded session. */
  missing: string[];
}

export function decodeFullSession(code: string): DecodedSession | null {
  try {
    const trimmed = code.trim();
    if (trimmed.slice(0, 3).toUpperCase() !== 'BPS') return null;
    const bytes = b64decode(trimmed.slice(3));
    if (bytes.length < 5 || bytes[0] !== 0x53) return null;
    const seed =
      bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24); // LE; top bit never set
    const answers: Answers = {};
    const missing: string[] = [];
    const n = Math.min(QUESTIONS.length, bytes.length - 5);
    for (let i = 0; i < n; i++) {
      const q = QUESTIONS[i];
      const b = bytes[5 + i];
      if (b === 0) {
        missing.push(q.id);
        continue;
      }
      if (b & 0x80) {
        if (q.format !== 'agreement') return null; // layout mismatch — refuse, don't guess
        answers[q.id] = { kind: 'scale', value: b & 0x7f };
      } else {
        if (q.format === 'agreement') return null;
        const opt = q.options[b - 1];
        if (!opt) return null;
        answers[q.id] = { kind: 'option', optionId: opt.id };
      }
    }
    return { answers, seed: seed > 0 ? seed : 1, missing };
  } catch {
    return null;
  }
}

// ─── Share links ─────────────────────────────────────────────────────────────

/**
 * A share link wraps a metric code in a URL. The sharer's NAME and sharing
 * INTENT ride in a single opaque, checksummed segment (?m=…) rather than as
 * readable params: the link works without a readable name, and the checksum
 * means a modified or corrupted segment degrades to the generic "somebody
 * shared this" presentation instead of delivering a tampered name.
 *
 * Segment layout: urlsafe base64 of [ flags, name utf-8 bytes…, checksum ]
 *   flags bit 0: intent (0 = show, 1 = invite)
 *   checksum: low byte of FNV-1a over (code + flags + name) — the segment is
 *   bound to the profile it accompanies, so swapping segments between links
 *   also fails the check.
 *
 * Legacy ?name=/?mode= params are ignored entirely. The bp code itself is
 * separately validated by decodeProfile.
 */
export type ShareIntent = 'show' | 'invite';

const NAME_MAX = 40;

function fnv1aLow(bytes: Uint8Array): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) & 0xff;
}

const textEnc = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
const textDec = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;

function utf8Bytes(s: string): Uint8Array {
  if (textEnc) return textEnc.encode(s);
  return new Uint8Array(Array.from(s, (c) => c.charCodeAt(0) & 0xff));
}

function encodeMetaSegment(code: string, name: string, intent: ShareIntent): string {
  const flags = intent === 'invite' ? 1 : 0;
  const nameBytes = utf8Bytes(name);
  const codeBytes = utf8Bytes(code);
  const body = new Uint8Array(codeBytes.length + 1 + nameBytes.length);
  body.set(codeBytes, 0);
  body[codeBytes.length] = flags;
  body.set(nameBytes, codeBytes.length + 1);
  const sum = fnv1aLow(body);
  const seg = new Uint8Array(1 + nameBytes.length + 1);
  seg[0] = flags;
  seg.set(nameBytes, 1);
  seg[seg.length - 1] = sum;
  return b64encode(seg);
}

interface DecodedMeta { name: string | null; intent: ShareIntent }

/** Any structural or checksum failure degrades to the generic presentation. */
function decodeMetaSegment(code: string, segment: string): DecodedMeta {
  const generic: DecodedMeta = { name: null, intent: 'show' };
  try {
    const bytes = b64decode(segment);
    if (bytes.length < 2) return generic;
    const flags = bytes[0];
    const nameBytes = bytes.slice(1, bytes.length - 1);
    const sum = bytes[bytes.length - 1];
    const codeBytes = utf8Bytes(code);
    const body = new Uint8Array(codeBytes.length + 1 + nameBytes.length);
    body.set(codeBytes, 0);
    body[codeBytes.length] = flags;
    body.set(nameBytes, codeBytes.length + 1);
    if (fnv1aLow(body) !== sum) return generic;
    const intent: ShareIntent = (flags & 1) === 1 ? 'invite' : 'show';
    const name = nameBytes.length > 0 && textDec ? textDec.decode(nameBytes).slice(0, NAME_MAX) : null;
    return { name, intent };
  } catch {
    return generic;
  }
}

export function buildShareLink(code: string, opts?: { name?: string | null; intent?: ShareIntent }): string {
  const params = new URLSearchParams();
  params.set('bp', code);
  const name = opts?.name?.trim();
  const intent = opts?.intent ?? 'show';
  if ((name && name.length > 0) || intent !== 'show') {
    params.set('m', encodeMetaSegment(code, name ? name.slice(0, NAME_MAX) : '', intent));
  }
  const base = typeof window !== 'undefined' && window.location
    ? window.location.origin + window.location.pathname
    : '/';
  return `${base}?${params.toString()}`;
}

/** Raw URL fields (no interpretation). */
export interface ParsedShareUrl {
  code: string;
  name: string | null;
  intent: ShareIntent;
}

/**
 * Read share fields out of a URL string (or a URLSearchParams). Returns null
 * when no recognizable metric code is present — session codes (BPS) and
 * imports are deliberately NOT accepted here: a link is for visiting someone
 * else's blueprint, and the owner-side flows import through file/code boxes.
 *
 * Name/intent come from the checksummed ?m= segment; missing or corrupt
 * segments decode to the generic unnamed/'show' presentation rather than an
 * error — a broken link should still show the blueprint, just generically.
 */
export function parseShareUrl(input: string | URLSearchParams): ParsedShareUrl | null {
  try {
    const params = typeof input === 'string' ? new URL(input, 'http://x.invalid').searchParams : input;
    const code = (params.get('bp') ?? '').trim();
    if (!code) return null;
    if (!/^BP[1-6]/i.test(code)) return null; // metric codes only
    const decoded = decodeProfile(code);
    if (!decoded) return null;
    const meta = decodeMetaSegment(code, (params.get('m') ?? '').trim());
    return { code, name: meta.name, intent: meta.intent };
  } catch {
    return null;
  }
}

// ─── Comparison ──────────────────────────────────────────────────────────────

/** One dimension's side-by-side reading, with tier words from the document. */
export interface CompareDimension {
  dimension: DimensionId;
  a: number;
  b: number;
  /** |a − b|. */
  delta: number;
  tierA: TierId;
  tierB: TierId;
  /** True when the two scores sit in different tier bands — prose would read them differently. */
  tierGap: boolean;
  /** Direction: +1 you higher, −1 they higher, 0 tie. */
  direction: -1 | 0 | 1;
}

/** All measured dimensions of one domain, plus how hot that domain runs. */
export interface CompareDomain {
  domain: DomainId;
  label: string;
  rows: CompareDimension[];
  /** Mean |delta| across the domain's measured rows. */
  meanDelta: number;
}

export interface ProfileCompare {
  /** 0–100: 100 = identical profiles across the measured primary dimensions. */
  alignmentIndex: number;
  matches: { dimension: DimensionId; a: number; b: number }[];
  gaps: { dimension: DimensionId; a: number; b: number; delta: number }[];
  /** Does what one person naturally GIVE match what the other hears best? */
  crossChannels: { youGive: string | null; theyHear: string | null; match: boolean; state: 'match' | 'gap' | 'unspecified' }[];
  /** Every measured dimension, grouped by domain in DOMAIN_DIMENSIONS order. */
  domains: CompareDomain[];
  /** Measured dimension count behind the index — context for legacy codes. */
  measuredCount: number;
  /** Dimensions at least one side couldn't measure (legacy share codes). */
  unmeasuredCount: number;
  /** Measured dims in the same tier band — the deep-agreement core. */
  sameTierCount: number;
  /** Deltas that crossed a tier boundary — where two documents disagree about the reading, not just the number. */
  tierGaps: { dimension: DimensionId; a: number; b: number; delta: number }[];
}

export function compareProfiles(a: ScoredProfile, b: ScoredProfile): ProfileCompare {
  // Dimensions neither profile actually measured are excluded — a 50/50 guess
  // would manufacture fake alignment or fake gaps.
  const dims = ALL_DIMENSIONS.filter(
    (d): d is DimensionId =>
      d !== 'express_receive_alignment' &&
      !a.dimensions[d]?.unmeasured &&
      !b.dimensions[d]?.unmeasured,
  );
  const items = dims.map((d) => ({
    dimension: d,
    a: a.dimensions[d].score,
    b: b.dimensions[d].score,
    delta: Math.abs(a.dimensions[d].score - b.dimensions[d].score),
  }));
  const meanDelta = items.length > 0 ? items.reduce((s, x) => s + x.delta, 0) / items.length : 0;
  const alignmentIndex = Math.max(0, Math.round(100 - meanDelta));
  const matches = [...items]
    .sort((x, y) => x.delta - y.delta)
    .slice(0, 3)
    .map(({ dimension, a: sa, b: sb }) => ({ dimension, a: sa, b: sb }));
  const gaps = [...items].sort((x, y) => y.delta - x.delta).slice(0, 3);
  // A null channel is NOT a mismatch: a missing express channel means no
  // flagship way of giving; a missing receive channel is the WIDE dictionary
  // — care lands in whatever register it arrives in. Rendering "— / transla-
  // tion needed" for a wide receiver tells exactly the wrong story.
  const stateFor = (give: string | null, hear: string | null): 'match' | 'gap' | 'unspecified' =>
    !give || !hear ? 'unspecified' : give === hear ? 'match' : 'gap';
  const crossChannels = [
    {
      youGive: a.channels.express,
      theyHear: b.channels.receive,
      match: !!a.channels.express && a.channels.express === b.channels.receive,
      state: stateFor(a.channels.express, b.channels.receive),
    },
    {
      youGive: b.channels.express,
      theyHear: a.channels.receive,
      match: !!b.channels.express && b.channels.express === a.channels.receive,
      state: stateFor(b.channels.express, a.channels.receive),
    },
  ];

  // ── The full 30-dimension table, grouped by domain ──
  // Every measured dimension appears — matches/gaps are the headlines, this
  // is the whole story. Tier bands come from the document itself, so the
  // compare screen speaks the same language the blueprints do.
  const deltaByDim = new Map(items.map((x) => [x.dimension, x]));
  const domains: CompareDomain[] = (Object.keys(DOMAIN_DIMENSIONS) as DomainId[]).map((domain) => {
    const rows: CompareDimension[] = [];
    for (const d of DOMAIN_DIMENSIONS[domain]) {
      const it = deltaByDim.get(d);
      if (!it) continue; // unmeasured on at least one side
      const tierA = tierOf(it.a);
      const tierB = tierOf(it.b);
      rows.push({
        dimension: d,
        a: it.a,
        b: it.b,
        delta: it.delta,
        tierA,
        tierB,
        tierGap: tierA !== tierB,
        direction: it.a > it.b ? 1 : it.a < it.b ? -1 : 0,
      });
    }
    const mean = rows.length > 0 ? rows.reduce((s, r) => s + r.delta, 0) / rows.length : 0;
    return { domain, label: DOMAIN_LABELS[domain], rows, meanDelta: Math.round(mean * 10) / 10 };
  });
  const allRows = domains.flatMap((d) => d.rows);
  const sameTierCount = allRows.filter((r) => !r.tierGap).length;
  const tierGaps = [...allRows]
    .filter((r) => r.tierGap)
    .sort((x, y) => y.delta - x.delta)
    .map(({ dimension, a: sa, b: sb, delta }) => ({ dimension, a: sa, b: sb, delta }));

  return {
    alignmentIndex,
    matches,
    gaps,
    crossChannels,
    domains,
    measuredCount: allRows.length,
    unmeasuredCount: ALL_DIMENSIONS.length - 1 - allRows.length, // −1: alignment composite never counted
    sameTierCount,
    tierGaps,
  };
}
