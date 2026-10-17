import type { AmbiencePreset } from '../../content/audio';
import type { MusicSource } from './MusicSource';

const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

/**
 * Generates calm lo-fi ambience live with WebAudio: soft pad chords, sparse
 * pentatonic plucks through a dotted-eighth echo, an optional brushed beat,
 * and quiet vinyl crackle. Uses a look-ahead scheduler, so timing stays tight
 * even if the main thread is busy.
 */
export class ProceduralAmbience implements MusicSource {
  readonly output: GainNode;
  private readonly tone: BiquadFilterNode;
  private readonly pluckBus: GainNode;
  private readonly beatBus: GainNode;
  private readonly noise: AudioBuffer;
  private crackle: AudioBufferSourceNode | null = null;
  private timer = 0;
  private nextTime = 0;
  private step = 0;
  private lastNote = 2;

  constructor(
    private readonly ctx: AudioContext,
    private readonly p: AmbiencePreset,
    private readonly rand: () => number = Math.random,
  ) {
    this.output = ctx.createGain();
    this.output.gain.value = 0;

    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.tone.frequency.value = p.filterHz;
    this.tone.Q.value = 0.4;
    this.tone.connect(this.output);

    // Plucks go dry into the tone filter and through a feedback echo.
    this.pluckBus = ctx.createGain();
    this.pluckBus.connect(this.tone);
    const delay = ctx.createDelay(2);
    delay.delayTime.value = (60 / p.bpm) * 0.75;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.33;
    const wet = ctx.createGain();
    wet.gain.value = 0.4;
    this.pluckBus.connect(delay);
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(this.tone);

    this.beatBus = ctx.createGain();
    this.beatBus.gain.value = 0.9;
    this.beatBus.connect(this.output);

    this.noise = this.makeNoise(1);
  }

  start(fade: number): void {
    const t = this.ctx.currentTime;
    this.nextTime = t + 0.1;
    this.step = 0;
    this.output.gain.setValueAtTime(0, t);
    this.output.gain.linearRampToValueAtTime(1, t + fade);
    this.startCrackle();
    this.schedule();
    this.timer = window.setInterval(this.schedule, 80);
  }

  stop(fade: number): void {
    const t = this.ctx.currentTime;
    this.output.gain.cancelScheduledValues(t);
    this.output.gain.setValueAtTime(this.output.gain.value, t);
    this.output.gain.linearRampToValueAtTime(0, t + fade);
    window.setTimeout(() => {
      window.clearInterval(this.timer);
      this.crackle?.stop();
      this.output.disconnect();
    }, fade * 1000 + 300);
  }

  private schedule = (): void => {
    const eighth = 60 / this.p.bpm / 2;
    while (this.nextTime < this.ctx.currentTime + 0.5) {
      this.playStep(this.step, this.nextTime, eighth);
      this.nextTime += eighth;
      this.step++;
    }
  };

  private playStep(step: number, t0: number, eighth: number): void {
    const pos = step % 8;
    const bar = Math.floor(step / 8);
    const t = pos % 2 === 1 ? t0 + eighth * 0.14 : t0; // gentle swing

    if (pos === 0) this.pad(this.p.chords[bar % this.p.chords.length], t, eighth * 8);

    if (this.p.beat) {
      if (pos === 0 || (pos === 5 && this.rand() < 0.35)) this.kick(t);
      if (pos === 2 || pos === 6) this.brush(t);
      this.hat(t, pos % 2 === 0 ? 0.035 : 0.018);
    }

    const chance = pos === 0 ? this.p.pluckChance * 1.4 : this.p.pluckChance;
    if (this.rand() < chance) {
      // Random walk over the scale keeps the melody smooth.
      const scale = this.p.melody;
      const move = Math.round((this.rand() - 0.5) * 4);
      this.lastNote = Math.min(scale.length - 1, Math.max(0, this.lastNote + move));
      this.pluck(scale[this.lastNote], t);
    }
  }

  private pad(notes: number[], t: number, dur: number): void {
    const level = this.p.padLevel;
    for (const n of notes) {
      for (const [type, detune] of [
        ['sine', -6],
        ['triangle', 6],
      ] as const) {
        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = midiHz(n);
        osc.detune.value = detune;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(level * (type === 'sine' ? 1 : 0.5), t + 1.2);
        g.gain.setTargetAtTime(0, t + dur, 0.6);
        osc.connect(g).connect(this.tone);
        osc.start(t);
        osc.stop(t + dur + 3);
      }
    }
  }

  private pluck(n: number, t: number): void {
    const osc = this.ctx.createOscillator();
    osc.type = this.p.pluckWave ?? 'triangle';
    osc.frequency.value = midiHz(n);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(this.p.pluckLevel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    osc.connect(g).connect(this.pluckBus);
    osc.start(t);
    osc.stop(t + 1.5);
  }

  private kick(t: number): void {
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(g).connect(this.beatBus);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  private brush(t: number): void {
    this.noiseHit(t, 'bandpass', 1900, 0.07, 0.16);
  }

  private hat(t: number, level: number): void {
    this.noiseHit(t, 'highpass', 7200, level, 0.045);
  }

  private noiseHit(t: number, type: BiquadFilterType, freq: number, level: number, decay: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(f).connect(g).connect(this.beatBus);
    src.start(t, this.rand() * 0.5);
    src.stop(t + decay + 0.02);
  }

  private startCrackle(): void {
    const len = this.ctx.sampleRate * 3;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (this.rand() * 2 - 1) * 0.04 + (this.rand() < 0.0004 ? (this.rand() * 2 - 1) * 0.9 : 0);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 3200;
    const g = this.ctx.createGain();
    g.gain.value = 0.06;
    src.connect(f).connect(g).connect(this.output);
    src.start();
    this.crackle = src;
  }

  private makeNoise(seconds: number): AudioBuffer {
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * seconds), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = this.rand() * 2 - 1;
    return buf;
  }
}
