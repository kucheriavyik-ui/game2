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

/** Who backs and who opposes a choice, written out under it in these colours. */
const STANCE_FOR_COLOR = '#8fcf8a';
const STANCE_AGAINST_COLOR = '#e0826e';
const STANCE_INDENT = 16;

interface Stance {
  id: string;
  position: 'for' | 'against' | 'neutral';
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
  /** The speaker's seat or trade, small and muted after the name: "(Маршал оборони)". */
  private readonly roleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly choiceTexts: Phaser.GameObjects.Text[] = [];
  private readonly hint: Phaser.GameObjects.Text;
  private readonly textWidth: number;
  private readonly textX: number;
  private readonly portraitFrame: Phaser.GameObjects.Rectangle;
  /** "за: …  проти: …" lines under the current choices; rebuilt for every line. */
  private stanceTexts: Phaser.GameObjects.Text[] = [];

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
    this.roleText = scene.add.text(textX, PAD + 7, '', textStyle(scene, { color: COLORS.muted }));
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
      this.roleText,
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
    // The mood is the last part of the portrait id ("kopar_neutral" -> "neutral"), whatever the speaker's id.
    const expression = line.portrait.slice(line.portrait.lastIndexOf('_') + 1);
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
    this.roleText
      .setText(character?.role ? `(${character.role})` : '')
      .setPosition(this.nameText.x + this.nameText.width + 8, this.nameText.y + 7)
      .setVisible(!narration);
    if (narration) {
      this.portraitImage.setVisible(false);
      this.portraitLabel.setVisible(false);
    }
    const textX = narration ? PAD : this.textX;
    const textWidth = narration ? this.scene.scale.width - PAD * 2 : this.textWidth;
    this.bodyText.setPosition(textX, narration ? PAD + 4 : PAD + 24).setWordWrapWidth(textWidth).setColor(narration ? COLORS.muted : COLORS.text);
    this.bodyText.setText(line.text);
    for (const t of this.choiceTexts) t.setX(textX);

    for (const t of this.stanceTexts) t.destroy();
    this.stanceTexts = [];
    let y = this.bodyText.y + this.bodyText.height + 6;
    this.choiceTexts.forEach((t, i) => {
      const choice = line.choices[i];
      t.setVisible(choice !== undefined);
      if (choice === undefined) return;
      t.setWordWrapWidth(textWidth);
      t.setText(`${i + 1}. ${choice}`);
      t.setY(y);
      y += t.height + 2;
      y = this.addStances(parseStances(line.choiceTags[i] ?? []), textX + STANCE_INDENT, y, textWidth - STANCE_INDENT, lookup);
      y += 3;
    });

    const showHint = line.choices.length === 0;
    this.hint.setText('> Space');
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

  /**
   * "за: Штарн, Ферранте   проти: Тобіас" under a choice, by the advisors' short names.
   * "проти" moves to its own line when both do not fit. Returns the y below them.
   */
  private addStances(
    stances: Stance[],
    x: number,
    y: number,
    width: number,
    lookup: (id: string) => CharacterDef | undefined,
  ): number {
    const names = (position: Stance['position']): string =>
      stances
        .filter((s) => s.position === position)
        .map((s) => lookup(s.id))
        .filter((c): c is CharacterDef => c !== undefined)
        .map((c) => c.short ?? c.name)
        .join(', ');
    const parts = [
      { label: names('for'), prefix: 'за: ', color: STANCE_FOR_COLOR },
      { label: names('against'), prefix: 'проти: ', color: STANCE_AGAINST_COLOR },
    ].filter((p) => p.label !== '');
    if (parts.length === 0) return y;

    let cx = x;
    let rowHeight = 0;
    for (const part of parts) {
      const t = this.scene.add.text(0, 0, part.prefix + part.label, textStyle(this.scene, { color: part.color, wordWrap: { width } }));
      if (cx > x && cx + t.width > x + width) {
        y += rowHeight + 1;
        cx = x;
        rowHeight = 0;
      }
      t.setPosition(cx, y);
      this.container.add(t);
      this.stanceTexts.push(t);
      cx += t.width + 24;
      rowHeight = Math.max(rowHeight, t.height);
    }
    return y + rowHeight;
  }
}
