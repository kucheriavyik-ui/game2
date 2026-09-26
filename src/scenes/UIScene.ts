import Phaser from 'phaser';
import { DialogueSystem, type DialogueLine } from '../systems/DialogueSystem';
import { GameState } from '../systems/GameState';
import { Journal, type JournalDefs } from '../systems/Journal';
import { findCharacter, JOURNAL_KEY, PEOPLE_KEY, type PeopleDef } from '../systems/LocationLoader';
import { DialogueBox } from '../ui/DialogueBox';
import { JournalPanel, type JournalTab } from '../ui/JournalPanel';
import { COLORS, textStyle } from '../ui/theme';

/**
 * Overlay scene that runs on top of the world. Owns the dialogue box and the
 * journal, drives conversations and reacts to Ink tags. Talks to the world
 * through game-wide events:
 *   'dialogue:start' (knot)              — world asks to run a knot
 *   'ui:lock' (locked: boolean)          — UI opened/closed; world freezes the player while locked
 *   'world:goto' (location, spawn)       — an Ink `# goto:` tag asked for a location change
 *   'ui:journal' (tab)                   — the pause menu asks to open the journal on a tab
 */
export class UIScene extends Phaser.Scene {
  private readonly dialogue = new DialogueSystem();
  private box!: DialogueBox;
  private journalPanel!: JournalPanel;
  private toast!: Phaser.GameObjects.Text;
  private current: DialogueLine | null = null;
  private pendingGoto: { location: string; spawn: string } | null = null;
  private pendingEnding: string | null = null;

  constructor() {
    super('UI');
  }

  create(): void {
    this.box = new DialogueBox(this);
    this.journalPanel = new JournalPanel(this);
    this.toast = this.add
      .text(this.scale.width - 4, 4, '', textStyle(this, { color: COLORS.accent }))
      .setOrigin(1, 0)
      .setDepth(250)
      .setAlpha(0);

    // Phaser reuses the scene object when the UI is launched again (after the
    // main menu), so state from the previous game must be cleared here.
    this.current = null;
    this.pendingGoto = null;
    this.pendingEnding = null;
    this.game.events.on('dialogue:start', this.startDialogue, this);
    this.game.events.on('ui:journal', this.openJournal, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('dialogue:start', this.startDialogue, this);
      this.game.events.off('ui:journal', this.openJournal, this);
    });

    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is not available');
    // A held key repeats; acting on repeats skips lines and picks choices by accident.
    const once = (fn: () => void) => (event: KeyboardEvent) => {
      if (!event.repeat) fn();
    };
    keyboard.on('keydown-SPACE', once(() => this.advance()));
    keyboard.on('keydown-ENTER', once(() => this.advance()));
    (['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'] as const).forEach((name, i) => {
      keyboard.on(`keydown-${name}`, once(() => this.choose(i)));
    });
    keyboard.on('keydown-J', once(() => this.toggleJournal()));
    // Arrows/WASD page through the journal while it is open.
    keyboard.on('keydown', (event: KeyboardEvent) => {
      if (this.journalPanel.isOpen) this.journalPanel.handleKey(event.code);
    });
    // Esc closes the journal on release, for a press made while it was open
    // (same reason as in the pause menu: one press must not do two things).
    let escArmed = false;
    keyboard.on('keydown-ESC', () => {
      escArmed = this.journalPanel.isOpen;
    });
    keyboard.on('keyup-ESC', () => {
      if (escArmed && this.journalPanel.isOpen) this.closeJournal();
      escArmed = false;
    });
  }

  /** Whether a dialogue or the journal is on screen; the world checks this to never stay frozen by mistake. */
  get isBusy(): boolean {
    return this.current !== null || this.journalPanel.isOpen;
  }

  // --- Dialogue ---

  private startDialogue(knot: string): void {
    if (this.journalPanel.isOpen) return;
    this.game.events.emit('ui:lock', true);
    this.pendingGoto = null;
    this.pendingEnding = null;
    this.showLine(this.dialogue.start(knot));
  }

  private advance(): void {
    if (!this.current || this.current.choices.length > 0) return;
    this.showLine(this.dialogue.next());
  }

  private choose(index: number): void {
    if (!this.current || index >= this.current.choices.length) return;
    this.showLine(this.dialogue.choose(index));
  }

  private showLine(line: DialogueLine | null): void {
    this.current = line;
    if (!line) {
      this.box.hide();
      if (this.pendingEnding) {
        // The world is done; the epilogue takes over the whole screen.
        this.scene.stop('World');
        this.scene.start('End', { id: this.pendingEnding });
        return;
      }
      this.game.events.emit('ui:lock', false);
      if (this.pendingGoto) {
        const { location, spawn } = this.pendingGoto;
        this.pendingGoto = null;
        this.game.events.emit('world:goto', location, spawn);
      }
      return;
    }
    this.handleTags(line.tags);
    this.box.show(line, findCharacter(this, line.speaker));
  }

  /** Engine-facing Ink tags. `speaker` and `portrait` are handled by DialogueSystem. */
  private handleTags(tags: string[]): void {
    for (const tag of tags) {
      const [key, ...rest] = tag.split(':').map((s) => s.trim());
      if (key === 'journal' && rest[0] === 'add' && rest[1]) {
        if (Journal.add(rest[1])) this.showToast('Нова нитка · J');
      } else if (key === 'goto' && rest[0]) {
        this.pendingGoto = { location: rest[0], spawn: rest[1] ?? 'start' };
      } else if (key === 'end_episode' && rest[0]) {
        this.pendingEnding = rest[0];
      }
    }
  }

  private showToast(text: string): void {
    this.toast.setText(text).setAlpha(1);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 2000, duration: 400 });
  }

  // --- Journal ---

  private toggleJournal(): void {
    if (this.current || this.scene.isActive('Pause')) return; // not during a conversation or the pause menu
    if (this.journalPanel.isOpen) this.closeJournal();
    else this.openJournal();
  }

  private openJournal(tab?: JournalTab): void {
    this.journalPanel.show(
      {
        threadIds: Journal.ids,
        threads: (this.cache.json.get(JOURNAL_KEY) ?? {}) as JournalDefs,
        people: this.cache.json.get(PEOPLE_KEY) as PeopleDef | undefined,
        isTrue: (name) => Boolean(GameState.get(name)),
        character: (id) => findCharacter(this, id),
      },
      tab,
    );
    this.game.events.emit('ui:lock', true);
  }

  private closeJournal(): void {
    this.journalPanel.hide();
    this.game.events.emit('ui:lock', false);
  }
}
