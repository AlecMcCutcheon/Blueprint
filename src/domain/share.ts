import type { ScoredProfile, DimensionId, Answers } from './types';
import { ALL_DIMENSIONS, CONSISTENCY_PAIRS } from './scoring';
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
//              external_processing (boundaries) — keeping every domain even.
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
  return { prefix: `BP${dims === 17 ? 1 : dims === 18 ? 2 : dims === 24 ? 3 : 4}`, dims, pairs, missing, missingPairs };
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

// The three historical layouts. Dimensions are cumulative — v1 ⊂ v2 ⊂ v3 — so
// one decoder covers all of them: each version contributes its present
// dimensions and pairs in order, and the rest are marked unmeasured.
const VERSIONS: CodeVersion[] = [
  versionFor(
    ALL_DIMENSIONS.length - 11,
    CONSISTENCY_PAIRS.length - 7,
    ['relational_privacy', 'sexual_communication', 'positivity_play', 'capitalization', 'conflict_engagement', 'commitment_sacrifice', 'money_coordination', 'desire_initiation', 'intimacy_attunement', 'feedback_receiving', 'external_processing'],
    7,
  ),
  versionFor(
    ALL_DIMENSIONS.length - 10,
    CONSISTENCY_PAIRS.length - 6,
    ['sexual_communication', 'positivity_play', 'capitalization', 'conflict_engagement', 'commitment_sacrifice', 'money_coordination', 'desire_initiation', 'intimacy_attunement', 'feedback_receiving', 'external_processing'],
    6,
  ),
  versionFor(
    ALL_DIMENSIONS.length - 4,
    CONSISTENCY_PAIRS.length,
    ['desire_initiation', 'intimacy_attunement', 'feedback_receiving', 'external_processing'],
    0,
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
  for (const d of ALL_DIMENSIONS) bytes.push(clamp(p.dimensions[d].score));
  bytes.push(clamp(p.consistencyIndex));
  for (const [a, b] of CONSISTENCY_PAIRS) {
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
    const version = VERSIONS.find((v) => v.prefix === prefix);
    if (!version) return null;
    const bytes = b64decode(payload);
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
    if (!/^BP[1-4]/i.test(code)) return null; // metric codes only
    const decoded = decodeProfile(code);
    if (!decoded) return null;
    const meta = decodeMetaSegment(code, (params.get('m') ?? '').trim());
    return { code, name: meta.name, intent: meta.intent };
  } catch {
    return null;
  }
}

// ─── Comparison ──────────────────────────────────────────────────────────────

export interface ProfileCompare {
  /** 0–100: 100 = identical profiles across the measured primary dimensions. */
  alignmentIndex: number;
  matches: { dimension: DimensionId; a: number; b: number }[];
  gaps: { dimension: DimensionId; a: number; b: number; delta: number }[];
  /** Does what one person naturally GIVE match what the other hears best? */
  crossChannels: { youGive: string | null; theyHear: string | null; match: boolean }[];
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
  const crossChannels = [
    {
      youGive: a.channels.express,
      theyHear: b.channels.receive,
      match: !!a.channels.express && a.channels.express === b.channels.receive,
    },
    {
      youGive: b.channels.express,
      theyHear: a.channels.receive,
      match: !!b.channels.express && b.channels.express === a.channels.receive,
    },
  ];
  return { alignmentIndex, matches, gaps, crossChannels };
}
