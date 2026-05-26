import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import {
  ChevronLeft, Map, Building2, Crosshair, Users, Sliders, Palette,
  Play, Upload, Check, ChevronRight, Eye, Save, Globe, Lock,
  TreePine, Sunrise, Mountain, Building, Waves, Cpu,
  Target, Sword, Car, Flag, Skull, Zap, Shield
} from 'lucide-react';
import { GameEngine } from '@/components/game/GameEngine';
import { useCreateSession, SessionInputGameMode } from '@workspace/api-client-react';

// ─── Template starters ───────────────────────────────────────
const GAME_TEMPLATES: Record<string, { mode: string; maxPlayers: number; timeLimit: number; weapons: string[] }> = {
  battle_royale: { mode:'battle_royale', maxPlayers:100, timeLimit:30, weapons:['ar','smg','sniper','shotgun','pistol'] },
  deathmatch:    { mode:'deathmatch',    maxPlayers:16,  timeLimit:15, weapons:['ar','smg','pistol'] },
  free_for_all:  { mode:'deathmatch',    maxPlayers:20,  timeLimit:10, weapons:['ar','smg','shotgun','pistol'] },
  squads:        { mode:'battle_royale', maxPlayers:40,  timeLimit:25, weapons:['ar','smg','sniper','shotgun','rpg','pistol'] },
  racing:        { mode:'sandbox',       maxPlayers:20,  timeLimit:15, weapons:[] },
  capture:       { mode:'deathmatch',    maxPlayers:32,  timeLimit:20, weapons:['ar','smg','pistol'] },
  zombies:       { mode:'sandbox',       maxPlayers:8,   timeLimit:30, weapons:['shotgun','smg','pistol','knife'] },
  sandbox:       { mode:'sandbox',       maxPlayers:16,  timeLimit:60, weapons:['ar','smg','sniper','shotgun','rpg','pistol','knife','grenade'] },
  tower_defense: { mode:'sandbox',       maxPlayers:4,   timeLimit:30, weapons:['ar','pistol'] },
  parkour:       { mode:'sandbox',       maxPlayers:10,  timeLimit:15, weapons:[] },
};

// ─── Map templates ────────────────────────────────────────────
const MAPS = [
  { id:'forest',  label:'Forest',   icon:TreePine,  color:'#22c55e' },
  { id:'desert',  label:'Desert',   icon:Sunrise,   color:'#f59e0b' },
  { id:'arctic',  label:'Arctic',   icon:Mountain,  color:'#60a5fa' },
  { id:'urban',   label:'Urban',    icon:Building,  color:'#8b5cf6' },
  { id:'island',  label:'Island',   icon:Waves,     color:'#06b6d4' },
  { id:'void',    label:'Void',     icon:Cpu,       color:'#ec4899' },
];

// ─── Tool tabs ────────────────────────────────────────────────
const TABS = [
  { id:'map',     label:'Map',      icon:Map },
  { id:'objects', label:'Objects',  icon:Building2 },
  { id:'weapons', label:'Weapons',  icon:Crosshair },
  { id:'rules',   label:'Rules',    icon:Sliders },
  { id:'players', label:'Players',  icon:Users },
  { id:'style',   label:'Style',    icon:Palette },
];

const WEAPONS_LIST = [
  { id:'ar',      label:'Assault Rifle',  emoji:'🔫', damage:'High',   fire:'Auto' },
  { id:'smg',     label:'SMG',            emoji:'🔫', damage:'Medium', fire:'Auto' },
  { id:'sniper',  label:'Sniper',         emoji:'🎯', damage:'Max',    fire:'Bolt' },
  { id:'shotgun', label:'Shotgun',        emoji:'💥', damage:'High',   fire:'Pump' },
  { id:'rpg',     label:'RPG',            emoji:'🚀', damage:'Extreme',fire:'Single' },
  { id:'pistol',  label:'Pistol',         emoji:'🔫', damage:'Low',    fire:'Semi' },
  { id:'knife',   label:'Knife',          emoji:'🔪', damage:'Medium', fire:'Melee' },
  { id:'grenade', label:'Grenades',       emoji:'💣', damage:'High',   fire:'Throw' },
];

const WIN_CONDITIONS = ['Most Kills','Last Standing','Capture Points','Finish Line','Survive Waves','Time Limit'];

