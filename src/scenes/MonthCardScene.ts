import Phaser from 'phaser';
import { findMonth } from '../systems/LocationLoader';
import { enterWorld } from '../systems/MonthFlow';
import { COLORS, textStyle } from '../ui/theme';

/** Black title card "Місяць N · Назва" with one line of atmosphere; any key skips it. */
export class MonthCardScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('MonthCard');
  }

  create(data: { month: string }): void {
    const month = findMonth(this, data.month);
    if (!month) throw new Error(`Unknown month "${data.month}"`);
    const { width, height } = this.scale;
    this.leaving = false;
    this.cameras.main.setBackgroundColor('#000000');
    this.registry.set('music', 'infirmary');

    const number = this.add
      .text(width / 2, height / 2 - 34, `Місяць ${month.number}`, textStyle(this, { color: COLORS.muted }))
      .setOrigin(0.5);
    const title = this.add
      .text(width / 2, height / 2 - 12, month.title, textStyle(this, { fontSize: '24px', color: COLORS.accent }))
      .setOrigin(0.5);
    const flavor = this.add
      .text(width / 2, height / 2 + 16, month.flavor, textStyle(this, { align: 'center', wordWrap: { width: width - 80 } }))
      .setOrigin(0.5, 0);
    const texts = [number, title, flavor];
    for (const t of texts) t.setAlpha(0);
    this.tweens.add({ targets: texts, alpha: 1, duration: 900 });

    const go = (): void => {
      if (this.leaving) return;
      this.leaving = true;
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        enterWorld(this, { location: month.location, spawn: 'start', intro: month.ink_open }),
      );
    };
    this.time.delayedCall(5000, go);
    // Keys work only after the card has faded in, so the key that started the month doesn't skip it.
    this.time.delayedCall(600, () => {
      this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (!event.repeat) go();
      });
    });
  }
}
