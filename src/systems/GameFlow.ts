import Phaser from 'phaser';
import { GameState } from './GameState';
import { Journal } from './Journal';
import { findChapter, STORY_KEY } from './LocationLoader';
import { SaveSystem } from './SaveSystem';

/**
 * Moving between the big states of the game: main menu, chapter title card,
 * the world. Kept in one place so every scene switches the same way.
 * The chapter currently being played lives in the registry as 'chapter'.
 */

/** A fresh story: new Ink state, empty journal. */
function resetStory(scene: Phaser.Scene): void {
  GameState.init(scene.cache.json.get(STORY_KEY) as Record<string, unknown>);
  Journal.load([]);
}

/** Wipes the save and starts a chapter from its title card. */
export function startNewGame(scene: Phaser.Scene, chapterId?: string): void {
  const chapter = findChapter(scene, chapterId);
  if (!chapter) throw new Error('content/chapters.json has no chapters');
  SaveSystem.clear();
  resetStory(scene);
  if (chapter.setup) {
    // A chapter started from the menu skips the ones before it; its setup knot
    // fills in whatever state it assumes (e.g. `chapter = 2`).
    const story = GameState.story;
    story.ChoosePathString(chapter.setup);
    while (story.canContinue) story.Continue();
  }
  scene.registry.set('chapter', chapter.id);
  scene.scene.start('Chapter', { chapter: chapter.id });
}

/** Restores the save slot and drops the player back where they were. Returns false if there is none. */
export function continueGame(scene: Phaser.Scene): boolean {
  const save = SaveSystem.load();
  if (!save) return false;
  resetStory(scene);
  try {
    GameState.story.state.LoadJson(save.ink);
    Journal.load(save.journal);
  } catch (err) {
    console.warn('Save slot is incompatible with the current story', err);
    SaveSystem.clear();
    return false;
  }
  scene.registry.set('chapter', save.chapter);
  // Maps change between versions: if the saved place is gone, carry on from the
  // chapter's starting point. The story state and journal are kept either way.
  if (!scene.cache.json.exists(`loc:${save.location}`)) {
    const chapter = findChapter(scene, save.chapter);
    if (!chapter) return false;
    enterWorld(scene, { ...chapter.start });
    return true;
  }
  enterWorld(scene, { location: save.location, x: save.x, y: save.y });
  return true;
}

/** Starts the world scene (and the UI over it) from any other scene. */
export function enterWorld(
  scene: Phaser.Scene,
  data: { location: string; spawn?: string; x?: number; y?: number; intro?: string },
): void {
  if (!scene.scene.isActive('UI')) scene.scene.launch('UI');
  scene.scene.start('World', data);
}

/** Leaves the game for the main menu. The caller saves first if it should. */
export function toMainMenu(scene: Phaser.Scene): void {
  for (const key of ['World', 'UI', 'Pause']) {
    if (key !== scene.scene.key && scene.scene.isActive(key)) scene.scene.stop(key);
  }
  scene.scene.start('Menu');
}
