import Phaser from 'phaser';
import { COLORS, textStyle } from './theme';

export interface MenuItem {
  /** Text, or a function for rows whose text depends on a value (settings). */
  label: string | (() => string);
  enabled?: boolean;
  /** Enter / Space / E. */
  onConfirm?: () => void;
  /** ← / → with -1 or +1 (sliders and toggles). */
  onAdjust?: (step: -1 | 1) => void;
}

/**
 * A vertical list of options driven by the keyboard. The owning scene
 * forwards keys with `handleKey`; the list redraws itself.
 */
export class MenuList {
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly y: number;
  private readonly align: 'left' | 'center';
  private readonly texts: Phaser.GameObjects.Text[] = [];
  private items: MenuItem[] = [];
  private index = 0;
  private depth = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, align: 'left' | 'center' = 'center') {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.align = align;
  }

  setDepth(depth: number): this {
    this.depth = depth;
    for (const t of this.texts) t.setDepth(depth);
    return this;
  }

  setItems(items: MenuItem[]): void {
    this.items = items;
    for (const t of this.texts) t.destroy();
    this.texts.length = 0;
    items.forEach((_, i) => {
      const t = this.scene.add
        .text(this.x, this.y + i * 16, '', textStyle(this.scene))
        .setOrigin(this.align === 'center' ? 0.5 : 0, 0)
        .setDepth(this.depth);
      this.texts.push(t);
    });
    this.index = Math.max(0, items.findIndex((it) => it.enabled !== false));
    this.render();
  }

  setVisible(visible: boolean): void {
    for (const t of this.texts) t.setVisible(visible);
  }

  /** Returns true if the key was used. */
  handleKey(code: string): boolean {
    if (this.items.length === 0) return false;
    switch (code) {
      case 'ArrowUp':
      case 'KeyW':
        this.move(-1);
        return true;
      case 'ArrowDown':
      case 'KeyS':
        this.move(1);
        return true;
      case 'ArrowLeft':
      case 'KeyA':
        this.items[this.index]?.onAdjust?.(-1);
        this.render();
        return true;
      case 'ArrowRight':
      case 'KeyD':
        this.items[this.index]?.onAdjust?.(1);
        this.render();
        return true;
      case 'Enter':
      case 'Space':
      case 'KeyE': {
        const item = this.items[this.index];
        if (item && item.enabled !== false) item.onConfirm?.();
        this.render();
        return true;
      }
      default:
        return false;
    }
  }

  /** Redraws labels (call after a value shown in a label changed). */
  render(): void {
    this.items.forEach((item, i) => {
      const t = this.texts[i];
      if (!t) return;
      const label = typeof item.label === 'function' ? item.label() : item.label;
      const selected = i === this.index;
      t.setText(selected ? `> ${label} <` : label);
      t.setColor(item.enabled === false ? '#4a4238' : selected ? COLORS.accent : COLORS.text);
    });
  }

  private move(step: number): void {
    const n = this.items.length;
    for (let k = 1; k <= n; k++) {
      const next = (this.index + step * k + n * k) % n;
      if (this.items[next]?.enabled !== false) {
        this.index = next;
        break;
      }
    }
    this.render();
  }
}

export const CONTROLS_TEXT = [
  'WASD / стрілки - рух',
  'E - поговорити, оглянути, увійти',
  'Space / Enter - далі',
  '1-4 - вибрати відповідь',
  'J - журнал',
  'Коліщатко миші - масштаб',
  'Esc - пауза',
].join('\n');
