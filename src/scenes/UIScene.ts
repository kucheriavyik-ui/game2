import Phaser from 'phaser';
import { DialogueSystem, type DialogueLine } from '../systems/DialogueSystem';
import { GameState } from '../systems/GameState';
import { Journal, type JournalDefs } from '../systems/Journal';
import { council, findCharacter, isOut, JOURNAL_KEY, RESOURCES_KEY, seatedAdvisors } from '../systems/LocationLoader';
import { councilLookup, finishMonth, gameOver } from '../systems/MonthFlow';
import { DialogueBox } from '../ui/DialogueBox';
import { bindDialogueKeys } from '../ui/dialogueKeys';
import { JournalPanel, type JournalTab } from '../ui/JournalPanel';
import { ResourceBar, type ResourceDef } from '../ui/ResourceBar';
import { COLORS, textStyle } from '../ui/theme';

/**
 * Overlay scene that runs on top of the world. Owns the dialogue box, the
 * resource bars and the journal, drives conversations and reacts to Ink tags:
 *   # journal:<id>     — journal entry (and, for Knowledge, sets the Ink VAR)
 *   # council_open     — the conversation is now the council: dim the world, show the banner
 *   # month_end        — when the conversation ends, the month ends
 *   # game_over:<id>   — when the conversation ends, the city falls
 * Talks to the world through game-wide events:
 *   'dialogue:start' (knot)       — world asks to run a knot
 *   'ui:lock' (locked: boolean)   — UI opened/closed; world freezes the player while locked
 *   'ui:journal' (tab)            — the pause menu asks to open the journal on a tab
 */
export class UIScene extends Phaser.Scene {
  private readonly dialogue = new DialogueSystem();
  private box!: DialogueBox;
  private journalPanel!: JournalPanel;
  private resources!: ResourceBar;
  private councilLayer!: Phaser.GameObjects.Container;
  private toast!: Phaser.GameObjects.Text;
  private current: DialogueLine | null = null;
  private monthEnds = false;
  private defeat: string | null = null;

  constructor() {
    super('UI');
  }

  create(): void {
    const { width, height } = this.scale;
    this.councilLayer = this.add
      .container(0, 0, [
        this.add.rectangle(0, 0, width, height, 0x0b0a0a, 0.6).setOrigin(0),
        // Left of the resource bars, which stay visible over the dimmed world.
        this.add.text(12, 30, 'РАДА КОРВЕНА', textStyle(this, { fontSize: '16px', color: COLORS.accent })),
      ])
      .setDepth(100)
      .setVisible(false);
    this.box = new DialogueBox(this);
    this.journalPanel = new JournalPanel(this);
    this.resources = new ResourceBar(this, (this.cache.json.get(RESOURCES_KEY) ?? []) as ResourceDef[]);
    this.refreshResources(false);
    // The analytics tavern has no city to keep: the bars stay hidden there.
    if (this.registry.get('month') === 'analytics') this.resources.toggle();
    this.toast = this.add
      .text(width / 2, 4, '', textStyle(this, { color: COLORS.accent }))
      .setOrigin(0.5, 0)
      .setDepth(250)
      .setAlpha(0);

    // Phaser reuses the scene object when the UI is launched again (next month,
    // after the main menu), so state from before must be cleared here.
    this.current = null;
    this.monthEnds = false;
    this.defeat = null;
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
    bindDialogueKeys(this, { advance: () => this.advance(), choose: (i) => this.choose(i) });
    keyboard.on('keydown-J', once(() => this.toggleJournal()));
    keyboard.on('keydown-R', once(() => this.resources.toggle()));
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
    this.monthEnds = false;
    this.defeat = null;
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
    // Choices change resources in Ink; the bars catch up after every step.
    this.refreshResources(true);
    this.current = line;
    if (line) {
      this.handleTags(line.tags);
      this.box.show(line, findCharacter(this, line.speaker), councilLookup(this));
      return;
    }

    this.handleTags(this.dialogue.leftoverTags);
    this.box.hide();
    this.councilLayer.setVisible(false);
    if (this.defeat) {
      gameOver(this, this.defeat);
      return;
    }
    if (this.monthEnds) {
      finishMonth(this);
      return;
    }
    this.game.events.emit('ui:lock', false);
  }

  /** Engine-facing Ink tags. `speaker` and `portrait` are handled by DialogueSystem, `stance` by DialogueBox. */
  private handleTags(tags: readonly string[]): void {
    for (const tag of tags) {
      const [key, value] = tag.split(':').map((s) => s.trim());
      if (key === 'journal' && value) {
        if (Journal.add(value)) this.showToast('Новий запис у журналі · J');
      } else if (key === 'council_open') {
        this.councilLayer.setVisible(true);
      } else if (key === 'month_end') {
        this.monthEnds = true;
      } else if (key === 'game_over' && value) {
        this.defeat = value;
      }
    }
  }

  private refreshResources(announce: boolean): void {
    this.resources.refresh((name) => GameState.num(name), announce);
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
    const isTrue = (name: string): boolean => Boolean(GameState.get(name));
    this.journalPanel.show(
      {
        entryIds: Journal.ids,
        entries: (this.cache.json.get(JOURNAL_KEY) ?? {}) as JournalDefs,
        council: council(this),
        advisors: seatedAdvisors(council(this), isTrue),
        loyalty: (id) => GameState.num(`loy_${id}`),
        out: (id) => isOut(id, isTrue),
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
