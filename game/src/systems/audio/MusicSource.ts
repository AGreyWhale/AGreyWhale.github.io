/** A looping piece of music that can fade in and out. */
export interface MusicSource {
  readonly output: AudioNode;
  start(fadeSeconds: number): void;
  /** Fades out, then releases its nodes. */
  stop(fadeSeconds: number): void;
}

/** Plays a looping audio file (for properly licensed tracks dropped into assets/audio). */
export class FileTrack implements MusicSource {
  readonly output: GainNode;
  private readonly el: HTMLAudioElement;

  constructor(
    private readonly ctx: AudioContext,
    url: string,
  ) {
    this.output = ctx.createGain();
    this.output.gain.value = 0;
    this.el = new Audio(url);
    this.el.loop = true;
    this.el.preload = 'auto';
    ctx.createMediaElementSource(this.el).connect(this.output);
  }

  start(fade: number): void {
    void this.el.play().catch(() => undefined);
    const t = this.ctx.currentTime;
    this.output.gain.setValueAtTime(0, t);
    this.output.gain.linearRampToValueAtTime(1, t + fade);
  }

  stop(fade: number): void {
    const t = this.ctx.currentTime;
    this.output.gain.cancelScheduledValues(t);
    this.output.gain.setValueAtTime(this.output.gain.value, t);
    this.output.gain.linearRampToValueAtTime(0, t + fade);
    window.setTimeout(() => {
      this.el.pause();
      this.output.disconnect();
    }, fade * 1000 + 100);
  }
}
