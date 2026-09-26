import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { MonthCardScene } from './scenes/MonthCardScene';
import { PauseScene } from './scenes/PauseScene';
import { StoryScene } from './scenes/StoryScene';
import { SummaryScene } from './scenes/SummaryScene';
import { UIScene } from './scenes/UIScene';
import { WorldScene } from './scenes/WorldScene';
import { FONT_LOAD } from './ui/theme';

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

function createGame(): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0b0a0a',
    pixelArt: true,
    roundPixels: true,
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    // Zoom is applied manually below; index.html centres the canvas with flexbox.
    scale: { mode: Phaser.Scale.NONE },
    // Order is also draw order: later scenes are drawn on top.
    scene: [BootScene, MenuScene, MonthCardScene, WorldScene, UIScene, PauseScene, SummaryScene, StoryScene],
  });

  /**
   * Integer zoom in *physical* pixels, so every game pixel maps to a whole
   * block of screen pixels. With Windows display scaling (devicePixelRatio
   * 1.25, 1.5 …) a plain CSS zoom of 2 would become 2.5 real pixels and blur,
   * so the CSS zoom is divided by the ratio and the canvas is placed on a
   * whole physical pixel as well.
   */
  const fitToWindow = (): void => {
    const dpr = window.devicePixelRatio || 1;
    const physical = Math.max(
      1,
      Math.floor(Math.min((window.innerWidth * dpr) / GAME_WIDTH, (window.innerHeight * dpr) / GAME_HEIGHT)),
    );
    game.scale.setZoom(physical / dpr);

    const canvas = game.canvas;
    const left = Math.floor((window.innerWidth * dpr - GAME_WIDTH * physical) / 2) / dpr;
    const top = Math.floor((window.innerHeight * dpr - GAME_HEIGHT * physical) / 2) / dpr;
    canvas.style.position = 'absolute';
    canvas.style.left = `${left}px`;
    canvas.style.top = `${top}px`;
    canvas.style.margin = '0';
  };
  window.addEventListener('resize', fitToWindow);
  fitToWindow();

  // Handy for poking at scenes from the browser console during development.
  if (import.meta.env.DEV) {
    (window as unknown as { __game: Phaser.Game }).__game = game;
  }
  return game;
}

// Canvas text silently falls back to a system font if ours is not loaded yet,
// so the game only starts once the font is ready (or has failed to load).
document.fonts
  .load(FONT_LOAD)
  .catch(() => [])
  .then(createGame);
