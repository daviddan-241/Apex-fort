import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";

// Web Audio API sound engine
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  private getMaster(): GainNode {
    this.getCtx();
    return this.masterGain!;
  }

  // Gunshot sound for given weapon type
  playGunshot(weaponType: string) {
    const ctx = this.getCtx();
    const master = this.getMaster();
    const now = ctx.currentTime;

    if (weaponType === "Sniper Rifle") {
      // Crack + bass boom
      this.playNoise(ctx, master, now, 0.001, 0.08, 0.5, 200, 80);
      this.playTone(ctx, master, now, 0.001, 0.4, 0.3, 140, 40, "sawtooth");
    } else if (weaponType === "Shotgun") {
      // Wide low boom
      for (let i = 0; i < 3; i++) {
        this.playNoise(ctx, master, now + i * 0.01, 0.001, 0.15, 0.5, 300 + Math.random() * 200, 60);
      }
      this.playTone(ctx, master, now, 0.001, 0.35, 0.4, 100, 30, "sawtooth");
    } else if (weaponType === "SMG") {
      // Sharp crack
      this.playNoise(ctx, master, now, 0.001, 0.05, 0.3, 800, 200);
      this.playTone(ctx, master, now, 0.001, 0.08, 0.15, 300, 100, "square");
    } else if (weaponType === "Pistol") {
      // Pop
      this.playNoise(ctx, master, now, 0.001, 0.07, 0.3, 600, 150);
      this.playTone(ctx, master, now, 0.001, 0.1, 0.2, 250, 80, "sawtooth");
    } else {
      // Assault Rifle — default
      this.playNoise(ctx, master, now, 0.001, 0.06, 0.35, 500, 120);
      this.playTone(ctx, master, now, 0.001, 0.12, 0.2, 200, 60, "sawtooth");
    }
  }

  playHit() {
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    this.playTone(ctx, this.getMaster(), now, 0.001, 0.05, 0.25, 800, 400, "sine");
  }

  playKill() {
    const ctx = this.getCtx();
    const master = this.getMaster();
    const now = ctx.currentTime;
    // Ascending ding
    [880, 1100, 1320].forEach((freq, i) => {
      this.playTone(ctx, master, now + i * 0.08, 0.001, 0.12, 0.15, freq, freq * 0.5, "sine");
    });
  }

  playPickup() {
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    this.playTone(ctx, this.getMaster(), now, 0.001, 0.08, 0.12, 600, 900, "sine");
    this.playTone(ctx, this.getMaster(), now + 0.08, 0.001, 0.08, 0.12, 800, 1000, "sine");
  }

  playReload() {
    const ctx = this.getCtx();
    const master = this.getMaster();
    const now = ctx.currentTime;
    // Click-clack
    this.playNoise(ctx, master, now, 0.001, 0.04, 0.15, 1500, 500);
    this.playNoise(ctx, master, now + 0.3, 0.001, 0.04, 0.15, 2000, 800);
    this.playTone(ctx, master, now + 0.35, 0.001, 0.06, 0.1, 300, 200, "square");
  }

  playJump() {
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    this.playTone(ctx, this.getMaster(), now, 0.001, 0.08, 0.12, 200, 300, "sine");
  }

  playLand() {
    const ctx = this.getCtx();
    const now = ctx.currentTime;
    this.playNoise(ctx, this.getMaster(), now, 0.001, 0.1, 0.2, 300, 50);
  }

  playBuildPlace() {
    const ctx = this.getCtx();
    const master = this.getMaster();
    const now = ctx.currentTime;
    this.playNoise(ctx, master, now, 0.001, 0.06, 0.2, 400, 100);
    this.playTone(ctx, master, now, 0.001, 0.1, 0.15, 180, 120, "sawtooth");
  }

  playStormWarning() {
    const ctx = this.getCtx();
    const master = this.getMaster();
    const now = ctx.currentTime;
    // Deep pulsing tone
    this.playTone(ctx, master, now, 0.01, 0.5, 0.3, 80, 60, "sawtooth");
    this.playTone(ctx, master, now + 0.6, 0.01, 0.5, 0.3, 75, 55, "sawtooth");
  }

  playVictory() {
    const ctx = this.getCtx();
    const master = this.getMaster();
    const now = ctx.currentTime;
    const melody = [523, 659, 784, 1047];
    melody.forEach((freq, i) => {
      this.playTone(ctx, master, now + i * 0.18, 0.001, 0.22, 0.3, freq, freq * 0.8, "sine");
    });
  }

  playDefeat() {
    const ctx = this.getCtx();
    const master = this.getMaster();
    const now = ctx.currentTime;
    const notes = [400, 320, 250, 180];
    notes.forEach((freq, i) => {
      this.playTone(ctx, master, now + i * 0.22, 0.001, 0.25, 0.35, freq, freq * 0.7, "sawtooth");
    });
  }

  private playNoise(
    ctx: AudioContext, dest: AudioNode, start: number,
    attack: number, decay: number, gain: number,
    highFreq: number, lowFreq: number,
  ) {
    const bufferSize = ctx.sampleRate * (attack + decay);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(highFreq, start);
    filter.frequency.linearRampToValueAtTime(lowFreq, start + attack + decay);
    filter.Q.value = 0.8;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(gain, start + attack);
    env.gain.exponentialRampToValueAtTime(0.001, start + attack + decay);

    source.connect(filter);
    filter.connect(env);
    env.connect(dest);
    source.start(start);
    source.stop(start + attack + decay + 0.01);
  }

  private playTone(
    ctx: AudioContext, dest: AudioNode, start: number,
    attack: number, decay: number, gain: number,
    startFreq: number, endFreq: number,
    type: OscillatorType,
  ) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), start + attack + decay);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(gain, start + attack);
    env.gain.exponentialRampToValueAtTime(0.001, start + attack + decay);

    osc.connect(env);
    env.connect(dest);
    osc.start(start);
    osc.stop(start + attack + decay + 0.01);
  }
}

