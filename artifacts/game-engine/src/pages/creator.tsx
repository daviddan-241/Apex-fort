import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useCreateSession, SessionInputGameMode } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import {
  TreePine, Sunrise, Mountain, Building2, Waves, Cpu,
  Target, Users, Timer, Trophy, ChevronRight, ChevronLeft,
  Sword, Crosshair, Shield, Zap, Check, Play
} from 'lucide-react';

const MAPS = [
  { id: 'forest',  label: 'Forest Warzone',   icon: TreePine,   color: '#22c55e', desc: 'Dense foliage, long sight lines, tactical cover' },
  { id: 'desert',  label: 'Desert Storm',     icon: Sunrise,    color: '#f59e0b', desc: 'Open dunes, sand storms, vehicle combat' },
  { id: 'arctic',  label: 'Arctic Fortress',  icon: Mountain,   color: '#60a5fa', desc: 'Snow-covered peaks, ice caves, stealth gameplay' },
  { id: 'urban',   label: 'Urban Combat',     icon: Building2,  color: '#8b5cf6', desc: 'City streets, rooftops, CQC action' },
  { id: 'island',  label: 'Island Arena',     icon: Waves,      color: '#06b6d4', desc: 'Tropical beaches, water combat, boat action' },
  { id: 'void',    label: 'Void Station',     icon: Cpu,        color: '#ec4899', desc: 'Space station, zero-g zones, sci-fi setting' },
];

const MODES = [
  { id: 'battle_royale',  label: 'Battle Royale', icon: Target,   color: '#ef4444', desc: 'Last one standing wins', max: 100 },
  { id: 'deathmatch',     label: 'Deathmatch',    icon: Sword,    color: '#00b4ff', desc: 'First to kill limit wins', max: 16 },
  { id: 'free_for_all',   label: 'Free For All',  icon: Zap,      color: '#f59e0b', desc: 'Every player for themselves', max: 20 },
  { id: 'squads',         label: 'Squads',        icon: Users,    color: '#22c55e', desc: '4-player teams battle it out', max: 40 },
  { id: 'sandbox',        label: 'Creative',      icon: Crosshair,color: '#ec4899', desc: 'No rules — build and experiment', max: 8 },
];

const WEAPONS = [
  { id: 'ar',       label: 'Assault Rifle',  emoji: '🔫' },
  { id: 'smg',      label: 'SMG',            emoji: '🔫' },
  { id: 'sniper',   label: 'Sniper Rifle',   emoji: '🎯' },
  { id: 'shotgun',  label: 'Shotgun',        emoji: '💥' },
  { id: 'rpg',      label: 'RPG',            emoji: '🚀' },
  { id: 'pistol',   label: 'Pistol',         emoji: '🔫' },
  { id: 'knife',    label: 'Combat Knife',   emoji: '🔪' },
  { id: 'grenade',  label: 'Grenades',       emoji: '💣' },
];

