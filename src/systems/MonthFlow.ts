import Phaser from 'phaser';
import type { ResourceDef } from '../ui/ResourceBar';
import { GameState } from './GameState';
import { Journal } from './Journal';
import {
  activeAdvisors,
  allAdvisors,
  council,
  findCharacter,
  findMonth,
  months,
  RESOURCES_KEY,
  STORY_KEY,
  type CharacterDef,
} from './LocationLoader';
import { SaveSystem } from './SaveSystem';

/**
 * The shape of a playthrough, in one place:
 *   new game → prologue → month card → the month's location (council opens)
 *   → council table → summary → next month … or a defeat.
 * The month being played lives in the registry as 'month'; the numbers it
 * started with (for the summary's "before → after") as 'monthStart'.
 */

/** Ink knot played before the first month, if the story has one. */
const PROLOGUE_KNOT = 'prologue';
/** Every scene that belongs to a month in progress. */
const PLAY_SCENES = ['World', 'UI', 'Pause'];

export type Snapshot = Record<string, number>;

/** Current values of every resource and every advisor's loyalty. */
export function snapshot(scene: Phaser.Scene): Snapshot {
  const resources = (scene.cache.json.get(RESOURCES_KEY) ?? []) as ResourceDef[];
  const names = [...resources.map((r) => r.var), ...allAdvisors(council(scene)).map((id) => `loy_${id}`)];
  return Object.fromEntries(names.map((name) => [name, GameState.num(name)]));
}

/**
 * For the dialogue box's "за / проти" lines: the character of an advisor who
 * takes part in decisions now. Those out of the council, or not seated yet
 * (Erik before Isolde falls), take no side.
 */
export function councilLookup(scene: Phaser.Scene): (id: string) => CharacterDef | undefined {
  const active = activeAdvisors(council(scene), (name) => Boolean(GameState.get(name)));
  return (id) => (active.includes(id) ? findCharacter(scene, id) : undefined);
}

function resetStory(scene: Phaser.Scene): void {
  GameState.init(scene.cache.json.get(STORY_KEY) as Record<string, unknown>);
  Journal.load([]);
}

function stopPlay(scene: Phaser.Scene): void {
  for (const key of PLAY_SCENES) {
    if (key !== scene.scene.key && scene.scene.isActive(key)) scene.scene.stop(key);
  }
}

/** Wipes the save and starts from the prologue (or straight from the first month). */
export function startNewGame(scene: Phaser.Scene): void {
  SaveSystem.clear();
  resetStory(scene);
  if (GameState.story.KnotContainerWithName(PROLOGUE_KNOT)) {
    stopPlay(scene);
    scene.scene.start('Story', { knot: PROLOGUE_KNOT });
    return;
  }
  const first = months(scene)[0];
  if (!first) throw new Error('content/months has no months');
  startMonth(scene, first.id);
}

/**
 * A new game that opens at a later month. The player first replays the council
 * tables of every earlier month (SetupScene), so the past is theirs to choose;
 * the Knowledge those months offer counts as learned.
 */
export function startFromMonth(scene: Phaser.Scene, id: string): void {
  const list = months(scene);
  const index = list.findIndex((m) => m.id === id);
  if (index < 0) throw new Error(`Unknown month "${id}"`);
  const earlier = list.slice(0, index);
  if (earlier.length === 0) {
    startNewGame(scene);
    return;
  }
  SaveSystem.clear();
  resetStory(scene);
  for (const month of earlier) for (const k of month.knowledge ?? []) Journal.add(k);
  stopPlay(scene);
  scene.scene.start('Setup', { months: earlier.map((m) => m.id), target: id });
}

/** Saves, remembers the starting numbers and shows the month's title card. */
export function startMonth(scene: Phaser.Scene, id: string): void {
  if (!findMonth(scene, id)) throw new Error(`Unknown month "${id}"`);
  scene.registry.set('month', id);
  scene.registry.set('monthStart', snapshot(scene));
  SaveSystem.save(id);
  stopPlay(scene);
  scene.scene.start('MonthCard', { month: id });
}

/**
 * Development shortcut (`?month=` in the URL): a fresh story placed straight into
 * a month, with the given Ink VARs switched on. Unlike startMonth it never saves.
 */
export function previewMonth(scene: Phaser.Scene, id: string, location?: string, flags: string[] = []): void {
  const month = findMonth(scene, id);
  if (!month) throw new Error(`?month=${id}: no such month in content/months`);
  resetStory(scene);
  for (const flag of flags) {
    if (GameState.has(flag)) GameState.set(flag, true);
    else console.warn(`?set=: main.ink has no VAR ${flag}`);
  }
  scene.registry.set('month', id);
  scene.registry.set('monthStart', snapshot(scene));
  if (location) enterWorld(scene, { location, spawn: 'start' });
  else scene.scene.start('MonthCard', { month: id });
}

/** Restores the save: the month starts again from its card. Returns false if there is no usable save. */
export function continueGame(scene: Phaser.Scene): boolean {
  const save = SaveSystem.load();
  if (!save || !findMonth(scene, save.month)) return false;
  resetStory(scene);
  try {
    GameState.story.state.LoadJson(save.ink);
    Journal.load(save.journal);
  } catch (err) {
    console.warn('Save slot is incompatible with the current story', err);
    SaveSystem.clear();
    return false;
  }
  startMonth(scene, save.month);
  return true;
}

/** Starts the world scene (and the UI over it). */
export function enterWorld(scene: Phaser.Scene, data: { location: string; spawn?: string; intro?: string }): void {
  if (!scene.scene.isActive('UI')) scene.scene.launch('UI');
  scene.scene.start('World', data);
}

/** The council has decided: leave the world for the summary screen. */
export function finishMonth(scene: Phaser.Scene): void {
  const month = scene.registry.get('month') as string;
  stopPlay(scene);
  scene.scene.start('Summary', { month });
}

/** After the summary: the next month by number, or the end of what is written so far. */
export function nextMonth(scene: Phaser.Scene): void {
  const list = months(scene);
  const index = list.findIndex((m) => m.id === scene.registry.get('month'));
  const current = list[index];
  const next = list[index + 1];
  // Only the month that directly follows: a gap (month 8 not written yet) ends the run here.
  if (next && current && next.number === current.number + 1) {
    startMonth(scene, next.id);
    return;
  }
  SaveSystem.clear();
  scene.scene.start('Story', {
    knot: null,
    caption: next ? `Далі буде\n(місяць ${(current?.number ?? 0) + 1} ще не написаний; місяць ${next.number} можна почати з меню)` : 'Далі буде',
  });
}

/** A resource hit zero: the defeat scene from Ink (`game_over_<id>`), then the main menu. */
export function gameOver(scene: Phaser.Scene, id: string): void {
  SaveSystem.clear();
  stopPlay(scene);
  scene.scene.start('Story', { knot: `game_over_${id}`, caption: 'Корвен упав' });
}

/** Leaves for the main menu. Progress since the start of the month is not kept. */
export function toMainMenu(scene: Phaser.Scene): void {
  stopPlay(scene);
  scene.scene.start('Menu');
}
