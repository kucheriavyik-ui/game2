import Phaser from 'phaser';

export const TILE_SIZE = 32;

/** One entry of the ASCII map legend (from location.json). */
export interface LegendEntry {
  name: string;
  solid: boolean;
  /** Placeholder colour, used until a tile image exists for `name`. */
  color: string;
  /** Optional CSS colour painted over the tile image, e.g. "rgba(0,0,0,0.45)" to push walls back. */
  overlay?: string;
  /** Building kit name from manifest.json `kits`; marks the cell as part of a building. */
  kit?: string;
  /** Draw the tile image mirrored left-right (the left half of a symmetric carpet). */
  flipX?: boolean;
}

export interface SpawnPoint {
  x: number;
  y: number;
}

/**
 * Placed thing on the map. `x`/`y` are tile coordinates and may be fractional
 * (5.5 = between two tiles). `decor` is scenery only: no interaction, `sprite`
 * names a manifest decor image. For `object`, `sprite` optionally names a
 * different objects/ image than the entity id.
 */
export interface EntityDef {
  id: string;
  type: 'npc' | 'object' | 'door' | 'decor' | 'council_table';
  x: number;
  y: number;
  sprite?: string;
  ink?: string;
  target?: string;
  spawn?: string;
  /** decor/object: whether the player collides with it (default true). */
  solid?: boolean;
  /** decor only: hangs on the building wall at this cell (a window) instead of standing on the ground. */
  wall?: boolean;
  /** decor with `wall`: pixels to lift it up the facade (negative = up). */
  dy?: number;
  /** decor only: lies flat on the floor (a rug) — drawn under everyone, no body. */
  floor?: boolean;
  /** door only: where it leads, shown above the prompt ("Скарбниця"). */
  label?: string;
  /** decor/object: mirror the sprite left-right (so slanted furniture all leans the same way). */
  flip?: boolean;
  /** Only present in this month (id from content/months); omitted = every month. */
  month?: string;
  /** Only present while this Ink VAR is true (`!name` — while it is false), e.g. "f_smiths_in". */
  when?: string;
  /** npc/object/decor: draw the sprite this many times larger (a cat on a shelf, 1.5). */
  scale?: number;
}

/** Shape of content/locations/<id>.json */
export interface LocationDef {
  id: string;
  name: string;
  map: string;
  legend: Record<string, LegendEntry>;
  spawns: Record<string, SpawnPoint>;
  entities: EntityDef[];
  /** Music track name from manifest.json `music`; omitted = silence. */
  music?: string;
  /** Optional smooth-ground config; see systems/Terrain.ts. */
  terrain?: import('./Terrain').TerrainConfig;
}

/** Shape of content/characters/<id>.json */
export interface CharacterDef {
  id: string;
  name: string;
  /** How others call them ("Штарн"); its first letter marks their stance in the council. */
  short?: string;
  /** Seat on the council ("Маршал оборони"); shown in the journal later. */
  role?: string;
  color: string;
  sprite?: string;
  portraits: Record<string, string>;
  ink?: string;
}

/** A parsed location ready to be rendered. */
export interface ParsedLocation {
  def: LocationDef;
  /** Legend characters in a stable order; the index is the tile id. */
  chars: string[];
  /** Tile ids row by row. */
  grid: number[][];
  width: number;
  height: number;
}

/**
 * Every file under content/ is bundled into the game script as a string.
 * Adding a new content file requires no code change: it just shows up here.
 * Not loaded as separate files on purpose: a host that serves .json without
 * "charset=utf-8" makes the browser read Cyrillic as Latin-1 (mojibake), while
 * the script itself is always decoded as UTF-8.
 */
