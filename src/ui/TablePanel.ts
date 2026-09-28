import Phaser from 'phaser';
import { COLORS, textStyle } from './theme';

/** Shape of content/tables.json entries: a small table a dialogue line can put on screen (`# table:<id>`). */
export interface TableDef {
  title: string;
  /** One line under the title (period, sample, a caveat). */
  note?: string;
  columns: string[];
  rows: string[][];
}
export type TableDefs = Record<string, TableDef>;

const PAD = 14;
const ROW = 14;
const GREEN = '#8fcf8a';
const RED = '#e0826e';

/**
 * Full-screen table over the world: the numbers behind what a character just
 * said, laid out in columns instead of a sentence. The first column is text
 * and left-aligned; the others are right-aligned, and a cell that starts with
 * + or − is coloured by its sign. Space/Enter closes it and the talk goes on.
 */
export class TablePanel {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly content: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const bg = scene.add.rectangle(0, 0, width, height, 0x14100e, 0.97).setOrigin(0);
    const hint = scene.add.text(width / 2, height - 10, 'Space - далі', textStyle(scene, { color: COLORS.muted })).setOrigin(0.5);
    this.content = scene.add.container(0, 0);
    this.container = scene.add.container(0, 0, [bg, this.content, hint]).setDepth(400).setVisible(false);
  }

  get isOpen(): boolean {
    return this.container.visible;
  }

  show(def: TableDef): void {
    this.content.removeAll(true);
    const width = this.scene.scale.width - PAD * 2;
    let y = PAD;
    const title = this.scene.add.text(PAD, y, def.title, textStyle(this.scene, { fontSize: '16px', color: COLORS.accent }));
    this.content.add(title);
    y += title.height + 6;
    if (def.note) {
      const note = this.scene.add.text(PAD, y, def.note, textStyle(this.scene, { color: COLORS.muted, wordWrap: { width } }));
      this.content.add(note);
      y += note.height + 8;
    }

    // The first column takes what the number columns leave; each number column is as wide as its widest cell.
    const numberCols = def.columns.slice(1);
    const colWidths = numberCols.map((c, i) => Math.max(c.length, ...def.rows.map((r) => (r[i + 1] ?? '').length)) * 8 + 12);
    const numbersWidth = colWidths.reduce((a, b) => a + b, 0);
    const firstWidth = width - numbersWidth;

    const drawRow = (cells: string[], header: boolean, rowY: number): number => {
      const first = this.scene.add.text(PAD, rowY, cells[0] ?? '', textStyle(this.scene, { color: header ? COLORS.muted : COLORS.text, wordWrap: { width: firstWidth - 6 } }));
      this.content.add(first);
      let x = PAD + firstWidth;
      numberCols.forEach((_, i) => {
        const cell = cells[i + 1] ?? '';
        x += colWidths[i] ?? 0;
        const color = header ? COLORS.muted : cell.startsWith('+') ? GREEN : cell.startsWith('−') || cell.startsWith('-') ? RED : COLORS.text;
        this.content.add(this.scene.add.text(x - 6, rowY, cell, textStyle(this.scene, { color })).setOrigin(1, 0));
      });
      return Math.max(first.height, ROW);
    };

    y += drawRow(def.columns, true, y) + 2;
    this.content.add(this.scene.add.rectangle(PAD, y, width, 1, 0x5a4a3a).setOrigin(0));
    y += 5;
    for (const row of def.rows) y += drawRow(row, false, y) + 4;
    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
  }
}
