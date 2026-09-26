import { GameState } from './GameState';

/** One screen of dialogue: a line of text, who says it, and any choices after it. */
export interface DialogueLine {
  speaker: string;
  portrait: string;
  text: string;
  choices: string[];
  /** Raw tags of this line, for systems that react to e.g. `journal:add:...`. */
  tags: string[];
}

const DEFAULT_SPEAKER = 'protector';

/**
 * Runs Ink knots as conversations. Speaker and portrait tags are "sticky":
 * once set they apply to following lines until changed, so writers only tag
 * lines where the speaker or expression changes.
 */
export class DialogueSystem {
  private speaker = DEFAULT_SPEAKER;
  private portrait = `${DEFAULT_SPEAKER}_neutral`;
  private active = false;

  get isActive(): boolean {
    return this.active;
  }

  /** Jump to a knot and return its first line, or null if it has no content. */
  start(knot: string): DialogueLine | null {
    this.speaker = DEFAULT_SPEAKER;
    this.portrait = `${DEFAULT_SPEAKER}_neutral`;
    this.active = true;
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
      const tags = story.currentTags ?? [];
      this.applyTags(tags);
      if (text.length === 0) continue; // tag-only line, nothing to show

      const choices = story.canContinue ? [] : story.currentChoices.map((c) => c.text);
      return { speaker: this.speaker, portrait: this.portrait, text, choices, tags };
    }

    // No text left but choices are pending (e.g. a knot that opens with choices).
    if (story.currentChoices.length > 0) {
      return {
        speaker: this.speaker,
        portrait: this.portrait,
        text: '',
        choices: story.currentChoices.map((c) => c.text),
        tags: [],
      };
    }

    this.active = false;
    return null;
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
