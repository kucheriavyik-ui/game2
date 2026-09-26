import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem';
import { toMainMenu } from '../systems/GameFlow';
import { findChapter } from '../systems/LocationLoader';
import { SaveSystem } from '../systems/SaveSystem';
import { COLORS, textStyle } from '../ui/theme';

interface EndSceneData {
  /** The id from `# end_episode:<id>`; the epilogue is the Ink knot `ending_<id>`. */
  id: string;
}

/** Black-screen epilogue, one line at a time, then "end of episode". */
export class EndScene extends Phaser.Scene {
  private readonly dialogue = new DialogueSystem();
  private text!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private finished = false;

  constructor() {
    super('End');
  }

  create(data: EndSceneData): void {
    // The episode is over; the slot is cleared so the next launch starts fresh.
    SaveSystem.clear();

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#000000');

    this.text = this.add
      .text(width / 2, height / 2 - 12, '', textStyle(this, { align: 'center', wordWrap: { width: width - 80 } }))
      .setOrigin(0.5);
    this.hint = this.add
      .text(width / 2, height - 24, '> Space', textStyle(this, { color: COLORS.muted }))
      .setOrigin(0.5);

    this.finished = false;
    this.showNext(this.dialogue.start(`ending_${data.id}`));

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

  private showNext(line: { text: string } | null): void {
    if (line) {
      this.text.setText(line.text).setColor(COLORS.text);
      return;
    }
    this.finished = true;
    const chapter = findChapter(this, this.registry.get('chapter') as string | undefined);
    this.text.setText(`Кінець місяця ${chapter?.number ?? 1}`).setColor(COLORS.accent);
    this.hint.setText('Enter - до головного меню');
  }
}
