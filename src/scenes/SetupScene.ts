import Phaser from 'phaser';
import { DialogueSystem, type DialogueLine } from '../systems/DialogueSystem';
import { GameState } from '../systems/GameState';
import { Journal } from '../systems/Journal';
import { findCharacter, findMonth, RESOURCES_KEY, type MonthDef } from '../systems/LocationLoader';
import { councilLookup, startMonth, toMainMenu } from '../systems/MonthFlow';
import { DialogueBox, MAX_CHOICES } from '../ui/DialogueBox';
import { ResourceBar, type ResourceDef } from '../ui/ResourceBar';
import { COLORS, textStyle } from '../ui/theme';

interface SetupSceneData {
  /** Months whose councils are replayed, in order. */
  months: string[];
  /** The month that starts afterwards. */
  target: string;
}

const PAD = 12;

/**
 * Starting from a later month: the council tables of every earlier month are
 * played back to back on a black screen, in the usual dialogue box, so the
 * player chooses the past with the very options the game would have offered
 * (Knowledge of those months counts as learned, so the hidden ones show too).
 * Ink applies the consequences as it always does; after each council the
 * month's `ink_end` knot runs silently for its upkeep and flags. Talks and
 * betrayals of the skipped months do not happen.
 */
export class SetupScene extends Phaser.Scene {
  private readonly dialogue = new DialogueSystem();
  private box!: DialogueBox;
  private resources!: ResourceBar;
  private header!: Phaser.GameObjects.Text;
  private current: DialogueLine | null = null;
  private queue: string[] = [];
  private target = '';
  private month: MonthDef | null = null;

  constructor() {
    super('Setup');
  }

  create(data: SetupSceneData): void {
    this.cameras.main.setBackgroundColor('#000000');
    this.registry.set('music', 'infirmary');
    this.current = null;
    this.queue = [...data.months];
    this.target = data.target;

    this.header = this.add.text(PAD, PAD, '', textStyle(this, { fontSize: '16px', color: COLORS.accent }));
    this.add.text(PAD, PAD + 22, 'Що вирішила рада? Оберіть, як усе було.', textStyle(this, { color: COLORS.muted }));
    this.add.text(PAD, PAD + 36, 'Esc - до головного меню', textStyle(this, { color: COLORS.muted }));
    this.box = new DialogueBox(this);
    this.resources = new ResourceBar(this, (this.cache.json.get(RESOURCES_KEY) ?? []) as ResourceDef[]);
    this.resources.refresh((name) => GameState.num(name), false);

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is not available');
    const once = (fn: () => void) => (event: KeyboardEvent) => {
      if (!event.repeat) fn();
    };
    keyboard.on('keydown-SPACE', once(() => this.advance()));
    keyboard.on('keydown-ENTER', once(() => this.advance()));
    (['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'] as const).slice(0, MAX_CHOICES).forEach((name, i) => {
      keyboard.on(`keydown-${name}`, once(() => this.choose(i)));
    });
    keyboard.on('keydown-ESC', once(() => toMainMenu(this)));

    this.nextCouncil();
  }

  private nextCouncil(): void {
    const id = this.queue.shift();
    if (!id) {
      startMonth(this, this.target);
      return;
    }
    const month = findMonth(this, id);
    if (!month) throw new Error(`Unknown month "${id}"`);
    this.month = month;
    this.header.setText(`Місяць ${month.number} · ${month.title}`);
    let line = this.dialogue.start(month.ink_council);
    // A council knot opens by asking whether to begin («Так, починаймо» / «Ще ні»); here the answer is always yes.
    if (line && line.choices.length > 0 && !line.tags.includes('council_open')) line = this.dialogue.choose(0);
    this.showLine(line);
  }

  private advance(): void {
    if (!this.current || this.current.choices.length > 0) return;
    this.showLine(this.dialogue.next());
  }

  private choose(index: number): void {
    if (!this.current || index >= this.current.choices.length) return;
    this.showLine(this.dialogue.choose(index));
  }

  private showLine(line: DialogueLine | null): void {
    this.resources.refresh((name) => GameState.num(name), true);
    this.current = line;
    if (line) {
      this.handleTags(line.tags);
      this.box.show(line, findCharacter(this, line.speaker), councilLookup(this));
      return;
    }
    this.handleTags(this.dialogue.leftoverTags);
    this.box.hide();
    if (this.month) this.runSilently(this.month.ink_end);
    this.nextCouncil();
  }

  /** Only the journal matters here; `month_end` is implied and a defeat cannot happen in the past. */
  private handleTags(tags: readonly string[]): void {
    for (const tag of tags) {
      const [key, value] = tag.split(':').map((s) => s.trim());
      if (key === 'journal' && value) Journal.add(value);
    }
  }

  /** Plays a knot to the end without showing it (the month's upkeep and consequence flags). */
  private runSilently(knot: string): void {
    const dialogue = new DialogueSystem();
    let line = dialogue.start(knot);
    while (line) line = line.choices.length > 0 ? dialogue.choose(0) : dialogue.next();
  }
}
