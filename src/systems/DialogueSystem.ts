import { GameState } from './GameState';

/** One screen of dialogue: a line of text, who says it, and any choices after it. */
export interface DialogueLine {
  speaker: string;
  portrait: string;
  text: string;
  choices: string[];
  /** Tags of each choice, same order (`stance:shtarn:for`). */
  choiceTags: string[][];
  /** Raw tags of this line (and of tag-only lines just before it), e.g. `journal:k_timber`. */
  tags: string[];
}

const DEFAULT_SPEAKER = 'protector';

/**
 * Plays a knot to the end with nobody watching: the month's summary knot, or a
 * skipped month's end when starting later. A knot that asks takes its first option.
 */
export function playThrough(knot: string): { lines: string[]; tags: string[] } {
  const dialogue = new DialogueSystem();
  const lines: string[] = [];
  const tags: string[] = [];
  let line = dialogue.start(knot);
  while (line) {
    tags.push(...line.tags);
    if (line.text) lines.push(line.text);
    line = line.choices.length > 0 ? dialogue.choose(0) : dialogue.next();
  }
  tags.push(...dialogue.leftoverTags);
  return { lines, tags };
}

/**
 * Runs Ink knots as conversations. Speaker and portrait tags are "sticky":
 * once set they apply to following lines until changed, so writers only tag
 * lines where the speaker or expression changes.
 */
export class DialogueSystem {
  private speaker = DEFAULT_SPEAKER;
  private portrait = `${DEFAULT_SPEAKER}_neutral`;
  private active = false;
  /** Tags from lines with no text, waiting for the next line that has some. */
  private carried: string[] = [];
  private leftover: string[] = [];

  get isActive(): boolean {
    return this.active;
  }

  /**
   * Tags that came after the last line of text (`# month_end` on its own line
   * at the end of a knot). Read them once `next()` has returned null.
   */
  get leftoverTags(): readonly string[] {
    return this.leftover;
  }

  /** Jump to a knot and return its first line, or null if it has no content. */
  start(knot: string): DialogueLine | null {
    this.speaker = DEFAULT_SPEAKER;
    this.portrait = `${DEFAULT_SPEAKER}_neutral`;
    this.active = true;
    this.carried = [];
    this.leftover = [];
    GameState.story.ChoosePathString(knot);
    return this.advance();
  }

  /** Show the next line, or null when the conversation is over. */
  next(): DialogueLine | null {
    return this.advance();
  }

  /** Pick one of the choices offered by the last line, then continue. */
  choose(index: number): DialogueLine | null {
    const story = GameState.story;
    if (index < 0 || index >= story.currentChoices.length) return this.advance();
    story.ChooseChoiceIndex(index);
    return this.advance();
  }

  private advance(): DialogueLine | null {
    const story = GameState.story;

    while (story.canContinue) {
      const text = (story.Continue() ?? '').trim();
      const tags = [...this.carried, ...(story.currentTags ?? [])];
      this.applyTags(story.currentTags ?? []);
      if (text.length === 0) {
        this.carried = tags; // tag-only line: keep its tags for the next line
        continue;
      }
      this.carried = [];
      return this.line(text, story.canContinue, tags);
    }

    // No text left but choices are pending (e.g. a knot that opens with choices).
    if (story.currentChoices.length > 0) {
      const tags = this.carried;
      this.carried = [];
      return this.line('', false, tags);
    }

    this.leftover = this.carried;
    this.carried = [];
    this.active = false;
    return null;
  }

  private line(text: string, more: boolean, tags: string[]): DialogueLine {
    const choices = more ? [] : GameState.story.currentChoices;
    return {
      speaker: this.speaker,
      portrait: this.portrait,
      text,
      choices: choices.map((c) => c.text),
      choiceTags: choices.map((c) => c.tags ?? []),
      tags,
    };
  }

  private applyTags(tags: string[]): void {
    for (const tag of tags) {
      const [key, value] = tag.split(':', 2).map((s) => s.trim());
      if (!value) continue;
      if (key === 'speaker') {
        this.speaker = value;
        this.portrait = `${value}_neutral`;
      } else if (key === 'portrait') {
        this.portrait = value;
      }
    }
  }
}
