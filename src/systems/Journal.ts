/** Shape of content/journal.json: entry id -> { title, text }. */
export type JournalDefs = Record<string, { title: string; text: string }>;

/**
 * The "Threads" journal: an ordered list of entry ids that Ink tags
 * (`# journal:add:<id>`) have unlocked. Entry texts live in content/journal.json.
 * This is the one piece of state kept outside Ink; SaveSystem persists it.
 */
const ids: string[] = [];

export const Journal = {
  /** Returns true if the entry was new. */
  add(id: string): boolean {
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
