import { create } from 'zustand';
import type { EngineConfig } from '@workspace/api-client-react';

export type GameMode = 'battle_royale' | 'team_deathmatch' | 'free_for_all' | 'squads';

export const GAME_MODES: GameMode[] = ['battle_royale', 'team_deathmatch', 'free_for_all', 'squads'];

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  battle_royale: 'Battle Royale',
  team_deathmatch: 'Team Deathmatch',
  free_for_all: 'Free For All',
  squads: 'Squads',
};

export const GAME_MODE_COLORS: Record<GameMode, string> = {
  battle_royale: '#ff4400',
  team_deathmatch: '#00b4ff',
  free_for_all: '#ffaa00',
  squads: '#00ff88',
};

export interface KillFeedEntry {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  timestamp: number;
}

interface GameState {
  health: number;
  shield: number;
  maxHealth: number;
  maxShield: number;
  ammo: number;
  maxAmmo: number;
  kills: number;
  deaths: number;
  isChatOpen: boolean;
  engineConfig: EngineConfig | null;
  gameModeIndex: number;
  uploadedModels: string[];
  killFeed: KillFeedEntry[];
  isUploaderOpen: boolean;

  setHealth: (health: number) => void;
  setShield: (shield: number) => void;
  setAmmo: (ammo: number) => void;
  addKill: () => void;
  addDeath: () => void;
  toggleChat: () => void;
  toggleUploader: () => void;
  setEngineConfig: (config: EngineConfig) => void;
  nextGameMode: () => void;
  addUploadedModel: (url: string) => void;
  removeUploadedModel: (url: string) => void;
  addKillFeedEntry: (entry: Omit<KillFeedEntry, 'id' | 'timestamp'>) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  health: 100,
  maxHealth: 100,
  shield: 50,
  maxShield: 100,
  ammo: 30,
  maxAmmo: 30,
  kills: 0,
  deaths: 0,
  isChatOpen: false,
  isUploaderOpen: false,
  engineConfig: null,
  gameModeIndex: 0,
  uploadedModels: [],
  killFeed: [],

  setHealth: (health) => set({ health: Math.max(0, Math.min(100, health)) }),
  setShield: (shield) => set({ shield: Math.max(0, Math.min(100, shield)) }),
  setAmmo: (ammo) => set({ ammo: Math.max(0, ammo) }),
  addKill: () => set((s) => ({ kills: s.kills + 1 })),
  addDeath: () => set((s) => ({ deaths: s.deaths + 1 })),
  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  toggleUploader: () => set((s) => ({ isUploaderOpen: !s.isUploaderOpen })),
  setEngineConfig: (config) => set({ engineConfig: config }),
  nextGameMode: () => set((s) => ({ gameModeIndex: (s.gameModeIndex + 1) % GAME_MODES.length })),
  addUploadedModel: (url) => set((s) => ({ uploadedModels: [...s.uploadedModels, url] })),
  removeUploadedModel: (url) => {
    URL.revokeObjectURL(url);
    set((s) => ({ uploadedModels: s.uploadedModels.filter((u) => u !== url) }));
  },
  addKillFeedEntry: (entry) => {
    const newEntry: KillFeedEntry = {
      ...entry,
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    };
    set((s) => ({ killFeed: [newEntry, ...s.killFeed].slice(0, 6) }));
    setTimeout(() => {
      set((s) => ({ killFeed: s.killFeed.filter((e) => e.id !== newEntry.id) }));
    }, 5000);
  },
}));
