import Phaser from 'phaser';
import { AssetKeys } from './Assets';
import { TILE_SIZE, type ParsedLocation } from './LocationLoader';

/**
 * Ground with smooth transitions, drawn from PixelLab Wang tilesets.
 *
 * The map still says one terrain per cell. Rendering happens on the "dual
 * grid": a tile sits on every cell corner and is chosen by the terrains of
 * the four cells around that corner, so boundaries fall between cells and
 * every edge, bend and corner comes from the tileset's own artwork.
 *
 * Each tileset knows two terrains (lower/upper). When a corner mixes more
 * than two, the lowest-priority terrains are folded into the next one up
 * until a known pair remains, and a pair with no tileset borrows the set
 * whose upper terrain matches the higher-priority one.
 */

/** location.json `terrain` block. */
export interface TerrainConfig {
  /** Lowest first, e.g. ["water", "mud", "cobblestone", "pier"]. */
  priority: string[];
  sets: { name: string; lower: string; upper: string }[];
  /** Legend names that stand on some terrain, e.g. { "house_stone": "cobblestone" }. */
  aliases?: Record<string, string>;
  /** Terrain whose open areas drift slowly (water). Edges stay still; only full tiles move. */
  animate?: string;
}

export interface TerrainRender {
  image: Phaser.GameObjects.Image;
  /** Call with the scene time to advance the drifting terrain, if any. */
  animate?: (time: number) => void;
}

/** The parts of PixelLab's tileset metadata we read. */
interface WangMeta {
  tileset_data: {
    tiles: {
      corners: { NW: 'upper' | 'lower'; NE: 'upper' | 'lower'; SW: 'upper' | 'lower'; SE: 'upper' | 'lower' };
      bounding_box: { x: number; y: number; width: number; height: number };
    }[];
  };
}

interface LoadedSet {
  lower: string;
  upper: string;
  image: HTMLImageElement;
  /** Wang index (NW·8 + NE·4 + SW·2 + SE, bit = upper) -> sheet rectangle. */
  boxes: Map<number, { x: number; y: number }>;
}

function loadSets(scene: Phaser.Scene, config: TerrainConfig): LoadedSet[] {
  const sets: LoadedSet[] = [];
  for (const def of config.sets) {
    const imageKey = AssetKeys.terrainImage(def.name);
    const meta = scene.cache.json.get(AssetKeys.terrainMeta(def.name)) as WangMeta | undefined;
    if (!scene.textures.exists(imageKey) || !meta) continue;
    const boxes = new Map<number, { x: number; y: number }>();
    for (const tile of meta.tileset_data.tiles) {
      const c = tile.corners;
      const index = (c.NW === 'upper' ? 8 : 0) + (c.NE === 'upper' ? 4 : 0) + (c.SW === 'upper' ? 2 : 0) + (c.SE === 'upper' ? 1 : 0);
      boxes.set(index, { x: tile.bounding_box.x, y: tile.bounding_box.y });
    }
    sets.push({
      lower: def.lower,
      upper: def.upper,
      image: scene.textures.get(imageKey).getSourceImage() as HTMLImageElement,
      boxes,
    });
  }
  return sets;
}

export function hasTerrainArt(scene: Phaser.Scene, config: TerrainConfig): boolean {
  return loadSets(scene, config).length === config.sets.length;
}

/**
 * Paints the whole location's ground into one canvas texture and adds it as
 * an image at depth 1 (just above the flat tilemap, below everything that
 * stands on the map). Returns null when the tilesets are not available.
 */
