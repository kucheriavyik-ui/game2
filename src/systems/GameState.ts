import { Story } from 'inkjs';

/**
 * The single source of truth for game state is the Ink story's variables.
 * This module only holds the Story instance and gives typed access to it.
 */
let story: Story | null = null;

export const GameState = {
  init(compiledStory: Record<string, unknown>): void {
    story = new Story(compiledStory);
  },

  get story(): Story {
    if (!story) throw new Error('GameState.init() must be called before use');
    return story;
  },

  /** Whether main.ink declares this VAR. */
  has(name: string): boolean {
    return GameState.story.variablesState.GlobalVariableExistsWithName(name);
  },

  /** A numeric VAR, 0 when missing. */
  num(name: string): number {
    return Number(GameState.get(name) ?? 0);
  },

  get(name: string): unknown {
    return GameState.story.variablesState.$(name);
  },

  set(name: string, value: string | number | boolean): void {
    GameState.story.variablesState.$(name, value);
  },
};
