import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { MusicScene } from './scenes/MusicScene';
import { MonthCardScene } from './scenes/MonthCardScene';
import { PauseScene } from './scenes/PauseScene';
import { SetupScene } from './scenes/SetupScene';
import { StoryScene } from './scenes/StoryScene';
import { SummaryScene } from './scenes/SummaryScene';
import { UIScene } from './scenes/UIScene';
import { WorldScene } from './scenes/WorldScene';
import { FONT_LOAD } from './ui/theme';

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
/** Integer zoom is kept only while it fills at least this share of the window. */
const INTEGER_ZOOM_MIN_FILL = 0.85;

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
    scene: [BootScene, MenuScene, SetupScene, MonthCardScene, WorldScene, UIScene, PauseScene, SummaryScene, StoryScene, MusicScene],
  });

  /**
   * Zoom in *physical* pixels. An integer zoom maps every game pixel to a whole
   * block of screen pixels, so it is preferred; but when it would leave much of
   * the window empty (a 755px-high browser page fits zoom 2 = 540px) the game is
   * stretched to fit instead and pixels become slightly uneven. With Windows
   * display scaling (devicePixelRatio 1.25, 1.5 …) the CSS zoom is divided by
   * the ratio and the canvas is placed on a whole physical pixel as well.
   */
  const fitToWindow = (): void => {
    const dpr = window.devicePixelRatio || 1;
    const fit = Math.min((window.innerWidth * dpr) / GAME_WIDTH, (window.innerHeight * dpr) / GAME_HEIGHT);
    const whole = Math.max(1, Math.floor(fit));
    const physical = whole >= fit * INTEGER_ZOOM_MIN_FILL ? whole : fit;
    game.scale.setZoom(physical / dpr);

    const canvas = game.canvas;
    const left = Math.max(0, Math.floor((window.innerWidth * dpr - GAME_WIDTH * physical) / 2)) / dpr;
    const top = Math.max(0, Math.floor((window.innerHeight * dpr - GAME_HEIGHT * physical) / 2)) / dpr;
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
