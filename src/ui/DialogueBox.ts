import Phaser from 'phaser';
import type { DialogueLine } from '../systems/DialogueSystem';
import type { CharacterDef } from '../systems/LocationLoader';
import { AssetKeys } from '../systems/Assets';
import { COLORS, textStyle } from './theme';

/** Usual height; the box grows upwards when a long line plus choices would not fit. */
const BOX_HEIGHT = 96;
const PAD = 8;
const PORTRAIT_SIZE = 56;
const HINT_SPACE = 12;
/** Keys 1-4 pick an answer. */
export const MAX_CHOICES = 4;

const CHIP_SIZE = 11;
const CHIP_STEP = 13;
const STANCE_COLORS = { for: 0x3f7a4a, against: 0x8a3226, neutral: 0x4a4238 } as const;

interface Stance {
  id: string;
  position: keyof typeof STANCE_COLORS;
}

/** `stance:<advisor>:for|against|neutral` tags of one choice. */
function parseStances(tags: readonly string[]): Stance[] {
  const result: Stance[] = [];
  for (const tag of tags) {
    const [key, id, position] = tag.split(':').map((s) => s.trim());
    if (key !== 'stance' || !id || !position) continue;
    if (position === 'for' || position === 'against' || position === 'neutral') result.push({ id, position });
  }
  return result;
}

/**
 * Bottom-of-screen dialogue panel. The portrait is a placeholder frame
 * showing the character's colour and name; swapping in real portraits
 * only means drawing an image where the frame is now.
 */
export class DialogueBox {
  private readonly container: Phaser.GameObjects.Container;
  private readonly scene: Phaser.Scene;
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly portraitFill: Phaser.GameObjects.Rectangle;
  private readonly portraitImage: Phaser.GameObjects.Image;
  private readonly portraitLabel: Phaser.GameObjects.Text;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly choiceTexts: Phaser.GameObjects.Text[] = [];
  private readonly hint: Phaser.GameObjects.Text;
  private readonly textWidth: number;
  private readonly textX: number;
  private readonly portraitFrame: Phaser.GameObjects.Rectangle;
  /** Advisor stance chips next to the current choices; rebuilt for every line. */
  private chips: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const width = scene.scale.width;
    const top = scene.scale.height - BOX_HEIGHT;

    const bg = scene.add.rectangle(0, 0, width, BOX_HEIGHT, 0x14100e, 0.94).setOrigin(0);
    this.bg = bg;
    const border = scene.add.rectangle(0, 0, width, 1, 0x5a4a3a).setOrigin(0);

    const portraitFrame = scene.add
      .rectangle(PAD, PAD, PORTRAIT_SIZE, PORTRAIT_SIZE)
      .setOrigin(0)
      .setStrokeStyle(1, 0x8a7a66);
    this.portraitFill = scene.add
      .rectangle(PAD + 1, PAD + 1, PORTRAIT_SIZE - 2, PORTRAIT_SIZE - 2, 0x444444)
      .setOrigin(0);
    this.portraitImage = scene.add
      .image(PAD + PORTRAIT_SIZE / 2, PAD + PORTRAIT_SIZE / 2, '__DEFAULT')
      .setDisplaySize(PORTRAIT_SIZE - 2, PORTRAIT_SIZE - 2)
      .setVisible(false);
    this.portraitLabel = scene.add
      .text(PAD + PORTRAIT_SIZE / 2, PAD + PORTRAIT_SIZE / 2, '', textStyle(scene, { align: 'center' }))
      .setOrigin(0.5);

    const textX = PAD * 2 + PORTRAIT_SIZE;
    const textWidth = width - textX - PAD;
    this.textWidth = textWidth;
    this.textX = textX;
    // The speaker's name at twice the font's native size, so it reads as a heading.
    this.nameText = scene.add.text(textX, PAD, '', textStyle(scene, { color: COLORS.accent, fontSize: '16px' }));
    this.bodyText = scene.add.text(textX, PAD + 24, '', textStyle(scene, { wordWrap: { width: textWidth } }));
    for (let i = 0; i < MAX_CHOICES; i++) {
      this.choiceTexts.push(
        scene.add.text(textX, 0, '', textStyle(scene, { color: COLORS.choice, wordWrap: { width: textWidth } })),
      );
    }
    this.hint = scene.add
      .text(width - PAD, BOX_HEIGHT - PAD, '> Space', textStyle(scene, { color: COLORS.muted }))
      .setOrigin(1, 1);

