import Phaser from 'phaser';
import { AssetKeys } from './Assets';
import { TILE_SIZE, type ParsedLocation } from './LocationLoader';

/**
 * Composes buildings out of a PixelLab building kit (80 pieces, see
 * assets/PROMPTS.md). A legend symbol with a `kit` field marks building
 * cells; the bottom row of each building becomes its street-facing facade
 * (walls, or a doorway where a `door` entity stands) and every row above
 * it is roof, picked per cell from its 8 neighbours.
 *
 * Piece indices follow the kit's placement_rules; they have been identical
 * across every kit generated so far.
 */
const PIECE = {
  floor: 0,
  wallS: 3,
  doorSa: 36,
  doorSb: 37,
  roof: {
    interior: 79,
    pyramid: 78,
    eaves: { N: 60, E: 61, S: 62, W: 63 },
    hips: { NE: 64, SE: 65, SW: 66, NW: 67 },
    valleys: { NE: 68, SE: 69, SW: 70, NW: 71 },
    ridges: { EW: 72, NS: 73 },
    ends: { E: 74, W: 75, N: 76, S: 77 },
  },
} as const;

export const KIT_PIECE_COUNT = 80;

interface Neighbours {
  N: boolean; S: boolean; E: boolean; W: boolean;
  NE: boolean; NW: boolean; SE: boolean; SW: boolean;
}

function roofPiece(n: Neighbours): number {
  const open = { N: !n.N, E: !n.E, S: !n.S, W: !n.W };
  const openCount = Object.values(open).filter(Boolean).length;
  const r = PIECE.roof;
  if (openCount === 4) return r.pyramid;
  if (openCount === 3) {
    if (!open.N) return r.ends.S;
    if (!open.S) return r.ends.N;
    if (!open.E) return r.ends.W;
    return r.ends.E;
  }
  if (open.N && open.S) return r.ridges.EW;
  if (open.E && open.W) return r.ridges.NS;
  if (open.N && open.E) return r.hips.NE;
  if (open.S && open.E) return r.hips.SE;
  if (open.S && open.W) return r.hips.SW;
  if (open.N && open.W) return r.hips.NW;
  if (open.N) return r.eaves.N;
  if (open.E) return r.eaves.E;
  if (open.S) return r.eaves.S;
  if (open.W) return r.eaves.W;
  if (!n.NE) return r.valleys.NE;
  if (!n.SE) return r.valleys.SE;
  if (!n.SW) return r.valleys.SW;
  if (!n.NW) return r.valleys.NW;
  return r.interior;
}

/**
 * Kit geometry, measured once per kit from its pieces:
 *   anchor — where the 32x32 cell sits inside a piece's canvas (top-left of the floor piece's pixels);
 *   rise   — how far a wall's face rises above its cell. Roof pieces are drawn that much higher so
 *            the eave's bottom edge meets the top of the facade instead of covering it.
 */
interface KitGeometry {
  anchor: { x: number; y: number };
  rise: number;
}
const geometries = new Map<string, KitGeometry>();

/** Top-left of the opaque pixels of a texture. */
function opaqueTopLeft(scene: Phaser.Scene, key: string): { x: number; y: number } {
  const source = scene.textures.get(key).getSourceImage() as HTMLImageElement;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  ctx.drawImage(source, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let minX = canvas.width;
  let minY = canvas.height;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if ((data[(y * canvas.width + x) * 4 + 3] ?? 0) > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
      }
    }
  }
  return { x: minX, y: minY };
}

function geometryOf(scene: Phaser.Scene, kit: string): KitGeometry {
  const cached = geometries.get(kit);
  if (cached) return cached;
  const anchor = opaqueTopLeft(scene, AssetKeys.kitPiece(kit, PIECE.floor));
  const wallTop = opaqueTopLeft(scene, AssetKeys.kitPiece(kit, PIECE.wallS)).y;
  const geometry = { anchor, rise: Math.max(0, anchor.y - wallTop) };
  geometries.set(kit, geometry);
  return geometry;
}

function anchorOf(scene: Phaser.Scene, kit: string): { x: number; y: number } {
  return geometryOf(scene, kit).anchor;
}

/** Top-left of the 32x32 cell inside a piece canvas (public for the ground crop). */
export function kitAnchor(scene: Phaser.Scene, kit: string): { x: number; y: number } {
  return anchorOf(scene, kit);
}

export function kitLoaded(scene: Phaser.Scene, kit: string): boolean {
  return scene.textures.exists(AssetKeys.kitPiece(kit, PIECE.floor));
}

/** Kit floor piece to use as the ground under a building cell, if the kit is loaded. */
export function kitFloorKey(scene: Phaser.Scene, kit: string): string | undefined {
  return kitLoaded(scene, kit) ? AssetKeys.kitPiece(kit, PIECE.floor) : undefined;
}

/**
 * Draws every building on the map. `doorCells` holds "x,y" of cells that
 * should show a doorway instead of a wall. Returns the created images so
 * the scene can manage them if it needs to.
 */
export function renderBuildings(
  scene: Phaser.Scene,
  location: ParsedLocation,
  doorCells: Set<string>,
): Phaser.GameObjects.Image[] {
  const images: Phaser.GameObjects.Image[] = [];
  const kitAt = (x: number, y: number): string | undefined => {
    const row = location.grid[y];
    if (!row) return undefined;
    const id = row[x];
    if (id === undefined) return undefined;
    const ch = location.chars[id];
    return ch !== undefined ? location.def.legend[ch]?.kit : undefined;
  };

  for (let y = 0; y < location.height; y++) {
    for (let x = 0; x < location.width; x++) {
      const kit = kitAt(x, y);
      if (!kit || !kitLoaded(scene, kit)) continue;

      const same = (dx: number, dy: number): boolean => kitAt(x + dx, y + dy) === kit;
      const isFacade = !same(0, 1);
      const { anchor, rise } = geometryOf(scene, kit);
      const place = (index: number, depth: number, dy = 0): void => {
        const img = scene.add
          .image(x * TILE_SIZE - anchor.x, y * TILE_SIZE - anchor.y + dy, AssetKeys.kitPiece(kit, index))
          .setOrigin(0)
          .setDepth(depth);
        images.push(img);
      };

      // Depth = bottom edge of the cell, like everything else that stands on the map.
      const bottom = (y + 1) * TILE_SIZE;
      if (isFacade) {
        if (doorCells.has(`${x},${y}`)) {
          place(PIECE.doorSa, bottom);
          place(PIECE.doorSb, bottom);
        } else {
          place(PIECE.wallS, bottom);
        }
      } else {
        // Roof cells only see other roof cells (the facade row is not roof).
        const roof = (dx: number, dy: number): boolean => same(dx, dy) && same(dx, dy + 1);
        place(
          roofPiece({
            N: roof(0, -1), S: roof(0, 1), E: roof(1, 0), W: roof(-1, 0),
            NE: roof(1, -1), NW: roof(-1, -1), SE: roof(1, 1), SW: roof(-1, 1),
          }),
          bottom - 1,
          -rise,
        );
      }
    }
  }
  return images;
}
