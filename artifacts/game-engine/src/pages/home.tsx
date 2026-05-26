import { useState } from 'react';
import { useLocation } from 'wouter';
import { Navbar } from '@/components/layout/Navbar';
import {
  Target, Sword, Car, Shield, Flag, Cpu, Zap, Skull,
  Plus, Play, Users, Trophy, Star, ChevronRight, Hammer,
  Globe, Lock, Clock, Gamepad2
} from 'lucide-react';

// ── Game type templates ────────────────────────────────────────
const TEMPLATES = [
  { id:'battle_royale',  label:'Battle Royale',    icon:Target,  color:'#ef4444', players:'100', desc:'Last player alive wins. Shrinking zone.' },
  { id:'deathmatch',     label:'Deathmatch',       icon:Sword,   color:'#00b4ff', players:'16',  desc:'Most kills wins. Fast respawns.' },
  { id:'free_for_all',   label:'Free For All',     icon:Zap,     color:'#f59e0b', players:'20',  desc:'Every player for themselves.' },
  { id:'squads',         label:'Squads',           icon:Users,   color:'#22c55e', players:'40',  desc:'4-player squads. Revive teammates.' },
  { id:'racing',         label:'Racing',           icon:Car,     color:'#a855f7', players:'20',  desc:'First to finish 3 laps wins.' },
  { id:'capture',        label:'Capture Points',   icon:Flag,    color:'#06b6d4', players:'32',  desc:'Hold zones to rack up points.' },
  { id:'zombies',        label:'Zombies',          icon:Skull,   color:'#84cc16', players:'8',   desc:'Survive waves of AI zombies.' },
  { id:'sandbox',        label:'Creative Sandbox', icon:Cpu,     color:'#ec4899', players:'16',  desc:'No rules. Build and experiment.' },
  { id:'tower_defense',  label:'Tower Defense',    icon:Shield,  color:'#f97316', players:'4',   desc:'Defend your base from waves.' },
  { id:'parkour',        label:'Parkour Race',     icon:Globe,   color:'#14b8a6', players:'10',  desc:'First to reach the end wins.' },
];

// ── Mock "my games" (will come from API) ──────────────────────
const MY_GAMES: { id: string; name: string; mode: string; color: string; players: number; status: 'live' | 'draft'; created: string }[] = [];

// ── Stat cards ────────────────────────────────────────────────
const STATS = [
  { label:'Games Created', value:'42',   icon:Gamepad2, color:'#00b4ff' },
  { label:'Active Players',value:'1,204',icon:Users,    color:'#22c55e' },
  { label:'Live Sessions', value:'8',    icon:Globe,    color:'#f59e0b' },
  { label:'Top Rated',     value:'⭐ 4.9',icon:Star,    color:'#a855f7' },
];

