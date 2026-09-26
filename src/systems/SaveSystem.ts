import { GameState } from './GameState';
import { Journal } from './Journal';

const STORAGE_KEY = 'siege.save';
const VERSION = 1;

export interface SaveData {
  version: number;
  chapter: string;
  ink: string;
  journal: string[];
  location: string;
  /** Where the player's feet are, in pixels. */
  x: number;
  y: number;
}

/** One automatic save slot in localStorage. */
export const SaveSystem = {
  save(chapter: string, location: string, x: number, y: number): void {
    const data: SaveData = {
      version: VERSION,
      chapter,
      ink: GameState.story.state.ToJson(),
      journal: [...Journal.ids],
      location,
      x: Math.round(x),
      y: Math.round(y),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Could not save game', err);
    }
  },

  /** Reads the slot; null when there is none or it is unusable. */
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
