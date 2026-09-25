// Directory of other people's blueprints opened on this device.
//
// Every blueprint opened from a share link or a bare code is remembered here
// (code + optional name), so comparison doesn't depend on pasting the same
// code again: the owner-side compare screen lists the directory, names can be
// set for blueprints that arrived unnamed, and stale entries can be removed.
// Like everything else in Blueprint, this lives only in this browser.

const KEY = 'blueprint.people.v1';
const NAME_MAX = 40;

export interface Person {
  code: string;
  name: string | null;
  added: number;
}

export function loadPeople(): Person[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p): p is Person => !!p && typeof p === 'object' && typeof p.code === 'string')
      .map((p) => ({
        code: p.code,
        name: typeof p.name === 'string' && p.name.trim() ? p.name.slice(0, NAME_MAX) : null,
        added: typeof p.added === 'number' ? p.added : 0,
      }));
  } catch {
    return [];
  }
}

export function savePeople(people: Person[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(people));
  } catch {
    // storage blocked — the directory just won't survive a refresh
  }
}

/**
 * Upsert by code. An existing name wins (manual renames stick); a named link
 * only fills the gap for an entry that arrived unnamed.
 */
export function upsertPerson(people: Person[], code: string, name: string | null): Person[] {
  const i = people.findIndex((p) => p.code === code);
  if (i >= 0) {
    const next = [...people];
    const cur = next[i];
    next[i] = { ...cur, name: cur.name ?? (name ? name.slice(0, NAME_MAX) : null) };
    return next;
  }
  return [...people, { code, name: name ? name.slice(0, NAME_MAX) : null, added: Date.now() }];
}

export function renamePerson(people: Person[], code: string, name: string | null): Person[] {
  return people.map((p) =>
    p.code === code ? { ...p, name: name && name.trim() ? name.trim().slice(0, NAME_MAX) : null } : p,
  );
}

export function removePerson(people: Person[], code: string): Person[] {
  return people.filter((p) => p.code !== code);
}