export default function HomePage() {
  const [, nav] = useLocation();
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const startCreating = (templateId?: string) => {
    const qs = templateId ? `?template=${templateId}` : '';
    nav(`/studio${qs}`);
  };

  return (
    <div className="min-h-screen bg-[#07080f] text-white">
      <Navbar />

      <div className="pt-14">

        {/* ── HERO ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:'linear-gradient(#00b4ff 1px,transparent 1px),linear-gradient(90deg,#00b4ff 1px,transparent 1px)',
              backgroundSize:'48px 48px',
            }} />

          {/* Glow orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background:'#00b4ff' }} />
          <div className="absolute top-10 right-1/4 w-64 h-64 rounded-full opacity-8 blur-3xl" style={{ background:'#a855f7' }} />

          <div className="relative z-10 px-5 py-16 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#00b4ff]/10 border border-[#00b4ff]/30 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-widest text-[#00b4ff] mb-6">
              <Hammer className="w-3 h-3" /> GAME CREATOR PLATFORM
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              Build <span style={{ color:'#00b4ff', textShadow:'0 0 30px #00b4ff88' }}>Any Game</span><br/>You Imagine
            </h1>
            <p className="text-white/45 text-base leading-relaxed mb-8 max-w-md mx-auto">
              Design, build and publish 3D games directly from your phone. Pick a template, customise everything, go live in minutes.
            </p>
            <button
              onClick={() => startCreating()}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-lg text-black transition-all active:scale-95 hover:scale-105"
              style={{ background:'linear-gradient(135deg,#00b4ff,#0077cc)', boxShadow:'0 0 40px #00b4ff44' }}
            >
              <Plus className="w-5 h-5" /> Create New Game
            </button>
          </div>
        </div>

        {/* ── STATS BAR ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 pb-8 max-w-2xl mx-auto">
          {STATS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/[0.04] border border-white/8 rounded-2xl px-4 py-3 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
              <div className="text-xl font-black" style={{ color }}>{value}</div>
              <div className="text-[10px] text-white/35 tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ── GAME TEMPLATES ────────────────────────────────────── */}
        <div className="px-4 pb-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black tracking-tight">Choose a Template</h2>
              <span className="text-[11px] text-white/30">{TEMPLATES.length} types</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEMPLATES.map(({ id, label, icon: Icon, color, players, desc }) => {
                const isHovered = hoveredTemplate === id;
                return (
                  <button
                    key={id}
                    onMouseEnter={() => setHoveredTemplate(id)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    onClick={() => startCreating(id)}
                    className="relative group text-left p-4 rounded-2xl border transition-all duration-200 active:scale-95"
                    style={{
                      borderColor: isHovered ? `${color}70` : 'rgba(255,255,255,0.07)',
                      background:  isHovered ? `${color}12` : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {/* Icon */}
                    <div className="mb-3 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background:`${color}20`, boxShadow: isHovered ? `0 0 16px ${color}44` : 'none' }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    {/* Label */}
                    <div className="font-bold text-sm leading-tight mb-1">{label}</div>
                    {/* Description */}
                    <div className="text-[11px] text-white/40 leading-tight mb-3">{desc}</div>
                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-white/30">
                        <Users className="w-2.5 h-2.5" /> up to {players}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold transition-colors"
                        style={{ color: isHovered ? color : 'rgba(255,255,255,0.25)' }}>
                        Build <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MY GAMES ──────────────────────────────────────────── */}
        <div className="px-4 pb-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black tracking-tight">My Games</h2>
              <button onClick={() => nav('/lobby')} className="text-[11px] text-white/30 hover:text-white transition-colors">
                Browse All
              </button>
            </div>

            {MY_GAMES.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-2xl py-12 text-center">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Gamepad2 className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-white/30 text-sm mb-4">You haven't created any games yet.</p>
                <button
                  onClick={() => startCreating()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black transition-all active:scale-95"
                  style={{ background:'#00b4ff' }}
                >
                  <Plus className="w-4 h-4" /> Create Your First Game
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {MY_GAMES.map((game) => (
                  <div key={game.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="w-10 h-10 rounded-xl" style={{ background:`${game.color}30`, border:`1px solid ${game.color}50` }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">{game.name}</div>
                      <div className="text-[11px] text-white/35">{game.mode} · {game.players} players · {game.created}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {game.status === 'live'
                        ? <span className="text-[10px] font-bold text-green-400 flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> LIVE</span>
                        : <span className="text-[10px] font-bold text-white/30 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> DRAFT</span>
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => nav(`/studio?id=${game.id}`)}
                        className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all">
                        <Hammer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => nav('/play')}
                        className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                        style={{ background:`${game.color}30` }}>
                        <Play className="w-3.5 h-3.5" style={{ color:game.color }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <div className="px-4 pb-14">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-black tracking-tight text-center mb-6">How It Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { n:'01', title:'Pick a Template', desc:'Choose from 10 game types — Battle Royale, Deathmatch, Racing, Zombies and more.', color:'#00b4ff' },
                { n:'02', title:'Customise Everything', desc:'Set the map, rules, weapons, player count, time limits, AI difficulty and more.', color:'#a855f7' },
                { n:'03', title:'Publish & Play', desc:'Go live in seconds. Anyone on Apex-Fort can join your game and play instantly.', color:'#22c55e' },
              ].map(({ n, title, desc, color }) => (
                <div key={n} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                  <div className="text-3xl font-black mb-3 opacity-20">{n}</div>
                  <div className="font-bold mb-2" style={{ color }}>{title}</div>
                  <div className="text-sm text-white/40 leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM CTA ────────────────────────────────────────── */}
        <div className="px-4 pb-16">
          <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-[#00b4ff]/10 to-[#a855f7]/10 border border-white/10 rounded-3xl py-10 px-6">
            <Trophy className="w-10 h-10 text-[#f59e0b] mx-auto mb-3" />
            <h3 className="text-xl font-black mb-2">Ready to build something epic?</h3>
            <p className="text-white/40 text-sm mb-6">Your first game takes less than 3 minutes to create and publish.</p>
            <button
              onClick={() => startCreating()}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-base text-black transition-all active:scale-95"
              style={{ background:'linear-gradient(135deg,#00b4ff,#0077cc)' }}
            >
              <Plus className="w-4 h-4" /> Start Building Now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
