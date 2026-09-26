import Phaser from 'phaser';
import { queueManifest, queueManifestImages } from '../systems/Assets';
import { GameState } from '../systems/GameState';
import { queueContentFiles, STORY_KEY } from '../systems/LocationLoader';
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

    // `?new` in the URL wipes the save slot (a developer shortcut).
    if (new URLSearchParams(window.location.search).has('new')) SaveSystem.clear();

    this.scene.start('Menu');
  }
}
