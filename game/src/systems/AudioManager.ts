import { ambiencePresets, musicTracks } from '../content/audio';
import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import { FileTrack, type MusicSource } from './audio/MusicSource';
import { ProceduralAmbience } from './audio/ProceduralAmbience';
import type { SaveManager, ThemeMode } from './SaveManager';

export type Sfx = 'blip' | 'open' | 'close' | 'door' | 'collect' | 'success' | 'fail';

/**
 * Music + sound effects. Nothing is created until `unlock()` runs inside the
 * Start click, so there is never autoplay. Day and night variants crossfade.
 * Mute is remembered and suspends the AudioContext to save battery.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private current: MusicSource | null = null;
  private variant: ThemeMode | null = null;
  private _muted: boolean;

  constructor(
    private readonly save: SaveManager,
    private readonly bus: EventBus<GameEvents>,
  ) {
    this._muted = save.data.muted;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else if (!this._muted) void this.ctx.resume();
    });
  }

  get muted(): boolean {
    return this._muted;
  }

  /** Must be called from a user gesture (the Start button). */
  unlock(): void {
    if (this.ctx) return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = this._muted ? 0 : 1;
    this.master.connect(comp);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.55;
    this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.35;
    this.sfxBus.connect(this.master);
    if (this._muted) void ctx.suspend();
    else void ctx.resume();
  }

  /** Switches between day and night music with a crossfade. */
  setVariant(v: ThemeMode): void {
    if (!this.ctx || v === this.variant) return;
    const first = this.variant === null;
    this.variant = v;
    const url = musicTracks[v];
    const next: MusicSource = url ? new FileTrack(this.ctx, url) : new ProceduralAmbience(this.ctx, ambiencePresets[v]);
    next.output.connect(this.musicBus);
    next.start(first ? 3 : 2.5);
    this.current?.stop(2.5);
    this.current = next;
  }

  toggleMute(): void {
    this.setMuted(!this._muted);
  }

  setMuted(m: boolean): void {
    this._muted = m;
    this.save.update({ muted: m });
    this.bus.emit('audio:muted', m);
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    if (m) {
      this.master.gain.linearRampToValueAtTime(0, t + 0.25);
      window.setTimeout(() => this._muted && void ctx.suspend(), 300);
    } else {
      void ctx.resume().then(() => this.master.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.4));
    }
  }

  play(sfx: Sfx): void {
    const ctx = this.ctx;
    if (!ctx || this._muted || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const tone = (freq: number, at: number, dur: number, level: number, type: OscillatorType = 'sine', glideTo?: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq, at);
      if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, at + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(level, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g).connect(this.sfxBus);
      o.start(at);
      o.stop(at + dur + 0.05);
    };
    switch (sfx) {
      case 'blip':
        tone(660, t, 0.12, 0.4, 'sine', 990);
        break;
      case 'open':
        tone(784, t, 0.35, 0.3, 'triangle');
        tone(1175, t + 0.08, 0.45, 0.25, 'triangle');
        break;
      case 'close':
        tone(880, t, 0.25, 0.25, 'triangle', 600);
        break;
      case 'collect':
        [784, 988, 1319].forEach((f, i) => tone(f, t + i * 0.07, 0.3, 0.22, 'triangle'));
        break;
      case 'success':
        tone(659, t, 0.2, 0.25, 'triangle');
        tone(988, t + 0.1, 0.35, 0.25, 'triangle');
        break;
      case 'fail':
        tone(330, t, 0.3, 0.25, 'sine', 220);
        break;
      case 'door':
        tone(220, t, 0.25, 0.5, 'sine', 110);
        tone(523, t + 0.12, 0.4, 0.18, 'triangle');
        break;
    }
  }
}
