import Phaser from 'phaser';
import { enterWorld } from '../systems/GameFlow';
import { findChapter } from '../systems/LocationLoader';
import { COLORS, textStyle } from '../ui/theme';

/** Black title card "Місяць N · Назва" before a chapter starts; any key skips it. */
export class ChapterScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('Chapter');
  }

  create(data: { chapter: string }): void {
    const chapter = findChapter(this, data.chapter);
    if (!chapter) throw new Error(`Unknown chapter "${data.chapter}"`);
    const { width, height } = this.scale;
    this.leaving = false;
    this.cameras.main.setBackgroundColor('#000000');

    const number = this.add
      .text(width / 2, height / 2 - 18, `Місяць ${chapter.number}`, textStyle(this, { color: COLORS.muted }))
      .setOrigin(0.5)
      .setAlpha(0);
    const title = this.add
      .text(width / 2, height / 2 + 6, chapter.title, textStyle(this, { fontSize: '24px', color: COLORS.accent }))
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: [number, title], alpha: 1, duration: 900 });

    const go = (): void => {
      if (this.leaving) return;
      this.leaving = true;
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        enterWorld(this, { ...chapter.start, intro: chapter.intro }),
      );
    };
    this.time.delayedCall(3200, go);
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (!event.repeat) go();
    });
  }
}
