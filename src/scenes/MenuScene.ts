import Phaser from 'phaser';
import { continueGame, startNewGame } from '../systems/GameFlow';
import { chapters, findChapter } from '../systems/LocationLoader';
import { SaveSystem } from '../systems/SaveSystem';
import { CONTROLS_TEXT, MenuList, type MenuItem } from '../ui/MenuList';
import { COLORS, textStyle } from '../ui/theme';

type View = 'main' | 'controls' | 'confirmNew' | 'chapter' | 'badSave';

/** Title screen: continue, new game, settings, controls. */
export class MenuScene extends Phaser.Scene {
  private list!: MenuList;
  private info!: Phaser.GameObjects.Text;
  private view: View = 'main';

  constructor() {
    super('Menu');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0b0a0a');

    // 24px is three times the font's native 8px grid: large and still sharp.
    this.add.text(width / 2, 44, 'ОБЛОГА КОРВЕНА', textStyle(this, { fontSize: '24px', color: COLORS.accent })).setOrigin(0.5);
    // The subtitle names the chapter of the saved game, if there is one.
    const save = SaveSystem.load();
    const chapter = save ? findChapter(this, save.chapter) : undefined;
    if (chapter) {
      this.add
        .text(width / 2, 74, `Місяць ${chapter.number}. ${chapter.title}`, textStyle(this, { color: COLORS.muted }))
        .setOrigin(0.5);
    }

    this.info = this.add
      .text(width / 2, 118, '', textStyle(this, { align: 'center', lineSpacing: 6 }))
      .setOrigin(0.5, 0);
    this.list = new MenuList(this, width / 2, 118);
    this.add
      .text(width / 2, height - 14, 'Стрілки - вибір · Enter - підтвердити', textStyle(this, { color: COLORS.muted }))
      .setOrigin(0.5);

    this.show('main');

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === 'Escape' && this.view !== 'main') {
        this.show('main');
        return;
      }
      this.list.handleKey(event.code);
    });
  }

  /** Each view is an optional block of text with a list of options under it. */
  private show(view: View): void {
    this.view = view;
    const back = { label: 'Назад', onConfirm: () => this.show('main') };
    const hasSave = SaveSystem.exists();
    const views: Record<View, { text: string; items: MenuItem[] }> = {
      main: {
        text: '',
        items: [
          {
            label: 'Продовжити',
            enabled: hasSave,
            onConfirm: () => {
              if (!continueGame(this)) this.show('badSave');
            },
          },
          { label: 'Нова гра', onConfirm: () => this.show(hasSave ? 'confirmNew' : 'chapter') },
          { label: 'Керування', onConfirm: () => this.show('controls') },
        ],
      },
      controls: { text: CONTROLS_TEXT, items: [back] },
      confirmNew: {
        text: 'Почати заново?\nПоточне збереження буде втрачено.',
        items: [
          { label: 'Ні, назад', onConfirm: () => this.show('main') },
          { label: 'Так, нова гра', onConfirm: () => this.show('chapter') },
        ],
      },
      badSave: {
        text: 'Збереження не підходить до цієї версії гри.\nПочніть розділ заново.',
        items: [
          { label: 'Обрати розділ', onConfirm: () => this.show('chapter') },
          { label: 'Назад', onConfirm: () => this.scene.restart() },
        ],
      },
      // Any chapter can be started on its own; a later one sets up the state it assumes.
      chapter: {
        text: 'З якого розділу почати?',
        items: [
          ...chapters(this).map((ch) => ({
            label: `Розділ ${ch.number}. ${ch.title}`,
            onConfirm: () => startNewGame(this, ch.id),
          })),
          back,
        ],
      },
    };

    const { text, items } = views[view];
    this.info.setText(text);
    this.list.setItems([]);
    const top = text ? this.info.y + this.info.height + 14 : this.info.y;
    this.list = new MenuList(this, this.scale.width / 2, top);
    this.list.setItems(items);
  }
}