    this.portraitFrame = portraitFrame;
    this.container = scene.add.container(0, top, [
      bg,
      border,
      portraitFrame,
      this.portraitFill,
      this.portraitImage,
      this.portraitLabel,
      this.nameText,
      this.bodyText,
      ...this.choiceTexts,
      this.hint,
    ]);
    this.container.setDepth(200).setVisible(false);
  }

  show(line: DialogueLine, character: CharacterDef | undefined, lookup: (id: string) => CharacterDef | undefined): void {
    const name = character?.name ?? line.speaker;
    const color = Phaser.Display.Color.HexStringToColor(character?.color ?? '#555555').color;

    this.portraitFill.setFillStyle(color);
    // Real art if drawn (falling back to the character's neutral face), else a
    // placeholder naming the expression the portrait will need, e.g. "smirk".
    // The character's own neutral face may have another name (Isolde's is "isolde_composed").
    const neutral = character?.portraits.neutral ?? `${line.speaker}_neutral`;
    const portraitKey = [
      AssetKeys.portrait(line.portrait),
      AssetKeys.portrait(neutral),
      AssetKeys.portrait(`${line.speaker}_neutral`),
    ].find((k) => this.scene.textures.exists(k));
    const expression = line.portrait.startsWith(`${line.speaker}_`)
      ? line.portrait.slice(line.speaker.length + 1)
      : line.portrait;
    if (portraitKey) {
      this.portraitImage.setTexture(portraitKey).setDisplaySize(PORTRAIT_SIZE - 2, PORTRAIT_SIZE - 2).setVisible(true);
      this.portraitLabel.setVisible(false);
    } else {
      this.portraitImage.setVisible(false);
      // Placeholder until portraits are drawn: who is speaking, and the mood the art will need.
      const who = character?.short ?? name;
      this.portraitLabel.setText(expression === 'neutral' ? who : `${who}\n${expression}`).setVisible(true);
    }
    this.nameText.setText(name);
    // A character with no name is the narrator: no portrait, no heading, the text runs full width.
    const narration = name === '';
    this.portraitFrame.setVisible(!narration);
    this.portraitFill.setVisible(!narration);
    this.nameText.setVisible(!narration);
    if (narration) {
      this.portraitImage.setVisible(false);
      this.portraitLabel.setVisible(false);
    }
    const textX = narration ? PAD : this.textX;
    const textWidth = narration ? this.scene.scale.width - PAD * 2 : this.textWidth;
    this.bodyText.setPosition(textX, narration ? PAD + 4 : PAD + 24).setWordWrapWidth(textWidth).setColor(narration ? COLORS.muted : COLORS.text);
    this.bodyText.setText(line.text);
    for (const t of this.choiceTexts) t.setX(textX);

    for (const chip of this.chips) chip.destroy();
    this.chips = [];
    let anyStance = false;
    let y = this.bodyText.y + this.bodyText.height + 6;
    this.choiceTexts.forEach((t, i) => {
      const choice = line.choices[i];
      t.setVisible(choice !== undefined);
      if (choice === undefined) return;
      const stances = parseStances(line.choiceTags[i] ?? []);
      if (stances.length > 0) anyStance = true;
      const chipsWidth = stances.length * CHIP_STEP;
      t.setWordWrapWidth(textWidth - (chipsWidth > 0 ? chipsWidth + 6 : 0));
      t.setText(`${i + 1}. ${choice}`);
      t.setY(y);
      this.addChips(stances, y, lookup);
      y += Math.max(t.height, stances.length > 0 ? CHIP_SIZE : 0) + 3;
    });

    // With choices on screen the hint line explains the stance chips instead of "> Space".
    const showHint = line.choices.length === 0 || anyStance;
    this.hint.setText(line.choices.length === 0 ? '> Space' : 'зелене - за, червоне - проти');
    this.hint.setVisible(showHint);
    this.fit(y, showHint);
    this.container.setVisible(true);
  }

  /** Grows the box upwards so text ending at `contentBottom` (box coordinates) fits. */
  private fit(contentBottom: number, withHint: boolean): void {
    const needed = Math.max(PAD + PORTRAIT_SIZE, contentBottom) + PAD + (withHint ? HINT_SPACE : 0);
    const height = Math.ceil(Math.max(BOX_HEIGHT, needed));
    this.bg.setSize(this.scene.scale.width, height);
    this.hint.setY(height - PAD);
    this.container.setY(this.scene.scale.height - height);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  /** Right-aligned row of chips at the height of a choice: the advisor's initial on the colour of their stance. */
  private addChips(stances: Stance[], y: number, lookup: (id: string) => CharacterDef | undefined): void {
    const right = this.scene.scale.width - PAD;
    const present = stances.filter((s) => lookup(s.id) !== undefined);
    present.forEach((stance, i) => {
      const character = lookup(stance.id);
      const x = right - (present.length - i) * CHIP_STEP + (CHIP_STEP - CHIP_SIZE);
      const box = this.scene.add.rectangle(x, y, CHIP_SIZE, CHIP_SIZE, STANCE_COLORS[stance.position]).setOrigin(0);
      const letter = this.scene.add
        .text(x + CHIP_SIZE / 2, y + CHIP_SIZE / 2 + 1, (character?.short ?? character?.name ?? stance.id).charAt(0), textStyle(this.scene))
        .setOrigin(0.5);
      this.container.add([box, letter]);
      this.chips.push(box, letter);
    });
  }
}
