import Phaser from 'phaser';

/**
 * Single place for UI text styling. Text is rasterised at the screen's zoom
 * (`resolution`) instead of the 480x270 canvas, otherwise every glyph gets
 * upscaled and blurs.
 */
export const FONT_FAMILY = '"Press Start 2P", monospace';
/** Press Start 2P is drawn on an 8-dot grid: 8 game px is its native size at any zoom. */
export const FONT_SIZE = '8px';
/** For document.fonts.load() before the game starts. */
export const FONT_LOAD = `${FONT_SIZE} "Press Start 2P"`;
const LINE_SPACING = 3;

export const COLORS = {
  text: '#e8e0d0',
  accent: '#d8b56a',
  muted: '#8a7a66',
  choice: '#9fc4a8',
  dark: '#1a1512',
} as const;

type TextStyle = Phaser.Types.GameObjects.Text.TextStyle;

export function textStyle(scene: Phaser.Scene, overrides: TextStyle = {}): TextStyle {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    color: COLORS.text,
    lineSpacing: LINE_SPACING,
    // Physical pixels per game pixel (zoom already has the display scaling divided out).
    resolution: Math.max(1, Math.ceil(scene.scale.zoom * (window.devicePixelRatio || 1) - 0.01)),
    ...overrides,
  };
}