export default function CreatorPage() {
  const [step, setStep] = useState(0);
  const [map, setMap] = useState('');
  const [mode, setMode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [timeLimit, setTimeLimit] = useState(15);
  const [weapons, setWeapons] = useState<string[]>(['ar', 'smg', 'pistol']);
  const [sessionName, setSessionName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const createSession = useCreateSession();
  const [, nav] = useLocation();

  const selectedMap  = MAPS.find(m => m.id === map);
  const selectedMode = MODES.find(m => m.id === mode);

  const toggleWeapon = (id: string) =>
    setWeapons(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);

  const handleCreate = async () => {
    if (!sessionName.trim()) return;
    setCreating(true);
    try {
      const modeMap: Record<string, SessionInputGameMode> = {
        battle_royale: SessionInputGameMode.battle_royale,
        deathmatch:    SessionInputGameMode.deathmatch,
        sandbox:       SessionInputGameMode.sandbox,
        free_for_all:  SessionInputGameMode.deathmatch,
        squads:        SessionInputGameMode.battle_royale,
      };
      await createSession.mutateAsync({
        data: {
          name: sessionName,
          gameMode: modeMap[mode] ?? SessionInputGameMode.deathmatch,
          maxPlayers,
        },
      });
      setCreated(true);
      setTimeout(() => nav('/lobby'), 2000);
    } catch {
      setCreating(false);
    }
  };

  const steps = ['Map', 'Mode', 'Weapons', 'Publish'];

  return (
    <div className="min-h-screen bg-[#08090f] text-white overflow-hidden">
      <Navbar />

      <div className="pt-14 min-h-screen flex flex-col">
        {/* ── Step indicator ─────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 py-5 px-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  i === step
                    ? 'bg-[#00b4ff] text-black'
                    : i < step
                    ? 'bg-white/10 text-white/60 cursor-pointer hover:bg-white/20'
                    : 'bg-white/5 text-white/25 cursor-default'
                }`}
              >
                {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < steps.length - 1 && <div className="w-6 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {/* ── STEP 0: Choose Map ─────────────────────────────── */}
        {step === 0 && (
          <div className="flex-1 px-4 pb-6">
            <div className="text-center mb-5">
              <h1 className="text-2xl font-black tracking-tight">Choose Your Map</h1>
              <p className="text-white/40 text-sm mt-1">Select the battlefield for your game</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {MAPS.map((m) => {
                const Icon = m.icon;
                const sel = map === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMap(m.id)}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                      sel ? 'border-current' : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                    style={sel ? { borderColor: m.color, background: `${m.color}18` } : {}}
                  >
                    <div className="mb-2 p-2 rounded-xl w-fit" style={{ background: `${m.color}22` }}>
                      <Icon className="w-5 h-5" style={{ color: m.color }} />
                    </div>
                    <div className="font-bold text-sm leading-tight">{m.label}</div>
                    <div className="text-[11px] text-white/45 mt-1 leading-tight">{m.desc}</div>
                    {sel && (
                      <div className="absolute top-2 right-2 rounded-full w-5 h-5 flex items-center justify-center" style={{ background: m.color }}>
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 1: Game Mode ──────────────────────────────── */}
        {step === 1 && (
          <div className="flex-1 px-4 pb-6">
            <div className="text-center mb-5">
              <h1 className="text-2xl font-black tracking-tight">Game Mode & Rules</h1>
              <p className="text-white/40 text-sm mt-1">How players win and play</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mb-6">
              {MODES.map((m) => {
                const Icon = m.icon;
                const sel  = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setMode(m.id); setMaxPlayers(Math.min(maxPlayers, m.max)); }}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                      sel ? 'border-current' : 'border-white/10 bg-white/5'
                    }`}
                    style={sel ? { borderColor: m.color, background: `${m.color}18` } : {}}
                  >
                    <div className="mb-2 p-2 rounded-xl w-fit" style={{ background: `${m.color}22` }}>
                      <Icon className="w-5 h-5" style={{ color: m.color }} />
                    </div>
                    <div className="font-bold text-sm">{m.label}</div>
                    <div className="text-[11px] text-white/45 mt-1 leading-tight">{m.desc}</div>
                    {sel && (
                      <div className="absolute top-2 right-2 rounded-full w-5 h-5 flex items-center justify-center" style={{ background: m.color }}>
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sliders */}
            <div className="max-w-lg mx-auto space-y-5 bg-white/5 border border-white/10 rounded-2xl p-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-1.5 text-white/70"><Users className="w-3.5 h-3.5" />Max Players</span>
                  <span className="font-bold text-[#00b4ff]">{maxPlayers}</span>
                </div>
                <input type="range" min={2} max={selectedMode?.max ?? 100} value={maxPlayers}
                  onChange={e => setMaxPlayers(+e.target.value)}
                  className="w-full accent-[#00b4ff]" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-1.5 text-white/70"><Timer className="w-3.5 h-3.5" />Time Limit</span>
                  <span className="font-bold text-[#00b4ff]">{timeLimit} min</span>
                </div>
                <input type="range" min={5} max={60} value={timeLimit}
                  onChange={e => setTimeLimit(+e.target.value)}
                  className="w-full accent-[#00b4ff]" />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Weapons ────────────────────────────────── */}
        {step === 2 && (
          <div className="flex-1 px-4 pb-6">
            <div className="text-center mb-5">
              <h1 className="text-2xl font-black tracking-tight">Weapons Allowed</h1>
              <p className="text-white/40 text-sm mt-1">Pick which weapons players can find</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {WEAPONS.map((w) => {
                const sel = weapons.includes(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => toggleWeapon(w.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                      sel
                        ? 'border-[#00b4ff] bg-[#00b4ff]/15'
                        : 'border-white/10 bg-white/5 opacity-60'
                    }`}
                  >
                    <span className="text-2xl">{w.emoji}</span>
                    <div className="text-left">
                      <div className="font-bold text-sm">{w.label}</div>
                      <div className="text-[10px] text-white/40">{sel ? 'Enabled' : 'Disabled'}</div>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${sel ? 'bg-[#00b4ff] border-[#00b4ff]' : 'border-white/20'}`}>
                      {sel && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3: Publish ────────────────────────────────── */}
        {step === 3 && (
          <div className="flex-1 px-4 pb-6">
            <div className="text-center mb-5">
              <h1 className="text-2xl font-black tracking-tight">Launch Your Game</h1>
              <p className="text-white/40 text-sm mt-1">Name it and go live</p>
            </div>
            {!created ? (
              <div className="max-w-sm mx-auto space-y-4">
                {/* Summary */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  {selectedMap && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: `${selectedMap.color}22` }}>
                        <selectedMap.icon className="w-4 h-4" style={{ color: selectedMap.color }} />
                      </div>
                      <div>
                        <div className="text-xs text-white/40">Map</div>
                        <div className="font-bold text-sm">{selectedMap.label}</div>
                      </div>
                    </div>
                  )}
                  {selectedMode && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: `${selectedMode.color}22` }}>
                        <selectedMode.icon className="w-4 h-4" style={{ color: selectedMode.color }} />
                      </div>
                      <div>
                        <div className="text-xs text-white/40">Mode</div>
                        <div className="font-bold text-sm">{selectedMode.label} · {maxPlayers} players · {timeLimit} min</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5">
                      <Trophy className="w-4 h-4 text-white/60" />
                    </div>
                    <div>
                      <div className="text-xs text-white/40">Weapons</div>
                      <div className="font-bold text-sm">{weapons.length} types enabled</div>
                    </div>
                  </div>
                </div>

                {/* Name input */}
                <div>
                  <label className="text-xs text-white/50 tracking-widest block mb-2">SESSION NAME</label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                    placeholder="e.g. Midnight Warzone"
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#00b4ff] transition-colors"
                    maxLength={40}
                  />
                </div>

                {/* Privacy toggle */}
                <button
                  onClick={() => setIsPrivate(p => !p)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    isPrivate ? 'border-[#00b4ff]/50 bg-[#00b4ff]/10' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <span className="text-sm font-medium">Private Session</span>
                  <div className={`w-10 h-5 rounded-full transition-colors ${isPrivate ? 'bg-[#00b4ff]' : 'bg-white/20'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${isPrivate ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>

                {/* Create button */}
                <button
                  onClick={handleCreate}
                  disabled={!sessionName.trim() || creating}
                  className="w-full py-4 rounded-2xl font-black text-lg tracking-wide transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #00b4ff, #0077cc)', boxShadow: '0 0 30px rgba(0,180,255,0.3)' }}
                >
                  {creating ? 'Creating...' : '🚀 Launch Game'}
                </button>
              </div>
            ) : (
              <div className="max-w-sm mx-auto text-center pt-10">
                <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-2xl font-black text-green-400 mb-2">Game Created!</h2>
                <p className="text-white/50 text-sm">Taking you to the lobby...</p>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation buttons ─────────────────────────────── */}
        <div className="sticky bottom-0 flex items-center justify-between px-4 py-4 bg-[#08090f]/95 backdrop-blur-md border-t border-white/5">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-sm disabled:opacity-25 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => Math.min(3, s + 1))}
              disabled={
                (step === 0 && !map) ||
                (step === 1 && !mode) ||
                (step === 2 && weapons.length === 0)
              }
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-black transition-all active:scale-95 disabled:opacity-30"
              style={{ background: '#00b4ff' }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => nav('/lobby')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-sm active:scale-95"
            >
              <Play className="w-4 h-4" /> View Lobby
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
