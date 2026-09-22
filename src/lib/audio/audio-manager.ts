/**
 * BOARD audio manager · Web Audio SFX + soft looping BGM.
 * Sounds are synthesized (no binary assets). Autoplay starts after unlock.
 *
 * Dice and pawn steps use filtered noise so they read as physical objects
 * (plastic on wood / token on felt), not pitched 8-bit beeps.
 */

export type SfxId =
  | "ui_click"
  | "ui_hover"
  | "dice_roll"
  | "pawn_step"
  | "buy"
  | "rent"
  | "capture"
  | "win"
  | "lose"
  | "deposit"
  | "error";

type SfxRecipe = {
  type: OscillatorType;
  freq: number;
  freqEnd?: number;
  duration: number;
  gain: number;
  delay?: number;
};

const SFX: Record<SfxId, SfxRecipe[]> = {
  ui_click: [
    { type: "square", freq: 880, duration: 0.03, gain: 0.07 },
    { type: "triangle", freq: 420, duration: 0.045, gain: 0.045, delay: 0.008 },
  ],
  ui_hover: [{ type: "triangle", freq: 520, duration: 0.04, gain: 0.12 }],
  // Preview only. Live rolls use startDiceRoll / finishDiceRoll.
  dice_roll: [],
  pawn_step: [],
  buy: [
    { type: "square", freq: 440, duration: 0.07, gain: 0.22 },
    { type: "square", freq: 660, duration: 0.09, gain: 0.2, delay: 0.05 },
  ],
  rent: [
    { type: "sawtooth", freq: 320, freqEnd: 160, duration: 0.16, gain: 0.18 },
  ],
  capture: [
    { type: "square", freq: 160, duration: 0.06, gain: 0.26 },
    {
      type: "square",
      freq: 120,
      freqEnd: 60,
      duration: 0.14,
      gain: 0.24,
      delay: 0.04,
    },
  ],
  win: [
    { type: "square", freq: 523, duration: 0.12, gain: 0.24 },
    { type: "square", freq: 659, duration: 0.12, gain: 0.24, delay: 0.1 },
    { type: "square", freq: 784, duration: 0.2, gain: 0.26, delay: 0.2 },
  ],
  lose: [
    { type: "triangle", freq: 300, freqEnd: 120, duration: 0.3, gain: 0.2 },
  ],
  deposit: [
    { type: "sine", freq: 480, duration: 0.09, gain: 0.2 },
    { type: "sine", freq: 720, duration: 0.12, gain: 0.18, delay: 0.07 },
  ],
  error: [
    { type: "square", freq: 140, freqEnd: 90, duration: 0.18, gain: 0.22 },
  ],
};

/** Soft pentatonic loop · calm lobby / room ambience. */
const BGM_NOTES = [262, 294, 330, 392, 330, 294, 262, 220];
const BGM_STEP_MS = 420;

