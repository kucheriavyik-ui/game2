import { GameState } from './GameState';

/** Shape of content/journal.json: entry id -> { title, text }. */
export type JournalDefs = Record<string, { title: string; text: string }>;

/**
 * The journal: entry ids in the order the Ink tag `# journal:<id>` unlocked them.
 * Entry texts live in content/journal.json. When Ink declares a VAR with the
 * same name (Knowledge, `k_*`), the tag also sets it to true, so hidden council
 * options can check it — writers tag the line and nothing else.
 */
const ids: string[] = [];

export const Journal = {
  /** Returns true if the entry was new. */
  add(id: string): boolean {
    if (GameState.has(id)) GameState.set(id, true);
    if (ids.includes(id)) return false;
    ids.push(id);
    return true;
  },

  get ids(): readonly string[] {
    return ids;
  },

  load(saved: readonly string[]): void {
    ids.length = 0;
    ids.push(...saved);
  },
};
