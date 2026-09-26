import Phaser from 'phaser';
import { musicUrl } from '../systems/Assets';
import { Settings } from '../systems/Settings';
import { COLORS, textStyle } from '../ui/theme';

const FADE_MS = 1500;

/** Settings volume 0..10 → sound volume; 5 (the default) is the old fixed 0.3. */
const volumeFromSettings = (): number => (Settings.get().musicVolume / 10) * 0.6;

/**
 * Background music. Lives for the whole game and never restarts, so tracks
 * survive location changes and the end screen. Other scenes only say which
 * track they want: `this.registry.set('music', 'port')` (or null for silence).
 * Tracks load lazily on first use and cross-fade; M toggles mute.
 */
export class MusicScene extends Phaser.Scene {
  private current: Phaser.Sound.BaseSound | null = null;
  private currentKey: string | null = null;
  private loading = false;
  private hint!: Phaser.GameObjects.Text;
  /**
   * Own copy of the mute state: with Web Audio, `sound.mute` reads the gain node,
   * which only updates once the audio thread catches up, so quick toggles misread it.
   */
  private muted = false;

  constructor() {
    super('Music');
  }

  create(): void {
    if (import.meta.env.DEV) (window as unknown as { __music: MusicScene }).__music = this;
    this.muted = !Settings.get().musicOn;
    this.sound.mute = this.muted;
    Settings.onChange((s) => {
      if (this.muted !== !s.musicOn) {
        this.muted = !s.musicOn;
        this.sound.mute = this.muted;
      }
      if (this.current) {
        this.tweens.killTweensOf(this.current);
        (this.current as Phaser.Sound.WebAudioSound).setVolume(volumeFromSettings());
      }
    });
    this.hint = this.add
      .text(this.scale.width / 2, 4, '', textStyle(this, { color: COLORS.muted }))
      .setOrigin(0.5, 0)
      .setDepth(1000)
      .setAlpha(0);

    // Phaser emits only `setdata` (not `changedata`) the first time a key is written,
    // so make sure the key exists before listening for changes to it.
    if (!this.registry.has('music')) this.registry.set('music', null);
    this.registry.events.on('changedata-music', (_parent: unknown, value: string | null) => this.switchTo(value));
    this.switchTo((this.registry.get('music') as string | null | undefined) ?? null);

    this.input.keyboard?.on('keydown-M', (event: KeyboardEvent) => {
      if (!event.repeat) this.toggleMute();
    });

    // Watchdog: whatever went wrong on the way (a lost event, a suspended audio
    // context, a load that finished for a track no longer wanted), once a second
    // make sure the wanted track is actually playing.
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.ensurePlaying() });
  }

  private ensurePlaying(): void {
    if (!this.currentKey || this.loading || this.sound.locked) return;
    if (!this.current) {
      if (this.cache.audio.exists(`music:${this.currentKey}`)) this.start(this.currentKey);
      return;
    }
    if (!this.current.isPlaying) this.current.play();
  }

  private switchTo(key: string | null): void {
    if (key === this.currentKey) return;
    this.currentKey = key;
    this.fadeOut();
    if (!key) return;

    const cacheKey = `music:${key}`;
    if (this.cache.audio.exists(cacheKey)) {
      this.start(key);
      return;
    }
    const url = musicUrl(key);
    if (!url) {
      console.warn(`No music track "${key}" in manifest.json`);
      return;
    }
    this.loading = true;
    this.load.audio(cacheKey, url);
    this.load.once(`filecomplete-audio-${cacheKey}`, () => this.start(key));
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.loading = false;
    });
    this.load.start();
  }

  private start(key: string): void {
    if (key !== this.currentKey || this.current) return; // moved on while loading, or already playing
    // Browsers keep audio locked until the first key press or click.
    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => this.start(key));
      return;
    }
    const track = this.sound.add(`music:${key}`, { loop: true, volume: 0 });
    track.play();
    this.tweens.add({ targets: track, volume: volumeFromSettings(), duration: FADE_MS });
    this.current = track;
  }

  private fadeOut(): void {
    const old = this.current;
    this.current = null;
    if (!old) return;
    this.tweens.add({
      targets: old,
      volume: 0,
      duration: FADE_MS,
      onComplete: () => old.destroy(),
    });
  }

  private toggleMute(): void {
    Settings.update({ musicOn: this.muted });
    this.hint.setText(this.muted ? 'Музика вимкнена · M' : 'Музика увімкнена · M').setAlpha(1);
    this.tweens.killTweensOf(this.hint);
    this.tweens.add({ targets: this.hint, alpha: 0, delay: 1500, duration: 400 });
  }
}
