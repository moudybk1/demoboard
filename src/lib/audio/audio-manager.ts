/**
 * BOARD audio manager · Web Audio SFX + soft looping BGM.
 * Sounds are synthesized (no binary assets). Autoplay starts after unlock.
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
    { type: "square", freq: 880, duration: 0.05, gain: 0.28 },
    { type: "square", freq: 420, duration: 0.08, gain: 0.18, delay: 0.012 },
  ],
  ui_hover: [{ type: "triangle", freq: 520, duration: 0.04, gain: 0.12 }],
  dice_roll: [
    { type: "square", freq: 180, freqEnd: 90, duration: 0.1, gain: 0.28 },
    {
      type: "square",
      freq: 220,
      freqEnd: 110,
      duration: 0.09,
      gain: 0.22,
      delay: 0.05,
    },
    {
      type: "square",
      freq: 260,
      freqEnd: 130,
      duration: 0.08,
      gain: 0.2,
      delay: 0.1,
    },
  ],
  pawn_step: [
    { type: "triangle", freq: 240, freqEnd: 180, duration: 0.07, gain: 0.2 },
  ],
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
      this.spawn(id);
      if (this.musicAutoplay && !this.musicMuted) this.startMusic();
    };

    if (ctx.state === "suspended") {
      void ctx.resume().then(spawn);
      return;
    }

    spawn();
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
}

export const audioManager = new AudioManager();

export function playSfx(id: SfxId) {
  audioManager.play(id);
}

export function unlockAudio() {
  return audioManager.unlock();
}
