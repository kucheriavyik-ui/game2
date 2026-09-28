import Phaser from 'phaser';
import { AssetKeys, placeholderTexture, walkFramesOf, type Direction } from '../systems/Assets';
import { kitAnchor, kitFloorKey, renderBuildings } from '../systems/Buildings';
import { findNearest, type Interactable } from '../systems/Interaction';
import { GameState } from '../systems/GameState';
import {
  conditionHolds,
  findCharacter,
  findMonth,
  parseLocation,
  TILE_SIZE,
  type EntityDef,
  type LocationDef,
  type ParsedLocation,
} from '../systems/LocationLoader';
import { renderTerrain } from '../systems/Terrain';
import { Prompt } from '../ui/Prompt';
import type { UIScene } from './UIScene';
import { textStyle } from '../ui/theme';

/** Either a named spawn point or an exact pixel position (when restoring a save). */
interface WorldSceneData {
  location: string;
  spawn?: string;
  x?: number;
  y?: number;
  /** Ink knot to play on arrival (the month's council opening). */
  intro?: string;
}

const PLAYER_ID = 'protector';
const PLAYER_SPEED = 130;
/** How far the hero's feet may be from the edge of a thing's footprint to use it. */
const INTERACT_RANGE = 18;
const WALK_FPS = 8;

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private facing: Direction = 'south';
  /** Texture keys of the hero's walk frames per direction; empty when there is no walk art. */
  private walkFrames: Partial<Record<Direction, string[]>> = {};
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private interactables: Interactable[] = [];
  private nearest: Interactable | null = null;
  private prompt!: Prompt;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private terrainAnimate?: (time: number) => void;
  private terrainAnimatedAt = 0;
  /** Scene time before which E is ignored (just arrived through a door). */
  private readyAt = 0;
  private lockedSince = 0;
  private uiLocked = false;

  constructor() {
    super('World');
  }

  create(data: WorldSceneData): void {
    const location = parseLocation(this, data.location);
    this.registry.set('music', location.def.music ?? null);
    const layer = this.buildTiles(location);
    this.terrainAnimate = location.def.terrain ? renderTerrain(this, location, location.def.terrain)?.animate : undefined;

    // Entities can belong to one month only (the same walls in month 1 and month 9).
    const month = this.registry.get('month') as string | undefined;
    // …and to one state of the story (Myroslava only if the smiths were let in; the marshal alive or dead).
    const isTrue = (name: string): boolean => Boolean(GameState.get(name));
    const entities = location.def.entities.filter(
      (e) => (!e.month || e.month === month) && conditionHolds(e.when, isTrue),
    );

    // Doors standing on building cells become doorways in the facade instead of separate props.
    const doorCells = new Set(
      entities.filter((e) => e.type === 'door' && this.isKitCell(location, e.x, e.y)).map((e) => `${e.x},${e.y}`),
    );
    renderBuildings(this, location, doorCells);

    const start = this.resolveStart(location, data);
    this.player = this.spawnPlayer(start.x, start.y);
    this.playerShadow = this.addShadow(start.x, start.y, 22);
    this.physics.add.collider(this.player, layer);

    this.interactables = [];
    for (const entity of entities) this.spawnEntity(entity, doorCells.has(`${entity.x},${entity.y}`));
    this.prompt = new Prompt(this);

    const worldWidth = location.width * TILE_SIZE;
    const worldHeight = location.height * TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldWidth, worldHeight);
    cam.startFollow(this.player, true);

    this.setupInput();
    const label = this.addLocationLabel(location.def.name);
    // Mouse wheel toggles a zoomed-out view of the map. Only 1 and 0.5 are used:
    // with an even screen zoom both keep every game pixel a whole number of screen pixels.
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      const zoom = dy > 0 ? 0.5 : 1;
      cam.setZoom(zoom);
      label.setVisible(zoom === 1);
    });

    this.uiLocked = false;
    this.readyAt = this.time.now + 300;
    this.game.events.on('ui:lock', this.onUiLock, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('ui:lock', this.onUiLock, this);
    });

    if (data.intro) this.runKnotWhenUiReady(data.intro);
  }

  update(time: number): void {
    // Water drifts at a lazy 8 fps; redrawing the ground texture every frame would be wasteful.
    if (this.terrainAnimate && time - this.terrainAnimatedAt > 125) {
      this.terrainAnimatedAt = time;
      this.terrainAnimate(time);
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    // Everything on the map is depth-sorted by the bottom edge of its footprint.
    this.player.setDepth(body.bottom);
    this.playerShadow.setPosition(this.player.x, body.bottom - 2);

    // Self-heal: if the UI is not actually showing anything, nothing should hold the hero.
    if (
      this.uiLocked &&
      time > this.lockedSince + 500 &&
      !(this.scene.get('UI') as UIScene).isBusy &&
      !this.scene.isActive('Pause')
    ) {
      this.uiLocked = false;
    }

    if (this.uiLocked) {
      body.setVelocity(0, 0);
      this.playWalk(false);
      return;
    }

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    const dx = (right ? 1 : 0) - (left ? 1 : 0);
    const dy = (down ? 1 : 0) - (up ? 1 : 0);

    body.setVelocity(dx, dy);
    // Same speed on diagonals as on straight moves.
    body.velocity.normalize().scale(PLAYER_SPEED);

    // Horizontal facing wins on diagonals; it reads better in top-down.
    if (dx !== 0) this.facing = dx > 0 ? 'east' : 'west';
    else if (dy !== 0) this.facing = dy > 0 ? 'south' : 'north';
    this.playWalk(dx !== 0 || dy !== 0);

    // Measured from the feet, not the sprite centre: a tall sprite's centre can't get
    // within reach of a door in the wall *below* it (interior exits).
    const feet = this.feet();
    this.nearest = findNearest(feet.x, feet.y, this.interactables, INTERACT_RANGE);
    // Above the head of a ~40px sprite standing on its tile.
    if (this.nearest) this.prompt.show(this.nearest.x, this.nearest.y - 26, this.nearest.verb, this.nearest.label);
    else this.prompt.hide();
  }

  // --- Interaction and transitions ---

  private interact(event?: KeyboardEvent): void {
    // Ignore a held E: its repeats would walk straight back through the door just used.
    if (event?.repeat || this.time.now < this.readyAt) return;
    if (this.uiLocked || !this.nearest) return;
    const { action } = this.nearest;
    if (action.kind === 'ink') {
      this.uiLocked = true;
      this.lockedSince = this.time.now;
      this.prompt.hide();
      this.game.events.emit('dialogue:start', action.knot);
    } else {
      this.goTo(action.location, action.spawn);
    }
  }

  private goTo(location: string, spawn: string): void {
    this.scene.restart({ location, spawn } satisfies WorldSceneData);
  }

  private onUiLock(locked: boolean): void {
    this.uiLocked = locked;
    if (locked) this.lockedSince = this.time.now;
  }

  private openPause(event: KeyboardEvent): void {
    if (event.repeat || this.uiLocked || this.scene.isActive('Pause')) return;
    this.prompt.hide();
    this.scene.launch('Pause');
  }

  /** Centre of the hero's collision box, i.e. where they stand. Spawns, saves and reach all use this. */
  private feet(): { x: number; y: number } {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    return { x: this.player.x, y: this.player.y + body.offset.y + body.height / 2 - this.player.height / 2 };
  }

  /** The UI scene may still be booting on the very first frame, so wait for it. */
  private runKnotWhenUiReady(knot: string): void {
    this.uiLocked = true;
    this.lockedSince = this.time.now + 2000; // give the UI scene time to boot
    const ui = this.scene.get('UI');
    const start = (): void => {
      this.game.events.emit('dialogue:start', knot);
    };
    if (ui.scene.isActive()) start();
    else ui.events.once(Phaser.Scenes.Events.CREATE, start);
  }

  private resolveStart(location: ParsedLocation, data: WorldSceneData): { x: number; y: number } {
    // A saved position is used only if it is still on walkable floor (the map may have been rebuilt).
    if (data.x !== undefined && data.y !== undefined && this.isWalkable(location, data.x, data.y)) {
      return { x: data.x, y: data.y };
    }
    const spawn =
      location.def.spawns[data.spawn ?? 'start'] ??
      location.def.spawns['start'] ??
      Object.values(location.def.spawns)[0];
    if (!spawn) throw new Error(`Location "${data.location}" has no spawn "${data.spawn}"`);
    return tileCenter(spawn.x, spawn.y);
  }

  // --- Building the scene ---

  /**
   * One tileset texture per location, assembled from whatever art exists:
   * a 32x32 image per legend name from the manifest, or a flat colour.
   */
  private buildTiles(location: ParsedLocation): Phaser.Tilemaps.TilemapLayer {
    const textureKey = `tiles:${location.def.id}`;
    if (this.textures.exists(textureKey)) this.textures.remove(textureKey);
    const canvas = this.textures.createCanvas(textureKey, location.chars.length * TILE_SIZE, TILE_SIZE);
    if (!canvas) throw new Error('Could not create tile texture');

    const ctx = canvas.context;
    location.chars.forEach((ch, i) => {
      const entry = location.def.legend[ch];
      // Building cells get the kit's own floor piece; the building itself is drawn on top later.
      const kitFloor = entry?.kit ? kitFloorKey(this, entry.kit) : undefined;
      const imageKey = kitFloor ?? (entry ? AssetKeys.tile(entry.name) : '');
      if (kitFloor && entry?.kit) {
        // The floor piece is a 32x32 cell inside a larger canvas; crop just the cell.
        const source = this.textures.get(kitFloor).getSourceImage() as HTMLImageElement;
        const a = kitAnchor(this, entry.kit);
        ctx.drawImage(source, a.x, a.y, TILE_SIZE, TILE_SIZE, i * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
        return;
      }
      if (imageKey && this.textures.exists(imageKey)) {
        const image = this.textures.get(imageKey).getSourceImage() as CanvasImageSource;
        if (entry?.flipX) {
          ctx.save();
          ctx.translate(i * TILE_SIZE + TILE_SIZE, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(image, 0, 0);
          ctx.restore();
        } else {
          ctx.drawImage(image, i * TILE_SIZE, 0);
        }
        if (entry?.overlay) {
          ctx.fillStyle = entry.overlay;
          ctx.fillRect(i * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
        }
        return;
      }
      ctx.fillStyle = entry?.color ?? '#ff00ff';
      ctx.fillRect(i * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
      // Faint inner border so identical neighbours still read as a grid.
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(i * TILE_SIZE, 0, TILE_SIZE, 1);
      ctx.fillRect(i * TILE_SIZE, 0, 1, TILE_SIZE);
    });
    canvas.refresh();

    const map = this.make.tilemap({ data: location.grid, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = map.addTilesetImage(textureKey);
    if (!tileset) throw new Error('Could not attach tileset');
    const layer = map.createLayer(0, tileset, 0, 0);
    if (!layer) throw new Error('Could not create tile layer');

    const solidIds = location.chars
      .map((ch, i) => (location.def.legend[ch]?.solid ? i : -1))
      .filter((i) => i >= 0);
    layer.setCollision(solidIds);

    return layer;
  }

  /** The hero, standing with their feet at (x, y): walk frames if drawn, else a standing sprite, else a flat block. */
  private spawnPlayer(x: number, y: number): Phaser.Physics.Arcade.Sprite {
    this.walkFrames = walkFramesOf(this, PLAYER_ID);
    this.facing = 'south';

    const character = findCharacter(this, PLAYER_ID);
    const idleKey = AssetKeys.idle(PLAYER_ID);
    const key =
      this.walkFrames.south?.[0] ??
      (this.textures.exists(idleKey)
        ? idleKey
        : placeholderTexture(this, 'ph:player', 20, 24, character?.color ?? '#c8b08a'));

    const sprite = this.physics.add.sprite(x, y, key);
    // Collide with the feet only, so the hero can stand "in front of" walls and props.
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 14).setOffset((sprite.width - 20) / 2, sprite.height - 14);
    body.setCollideWorldBounds(true);
    // Lift the sprite so the collision box, not the image centre, lands on the spawn point.
    sprite.setY(y - (sprite.height / 2 - 7));
    body.updateFromGameObject();

    for (const [dir, keys] of Object.entries(this.walkFrames) as [Direction, string[]][]) {
      const animKey = `${PLAYER_ID}-walk-${dir}`;
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: keys.map((k) => ({ key: k })),
          frameRate: WALK_FPS,
          repeat: -1,
        });
      }
    }
    return sprite;
  }

  private playWalk(moving: boolean): void {
    const frames = this.walkFrames[this.facing];
    if (!frames) return;
    if (moving) {
      this.player.anims.play(`${PLAYER_ID}-walk-${this.facing}`, true);
    } else {
      this.player.anims.stop();
      this.player.setTexture(frames[0] ?? '');
    }
  }

  /** Whether a pixel position lies on a non-solid tile inside the map. */
  private isWalkable(location: ParsedLocation, px: number, py: number): boolean {
    const id = location.grid[Math.floor(py / TILE_SIZE)]?.[Math.floor(px / TILE_SIZE)];
    const ch = id === undefined ? undefined : location.chars[id];
    return ch !== undefined && location.def.legend[ch]?.solid === false;
  }

  private isKitCell(location: ParsedLocation, x: number, y: number): boolean {
    const id = location.grid[y]?.[x];
    const ch = id === undefined ? undefined : location.chars[id];
    return ch !== undefined && location.def.legend[ch]?.kit !== undefined;
  }

  /** NPC = standing sprite, object = prop image, door = dark slab in the wall (unless the building kit drew a doorway). */
  private spawnEntity(entity: EntityDef, doorwayDrawn = false): void {
    const { x, y } = tileCenter(entity.x, entity.y);

    switch (entity.type) {
      case 'npc': {
        const character = findCharacter(this, entity.id);
        if (!character) throw new Error(`Entity "${entity.id}" has no file in content/characters`);
        const template = entity.ink ?? character.ink;
        const knot = template && this.knotFor(template, entity.id);
        if (!knot) throw new Error(`NPC "${entity.id}" has no ink knot`);

        // `sprite` lets a character borrow another one's art (a guild clerk for Erik).
        const idleKey = AssetKeys.idle(entity.sprite ?? entity.id);
        const key = this.textures.exists(idleKey)
          ? idleKey
          : placeholderTexture(this, `ph:npc:${entity.id}`, 20, 24, character.color, character.name.charAt(0));
        const npc = this.addProp(x, y, key, true, false, entity.scale ?? 1);
        this.interactables.push({
          id: entity.id,
          x,
          y,
          area: footprint(npc),
          verb: 'поговорити',
          // A location may hide who this is ("Шпигун у кайданах" for Lorenz in the cellar).
          label: entity.label ?? character.name,
          action: { kind: 'ink', knot },
        });
        break;
      }
      case 'object': {
        if (!entity.ink) throw new Error(`Object "${entity.id}" has no ink knot`);
        const key = this.propTexture(entity.sprite ?? entity.id) ?? placeholderTexture(this, 'ph:object', 16, 16, '#7a6a4a');
        const prop = this.addProp(x, y, key, entity.solid ?? true, entity.flip);
        this.interactables.push({
          id: entity.id,
          x,
          y,
          area: footprint(prop),
          verb: 'оглянути',
          action: { kind: 'ink', knot: this.knotFor(entity.ink, entity.id) },
        });
        break;
      }
      case 'decor': {
        const texture = (entity.sprite && this.propTexture(entity.sprite)) || placeholderTexture(this, 'ph:decor', 16, 16, '#5a5048');
        if (entity.wall) this.addWallDecor(x, y, texture, entity.dy ?? 0);
        // Above the ground texture (depth 1), below shadows (2) and everything standing.
        else if (entity.floor) this.add.image(x, y, texture).setDepth(1.5).setFlipX(entity.flip ?? false);
        else this.addProp(x, y, texture, entity.solid ?? true, entity.flip);
        break;
      }
      case 'council_table': {
        // The table always opens the council of the month being played.
        const month = findMonth(this, this.registry.get('month') as string | undefined);
        if (!month) throw new Error('Council table used outside a month');
        const tableKey = AssetKeys.object(entity.sprite ?? entity.id);
        const key = this.textures.exists(tableKey) ? tableKey : placeholderTexture(this, 'ph:council', 40, 24, '#6b4a2c');
        const table = this.addProp(x, y, key, true, entity.flip);
        this.interactables.push({
          id: entity.id,
          x,
          y,
          area: footprint(table),
          verb: 'скликати раду',
          label: entity.label ?? 'Стіл ради',
          action: { kind: 'ink', knot: month.ink_council },
        });
        break;
      }
      case 'door': {
        const doorKey = AssetKeys.object(entity.sprite ?? entity.id);
        if (this.textures.exists(doorKey)) this.addProp(x, y, doorKey, false);
        else if (!doorwayDrawn) this.add.rectangle(x, y, 24, 28, 0x1d1613).setStrokeStyle(1, 0x6b5a48);
        const half = TILE_SIZE / 2;
        // A door with nowhere to go is part of the facade: at most something to look at.
        if (!entity.target) {
          if (entity.ink) {
            this.interactables.push({
              id: entity.id,
              x,
              y,
              area: { left: x - half, top: y - half, right: x + half, bottom: y + half },
              verb: 'оглянути',
              label: entity.label,
              action: { kind: 'ink', knot: this.knotFor(entity.ink, entity.id) },
            });
          }
          break;
        }
        this.interactables.push({
          id: entity.id,
          x,
          y,
          // The doorway's own cell: it sits in the wall, so the hero reaches it from the street side.
          area: { left: x - half, top: y - half, right: x + half, bottom: y + half },
          verb: 'увійти',
          // Own label if given ("Вартівня"), otherwise the name of the place it leads to.
          label: entity.label ?? (this.cache.json.get(`loc:${entity.target}`) as LocationDef | undefined)?.name,
          action: { kind: 'goto', location: entity.target, spawn: entity.spawn ?? 'start' },
        });
        break;
      }
    }
  }

  /**
   * The knot an entity talks with. `{month}` stands for the month being played
   * ("{month}_horn" is m04_horn in month 4); when the story has no such knot the
   * entity falls back to `<id>_idle` — a line for months that have nothing special.
   */
  private knotFor(template: string, id: string): string {
    const month = (this.registry.get('month') as string | undefined) ?? '';
    const knot = template.replace('{month}', month);
    return GameState.story.KnotContainerWithName(knot) ? knot : `${id}_idle`;
  }

  /** Art for a prop by name: an object image first, then a decor one (a barrel can be either). */
  private propTexture(name: string): string | undefined {
    return [AssetKeys.object(name), AssetKeys.decor(name)].find((k) => this.textures.exists(k));
  }

  /** A static thing on the map, standing on tile (x, y); solid ones block the hero at their base. */
  private addProp(x: number, y: number, key: string, solid: boolean, flip = false, scale = 1): Phaser.Physics.Arcade.Image {
    const image = this.physics.add.staticImage(x, y, key).setFlipX(flip).setScale(scale);
    // Tall art stands on the tile rather than being centred in it.
    if (image.displayHeight > TILE_SIZE) image.setY(y + TILE_SIZE / 2 - image.displayHeight / 2 + 4);
    const body = image.body as Phaser.Physics.Arcade.StaticBody;
    // The footprint follows what is actually drawn, not the canvas: a character's
    // 68px canvas holds a 20px figure, a bed's 96px canvas an 80px bed.
    const measured = this.opaqueBounds(key);
    // A mirrored sprite has its opaque area mirrored too.
    const art = flip ? { ...measured, left: image.width - measured.left - measured.width } : measured;
    const wide = art.width > TILE_SIZE;
    const footW = wide ? art.width - 8 : Math.min(art.width, 24);
    const footH = Math.min(art.height, wide ? 20 : 16);
    body.setSize(footW * scale, footH * scale).setOffset((art.left + (art.width - footW) / 2) * scale, (art.bottom - footH) * scale);
    image.setDepth(body.bottom);
    if (solid) {
      this.physics.add.collider(this.player, image);
      this.addShadow(body.center.x, body.bottom - 2, Math.min(art.width + 4, 72));
    }
    return image;
  }

  /** Bounding box of a texture's non-transparent pixels, measured once per texture. */
  private opaqueBounds(key: string): { left: number; width: number; height: number; bottom: number } {
    const cached = opaqueCache.get(key);
    if (cached) return cached;
    const source = this.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let result = { left: 0, width: source.width, height: source.height, bottom: source.height };
    if (ctx) {
      ctx.drawImage(source, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          if ((data[(y * canvas.width + x) * 4 + 3] ?? 0) > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX >= 0) result = { left: minX, width: maxX - minX + 1, height: maxY - minY + 1, bottom: maxY + 1 };
    }
    opaqueCache.set(key, result);
    return result;
  }

  /**
   * Something hung on a building's wall face (a window): no body, no shadow,
   * drawn just in front of the wall it sits on. `dy` lifts it up the facade.
   */
  private addWallDecor(x: number, y: number, key: string, dy: number): void {
    this.add.image(x, y + dy, key).setDepth(y + TILE_SIZE / 2 + 1);
  }

  /** Soft oval on the ground under something that stands on the map. */
  private addShadow(x: number, y: number, width: number): Phaser.GameObjects.Ellipse {
    return this.add.ellipse(x, y, width, Math.max(6, width * 0.3), 0x000000, 0.28).setDepth(2);
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is not available');
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    keyboard.on('keydown-E', this.interact, this);
    keyboard.on('keydown-ESC', this.openPause, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown-E', this.interact, this);
      keyboard.off('keydown-ESC', this.openPause, this);
    });
  }

  private addLocationLabel(name: string): Phaser.GameObjects.Text {
    return this.add.text(4, 4, name, textStyle(this)).setScrollFactor(0).setDepth(10_000);
  }
}

const opaqueCache = new Map<string, { left: number; width: number; height: number; bottom: number }>();

/** The collision footprint of a prop, which is what the hero walks up to. */
function footprint(image: Phaser.Physics.Arcade.Image): Interactable['area'] {
  const body = image.body as Phaser.Physics.Arcade.StaticBody;
  return { left: body.x, top: body.y, right: body.right, bottom: body.bottom };
}

function tileCenter(tileX: number, tileY: number): { x: number; y: number } {
  return { x: tileX * TILE_SIZE + TILE_SIZE / 2, y: tileY * TILE_SIZE + TILE_SIZE / 2 };
}
