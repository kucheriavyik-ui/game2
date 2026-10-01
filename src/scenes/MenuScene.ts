import Phaser from 'phaser';
import { findMonth, months } from '../systems/LocationLoader';
import { continueGame, startFromMonth, startNewGame } from '../systems/MonthFlow';
import { SaveSystem } from '../systems/SaveSystem';
import { Settings } from '../systems/Settings';
import { CONTROLS_TEXT, MenuList, settingsItems, type MenuItem } from '../ui/MenuList';
import { COLORS, textStyle } from '../ui/theme';

type View = 'main' | 'chooseMonth' | 'settings' | 'controls' | 'confirmNew' | 'badSave';

/** Title screen: continue, new game (from any month written so far), controls. */
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
    this.registry.set('music', 'port');

    // 24px is three times the font's native 8px grid: large and still sharp.
    this.add.text(width / 2, 44, 'ОБЛОГА КОРВЕНА', textStyle(this, { fontSize: '24px', color: COLORS.accent })).setOrigin(0.5);
    // The subtitle names the month of the saved game, if there is one.
    const save = SaveSystem.load();
    const month = save ? findMonth(this, save.month) : undefined;
    if (month) {
      this.add
        .text(width / 2, 74, `Місяць ${month.number}. ${month.title}`, textStyle(this, { color: COLORS.muted }))
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
          { label: 'Нова гра', onConfirm: () => this.show(hasSave ? 'confirmNew' : 'chooseMonth') },
          { label: 'Налаштування', onConfirm: () => this.show('settings') },
          { label: 'Керування', onConfirm: () => this.show('controls') },
        ],
      },
      chooseMonth: {
        text: 'З якого місяця почати?\nДля пізнішого місяця спершу оберете,\nщо вирішувала рада до нього.',
        items: [
          ...months(this).map((m, i) => ({
            label: `Місяць ${m.number}. ${m.title}`,
            onConfirm: () => (i === 0 ? startNewGame(this) : startFromMonth(this, m.id)),
          })),
          back,
        ],
      },
      settings: { text: '', items: settingsItems(this, Settings, () => this.show('main')) },
      controls: { text: CONTROLS_TEXT, items: [back] },
      confirmNew: {
        text: 'Почати заново?\nПоточне збереження буде втрачено.',
        items: [
          { label: 'Ні, назад', onConfirm: () => this.show('main') },
          { label: 'Так, нова гра', onConfirm: () => this.show('chooseMonth') },
        ],
      },
      badSave: {
        text: 'Збереження не підходить до цієї версії гри.\nДоведеться почати заново.',
        items: [
          { label: 'Нова гра', onConfirm: () => startNewGame(this) },
          { label: 'Назад', onConfirm: () => this.scene.restart() },
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
