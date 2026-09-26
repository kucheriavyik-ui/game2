import Phaser from 'phaser';
import { AssetKeys } from '../systems/Assets';
import type { JournalDefs } from '../systems/Journal';
import { loyaltyLevel, type CharacterDef, type CouncilDef } from '../systems/LocationLoader';
import { COLORS, textStyle } from './theme';

const PAD = 12;
const TOP = 40;
const PORTRAIT = 28;
const SCROLL_STEP = 24;

export type JournalTab = 'knowledge' | 'council';

export interface JournalData {
  /** Unlocked entries, oldest first. */
  entryIds: readonly string[];
  entries: JournalDefs;
  council: CouncilDef;
  /** An advisor's loyalty, 0..10 (shown only as a word). */
  loyalty(id: string): number;
  /** Whether the advisor has left the council for good. */
  out(id: string): boolean;
  character(id: string): CharacterDef | undefined;
}

/**
 * Full-screen journal with two tabs: «Знання» (what the Protector has learned)
 * and «Рада» (each advisor's seat and mood). ←/→ switches tabs, ↑/↓ scrolls.
 */
export class JournalPanel {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly entries: Phaser.GameObjects.Container;
  private readonly tabTexts: Record<JournalTab, Phaser.GameObjects.Text>;
  private readonly width: number;
  private readonly viewHeight: number;
  private tab: JournalTab = 'knowledge';
  private data: JournalData | null = null;
  private scroll = 0;
  private contentHeight = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.width = scene.scale.width;
    const height = scene.scale.height;
    this.viewHeight = height - TOP - 22;

    const bg = scene.add.rectangle(0, 0, this.width, height, 0x14100e, 0.97).setOrigin(0);
    this.tabTexts = {
      knowledge: scene.add.text(PAD, PAD, 'Знання', textStyle(scene, { fontSize: '16px' })),
      council: scene.add.text(PAD + 120, PAD, 'Рада', textStyle(scene, { fontSize: '16px' })),
    };
    const hint = scene.add
      .text(this.width / 2, height - 10, 'A/D - вкладки · W/S - гортати · J/Esc - закрити', textStyle(scene, { color: COLORS.muted }))
      .setOrigin(0.5);
    this.entries = scene.add.container(PAD, TOP);

    // Clip the list to the area between the tabs and the hint line.
    const maskShape = scene.make.graphics({}, false);
    maskShape.fillStyle(0xffffff).fillRect(0, TOP - 2, this.width, this.viewHeight + 4);
    this.entries.setMask(maskShape.createGeometryMask());

    this.container = scene.add.container(0, 0, [bg, this.tabTexts.knowledge, this.tabTexts.council, hint, this.entries]);
    this.container.setDepth(300).setVisible(false);
  }

  get isOpen(): boolean {
    return this.container.visible;
  }

  show(data: JournalData, tab: JournalTab = this.tab): void {
    this.data = data;
    this.container.setVisible(true);
    this.setTab(tab);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  /** Returns true if the key was used. */
  handleKey(code: string): boolean {
    if (!this.isOpen) return false;
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
      case 'ArrowRight':
      case 'KeyD':
      case 'Tab':
        this.setTab(this.tab === 'knowledge' ? 'council' : 'knowledge');
        return true;
      case 'ArrowUp':
      case 'KeyW':
        this.scrollBy(-SCROLL_STEP);
        return true;
      case 'ArrowDown':
      case 'KeyS':
        this.scrollBy(SCROLL_STEP);
        return true;
      default:
        return false;
    }
  }

  private setTab(tab: JournalTab): void {
    this.tab = tab;
    this.tabTexts.knowledge.setColor(tab === 'knowledge' ? COLORS.accent : '#4a4238');
    this.tabTexts.council.setColor(tab === 'council' ? COLORS.accent : '#4a4238');
    this.entries.removeAll(true);
    this.scroll = 0;
    if (!this.data) return;
    this.contentHeight = tab === 'knowledge' ? this.renderKnowledge(this.data) : this.renderCouncil(this.data);
    this.entries.setY(TOP);
  }

  private scrollBy(dy: number): void {
    const max = Math.max(0, this.contentHeight - this.viewHeight);
    this.scroll = Phaser.Math.Clamp(this.scroll + dy, 0, max);
    this.entries.setY(TOP - this.scroll);
  }

  private empty(text: string): number {
    const t = this.scene.add.text(0, 0, text, textStyle(this.scene, { color: COLORS.muted, wordWrap: { width: this.width - PAD * 2 } }));
    this.entries.add(t);
    return t.height;
  }

  private renderKnowledge(data: JournalData): number {
    if (data.entryIds.length === 0) return this.empty('Поки що нічого. Поговоріть із людьми і роздивіться речі.');
    const textWidth = this.width - PAD * 2;
    let y = 0;
    // Newest first, so the latest entry is always on top.
    for (const id of [...data.entryIds].reverse()) {
      const def = data.entries[id];
      const title = this.scene.add.text(0, y, `* ${def?.title ?? id}`, textStyle(this.scene, { color: COLORS.accent }));
      y += title.height + 3;
      const body = this.scene.add.text(10, y, def?.text ?? '', textStyle(this.scene, { wordWrap: { width: textWidth - 10 } }));
      y += body.height + 10;
      this.entries.add([title, body]);
    }
    return y;
  }

  private renderCouncil(data: JournalData): number {
    if (data.council.advisors.length === 0) return this.empty('Ради немає.');
    const textX = PORTRAIT + 10;
    let y = 0;
    for (const id of data.council.advisors) {
      const character = data.character(id);
      const portraitKey = AssetKeys.portrait(character?.portraits.neutral ?? `${id}_neutral`);
      if (this.scene.textures.exists(portraitKey)) {
        this.entries.add(this.scene.add.image(0, y, portraitKey).setOrigin(0).setDisplaySize(PORTRAIT, PORTRAIT));
      } else {
        const color = Phaser.Display.Color.HexStringToColor(character?.color ?? '#555555').color;
        this.entries.add(this.scene.add.rectangle(0, y, PORTRAIT, PORTRAIT, color).setOrigin(0));
      }
      const name = this.scene.add.text(textX, y + 2, character?.name ?? id, textStyle(this.scene, { color: COLORS.accent }));
      const role = this.scene.add.text(textX, y + 15, character?.role ?? '', textStyle(this.scene, { color: COLORS.muted }));
      const level = data.out(id) ? { label: 'поза радою', color: COLORS.muted } : loyaltyLevel(data.council, data.loyalty(id));
      const mood = this.scene.add
        .text(this.width - PAD * 2, y + 2, level.label, textStyle(this.scene, { color: level.color }))
        .setOrigin(1, 0);
      this.entries.add([name, role, mood]);
      y += PORTRAIT + 6;
    }
    return y;
  }
}
