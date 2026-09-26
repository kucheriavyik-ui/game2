import { GameState } from './GameState';
import { Journal } from './Journal';

const STORAGE_KEY = 'siege.save';
// v2: saved only at the start of a month; no position in the world.
const VERSION = 2;

export interface SaveData {
  version: number;
  /** The month about to be played (content/months id). */
  month: string;
  ink: string;
  journal: string[];
}

/** One automatic slot in localStorage, written at the start of every month. */
export const SaveSystem = {
  save(month: string): void {
    const data: SaveData = {
      version: VERSION,
      month,
      ink: GameState.story.state.ToJson(),
      journal: [...Journal.ids],
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Could not save game', err);
    }
  },

  /** Reads the slot; null when there is none or it is from another version. */
  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;
      return data.version === VERSION ? data : null;
    } catch {
      return null;
    }
  },

  exists(): boolean {
    return SaveSystem.load() !== null;
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nothing to do
    }
  },
};
