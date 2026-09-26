import Phaser from 'phaser';
import { toMainMenu } from '../systems/GameFlow';
import { CONTROLS_TEXT, MenuList, type MenuItem } from '../ui/MenuList';
import { COLORS, textStyle } from '../ui/theme';
import type { WorldScene } from './WorldScene';

type View = 'main' | 'controls';

/**
 * Esc menu over the world. The world is frozen (ui:lock) while it is open.
 * Opening the journal from here hands over to the UI scene via 'ui:journal'.
 */
export class PauseScene extends Phaser.Scene {
  private list!: MenuList;
  private info!: Phaser.GameObjects.Text;
  private view: View = 'main';

  constructor() {
    super('Pause');
  }

  create(): void {
    const { width, height } = this.scale;
    this.game.events.emit('ui:lock', true);
    this.add.rectangle(0, 0, width, height, 0x0b0a0a, 0.82).setOrigin(0);
    this.add.text(width / 2, 40, 'Пауза', textStyle(this, { fontSize: '16px', color: COLORS.accent })).setOrigin(0.5);
    this.info = this.add.text(width / 2, 74, '', textStyle(this, { align: 'center', lineSpacing: 6 })).setOrigin(0.5, 0);
    this.list = new MenuList(this, width / 2, 74);
    this.add
      .text(width / 2, height - 14, 'Esc - повернутися до гри', textStyle(this, { color: COLORS.muted }))
      .setOrigin(0.5);
    this.show('main');

    // Esc acts on release, and only for a press that started while the menu was
    // open: the press that opened the pause must not also close it, and the
    // press that closes it must not reach the world and open it again.
    let escArmed = false;
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === 'Escape') {
        escArmed = true;
        return;
      }
      this.list.handleKey(event.code);
    });
    this.input.keyboard?.on('keyup', (event: KeyboardEvent) => {
      if (event.code !== 'Escape' || !escArmed) return;
      escArmed = false;
      if (this.view === 'main') this.close();
      else this.show('main');
    });
  }

  private show(view: View): void {
    this.view = view;
    const back = { label: 'Назад', onConfirm: () => this.show('main') };
    const views: Record<View, { text: string; items: MenuItem[] }> = {
      main: {
        text: '',
        items: [
          { label: 'Продовжити', onConfirm: () => this.close() },
          { label: 'Нитки', onConfirm: () => this.openJournal('threads') },
          { label: 'Люди', onConfirm: () => this.openJournal('people') },
          { label: 'Керування', onConfirm: () => this.show('controls') },
          { label: 'Вийти в головне меню', onConfirm: () => this.quitToMenu() },
        ],
      },
      controls: { text: CONTROLS_TEXT, items: [back] },
    };
    const { text, items } = views[view];
    this.info.setText(text);
    this.list.setItems([]);
    const top = text ? this.info.y + this.info.height + 14 : this.info.y;
    this.list = new MenuList(this, this.scale.width / 2, top);
    this.list.setItems(items);
  }

  private close(): void {
    this.game.events.emit('ui:lock', false);
    this.scene.stop();
  }

  private openJournal(tab: 'threads' | 'people'): void {
    this.scene.stop();
    // The journal keeps the world locked; closing it releases the lock.
    this.game.events.emit('ui:journal', tab);
  }

  private quitToMenu(): void {
    (this.scene.get('World') as WorldScene).saveNow();
    toMainMenu(this);
  }
}
