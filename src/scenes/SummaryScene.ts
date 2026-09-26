import Phaser from 'phaser';
import { playThrough } from '../systems/DialogueSystem';
import { GameState } from '../systems/GameState';
import { activeAdvisors, council, findCharacter, findMonth, loyaltyLevel, RESOURCES_KEY } from '../systems/LocationLoader';
import { gameOver, nextMonth, snapshot, type Snapshot } from '../systems/MonthFlow';
import type { ResourceDef } from '../ui/ResourceBar';
import { COLORS, textStyle } from '../ui/theme';

const RED = '#d0604a';
const COLUMN_LEFT = 40;
const COLUMN_RIGHT = 232;
const ROW = 12;

/**
 * End of a month. Runs the month's `ink_end` knot (upkeep, one line per
 * consequence, the defeat check), then shows its lines, every resource
 * "before → after" and the advisors whose mood changed. A `# game_over:<id>`
 * tag from the knot turns "next month" into the defeat scene.
 */
export class SummaryScene extends Phaser.Scene {
  private defeat: string | null = null;
  private leaving = false;

  constructor() {
    super('Summary');
  }

  create(data: { month: string }): void {
    const month = findMonth(this, data.month);
    if (!month) throw new Error(`Unknown month "${data.month}"`);
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0b0a0a');
    this.registry.set('music', 'infirmary');
    this.leaving = false;
    this.defeat = null;

    const before = (this.registry.get('monthStart') as Snapshot | undefined) ?? snapshot(this);
    const lines = this.runEnd(month.ink_end);
    const after = snapshot(this);

    this.add
      .text(width / 2, 14, `Кінець місяця ${month.number} · ${month.title}`, textStyle(this, { color: COLORS.accent }))
      .setOrigin(0.5, 0);
    const flavor = this.add
      .text(width / 2, 34, lines.join('\n'), textStyle(this, { align: 'center', wordWrap: { width: width - 60 } }))
      .setOrigin(0.5, 0);

    const top = flavor.y + flavor.height + 18;
    this.resourceColumn(top, before, after);
    this.councilColumn(top, before, after);

    this.add
      .text(width / 2, height - 16, this.defeat ? '> Space' : 'Space - далі', textStyle(this, { color: COLORS.muted }))
      .setOrigin(0.5);

    this.time.delayedCall(400, () => {
      this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (event.repeat || this.leaving || !['Space', 'Enter'].includes(event.code)) return;
        this.leaving = true;
        if (this.defeat) gameOver(this, this.defeat);
        else nextMonth(this);
      });
    });
  }

  /** Plays the knot to the end and returns its text; notes a defeat tag. */
  private runEnd(knot: string): string[] {
    const { lines, tags } = playThrough(knot);
    this.readTags(tags);
    return lines;
  }

  private readTags(tags: readonly string[]): void {
    for (const tag of tags) {
      const [key, value] = tag.split(':').map((s) => s.trim());
      if (key === 'game_over' && value && !this.defeat) this.defeat = value;
    }
  }

  private resourceColumn(top: number, before: Snapshot, after: Snapshot): void {
    this.add.text(COLUMN_LEFT, top, 'Місто', textStyle(this, { color: COLORS.muted }));
    const defs = (this.cache.json.get(RESOURCES_KEY) ?? []) as ResourceDef[];
    defs.forEach((def, i) => {
      const y = top + (i + 1) * ROW + 4;
      const from = before[def.var] ?? 0;
      const to = after[def.var] ?? 0;
      const diff = to - from;
      this.add.text(COLUMN_LEFT, y, def.label, textStyle(this));
      this.add
        .text(COLUMN_LEFT + 136, y, `${from} > ${to}`, textStyle(this, { color: to <= 20 ? RED : COLORS.text }))
        .setOrigin(1, 0);
      if (diff !== 0) {
        this.add.text(COLUMN_LEFT + 144, y, diff > 0 ? `+${diff}` : `-${-diff}`, textStyle(this, { color: diff > 0 ? COLORS.choice : RED }));
      }
    });
  }

  /** One row per advisor whose loyalty moved: their name and how they feel now, coloured by the direction. */
  private councilColumn(top: number, before: Snapshot, after: Snapshot): void {
    this.add.text(COLUMN_RIGHT, top, 'Рада', textStyle(this, { color: COLORS.muted }));
    const def = council(this);
    const isTrue = (name: string): boolean => Boolean(GameState.get(name));
    const moved = activeAdvisors(def, isTrue).filter((id) => (after[`loy_${id}`] ?? 0) !== (before[`loy_${id}`] ?? 0));
    if (moved.length === 0) {
      this.add.text(COLUMN_RIGHT, top + ROW + 4, 'Ніхто не змінив думки.', textStyle(this));
      return;
    }
    moved.forEach((id, i) => {
      const y = top + (i + 1) * ROW + 4;
      const value = after[`loy_${id}`] ?? 0;
      const rose = value > (before[`loy_${id}`] ?? 0);
      const name = findCharacter(this, id)?.name ?? id;
      this.add.text(COLUMN_RIGHT, y, name, textStyle(this));
      this.add
        .text(COLUMN_RIGHT + 232, y, loyaltyLevel(def, value).label, textStyle(this, { color: rose ? COLORS.choice : RED }))
        .setOrigin(1, 0);
    });
  }
}
