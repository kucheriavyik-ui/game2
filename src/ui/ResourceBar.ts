import Phaser from 'phaser';
import { COLORS, textStyle } from './theme';

/** Shape of content/resources.json entries: which Ink variable to show and how. */
export interface ResourceDef {
  var: string;
  label: string;
  color: string;
}

const WIDTH = 160;
/** Right edge of the value column; the change ("-15") is printed to the right of it. */
const VALUE_RIGHT = 128;
const ROW = 12;
const PAD = 4;
const BAR_X = 64;
const BAR_WIDTH = 40;
const BAR_HEIGHT = 4;
const MAX = 100;

interface Row {
  def: ResourceDef;
  bar: Phaser.GameObjects.Rectangle;
  value: Phaser.GameObjects.Text;
  delta: Phaser.GameObjects.Text;
  shown: number;
}

/**
 * The four city resources in the top-right corner. Values come from Ink;
 * after each line the UI calls `refresh`, and anything that changed since
 * the last look flashes its difference ("-15") next to the bar.
 */
export class ResourceBar {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly rows: Row[] = [];

  constructor(scene: Phaser.Scene, defs: ResourceDef[]) {
    this.scene = scene;
    const x0 = scene.scale.width - WIDTH - PAD;
    const height = defs.length * ROW + PAD * 2 - 3;
    const bg = scene.add.rectangle(0, 0, WIDTH, height, 0x14100e, 0.8).setOrigin(0).setStrokeStyle(1, 0x5a4a3a);
    this.container = scene.add.container(x0, PAD, [bg]).setDepth(150);

    defs.forEach((def, i) => {
      const y = PAD + i * ROW;
      const label = scene.add.text(PAD, y, def.label, textStyle(scene));
      const track = scene.add.rectangle(BAR_X, y + 2, BAR_WIDTH, BAR_HEIGHT, 0x2a221c).setOrigin(0);
      const bar = scene.add
        .rectangle(BAR_X, y + 2, 0, BAR_HEIGHT, Phaser.Display.Color.HexStringToColor(def.color).color)
        .setOrigin(0);
      const value = scene.add.text(VALUE_RIGHT, y, '', textStyle(scene)).setOrigin(1, 0);
      const delta = scene.add.text(WIDTH - PAD, y, '', textStyle(scene)).setOrigin(1, 0).setAlpha(0);
      this.container.add([label, track, bar, value, delta]);
      this.rows.push({ def, bar, value, delta, shown: Number.NaN });
    });
  }

  /** Re-reads every value. `announce` shows the difference for values that changed. */
  refresh(read: (name: string) => number, announce: boolean): void {
    for (const row of this.rows) {
      const next = read(row.def.var);
      if (next === row.shown) continue;
      if (announce && !Number.isNaN(row.shown)) this.flash(row, next - row.shown);
      row.shown = next;
      row.value.setText(String(next)).setColor(next <= 20 ? '#d0604a' : COLORS.text);
      const width = (BAR_WIDTH * Phaser.Math.Clamp(next, 0, MAX)) / MAX;
      this.scene.tweens.killTweensOf(row.bar);
      if (announce) this.scene.tweens.add({ targets: row.bar, width, duration: 400 });
      else row.bar.width = width;
    }
  }

  toggle(): void {
    this.container.setVisible(!this.container.visible);
  }

  private flash(row: Row, diff: number): void {
    row.delta
      .setText(diff > 0 ? `+${diff}` : `-${Math.abs(diff)}`)
      .setColor(diff > 0 ? COLORS.choice : '#d0604a')
      .setAlpha(1);
    this.scene.tweens.killTweensOf(row.delta);
    this.scene.tweens.add({ targets: row.delta, alpha: 0, delay: 2200, duration: 500 });
    // Make sure a hidden panel still tells the player something happened.
    this.container.setVisible(true);
  }
}
