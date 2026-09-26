import Phaser from 'phaser';
import { MAX_CHOICES } from './DialogueBox';

/** Keys that drive a conversation: Space/Enter go on, 1–6 pick an answer. Held keys do not repeat. */
export function bindDialogueKeys(scene: Phaser.Scene, handlers: { advance(): void; choose(index: number): void }): void {
  const keyboard = scene.input.keyboard;
  if (!keyboard) throw new Error('Keyboard input is not available');
  const once = (fn: () => void) => (event: KeyboardEvent) => {
    if (!event.repeat) fn();
  };
  keyboard.on('keydown-SPACE', once(() => handlers.advance()));
  keyboard.on('keydown-ENTER', once(() => handlers.advance()));
  (['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'] as const).slice(0, MAX_CHOICES).forEach((name, i) => {
    keyboard.on(`keydown-${name}`, once(() => handlers.choose(i)));
  });
}
