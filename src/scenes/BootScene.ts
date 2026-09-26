import Phaser from 'phaser';
import { queueManifest, queueManifestImages } from '../systems/Assets';
import { setPreviewVars } from '../systems/DialogueSystem';
import { GameState } from '../systems/GameState';
import { queueContentFiles, RESOURCES_KEY, STORY_KEY } from '../systems/LocationLoader';
import type { ResourceDef } from '../ui/ResourceBar';
import { previewMonth } from '../systems/MonthFlow';
import { SaveSystem } from '../systems/SaveSystem';

/**
 * Loads content and art in two passes (the manifest has to be read before the
 * images it names can be queued), then opens the main menu.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    queueContentFiles(this.load);
    queueManifest(this.load);
  }

  create(): void {
    queueManifestImages(this);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => this.openMenu());
    this.load.start();
  }

  private openMenu(): void {
    GameState.init(this.cache.json.get(STORY_KEY) as Record<string, unknown>);
    // Every choice shows what it does to these before it is taken.
    setPreviewVars(((this.cache.json.get(RESOURCES_KEY) ?? []) as ResourceDef[]).map((r) => ({ var: r.var, label: r.label })));

    // Music outlives every other scene, so it is launched once and never stopped.
    if (!this.scene.isActive('Music')) this.scene.launch('Music');

    const params = new URLSearchParams(window.location.search);
    // `?new` in the URL wipes the save slot (a developer shortcut).
    if (params.has('new')) SaveSystem.clear();

    // Development only: `?month=m04` jumps straight into a month to look at it,
    // `&loc=city` skips the card and the council opening, `&set=f_smiths_in,k_rats`
    // switches Ink VARs on first. Nothing is saved, the real save slot stays as it was.
    const month = params.get('month');
    if (import.meta.env.DEV && month) {
      previewMonth(this, month, params.get('loc') ?? undefined, (params.get('set') ?? '').split(',').filter(Boolean));
      return;
    }

    this.scene.start('Menu');
  }
}
