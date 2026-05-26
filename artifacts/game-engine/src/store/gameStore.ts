import { create } from 'zustand';
import type { EngineConfig } from '@workspace/api-client-react';

export type GameMode = 'battle_royale' | 'team_deathmatch' | 'free_for_all' | 'squads';
export const GAME_MODES: GameMode[] = ['battle_royale', 'team_deathmatch', 'free_for_all', 'squads'];
export const GAME_MODE_LABELS: Record<GameMode, string> = {
  battle_royale:  'Battle Royale',
  team_deathmatch:'Team Deathmatch',
  free_for_all:   'Free For All',
  squads:         'Squads',
};
export const GAME_MODE_COLORS: Record<GameMode, string> = {
  battle_royale:   '#ff4400',
  team_deathmatch: '#00b4ff',
  free_for_all:    '#ffaa00',
  squads:          '#00ff88',
};

export interface KillFeedEntry {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  timestamp: number;
}

interface TouchInput {
  moveX: number; moveY: number;
  lookDx: number; lookDy: number;
  shooting: boolean; jumping: boolean;
}

interface GameState {
  health: number; maxHealth: number;
  shield: number; maxShield: number;
  ammo: number; maxAmmo: number;
  kills: number; deaths: number;
  isChatOpen: boolean; isUploaderOpen: boolean;
  engineConfig: EngineConfig | null;
  gameModeIndex: number;
  uploadedModels: string[];
  killFeed: KillFeedEntry[];
  touchInput: TouchInput;
  isPlayerActive: boolean;

  setHealth: (v: number) => void;
  setShield: (v: number) => void;
  setAmmo: (v: number) => void;
  addKill: () => void;
  addDeath: () => void;
  toggleChat: () => void;
  toggleUploader: () => void;
  setEngineConfig: (c: EngineConfig) => void;
  nextGameMode: () => void;
  addUploadedModel: (url: string) => void;
  removeUploadedModel: (url: string) => void;
  addKillFeedEntry: (e: Omit<KillFeedEntry, 'id'|'timestamp'>) => void;
  setTouchInput: (v: Partial<TouchInput>) => void;
  setPlayerActive: (v: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  health: 100, maxHealth: 100,
  shield: 50,  maxShield: 100,
  ammo: 30,    maxAmmo: 30,
  kills: 0,    deaths: 0,
  isChatOpen: false, isUploaderOpen: false,
  engineConfig: null, gameModeIndex: 0,
  uploadedModels: [], killFeed: [],
  touchInput: { moveX:0,moveY:0,lookDx:0,lookDy:0,shooting:false,jumping:false },
  isPlayerActive: true,

  setHealth: (v) => set({ health: Math.max(0, Math.min(100, v)) }),
  setShield: (v) => set({ shield: Math.max(0, Math.min(100, v)) }),
  setAmmo:   (v) => set({ ammo: Math.max(0, v) }),
  addKill:   ()  => set((s) => ({ kills: s.kills+1 })),
  addDeath:  ()  => set((s) => ({ deaths: s.deaths+1 })),
  toggleChat:     () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  toggleUploader: () => set((s) => ({ isUploaderOpen: !s.isUploaderOpen })),
  setEngineConfig: (c) => set({ engineConfig: c }),
  nextGameMode: () => set((s) => ({ gameModeIndex: (s.gameModeIndex+1) % GAME_MODES.length })),
  addUploadedModel: (url) => set((s) => ({ uploadedModels: [...s.uploadedModels, url] })),
  removeUploadedModel: (url) => {
    URL.revokeObjectURL(url);
    set((s) => ({ uploadedModels: s.uploadedModels.filter(u => u!==url) }));
  },
  addKillFeedEntry: (entry) => {
    const e: KillFeedEntry = { ...entry, id: Math.random().toString(36).slice(2), timestamp: Date.now() };
    set((s) => ({ killFeed: [e, ...s.killFeed].slice(0, 8) }));
    setTimeout(() => set((s) => ({ killFeed: s.killFeed.filter(x => x.id!==e.id) })), 5000);
  },
  setTouchInput: (v) => set((s) => ({ touchInput: { ...s.touchInput, ...v } })),
  setPlayerActive: (v) => set({ isPlayerActive: v }),
}));
