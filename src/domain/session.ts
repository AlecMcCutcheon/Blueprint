// Full-session export/import.
//
// This is the owner-side restore path. A share code carries derived metrics
// only — deliberately, because a code gets handed to OTHER people. Restoring
// YOUR OWN session (backup, device migration) deserves the real thing: a JSON
// file with the raw answers, the presentation-order seed, and an optional
// name. Everything downstream — scores, blueprint, review, clarifier
// adjustments — rebuilds naturally from answers by re-scoring; nothing is
// reconstructed or guessed.
//
// Import validates strictly: unknown ids are dropped (not guessed at), every
// option/scale value must exist in the current bank, and the name is length-
// capped. A file from an older or newer bank still imports everything that
// matches — honest partial restore, with a count so the UI can say so.

import type { Answers } from './types';
import { QUESTIONS, BONUS_POOL } from './questions';

export const SESSION_FORMAT = 'blueprint-session';
export const SESSION_VERSION = 1;

/** What a blueprint session file looks like on disk. */
export interface SessionFile {
  format: typeof SESSION_FORMAT;
  version: number;
  exported: string; // ISO date
  name: string | null; // optional display name
  orderSeed: number; // presentation-order seed (persists the exact quiz order)
  answers: Answers; // raw answers, keyed by question id
}

const NAME_MAX = 40;

/** Build a session file from the live run. */
export function buildSessionFile(answers: Answers, orderSeed: number, name: string | null): SessionFile {
  return {
    format: SESSION_FORMAT,
    version: SESSION_VERSION,
    exported: new Date().toISOString(),
    name: cleanName(name),
    orderSeed,
    answers,
  };
}

export function sessionFileName(name: string | null): string {
  const who = cleanName(name)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return who ? `blueprint-session-${who}.json` : 'blueprint-session.json';
}

function cleanName(name: string | null | undefined): string | null {
  const n = (name ?? '').trim();
  return n ? n.slice(0, NAME_MAX) : null;
}

export interface ImportResult {
  answers: Answers;
  orderSeed: number;
  name: string | null;
  /** Answer ids that failed validation (stale option ids, retired questions…). */
  dropped: string[];
}

/**
 * Validate a parsed JSON value as a session file and extract the answers.
 * Throws a readable Error when the file isn't a session at all; drops (and
 * reports) individual answers that no longer match the bank.
 */
export function importSessionFile(data: unknown): ImportResult {
  if (!data || typeof data !== 'object') {
    throw new Error('That file is not a Blueprint session (no JSON object found).');
  }
  const f = data as Record<string, unknown>;
  if (f.format !== SESSION_FORMAT) {
    throw new Error('That file is not a Blueprint session file — look for the .json export from the blueprint page.');
  }
  if (typeof f.version !== 'number' || f.version > SESSION_VERSION) {
    throw new Error('That session file was made by a newer version of Blueprint.');
  }
  const rawAnswers = f.answers;
  if (!rawAnswers || typeof rawAnswers !== 'object') {
    throw new Error('That session file has no answers in it.');
  }

  // Validate every answer against its own question — index-based, so a file
  // carrying a core id can never be validated against a different question.
  const byId = new Map([...QUESTIONS, ...BONUS_POOL].map((q) => [q.id, q]));
  const answers: Answers = {};
  const dropped: string[] = [];
  for (const [id, v] of Object.entries(rawAnswers as Record<string, unknown>)) {
    const q = byId.get(id);
    if (!q || !v || typeof v !== 'object') {
      if (q === undefined) dropped.push(id); // unknown question = bank changed
      continue;
    }
    const a = v as { kind?: unknown; optionId?: unknown; value?: unknown };
    if (a.kind === 'option' && typeof a.optionId === 'string') {
      if (q.options.some((o) => 'label' in o && o.id === a.optionId)) {
        answers[id] = { kind: 'option', optionId: a.optionId };
      } else {
        dropped.push(id);
      }
    } else if (a.kind === 'scale' && typeof a.value === 'number' && q.format === 'agreement') {
      if (q.options.some((o) => 'value' in o && (o as { value: number }).value === a.value)) {
        answers[id] = { kind: 'scale', value: a.value };
      } else {
        dropped.push(id);
      }
    } else {
      dropped.push(id);
    }
  }

  // Seed: plain number, tolerant of a legacy JSON-quoted value.
  const seedRaw = typeof f.orderSeed === 'number' ? f.orderSeed : Number(String(f.orderSeed ?? '').replace(/"/g, ''));
  const orderSeed = Number.isFinite(seedRaw) && seedRaw > 0 ? Math.floor(seedRaw) : 1;

  return { answers, orderSeed, name: cleanName(f.name as string | null), dropped };
}

/** Parse + validate a JSON string (the file-reader path). */
export function importSessionJson(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  return importSessionFile(data);
}

/** Trigger a browser download of the session file. Returns the chosen filename. */
export function downloadSessionFile(file: SessionFile): string {
  const filename = sessionFileName(file.name);
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return filename;
}
