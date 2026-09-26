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

  get(name: string): unknown {
    return GameState.story.variablesState.$(name);
  },

  set(name: string, value: string | number | boolean): void {
    GameState.story.variablesState.$(name, value);
  },
};
