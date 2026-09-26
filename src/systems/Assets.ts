import Phaser from 'phaser';

/**
 * assets/manifest.json — which image stands for what. Everything is optional:
 * anything missing here (or not yet drawn) falls back to a placeholder.
 *
 *   tiles:      legend name -> "tiles/wall.png"                      (32x32)
 *   objects:    entity id   -> "objects/port_board.png"              (transparent)
 *   portraits:  portrait id -> "characters/rat/portrait_neutral.png"
 *   characters: id -> { idle: "characters/rat/south.png" }            static NPC
 *               id -> { walk: { south: ["characters/anselm/walk/south/0.png", ...], west: [...] } }
 *                     one PNG per frame, as PixelLab exports them; frame 0 doubles as the standing pose
 */
export type WalkFrames = Partial<Record<Direction, string[]>>;

export interface CharacterAssets {
  idle?: string;
  walk?: WalkFrames;
}

export interface Manifest {
  tiles: Record<string, string>;
  objects: Record<string, string>;
  /** Scenery sprites: decor name -> image (placed via `decor` entities). */
  decor?: Record<string, string>;
  portraits: Record<string, string>;
  characters: Record<string, CharacterAssets>;
  /** Building kits: name -> folder under assets/ holding tile_0.png … tile_79.png. */
  kits?: Record<string, string>;
  /** Wang terrain tilesets: name -> { image: sheet PNG, meta: PixelLab metadata JSON }. */
  terrains?: Record<string, { image: string; meta: string }>;
}

const KIT_PIECES = 80;

export type Direction = 'south' | 'west' | 'east' | 'north';

const assetUrls = import.meta.glob('/assets/**/*.{png,json,ogg,mp3}', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const MANIFEST_PATH = '/assets/manifest.json';

let manifest: Manifest = { tiles: {}, objects: {}, decor: {}, portraits: {}, characters: {} };

/** Texture keys, so every scene names things the same way. */
export const AssetKeys = {
  tile: (legendName: string) => `tile:${legendName}`,
  object: (entityId: string) => `object:${entityId}`,
  decor: (name: string) => `decor:${name}`,
  portrait: (portraitId: string) => `portrait:${portraitId}`,
  idle: (characterId: string) => `char:${characterId}:idle`,
  walkFrame: (characterId: string, dir: Direction, index: number) => `char:${characterId}:walk:${dir}:${index}`,
  kitPiece: (kit: string, index: number) => `kit:${kit}:${index}`,
  terrainImage: (name: string) => `terrain:${name}:image`,
  terrainMeta: (name: string) => `terrain:${name}:meta`,
};

/** Phase 1: load the manifest itself. */
export function queueManifest(loader: Phaser.Loader.LoaderPlugin): void {
  const url = assetUrls[MANIFEST_PATH];
  if (url) loader.json('manifest', url);
}

/** Phase 2: read the manifest from cache and queue every image it names. */
export function queueManifestImages(scene: Phaser.Scene): void {
  manifest = { ...manifest, ...(scene.cache.json.get('manifest') as Partial<Manifest> | undefined) };
  const loader = scene.load;
  const urlOf = (rel: string): string | undefined => assetUrls[`/assets/${rel}`];
  const warnMissing = (rel: string): void => console.warn(`manifest.json names "${rel}" but assets/${rel} does not exist`);

  for (const [name, rel] of Object.entries(manifest.tiles)) {
    const url = urlOf(rel);
    url ? loader.image(AssetKeys.tile(name), url) : warnMissing(rel);
  }
  for (const [id, rel] of Object.entries(manifest.objects)) {
    const url = urlOf(rel);
    url ? loader.image(AssetKeys.object(id), url) : warnMissing(rel);
  }
  for (const [name, rel] of Object.entries(manifest.decor ?? {})) {
    const url = urlOf(rel);
    url ? loader.image(AssetKeys.decor(name), url) : warnMissing(rel);
  }
  for (const [id, rel] of Object.entries(manifest.portraits)) {
    const url = urlOf(rel);
    url ? loader.image(AssetKeys.portrait(id), url) : warnMissing(rel);
  }
  for (const [kit, folder] of Object.entries(manifest.kits ?? {})) {
    for (let i = 0; i < KIT_PIECES; i++) {
      const rel = `${folder}/tile_${i}.png`;
      const url = urlOf(rel);
      url ? loader.image(AssetKeys.kitPiece(kit, i), url) : warnMissing(rel);
    }
  }
  for (const [name, def] of Object.entries(manifest.terrains ?? {})) {
    const image = urlOf(def.image);
    const meta = urlOf(def.meta);
    image ? loader.image(AssetKeys.terrainImage(name), image) : warnMissing(def.image);
    meta ? loader.json(AssetKeys.terrainMeta(name), meta) : warnMissing(def.meta);
  }
  for (const [id, def] of Object.entries(manifest.characters)) {
    if (def.idle) {
      const url = urlOf(def.idle);
      url ? loader.image(AssetKeys.idle(id), url) : warnMissing(def.idle);
    }
    for (const [dir, frames] of Object.entries(def.walk ?? {}) as [Direction, string[]][]) {
      frames.forEach((rel, index) => {
        const url = urlOf(rel);
        url ? loader.image(AssetKeys.walkFrame(id, dir, index), url) : warnMissing(rel);
      });
    }
  }
}

/** Walk frame texture keys per direction, only for directions whose every frame loaded. */
export function walkFramesOf(scene: Phaser.Scene, characterId: string): Partial<Record<Direction, string[]>> {
  const result: Partial<Record<Direction, string[]>> = {};
  const walk = manifest.characters[characterId]?.walk ?? {};
  for (const [dir, frames] of Object.entries(walk) as [Direction, string[]][]) {
    const keys = frames.map((_, i) => AssetKeys.walkFrame(characterId, dir, i));
    if (keys.length > 0 && keys.every((k) => scene.textures.exists(k))) result[dir] = keys;
  }
  return result;
}

/**
 * A flat-coloured rectangle texture, optionally with a letter, used wherever
 * real art has not been drawn yet. Cached by key.
 */
export function placeholderTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  color: string,
  label = '',
): string {
  if (scene.textures.exists(key)) return key;
  const canvas = scene.textures.createCanvas(key, width, height);
  if (!canvas) throw new Error(`Could not create placeholder texture "${key}"`);
  const ctx = canvas.context;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
  if (label) {
    ctx.fillStyle = '#1a1512';
    ctx.font = `${Math.floor(height / 2)}px "Pixelify Sans", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, width / 2, height / 2 + 1);
  }
  canvas.refresh();
  return key;
}
