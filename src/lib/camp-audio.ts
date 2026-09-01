/**
 * Base Camp audio: a chill, looping tribal groove and footstep sounds, all
 * synthesised live with the Web Audio API so the game ships no audio files.
 *
 * Everything is lazy: no AudioContext is created until the player turns the
 * sound on (browsers require a user gesture anyway).
 */

const PENTATONIC = [0, 3, 5, 7, 10]; // minor pentatonic — easy, "tribal" flavour
const ROOT = 196; // G3
const BPM = 72;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

const noteHz = (semitone: number) => ROOT * Math.pow(2, semitone / 12);

export class CampAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextBar = 0;
  private bar = 0;
  private noise: AudioBuffer | null = null;

  private left = false;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0;
      this.musicGain.connect(this.master);
      // One second of white noise, reused for drums, shaker and footsteps.
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    void this.ctx.resume();
    return this.ctx;
  }

  /** Short pitched tone — kalimba / wooden flute voice. */
  private tone(at: number, hz: number, dur: number, gain: number, type: OscillatorType) {
    const ctx = this.ctx;
    const out = this.musicGain;
    if (!ctx || !out) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  /** Hand drum: pitched thump with a touch of body. */
  private drum(at: number, hz: number, gain: number, dur = 0.35, dest: AudioNode | null = null) {
    const ctx = this.ctx;
    const out = dest ?? this.musicGain;
    if (!ctx || !out) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(hz * 2.2, at);
    osc.frequency.exponentialRampToValueAtTime(hz, at + 0.09);
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  /** Filtered noise burst — shaker, rim taps, footsteps. */
  private hiss(
    at: number,
    gain: number,
    dur: number,
    freq: number,
    dest: AudioNode | null = this.musicGain,
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !dest) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(filter).connect(g).connect(dest);
    src.start(at);
    src.stop(at + dur + 0.05);
  }

  /** Lay down one bar of the groove at the given context time. */
  private scheduleBar(at: number) {
    const b = this.bar;
    // Djembe pattern: deep on 1 and 3, slaps in between.
    this.drum(at, 82, 0.5);
    this.drum(at + BEAT * 1.5, 120, 0.28, 0.25);
    this.drum(at + BEAT * 2, 96, 0.4);
    this.drum(at + BEAT * 3.5, 150, 0.22, 0.2);
    // Shaker on every eighth, softer off-beats.
    for (let i = 0; i < 8; i++) {
      this.hiss(at + (BEAT / 2) * i, i % 2 === 0 ? 0.05 : 0.03, 0.07, 6500);
    }
    // Drone fifth underneath, one per bar.
    this.tone(at, ROOT / 2, BAR, 0.05, "triangle");
    this.tone(at, noteHz(7) / 2, BAR, 0.035, "triangle");
    // Lazy pentatonic melody — a few notes per bar, shifting every cycle.
    const steps = [0, 1.5, 2.5, 3];
    steps.forEach((s, i) => {
      const idx = (b * 2 + i * 3) % PENTATONIC.length;
      const oct = (b + i) % 3 === 0 ? 12 : 0;
      this.tone(at + BEAT * s, noteHz(PENTATONIC[idx]! + 12 + oct), 0.9, 0.09, "sine");
    });
    this.bar = (b + 1) % 8;
  }

  /** Fade the tribal loop in and keep it scheduled ahead of the clock. */
  startMusic() {
    const ctx = this.ensure();
    if (!ctx || !this.musicGain || this.timer) return;
    this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
    this.musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.5);
    this.nextBar = ctx.currentTime + 0.2;
    this.timer = setInterval(() => {
      const c = this.ctx;
      if (!c) return;
      while (this.nextBar < c.currentTime + 2) {
        this.scheduleBar(this.nextBar);
        this.nextBar += BAR;
      }
    }, 400);
  }

  stopMusic() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const ctx = this.ctx;
    if (ctx && this.musicGain) {
      this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
      this.musicGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2);
    }
  }

  /** Soft dragging noise sweep — the scuff of a sole over grit. */
  private scuff(at: number, gain: number, dur: number, from: number, to: number) {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.master) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.playbackRate.value = 0.6 + Math.random() * 0.5;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.6;
    filter.frequency.setValueAtTime(from, at);
    filter.frequency.exponentialRampToValueAtTime(to, at + dur);
    const g = ctx.createGain();
    // Soft swell instead of a click, then a long tail: that's the shuffle.
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(gain, at + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(at);
    src.stop(at + dur + 0.05);
  }

  /** A shuffling footfall: sole dragging over grit, then a soft body thump. */
  step() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const at = ctx.currentTime + 0.005;
    this.left = !this.left;
    // Alternating feet sound slightly different, so steps don't feel cloned.
    const tilt = this.left ? 1 : 0.82;
    const dur = 0.16 + Math.random() * 0.09;
    // Dragging scuff sweeping down as the foot settles.
    this.scuff(at, 0.075 * tilt, dur, (1500 + Math.random() * 600) * tilt, 480);
    // Faint high grit riding on top.
    this.scuff(at + 0.01, 0.028, dur * 0.7, 4200 + Math.random() * 800, 2200);
    // Weight settling — a very short, dull low thump.
    this.drum(at + dur * 0.45, 62 + Math.random() * 14, 0.07, 0.09, this.master);
  }

  /** Bright bell-ish blip used to build the pickup arpeggio. */
  private blip(at: number, hz: number, dur: number, gain: number, type: OscillatorType = "triangle") {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(this.master);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  /**
   * Item pickup: a quick two-note "ding-ding" rising a fifth, with a soft
   * sparkle of noise on top — Zelda-rupee energy, kept short and friendly.
   * `index` (how many you already have) nudges the pitch up so a run of
   * pickups sounds like a little climbing scale.
   */
  pickup(index = 0) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const at = ctx.currentTime + 0.005;
    const base = 784 * Math.pow(2, Math.min(index, 5) / 12); // G5 and up
    this.blip(at, base, 0.11, 0.16);
    this.blip(at + 0.085, base * 1.5, 0.22, 0.15);
    this.blip(at + 0.085, base * 3, 0.14, 0.05, "sine");
    // Airy sparkle tail.
    this.hiss(at + 0.06, 0.035, 0.2, 7200, this.master);
  }

  /** Quest complete: a bright four-note fanfare with a warm thump underneath. */
  questComplete() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const at = ctx.currentTime + 0.01;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((hz, i) => {
      this.blip(at + i * 0.11, hz, i === notes.length - 1 ? 0.6 : 0.2, 0.16);
      this.blip(at + i * 0.11, hz * 2, 0.12, 0.04, "sine");
    });
    this.drum(at, 90, 0.28, 0.4, this.master);
    this.hiss(at + 0.33, 0.05, 0.5, 6000, this.master);
  }

  /**
   * Zone transition: a shimmering swell — a wide low drum boom plus a slow
   * rising shimmer of bell tones and filtered noise. Distinct from footsteps
   * and pickups so the player instantly knows they've entered a new biome.
   */
  zoneEnter() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const at = ctx.currentTime + 0.01;
    // Deep boom — the "whoosh" of stepping through.
    this.drum(at, 70, 0.6, 0.32, this.master);
    // Rising shimmer: a quick arpeggio up a whole-tone scale.
    const shimmer = [392, 440, 494, 554, 622];
    shimmer.forEach((hz, i) => {
      this.blip(at + i * 0.05, hz, 0.5, 0.07, "sine");
    });
    // Airy noise sweep upward — the "wind through a portal" feel.
    this.scuff(at, 0.05, 0.6, 400, 6000);
  }

  /** Altitude-sickness countdown tick: a dry, urgent heartbeat + beep. */
  alarm(urgent = false) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const at = ctx.currentTime + 0.005;
    this.drum(at, urgent ? 96 : 74, 0.22, 0.18, this.master);
    this.blip(at, urgent ? 1100 : 760, 0.09, urgent ? 0.12 : 0.07, "square");
  }

  /** Cracking the oxygen bottle open: a hiss, then a warm settling chord. */
  oxygen() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const at = ctx.currentTime + 0.01;
    this.scuff(at, 0.09, 0.7, 5200, 900);
    [262, 330, 392, 523].forEach((hz, i) => this.blip(at + 0.18 + i * 0.06, hz, 0.6, 0.1, "sine"));
  }

  /** Blacking out at altitude: a sagging, sickly downward slide. */
  collapse() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const at = ctx.currentTime + 0.01;
    [523, 415, 311, 208, 140].forEach((hz, i) =>
      this.blip(at + i * 0.11, hz, 0.5, 0.14, "sawtooth"),
    );
    this.drum(at + 0.55, 54, 0.5, 0.6, this.master);
  }

  dispose() {
    this.stopMusic();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.noise = null;
  }
}
