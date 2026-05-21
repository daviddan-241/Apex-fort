import { WeaponType } from './store';

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private noise(duration: number, gain: number): void {
    try {
      const ctx = this.getCtx();
      const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.8;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      src.connect(g);
      g.connect(ctx.destination);
      src.start();
      src.stop(ctx.currentTime + duration);
    } catch {}
  }

  private tone(freq: number, duration: number, gain: number, type: OscillatorType = 'sine', freqEnd?: number): void {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  playGunshot(weapon: WeaponType): void {
    switch (weapon) {
      case 'AR':
        this.noise(0.08, 0.4);
        this.tone(200, 0.06, 0.15, 'sawtooth', 80);
        break;
      case 'Shotgun':
        this.noise(0.18, 0.7);
        this.tone(80, 0.15, 0.3, 'sawtooth', 30);
        break;
      case 'Sniper':
        this.noise(0.04, 0.3);
        this.tone(600, 0.3, 0.2, 'sine', 150);
        break;
      case 'SMG':
        this.noise(0.05, 0.3);
        this.tone(300, 0.04, 0.1, 'square', 180);
        break;
      case 'MythicAR':
        this.noise(0.09, 0.5);
        this.tone(440, 0.08, 0.2, 'sawtooth', 100);
        this.tone(880, 0.05, 0.1, 'sine', 440);
        break;
      case 'InfinityCannon':
        this.noise(0.35, 0.8);
        this.tone(60, 0.4, 0.5, 'sawtooth', 20);
        this.tone(120, 0.3, 0.3, 'square', 40);
        break;
    }
  }

  playHit(): void {
    this.tone(1200, 0.05, 0.3, 'sine', 800);
  }

  playKillConfirm(): void {
    [880, 1100, 1320].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.12, 0.25, 'sine'), i * 80);
    });
  }

  playReload(): void {
    this.noise(0.12, 0.18);
    setTimeout(() => this.noise(0.08, 0.2), 180);
    setTimeout(() => this.tone(500, 0.06, 0.15, 'square'), 300);
  }

  playJump(): void {
    this.tone(300, 0.12, 0.15, 'sine', 500);
  }

  playLand(): void {
    this.noise(0.08, 0.3);
    this.tone(100, 0.08, 0.2, 'sine', 60);
  }

  playFootstep(): void {
    this.noise(0.05, 0.12);
  }

  playStormDamage(): void {
    this.tone(80, 0.15, 0.2, 'sawtooth', 60);
  }

  playShieldBreak(): void {
    this.tone(600, 0.08, 0.3, 'sine', 200);
    this.noise(0.1, 0.2);
  }

  playHeal(): void {
    this.tone(440, 0.1, 0.2, 'sine', 660);
    setTimeout(() => this.tone(660, 0.1, 0.15, 'sine', 880), 100);
  }

  playVictory(): void {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.35, 0.3, 'sine'), i * 180);
    });
  }

  playDefeat(): void {
    [440, 370, 330, 277].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.3, 0.25, 'sine', freq * 0.8), i * 200);
    });
  }

  playChallengeComplete(): void {
    [880, 1100, 1320, 1760].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.15, 0.3, 'sine'), i * 60);
    });
  }

  playLevelUp(): void {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.2, 0.35, 'sine'), i * 100);
    });
  }
}

export const sounds = new SoundEngine();
