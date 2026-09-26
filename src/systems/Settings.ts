/**
 * Player settings, kept in the browser (localStorage) between sessions.
 * Anything that cares subscribes with `Settings.onChange`.
 */
export interface SettingsData {
  /** 0..10 */
  musicVolume: number;
  musicOn: boolean;
}

const STORAGE_KEY = 'korven.settings';
const DEFAULTS: SettingsData = { musicVolume: 5, musicOn: true };

type Listener = (settings: SettingsData) => void;

let current: SettingsData = read();
const listeners = new Set<Listener>();

function read(): SettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SettingsData>) };
    // Carry over the mute flag from before settings existed.
    if (localStorage.getItem('korven.muted') === '1') return { ...DEFAULTS, musicOn: false };
  } catch {
    // unreadable storage: fall back to defaults
  }
  return { ...DEFAULTS };
}

export const Settings = {
  get(): Readonly<SettingsData> {
    return current;
  },

  update(patch: Partial<SettingsData>): void {
    current = { ...current, ...patch };
    current.musicVolume = Math.max(0, Math.min(10, Math.round(current.musicVolume)));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // not critical: the setting just won't be remembered
    }
    for (const fn of listeners) fn(current);
  },

  /** Returns an unsubscribe function. */
  onChange(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