export default function StudioPage() {
  const [, nav] = useLocation();
  const search  = useSearch();
  const params  = new URLSearchParams(search);
  const templateId = params.get('template') ?? 'battle_royale';
  const preset  = GAME_TEMPLATES[templateId] ?? GAME_TEMPLATES.battle_royale;

  // Studio state
  const [gameName,    setGameName]    = useState('My Awesome Game');
  const [editingName, setEditingName] = useState(false);
  const [tab,         setTab]         = useState('map');
  const [showPreview, setShowPreview] = useState(false);
  const [published,   setPublished]   = useState(false);
  const [publishing,  setPublishing]  = useState(false);

  // Game config
  const [selectedMap,    setSelectedMap]    = useState('forest');
  const [weapons,        setWeapons]        = useState<string[]>(preset.weapons);
  const [maxPlayers,     setMaxPlayers]     = useState(preset.maxPlayers);
  const [timeLimit,      setTimeLimit]      = useState(preset.timeLimit);
  const [aiDifficulty,   setAiDifficulty]   = useState<'easy'|'medium'|'hard'>('medium');
  const [winCondition,   setWinCondition]   = useState(WIN_CONDITIONS[0]);
  const [friendlyFire,   setFriendlyFire]   = useState(false);
  const [respawns,       setRespawns]       = useState(true);
  const [respawnDelay,   setRespawnDelay]   = useState(5);
  const [mapSize,        setMapSize]        = useState<'small'|'medium'|'large'>('medium');
  const [timeOfDay,      setTimeOfDay]      = useState<'dawn'|'day'|'dusk'|'night'>('day');
  const [weatherEffect,  setWeatherEffect]  = useState<'clear'|'fog'|'rain'|'storm'>('clear');
  const [isPrivate,      setIsPrivate]      = useState(false);
  const [npcCount,       setNpcCount]       = useState(8);

  const createSession = useCreateSession();

  const toggleWeapon = (id: string) =>
    setWeapons(prev => prev.includes(id) ? prev.filter(w => w!==id) : [...prev, id]);

  const handlePublish = async () => {
    setPublishing(true);
    const modeMap: Record<string, SessionInputGameMode> = {
      battle_royale: SessionInputGameMode.battle_royale,
      deathmatch:    SessionInputGameMode.deathmatch,
      sandbox:       SessionInputGameMode.sandbox,
    };
    try {
      await createSession.mutateAsync({
        data: {
          name: gameName,
          gameMode: modeMap[preset.mode] ?? SessionInputGameMode.deathmatch,
          maxPlayers,
        },
      });
      setPublished(true);
      setTimeout(() => nav('/lobby'), 2000);
    } catch {
      setPublishing(false);
    }
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setShowPreview(false)}
            className="flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" /> Exit Preview
          </button>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-black/70 backdrop-blur-md border border-[#00b4ff]/40 rounded-xl px-4 py-2 text-[#00b4ff] text-xs font-bold tracking-widest">
            ◉ PREVIEW MODE
          </div>
        </div>
        <GameEngine />
      </div>
    );
  }

  if (published) {
    return (
      <div className="min-h-screen bg-[#07080f] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500 flex items-center justify-center mx-auto mb-5">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Game Published!</h2>
          <p className="text-white/40 text-sm mb-1">"{gameName}" is now live</p>
          <p className="text-white/25 text-xs">Taking you to the lobby…</p>
        </div>
      </div>
    );
  }

  const selectedMapDef = MAPS.find(m => m.id === selectedMap);

  return (
    <div className="min-h-screen bg-[#07080f] text-white flex flex-col">

      {/* ── STUDIO HEADER ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0a0b16]/90 backdrop-blur-md border-b border-white/8 flex-shrink-0">
        <button onClick={() => nav('/')} className="p-2 rounded-lg hover:bg-white/8 transition-colors active:scale-90">
          <ChevronLeft className="w-5 h-5 text-white/60" />
        </button>

        {/* Game name (editable) */}
        {editingName ? (
          <input
            autoFocus
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key==='Enter' && setEditingName(false)}
            className="flex-1 bg-white/10 border border-[#00b4ff]/50 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none min-w-0"
            maxLength={40}
          />
        ) : (
          <button onClick={() => setEditingName(true)} className="flex-1 text-left min-w-0">
            <span className="font-bold text-sm truncate block hover:text-[#00b4ff] transition-colors">{gameName}</span>
            <span className="text-[10px] text-white/25">Tap to rename</span>
          </button>
        )}

        {/* Actions */}
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/8 hover:bg-white/14 border border-white/12 rounded-xl text-xs font-bold transition-all active:scale-95"
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-black transition-all active:scale-95 disabled:opacity-40"
          style={{ background:'linear-gradient(135deg,#00b4ff,#0077cc)' }}
        >
          <Globe className="w-3.5 h-3.5" />
          {publishing ? 'Publishing…' : 'Publish'}
        </button>
      </div>

      {/* ── TAB BAR ───────────────────────────────────────────── */}
      <div className="flex overflow-x-auto border-b border-white/8 bg-[#0a0b16]/60 flex-shrink-0 no-scrollbar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
              tab === id
                ? 'border-[#00b4ff] text-[#00b4ff]'
                : 'border-transparent text-white/35 hover:text-white/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* MAP TAB */}
        {tab === 'map' && (
          <div className="p-4 space-y-5">
            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-3">SELECT TERRAIN</label>
              <div className="grid grid-cols-3 gap-2">
                {MAPS.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedMap(id)}
                    className={`p-3 rounded-xl border-2 text-center transition-all active:scale-95 ${
                      selectedMap===id ? 'border-current' : 'border-white/8 bg-white/3'
                    }`}
                    style={selectedMap===id ? { borderColor:color, background:`${color}15` } : {}}
                  >
                    <div className="p-2 rounded-lg mx-auto w-fit mb-1.5" style={{ background:`${color}20` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="text-xs font-bold">{label}</div>
                    {selectedMap===id && <Check className="w-3 h-3 mx-auto mt-1" style={{ color }} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-3">MAP SIZE</label>
              <div className="flex gap-2">
                {(['small','medium','large'] as const).map(s => (
                  <button key={s} onClick={() => setMapSize(s)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 capitalize ${
                      mapSize===s ? 'bg-[#00b4ff]/15 border-[#00b4ff]/50 text-[#00b4ff]' : 'border-white/8 text-white/40'
                    }`}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-3">TIME OF DAY</label>
              <div className="grid grid-cols-4 gap-2">
                {(['dawn','day','dusk','night'] as const).map(t => (
                  <button key={t} onClick={() => setTimeOfDay(t)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 capitalize ${
                      timeOfDay===t ? 'bg-[#f59e0b]/15 border-[#f59e0b]/50 text-[#f59e0b]' : 'border-white/8 text-white/40'
                    }`}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-3">WEATHER</label>
              <div className="grid grid-cols-4 gap-2">
                {(['clear','fog','rain','storm'] as const).map(w => (
                  <button key={w} onClick={() => setWeatherEffect(w)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 capitalize ${
                      weatherEffect===w ? 'bg-[#60a5fa]/15 border-[#60a5fa]/50 text-[#60a5fa]' : 'border-white/8 text-white/40'
                    }`}>{w}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* OBJECTS TAB */}
        {tab === 'objects' && (
          <div className="p-4 space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <Building2 className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">Buildings, crates, walls and cover objects are placed automatically based on your map template.</p>
            </div>
            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-3">OBJECT DENSITY</label>
              <div className="flex gap-2">
                {['Sparse','Normal','Dense'].map(d => (
                  <button key={d} className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-white/8 text-white/40 hover:border-white/20 transition-all active:scale-95">{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-3">INCLUDE</label>
              {[['Buildings','#00b4ff',true],['Watchtowers','#a855f7',true],['Vehicles','#f59e0b',false],['Trees','#22c55e',true],['Rocks','#8b5cf6',true]].map(([l,c,on])=>(
                <div key={l as string} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-sm">{l as string}</span>
                  <div className={`w-10 h-5 rounded-full transition-colors ${on ? '' : 'bg-white/10'}`} style={on ? { background: c as string } : {}}>
                    <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${on ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEAPONS TAB */}
        {tab === 'weapons' && (
          <div className="p-4 space-y-4">
            <p className="text-xs text-white/35">Toggle which weapons players can find and use in your game.</p>
            <div className="space-y-2">
              {WEAPONS_LIST.map(({ id, label, emoji, damage, fire }) => {
                const on = weapons.includes(id);
                return (
                  <button key={id} onClick={() => toggleWeapon(id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all active:scale-95 text-left ${
                      on ? 'border-[#00b4ff]/50 bg-[#00b4ff]/8' : 'border-white/8 bg-white/3 opacity-50'
                    }`}>
                    <span className="text-2xl">{emoji}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{label}</div>
                      <div className="text-[10px] text-white/35">Damage: {damage} · {fire}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${on ? 'bg-[#00b4ff] border-[#00b4ff]' : 'border-white/20'}`}>
                      {on && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* RULES TAB */}
        {tab === 'rules' && (
          <div className="p-4 space-y-5">
            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-2">MAX PLAYERS</label>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white/60">Players</span>
                <span className="font-bold text-[#00b4ff]">{maxPlayers}</span>
              </div>
              <input type="range" min={2} max={100} value={maxPlayers} onChange={e=>setMaxPlayers(+e.target.value)}
                className="w-full accent-[#00b4ff]" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white/60">Time Limit</span>
                <span className="font-bold text-[#00b4ff]">{timeLimit} min</span>
              </div>
              <input type="range" min={3} max={60} value={timeLimit} onChange={e=>setTimeLimit(+e.target.value)}
                className="w-full accent-[#00b4ff]" />
            </div>
            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-3">WIN CONDITION</label>
              <div className="space-y-2">
                {WIN_CONDITIONS.map(w => (
                  <button key={w} onClick={() => setWinCondition(w)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all active:scale-95 ${
                      winCondition===w ? 'border-[#00b4ff]/50 bg-[#00b4ff]/10 text-[#00b4ff]' : 'border-white/8 text-white/50'
                    }`}>{w}</button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label:'Friendly Fire', val:friendlyFire, set:setFriendlyFire },
                { label:'Respawns Enabled', val:respawns, set:setRespawns },
              ].map(({ label, val, set }) => (
                <button key={label} onClick={() => set(!val)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/8 bg-white/3 transition-all active:scale-95">
                  <span className="text-sm">{label}</span>
                  <div className={`w-10 h-5 rounded-full transition-colors ${val ? 'bg-[#00b4ff]' : 'bg-white/15'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white m-0.5 transition-transform ${val ? 'translate-x-5' : ''}`} />
                  </div>
                </button>
              ))}
              {respawns && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/60">Respawn Delay</span>
                    <span className="font-bold text-[#00b4ff]">{respawnDelay}s</span>
                  </div>
                  <input type="range" min={0} max={30} value={respawnDelay} onChange={e=>setRespawnDelay(+e.target.value)}
                    className="w-full accent-[#00b4ff]" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* PLAYERS TAB */}
        {tab === 'players' && (
          <div className="p-4 space-y-5">
            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-3">AI SOLDIERS</label>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white/60">NPC Count</span>
                <span className="font-bold text-[#00b4ff]">{npcCount}</span>
              </div>
              <input type="range" min={0} max={40} value={npcCount} onChange={e=>setNpcCount(+e.target.value)}
                className="w-full accent-[#00b4ff]" />
            </div>
            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-3">AI DIFFICULTY</label>
              <div className="flex gap-2">
                {(['easy','medium','hard'] as const).map(d => (
                  <button key={d} onClick={() => setAiDifficulty(d)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 capitalize ${
                      aiDifficulty===d
                        ? d==='easy' ? 'bg-green-500/15 border-green-500/50 text-green-400'
                        : d==='medium' ? 'bg-[#f59e0b]/15 border-[#f59e0b]/50 text-[#f59e0b]'
                        : 'bg-red-500/15 border-red-500/50 text-red-400'
                        : 'border-white/8 text-white/40'
                    }`}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-3">VISIBILITY</label>
              <div className="flex gap-2">
                <button onClick={() => setIsPrivate(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all active:scale-95 ${!isPrivate ? 'bg-[#00b4ff]/15 border-[#00b4ff]/50 text-[#00b4ff]' : 'border-white/8 text-white/40'}`}>
                  <Globe className="w-4 h-4" /> Public
                </button>
                <button onClick={() => setIsPrivate(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all active:scale-95 ${isPrivate ? 'bg-[#a855f7]/15 border-[#a855f7]/50 text-[#a855f7]' : 'border-white/8 text-white/40'}`}>
                  <Lock className="w-4 h-4" /> Private
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STYLE TAB */}
        {tab === 'style' && (
          <div className="p-4 space-y-5">
            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-3">GAME DESCRIPTION</label>
              <textarea
                placeholder="Describe your game to attract players…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#00b4ff]/50 resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 tracking-widest block mb-3">THEME COLOUR</label>
              <div className="grid grid-cols-6 gap-2">
                {['#00b4ff','#22c55e','#ef4444','#f59e0b','#a855f7','#ec4899',
                  '#06b6d4','#14b8a6','#f97316','#84cc16','#6366f1','#e11d48'].map(c => (
                  <button key={c} className="w-full aspect-square rounded-xl border-2 border-transparent hover:border-white/40 active:scale-90 transition-all"
                    style={{ background:c }} />
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── BOTTOM BAR ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-4 bg-[#0a0b16]/90 backdrop-blur-md border-t border-white/8 flex-shrink-0">
        <div className="flex-1 text-xs text-white/30">
          {selectedMapDef && (
            <span className="flex items-center gap-1.5">
              <selectedMapDef.icon className="w-3 h-3" style={{ color:selectedMapDef.color }} />
              {selectedMapDef.label} · {maxPlayers} players · {timeLimit}min · {weapons.length} weapons
            </span>
          )}
        </div>
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 text-[#00b4ff]" /> Preview
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-black transition-all active:scale-95 disabled:opacity-40"
          style={{ background:'linear-gradient(135deg,#00b4ff,#0077cc)' }}
        >
          <Globe className="w-3.5 h-3.5" />
          {publishing ? 'Publishing…' : 'Publish Game'}
        </button>
      </div>
    </div>
  );
}
