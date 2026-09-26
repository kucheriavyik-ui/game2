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
/** Ordinary lines offer up to 3 answers; only the evidence hub of a confrontation uses more. */
export const MAX_CHOICES = 6;

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

  show(line: DialogueLine, character: CharacterDef | undefined): void {
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
      this.portraitLabel.setText(expression).setVisible(true);
    }
    this.nameText.setText(name);
    this.bodyText.setText(line.text);

    let y = this.bodyText.y + this.bodyText.height + 6;
    this.choiceTexts.forEach((t, i) => {
      const choice = line.choices[i];
      t.setVisible(choice !== undefined);
      if (choice === undefined) return;
      t.setText(`${i + 1}. ${choice}`);
      t.setY(y);
      y += t.height + 3;
    });

    const showHint = line.choices.length === 0;
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
}
