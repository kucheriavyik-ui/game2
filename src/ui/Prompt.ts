import Phaser from 'phaser';
import { COLORS, textStyle } from './theme';

/**
 * The "E · поговорити" label that floats above whatever the player can
 * interact with; for characters, their name sits on a line above it.
 */
export class Prompt {
  private readonly container: Phaser.GameObjects.Container;
  private readonly name: Phaser.GameObjects.Text;
  private readonly label: Phaser.GameObjects.Text;
  private readonly bg: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.name = scene.add.text(0, 0, '', textStyle(scene, { color: COLORS.accent })).setOrigin(0.5, 1);
    this.label = scene.add.text(0, 0, '', textStyle(scene)).setOrigin(0.5, 1);
    this.bg = scene.add.rectangle(0, 0, 10, 12, 0x14100e, 0.85).setOrigin(0.5, 1);
    this.container = scene.add.container(0, 0, [this.bg, this.name, this.label]);
    // Sprites use their Y as depth, so the prompt needs to sit well above any map position.
    this.container.setDepth(5000).setVisible(false);
  }

  /** (x, y) is the bottom centre of the prompt. */
  show(x: number, y: number, verb: string, name?: string): void {
    this.label.setText(`E · ${verb}`).setY(-2);
    this.name.setText(name ?? '').setVisible(Boolean(name)).setY(-this.label.height - 5);
    const width = Math.max(this.label.width, name ? this.name.width : 0) + 8;
    const height = this.label.height + (name ? this.name.height + 3 : 0) + 4;
    this.bg.setSize(width, height);
    this.container.setPosition(Math.round(x), Math.round(y));
    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
  }
}