// Singleton audio engine
export const audioEngine = new AudioEngine();

// Footstep generator
function createFootstepSystem() {
  let lastStep = 0;
  return {
    tick(isMoving: boolean, isSprinting: boolean) {
      if (!isMoving) return;
      const now = Date.now();
      const interval = isSprinting ? 280 : 430;
      if (now - lastStep > interval) {
        lastStep = now;
        // Soft footstep
        const ctx = (audioEngine as any).getCtx?.() as AudioContext | undefined;
        if (!ctx) return;
        const master = (audioEngine as any).getMaster?.() as GainNode | undefined;
        if (!master) return;
        const t = ctx.currentTime;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.07), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = "lowpass";
        filt.frequency.value = 300;
        const g = ctx.createGain();
        g.gain.value = 0.06;
        src.connect(filt);
        filt.connect(g);
        g.connect(master);
        src.start(t);
      }
    },
  };
}

const footsteps = createFootstepSystem();

export default function SoundSystem() {
  const { kills, phase, weapons, activeWeaponIndex } = useGameStore();
  const prevKills = useRef(kills);
  const prevPhase = useRef(phase);

  // Kill sound
  useEffect(() => {
    if (kills > prevKills.current) {
      audioEngine.playKill();
      prevKills.current = kills;
    }
  }, [kills]);

  // Victory / Defeat sound
  useEffect(() => {
    if (phase === "VICTORY" && prevPhase.current === "PLAYING") {
      setTimeout(() => audioEngine.playVictory(), 400);
    }
    if (phase === "DEFEAT" && prevPhase.current === "PLAYING") {
      setTimeout(() => audioEngine.playDefeat(), 400);
    }
    prevPhase.current = phase;
  }, [phase]);

  // Storm warning (when stormTimeLeft < 10)
  const stormTimeLeft = useGameStore(s => s.stormTimeLeft);
  const prevStormTime = useRef(stormTimeLeft);
  useEffect(() => {
    if (stormTimeLeft < 10 && prevStormTime.current >= 10) {
      audioEngine.playStormWarning();
    }
    prevStormTime.current = stormTimeLeft;
  }, [stormTimeLeft]);

  return null;
}

// Hook to be used in Player.tsx for shooting/footstep sounds
export function useSoundEffects() {
  return audioEngine;
}