export function renderTerrain(
  scene: Phaser.Scene,
  location: ParsedLocation,
  config: TerrainConfig,
): TerrainRender | null {
  const sets = loadSets(scene, config);
  if (sets.length === 0) return null;
  const rank = new Map(config.priority.map((name, i) => [name, i]));
  const animCells: { x: number; y: number }[] = [];

  // Terrain name per cell, clamped at the map edge so borders never show a seam.
  const terrainAt = (x: number, y: number): string => {
    const cx = Phaser.Math.Clamp(x, 0, location.width - 1);
    const cy = Phaser.Math.Clamp(y, 0, location.height - 1);
    const ch = location.chars[location.grid[cy]?.[cx] ?? 0] ?? '';
    const name = location.def.legend[ch]?.name ?? '';
    return config.aliases?.[name] ?? name;
  };

  const key = `terrain:${location.def.id}`;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const canvas = scene.textures.createCanvas(key, (location.width + 1) * TILE_SIZE, (location.height + 1) * TILE_SIZE);
  if (!canvas) throw new Error('Could not create terrain texture');
  const ctx = canvas.context;

  for (let j = 0; j <= location.height; j++) {
    for (let i = 0; i <= location.width; i++) {
      // Corner order matches the Wang index bits: NW, NE, SW, SE.
      let corners = [terrainAt(i - 1, j - 1), terrainAt(i, j - 1), terrainAt(i - 1, j), terrainAt(i, j)];
      const pick = resolve(corners, sets, rank);
      if (!pick) continue;
      corners = corners.map((c) => pick.remap.get(c) ?? c);
      const index = corners.reduce((acc, c, k) => acc + (c === pick.set.upper ? [8, 4, 2, 1][k]! : 0), 0);
      const box = pick.set.boxes.get(index);
      if (!box) continue;
      ctx.drawImage(pick.set.image, box.x, box.y, TILE_SIZE, TILE_SIZE, i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      if (config.animate && corners.every((c) => c === config.animate)) animCells.push({ x: i * TILE_SIZE, y: j * TILE_SIZE });
    }
  }
  canvas.refresh();

  const image = scene.add.image(-TILE_SIZE / 2, -TILE_SIZE / 2, key).setOrigin(0).setDepth(1);
  const animate = config.animate ? makeDrift(ctx, canvas, sets, config.animate, animCells) : undefined;
  return { image, animate };
}

/**
 * Slow drift for open water: the base tile is a seamless texture, so every
 * full-water cell is refilled with that texture shifted by a few pixels.
 * Transition tiles are untouched, which keeps shores and pier edges crisp.
 */
function makeDrift(
  ctx: CanvasRenderingContext2D,
  canvas: Phaser.Textures.CanvasTexture,
  sets: LoadedSet[],
  terrain: string,
  cells: { x: number; y: number }[],
): ((time: number) => void) | undefined {
  const set = sets.find((s) => s.lower === terrain) ?? sets.find((s) => s.upper === terrain);
  if (!set || cells.length === 0) return undefined;
  const box = set.boxes.get(set.lower === terrain ? 0 : 15);
  if (!box) return undefined;

  const tile = document.createElement('canvas');
  tile.width = TILE_SIZE;
  tile.height = TILE_SIZE;
  tile.getContext('2d')?.drawImage(set.image, box.x, box.y, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE);
  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return undefined;

  return (time: number) => {
    const dx = Math.floor(time / 180) % TILE_SIZE;
    const dy = Math.floor(time / 700) % TILE_SIZE;
    ctx.fillStyle = pattern;
    for (const cell of cells) {
      ctx.save();
      ctx.translate(cell.x + dx, cell.y + dy);
      ctx.fillRect(-dx, -dy, TILE_SIZE, TILE_SIZE);
      ctx.restore();
    }
    canvas.refresh();
  };
}

/** Which tileset draws a corner, and how its terrains are folded to fit that set. */
function resolve(
  corners: string[],
  sets: LoadedSet[],
  rank: Map<string, number>,
): { set: LoadedSet; remap: Map<string, string> } | null {
  const remap = new Map<string, string>();
  const present = () => [...new Set(corners.map((c) => remap.get(c) ?? c))].sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));

  // Fold the lowest terrain into the next one until at most two remain.
  let names = present();
  while (names.length > 2) {
    remap.set(names[0]!, names[1]!);
    names = present();
  }

  if (names.length === 1) {
    const only = names[0]!;
    const set = sets.find((s) => s.lower === only) ?? sets.find((s) => s.upper === only);
    return set ? { set, remap } : null;
  }

  const [lo, hi] = names as [string, string];
  const exact = sets.find((s) => s.lower === lo && s.upper === hi);
  if (exact) return { set: exact, remap };

  // No tileset for this pair: use the one whose upper terrain is `hi` and pretend `lo` is its lower.
  const borrowed = sets.find((s) => s.upper === hi) ?? sets.find((s) => s.upper === lo);
  if (!borrowed) return null;
  if (borrowed.upper === hi) remap.set(lo, borrowed.lower);
  else remap.set(hi, borrowed.lower);
  return { set: borrowed, remap };
}