const STORAGE_MUTE = "board.audio.muted";
const STORAGE_VOLUME = "board.audio.volume";
const STORAGE_MUSIC_MUTE = "board.audio.musicMuted";
const STORAGE_MUSIC_VOL = "board.audio.musicVolume";
const STORAGE_MUSIC_AUTO = "board.audio.musicAutoplay";

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private unlocked = false;
  private muted = false;
  private volume = 1;
  private musicMuted = false;
  private musicVolume = 0.55;
  private musicAutoplay = true;
  private musicPlaying = false;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private noiseBuffer: AudioBuffer | null = null;
  private diceRolling = false;
  private diceGen = 0;
  private diceTimer: number | null = null;
  private dicePreviewTimer: number | null = null;

  constructor() {
    if (typeof window === "undefined") return;
    try {
      this.muted = window.localStorage.getItem(STORAGE_MUTE) === "1";
      this.musicMuted = window.localStorage.getItem(STORAGE_MUSIC_MUTE) === "1";
      this.musicAutoplay =
        window.localStorage.getItem(STORAGE_MUSIC_AUTO) !== "0";
      const raw = window.localStorage.getItem(STORAGE_VOLUME);
      if (raw !== null) {
        const next = Number(raw);
        if (!Number.isNaN(next)) this.volume = Math.min(1, Math.max(0, next));
      }
      const musicRaw = window.localStorage.getItem(STORAGE_MUSIC_VOL);
      if (musicRaw !== null) {
        const next = Number(musicRaw);
        if (!Number.isNaN(next))
          this.musicVolume = Math.min(1, Math.max(0, next));
      }
    } catch {
      // private mode
    }
  }

  isMuted() {
    return this.muted;
  }

  isMusicMuted() {
    return this.musicMuted;
  }

  isMusicPlaying() {
    return this.musicPlaying;
  }

  getMusicAutoplay() {
    return this.musicAutoplay;
  }

  getVolume() {
    return this.volume;
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyGain();
    this.persist(STORAGE_MUTE, muted ? "1" : "0");
    if (muted) this.stopDiceRollLoop();
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    this.applyGain();
    this.persist(STORAGE_MUSIC_MUTE, muted ? "1" : "0");
    if (muted) this.stopMusic();
    else if (this.unlocked && this.musicAutoplay) this.startMusic();
  }

  toggleMusicMute() {
    this.setMusicMuted(!this.musicMuted);
    return this.musicMuted;
  }

  setMusicAutoplay(enabled: boolean) {
    this.musicAutoplay = enabled;
    this.persist(STORAGE_MUSIC_AUTO, enabled ? "1" : "0");
    if (!enabled) this.stopMusic();
    else if (this.unlocked && !this.musicMuted) this.startMusic();
  }

  setVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume));
    this.applyGain();
    this.persist(STORAGE_VOLUME, String(this.volume));
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.min(1, Math.max(0, volume));
    this.applyGain();
    this.persist(STORAGE_MUSIC_VOL, String(this.musicVolume));
  }

  /** Call from a user gesture so AudioContext can start. */
  async unlock() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return;
      }
    }
    this.unlocked = true;
    if (this.musicAutoplay && !this.musicMuted) this.startMusic();
  }

  startMusic() {
    if (typeof window === "undefined" || this.musicMuted || this.musicPlaying)
      return;
    const ctx = this.ensureContext();
    if (!ctx || !this.musicBus) return;
    if (ctx.state === "suspended") {
      void ctx.resume().then(() => {
        this.unlocked = true;
        this.startMusic();
      });
      return;
    }

    this.unlocked = true;
    this.musicPlaying = true;
    this.musicStep = 0;
    this.scheduleMusicTick();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  play(id: SfxId) {
    if (typeof window === "undefined") return;
    if (this.muted || this.volume <= 0) return;

    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus) return;

    const spawn = () => {
      this.unlocked = true;
      if (id === "dice_roll") {
        this.previewDiceRoll();
        if (this.musicAutoplay && !this.musicMuted) this.startMusic();
        return;
      }
      this.spawn(id);
      if (this.musicAutoplay && !this.musicMuted) this.startMusic();
    };

    if (ctx.state === "suspended") {
      void ctx.resume().then(spawn);
      return;
    }

    spawn();
  }

  /**
   * Dice hitting a table while they tumble. Runs until `finishDiceRoll`.
   * Procedural clacks last exactly as long as the roll animation.
   */
  startDiceRoll() {
    if (typeof window === "undefined") return;
    if (this.muted || this.volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.clearDicePreview();
    this.diceGen += 1;
    const gen = this.diceGen;
    this.diceRolling = true;
    this.clearDiceTimer();

    const begin = () => {
      if (gen !== this.diceGen || !this.diceRolling) return;
      this.unlocked = true;
      this.clackDice();
      this.scheduleDiceClack(gen);
    };

    if (ctx.state === "suspended") {
      void ctx.resume().then(begin);
      return;
    }
    begin();
  }

  /** Stop the rattle without a landing thud (unmount / cancelled roll). */
  stopDiceRollLoop() {
    this.diceGen += 1;
    this.diceRolling = false;
    this.clearDiceTimer();
  }

  /** Stop the rattle and play the heavier settle knocks. */
  finishDiceRoll() {
    this.stopDiceRollLoop();
    if (this.muted || this.volume <= 0) return;
    this.landDice();
  }

  private persist(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }

  private ensureContext() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applyGain();
    }
    return this.ctx;
  }

  private applyGain() {
    if (this.sfxBus) {
      this.sfxBus.gain.value = this.muted ? 0 : this.volume * 1.35;
    }
    if (this.musicBus) {
      this.musicBus.gain.value = this.musicMuted ? 0 : this.musicVolume;
    }
  }

  private scheduleMusicTick() {
    if (!this.musicPlaying) return;
    this.playMusicNote(BGM_NOTES[this.musicStep % BGM_NOTES.length]);
    this.musicStep += 1;
    this.musicTimer = window.setTimeout(() => {
      this.scheduleMusicTick();
    }, BGM_STEP_MS);
  }

  private playMusicNote(freq: number) {
    const ctx = this.ctx;
    const bus = this.musicBus;
    if (!ctx || !bus || this.musicMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.11, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(bus);
    osc.start();
    osc.stop(ctx.currentTime + 0.38);
  }

  private spawn(id: SfxId) {
    const ctx = this.ctx;
    const bus = this.sfxBus;
    if (!ctx || !bus) return;

    if (id === "pawn_step") {
      this.spawnPawnStep();
      return;
    }

    const recipes = SFX[id];
    const now = ctx.currentTime;

    for (const recipe of recipes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = recipe.type;
      osc.frequency.setValueAtTime(recipe.freq, now + (recipe.delay ?? 0));
      if (recipe.freqEnd !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(1, recipe.freqEnd),
          now + (recipe.delay ?? 0) + recipe.duration,
        );
      }

      const start = now + (recipe.delay ?? 0);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(recipe.gain, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + recipe.duration);

      osc.connect(gain);
      gain.connect(bus);
      osc.start(start);
      osc.stop(start + recipe.duration + 0.02);
    }
  }

  private previewDiceRoll() {
    this.startDiceRoll();
    this.clearDicePreview();
    this.dicePreviewTimer = window.setTimeout(() => {
      this.dicePreviewTimer = null;
      this.finishDiceRoll();
    }, 640);
  }

  private clearDicePreview() {
    if (this.dicePreviewTimer !== null) {
      window.clearTimeout(this.dicePreviewTimer);
      this.dicePreviewTimer = null;
    }
  }

  private clearDiceTimer() {
    if (this.diceTimer !== null) {
      window.clearTimeout(this.diceTimer);
      this.diceTimer = null;
    }
  }

  private scheduleDiceClack(gen: number) {
    // Irregular gaps read as tumbling dice. Even ticks sound like a metronome.
    const wait = 42 + Math.random() * 78;
    this.diceTimer = window.setTimeout(() => {
      if (gen !== this.diceGen || !this.diceRolling) return;
      this.clackDice();
      this.scheduleDiceClack(gen);
    }, wait);
  }

  private clackDice() {
    const bright = 1500 + Math.random() * 2500;
    this.noiseHit({
      duration: 0.028 + Math.random() * 0.03,
      gain: 0.18 + Math.random() * 0.1,
      frequency: bright,
      q: 1.5 + Math.random() * 1.1,
    });
    if (Math.random() > 0.42) {
      this.noiseHit({
        duration: 0.045,
        gain: 0.11 + Math.random() * 0.06,
        delay: 0.006 + Math.random() * 0.012,
        frequency: 260 + Math.random() * 480,
        q: 0.85,
        type: "lowpass",
      });
    }
  }

  private landDice() {
    this.noiseHit({
      duration: 0.1,
      gain: 0.3,
      frequency: 220,
      q: 0.75,
      type: "lowpass",
    });
    this.noiseHit({
      duration: 0.08,
      gain: 0.22,
      delay: 0.05,
      frequency: 160,
      q: 0.7,
      type: "lowpass",
    });
    this.noiseHit({
      duration: 0.032,
      gain: 0.16,
      frequency: 1700,
      q: 1.8,
    });
  }

  /**
   * Wooden token tap on felt. Short, unpitched, slightly varied so a path
   * of hops does not machine-gun one identical sample.
   */
  private spawnPawnStep() {
    const body = 210 + Math.random() * 110;
    this.noiseHit({
      duration: 0.046,
      gain: 0.2,
      frequency: body,
      q: 1.05,
      type: "lowpass",
    });
    this.noiseHit({
      duration: 0.014,
      gain: 0.07,
      frequency: 1200 + Math.random() * 500,
      q: 2.4,
    });
  }

  private ensureNoiseBuffer() {
    const ctx = this.ctx;
    if (!ctx) return null;
    if (this.noiseBuffer) return this.noiseBuffer;
    const length = Math.floor(ctx.sampleRate * 0.5);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private noiseHit(opts: {
    duration: number;
    gain: number;
    delay?: number;
    frequency: number;
    q?: number;
    type?: BiquadFilterType;
  }) {
    const ctx = this.ctx;
    const bus = this.sfxBus;
    const buffer = this.ensureNoiseBuffer();
    if (!ctx || !bus || !buffer) return;

    const start = ctx.currentTime + (opts.delay ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const offset = Math.random() * Math.max(0, buffer.duration - opts.duration);
    const filter = ctx.createBiquadFilter();
    filter.type = opts.type ?? "bandpass";
    filter.frequency.setValueAtTime(opts.frequency, start);
    filter.Q.setValueAtTime(opts.q ?? 1.2, start);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, opts.gain),
      start + 0.003,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    src.start(start, offset);
    src.stop(start + opts.duration + 0.02);
  }
}

export const audioManager = new AudioManager();

export function playSfx(id: SfxId) {
  audioManager.play(id);
}

export function startDiceRoll() {
  audioManager.startDiceRoll();
}

export function stopDiceRollLoop() {
  audioManager.stopDiceRollLoop();
}

export function finishDiceRoll() {
  audioManager.finishDiceRoll();
}

export function unlockAudio() {
  return audioManager.unlock();
}
