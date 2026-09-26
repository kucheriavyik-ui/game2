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
}

/** Shape of content/locations/<id>.json */
export interface LocationDef {
  id: string;
  name: string;
  map: string;
  legend: Record<string, LegendEntry>;
  spawns: Record<string, SpawnPoint>;
  entities: EntityDef[];
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
 * Every file under content/ becomes a URL Vite can serve (dev) or bundle (build).
 * Adding a new content file requires no code change: it just shows up here.
 */
const contentUrls = import.meta.glob('/content/**/*.{json,txt}', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const STORY_KEY = 'story:main';
export const JOURNAL_KEY = 'journal';
export const RESOURCES_KEY = 'resources';
export const COUNCIL_KEY = 'council';

/** Shape of content/months/<id>.json. */
export interface MonthDef {
  id: string;
  number: number;
  title: string;
  /** One sentence of atmosphere on the month's title card. */
  flavor: string;
  location: string;
  /** Knot played on arrival: the council reports and names the crisis. */
  ink_open: string;
  /** Knot behind the council table: the decisions; ends with `# month_end`. */
  ink_council: string;
  /** Knot for the summary screen: upkeep, one line per consequence, then the defeat check. */
  ink_end: string;
}

/** Shape of content/council.json: who sits on the council and how loyalty reads in words. */
export interface CouncilDef {
  /** Advisor ids in display order; each has a character file and an Ink VAR loy_<id>. */
  advisors: string[];
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

/** Loyalty in words ("спокійний"): the player never sees the number. */
export function loyaltyLevel(def: CouncilDef, value: number): { label: string; color: string } {
  return def.levels.find((l) => value >= l.min) ?? def.levels[def.levels.length - 1] ?? { label: '?', color: '#ffffff' };
}

/** Queue every location, character and the compiled story into the Phaser loader. */
export function queueContentFiles(loader: Phaser.Loader.LoaderPlugin): void {
  for (const [path, url] of Object.entries(contentUrls)) {
    const [, , folder, ...rest] = path.split('/'); // "", "content", folder, ...
    const file = rest.join('/');

    if (folder === 'locations') {
      if (file.endsWith('.json')) loader.json(`loc:${stripExt(file, '.json')}`, url);
      else if (file.endsWith('.map.txt')) loader.text(`map:${file}`, url);
    } else if (folder === 'characters') {
      if (file.endsWith('.json')) loader.json(`char:${stripExt(file, '.json')}`, url);
    } else if (folder === 'story') {
      if (file === 'main.ink.json') loader.json(STORY_KEY, url);
    } else if (folder === 'journal.json') {
      loader.json(JOURNAL_KEY, url);
    } else if (folder === 'months') {
      if (file.endsWith('.json')) loader.json(`month:${stripExt(file, '.json')}`, url);
    } else if (folder === 'council.json') {
      loader.json(COUNCIL_KEY, url);
    } else if (folder === 'resources.json') {
      loader.json(RESOURCES_KEY, url);
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