const contentTexts = import.meta.glob('/content/**/*.{json,txt}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const STORY_KEY = 'story:main';
export const JOURNAL_KEY = 'journal';
export const TABLES_KEY = 'tables';
export const RESOURCES_KEY = 'resources';
export const COUNCIL_KEY = 'council';

/** Shape of content/months/<id>.json. */
export interface MonthDef {
  id: string;
  number: number;
  title: string;
  /** One sentence of atmosphere on the month's title card; or several, the first whose `when` holds. */
  flavor: string | { when?: string; text: string }[];
  location: string;
  /**
   * Knowledge (`k_*`) that this month's people and places can give. A game
   * started from a later month counts all of it as learned.
   */
  knowledge?: string[];
  /** Knot played on arrival: the council reports and names the crisis. */
  ink_open: string;
  /** Knot behind the council table: the decisions; ends with `# month_end`. */
  ink_council: string;
  /** Knot for the summary screen: upkeep, one line per consequence, then the defeat check. */
  ink_end: string;
}

/**
 * A seat on the council: an advisor id, or one who holds the seat only while an
 * Ink condition is true (Erik takes the Guild's seat once Isolde is out:
 * `{ "id": "erik", "when": "out_isolde" }`).
 */
export type CouncilSeat = string | { id: string; when?: string };

/** Shape of content/council.json: who sits on the council and how loyalty reads in words. */
export interface CouncilDef {
  /** Seats in display order; every advisor has a character file and an Ink VAR loy_<id>. */
  advisors: CouncilSeat[];
  /** Highest first: the first level whose `min` the loyalty reaches is shown. */
  levels: { min: number; label: string; color: string }[];
}

/** All months, in order. */
export function months(scene: Phaser.Scene): MonthDef[] {
  return scene.cache.json
    .getKeys()
    .filter((k: string) => k.startsWith('month:'))
    .map((k: string) => scene.cache.json.get(k) as MonthDef)
    .sort((a: MonthDef, b: MonthDef) => a.number - b.number);
}

export function findMonth(scene: Phaser.Scene, id: string | undefined): MonthDef | undefined {
  return months(scene).find((m) => m.id === id);
}

export function council(scene: Phaser.Scene): CouncilDef {
  return (scene.cache.json.get(COUNCIL_KEY) as CouncilDef | undefined) ?? { advisors: [], levels: [] };
}

export function seatId(seat: CouncilSeat): string {
  return typeof seat === 'string' ? seat : seat.id;
}

/** Everyone who can ever sit on the council. */
export function allAdvisors(def: CouncilDef): string[] {
  return def.advisors.map(seatId);
}

/** Advisors whose seat exists right now (the journal lists them, even those out for good). */
export function seatedAdvisors(def: CouncilDef, isTrue: (name: string) => boolean): string[] {
  return def.advisors.filter((s) => typeof s === 'string' || conditionHolds(s.when, isTrue)).map(seatId);
}

/** Advisors who take part in decisions now: seated and not out. */
export function activeAdvisors(def: CouncilDef, isTrue: (name: string) => boolean): string[] {
  return seatedAdvisors(def, isTrue).filter((id) => !isOut(id, isTrue));
}

/** The title card's line for the current state of the story. */
export function monthFlavor(month: MonthDef, isTrue: (name: string) => boolean): string {
  if (typeof month.flavor === 'string') return month.flavor;
  return month.flavor.find((f) => conditionHolds(f.when, isTrue))?.text ?? '';
}

/**
 * Whether an Ink condition holds: a VAR name, or `!name` for "is false".
 * `isTrue` reads the variable (kept outside so this file does not depend on GameState).
 */
export function conditionHolds(when: string | undefined, isTrue: (name: string) => boolean): boolean {
  if (!when) return true;
  const w = when.trim();
  return w.startsWith('!') ? !isTrue(w.slice(1).trim()) : isTrue(w);
}

/** Advisors who have left the council for good (Ink VAR `out_<id>`: executed, exiled, dead). */
export function isOut(id: string, isTrue: (name: string) => boolean): boolean {
  return isTrue(`out_${id}`);
}

/** Loyalty in words ("спокійний"): the player never sees the number. */
export function loyaltyLevel(def: CouncilDef, value: number): { label: string; color: string } {
  return def.levels.find((l) => value >= l.min) ?? def.levels[def.levels.length - 1] ?? { label: '?', color: '#ffffff' };
}

/** Put every location, character and the compiled story into the Phaser caches. */
export function queueContentFiles(loader: Phaser.Loader.LoaderPlugin): void {
  const json = (key: string, text: string): void => {
    loader.cacheManager.json.add(key, JSON.parse(text.replace(/^﻿/, '')));
  };
  for (const [path, text] of Object.entries(contentTexts)) {
    const [, , folder, ...rest] = path.split('/'); // "", "content", folder, ...
    const file = rest.join('/');

    if (folder === 'locations') {
      if (file.endsWith('.json')) json(`loc:${stripExt(file, '.json')}`, text);
      else if (file.endsWith('.map.txt')) loader.cacheManager.text.add(`map:${file}`, text);
    } else if (folder === 'characters') {
      if (file.endsWith('.json')) json(`char:${stripExt(file, '.json')}`, text);
    } else if (folder === 'story') {
      if (file === 'main.ink.json') json(STORY_KEY, text);
    } else if (folder === 'journal.json') {
      json(JOURNAL_KEY, text);
    } else if (folder === 'tables.json') {
      json(TABLES_KEY, text);
    } else if (folder === 'months') {
      if (file.endsWith('.json')) json(`month:${stripExt(file, '.json')}`, text);
    } else if (folder === 'council.json') {
      json(COUNCIL_KEY, text);
    } else if (folder === 'resources.json') {
      json(RESOURCES_KEY, text);
    }
  }
}

function stripExt(file: string, ext: string): string {
  return file.slice(0, -ext.length);
}

export function findCharacter(scene: Phaser.Scene, id: string): CharacterDef | undefined {
  return scene.cache.json.get(`char:${id}`) as CharacterDef | undefined;
}

/** Read a loaded location from the cache and turn the ASCII grid into tile ids. */
export function parseLocation(scene: Phaser.Scene, id: string): ParsedLocation {
  const def = scene.cache.json.get(`loc:${id}`) as LocationDef | undefined;
  if (!def) throw new Error(`Location "${id}" not found in content/locations`);

  const text = scene.cache.text.get(`map:${def.map}`) as string | undefined;
  if (text === undefined) throw new Error(`Map file "${def.map}" for location "${id}" not loaded`);

  const chars = Object.keys(def.legend);
  const rows = text.replace(/\r/g, '').split('\n').filter((r) => r.length > 0);
  const width = Math.max(...rows.map((r) => r.length));

  const grid = rows.map((row, y) =>
    Array.from({ length: width }, (_, x) => {
      const ch = row[x] ?? ' ';
      const index = chars.indexOf(ch);
      if (index === -1) throw new Error(`Unknown map symbol "${ch}" at ${x},${y} in ${def.map}`);
      return index;
    }),
  );

  return { def, chars, grid, width, height: rows.length };
}
