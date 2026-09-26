import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem';
import { startMonth, toMainMenu } from '../systems/MonthFlow';
import { COLORS, textStyle } from '../ui/theme';

interface StorySceneData {
  /** Knot to narrate line by line; null shows only the caption. */
  knot: string | null;
  /** Shown after the last line, before returning to the main menu. */
  caption?: string;
}

/**
 * Text on a black screen, one line at a time: the prologue, a defeat, the end
 * of what is written. A `# goto:<month>` tag in the knot starts that month
 * afterwards; otherwise the caption is shown and Enter leads to the main menu.
 */
export class StoryScene extends Phaser.Scene {
  private readonly dialogue = new DialogueSystem();
  private text!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private finished = false;
  private gotoMonth: string | null = null;
  private caption = '';

  constructor() {
    super('Story');
  }

  create(data: StorySceneData): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#000000');
    this.finished = false;
    this.gotoMonth = null;
    this.caption = data.caption ?? 'Кінець';

    this.text = this.add
      .text(width / 2, height / 2 - 12, '', textStyle(this, { align: 'center', wordWrap: { width: width - 80 } }))
      .setOrigin(0.5);
    this.hint = this.add.text(width / 2, height - 24, '> Space', textStyle(this, { color: COLORS.muted })).setOrigin(0.5);

    this.showNext(data.knot ? this.dialogue.start(data.knot) : null);

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is not available');
    keyboard.on('keydown-SPACE', (e: KeyboardEvent) => !e.repeat && this.advance(), this);
    keyboard.on('keydown-ENTER', (e: KeyboardEvent) => !e.repeat && this.advance(), this);
  }

  private advance(): void {
    if (this.finished) {
      toMainMenu(this);
      return;
    }
    this.showNext(this.dialogue.next());
  }

  private showNext(line: { text: string; tags: string[] } | null): void {
    this.readTags(line ? line.tags : this.dialogue.leftoverTags);
    if (line) {
      this.text.setText(line.text).setColor(COLORS.text);
      return;
    }
    if (this.gotoMonth) {
      startMonth(this, this.gotoMonth);
      return;
    }
    this.finished = true;
    this.text.setText(this.caption).setColor(COLORS.accent);
    this.hint.setText('Enter - до головного меню');
  }

  private readTags(tags: readonly string[]): void {
    for (const tag of tags) {
      const [key, value] = tag.split(':').map((s) => s.trim());
      if (key === 'goto' && value) this.gotoMonth = value;
    }
  }
}
