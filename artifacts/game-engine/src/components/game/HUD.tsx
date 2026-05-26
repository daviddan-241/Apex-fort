import { useGameStore, GAME_MODES, GAME_MODE_LABELS, GAME_MODE_COLORS } from '@/store/gameStore';
import { Upload, Skull, Target, MessageSquare } from 'lucide-react';

export function HUD() {
  const {
    health, maxHealth, shield, maxShield, ammo, maxAmmo,
    kills, deaths, killFeed, gameModeIndex,
    toggleChat, toggleUploader, isPlayerActive,
  } = useGameStore();

  const mode      = GAME_MODES[gameModeIndex];
  const modeLabel = GAME_MODE_LABELS[mode];
  const modeColor = GAME_MODE_COLORS[mode];
  const kd        = deaths === 0 ? kills.toFixed(1) : (kills / deaths).toFixed(2);
  const hPct      = Math.max(0, (health / maxHealth) * 100);
  const sPct      = Math.max(0, (shield / maxShield) * 100);

  return (
    <div className="relative w-full h-full pointer-events-none select-none font-mono text-white">

      {/* Crosshair — only when player is controlling */}
      {isPlayerActive && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute w-5 h-px bg-white/65" />
            <div className="absolute w-px h-5 bg-white/65" />
            <div className="absolute w-2.5 h-2.5 border border-white/35 rounded-full" />
          </div>
        </div>
      )}

      {/* Cinematic hint */}
      {!isPlayerActive && (
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 pointer-events-none" style={{ animation:'fadePulse 2.5s ease infinite' }}>
          <div className="text-[10px] tracking-[0.5em] text-white/25 font-mono uppercase">Cinematic · Tap or move to play</div>
        </div>
      )}

      {/* Health / Shield — top left */}
      <div className="absolute top-4 left-4 w-52 space-y-2">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
          <div className="mb-2.5 space-y-1">
            <div className="flex justify-between text-[10px] font-bold tracking-widest text-blue-300">
              <span>SHIELD</span><span>{Math.round(shield)}</span>
            </div>
            <div className="h-1.5 w-full bg-blue-950/70 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width:`${sPct}%`, background:'linear-gradient(90deg,#1d4ed8,#38bdf8)' }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold tracking-widest text-green-300">
              <span>HEALTH</span><span>{Math.round(health)}</span>
            </div>
            <div className="h-1.5 w-full bg-green-950/70 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width:`${hPct}%`, background: hPct>60 ? 'linear-gradient(90deg,#16a34a,#4ade80)' : hPct>30 ? 'linear-gradient(90deg,#ca8a04,#facc15)' : 'linear-gradient(90deg,#dc2626,#f87171)' }} />
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[['KILLS', String(kills),'#00b4ff'],['K/D',kd,'#fff'],['DEATHS',String(deaths),'#f87171']].map(([l,v,c])=>(
            <div key={l} className="flex-1 bg-black/55 border border-white/10 rounded-lg px-2 py-1.5 text-center">
              <div className="text-[9px] text-white/35 tracking-wider">{l}</div>
              <div className="text-sm font-bold" style={{color:c}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mode badge + minimap — top right */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border rounded-full px-3 py-1.5"
          style={{ borderColor:`${modeColor}55` }}>
          <div className="w-2 h-2 rounded-full" style={{ background:modeColor, boxShadow:`0 0 8px ${modeColor}` }} />
          <span className="text-[10px] font-bold tracking-widest" style={{color:modeColor}}>{modeLabel.toUpperCase()}</span>
        </div>
        <div className="w-28 h-28 rounded-full bg-black/65 backdrop-blur-md border border-white/15 overflow-hidden relative shadow-2xl">
          {[[-0.35,-0.35],[-0.45,0],[-0.35,0.35],[-0.22,-0.45],[-0.5,-0.22]].map(([x,z],i)=>(
            <div key={i} className="absolute rounded-full" style={{ width:4,height:4,background:'#22c55e',boxShadow:'0 0 4px #22c55e',left:`${(x+0.7)*100}%`,top:`${(z+0.7)*100}%`,transform:'translate(-50%,-50%)' }} />
          ))}
          {[[0.35,0.35],[0.45,0],[0.35,-0.35],[0.22,0.45],[0.5,0.22]].map(([x,z],i)=>(
            <div key={i} className="absolute rounded-full" style={{ width:4,height:4,background:'#ef4444',boxShadow:'0 0 4px #ef4444',left:`${(x+0.7)*100}%`,top:`${(z+0.7)*100}%`,transform:'translate(-50%,-50%)' }} />
          ))}
          <div className="absolute rounded-full" style={{ width:6,height:6,background:'#fff',boxShadow:'0 0 8px #fff',left:'50%',top:'50%',transform:'translate(-50%,-50%)' }} />
          {['N','S','W','E'].map((d,i)=>{
            const s=[{top:3,left:'50%',transform:'translateX(-50%)'},{bottom:3,left:'50%',transform:'translateX(-50%)'},
              {left:3,top:'50%',transform:'translateY(-50%)'},{right:3,top:'50%',transform:'translateY(-50%)'}];
            return <div key={d} className="absolute text-[8px] font-bold text-white/35" style={{position:'absolute',...s[i] as React.CSSProperties}}>{d}</div>;
          })}
        </div>
      </div>

      {/* Ammo — bottom right */}
      <div className="absolute bottom-6 right-6">
        <div className="bg-black/65 backdrop-blur-md border border-white/15 rounded-xl px-5 py-3 shadow-2xl text-right">
          <div className="text-[9px] text-white/35 tracking-widest mb-0.5">AMMO</div>
          <div className="flex items-end gap-1 justify-end">
            <span className="text-5xl font-black leading-none" style={{color:ammo<6?'#ef4444':'#fff'}}>{ammo}</span>
            <span className="text-sm text-white/30 mb-0.5">/ {maxAmmo}</span>
          </div>
        </div>
      </div>

      {/* Action buttons — bottom left */}
      <div className="absolute bottom-6 left-6 flex gap-2 pointer-events-auto">
        <button onClick={toggleChat}
          className="bg-black/65 hover:bg-black/90 backdrop-blur-md border border-white/15 h-10 rounded-full px-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wider transition-all hover:scale-105 active:scale-95">
          <MessageSquare className="w-3.5 h-3.5 text-[#00b4ff]" /> AI
        </button>
        <button onClick={toggleUploader}
          className="bg-black/65 hover:bg-black/90 backdrop-blur-md border border-white/15 h-10 rounded-full px-3 flex items-center gap-1.5 text-[10px] font-bold tracking-wider transition-all hover:scale-105 active:scale-95">
          <Upload className="w-3.5 h-3.5 text-purple-400" /> UE5
        </button>
      </div>

      {/* Kill feed — right side */}
      <div className="absolute top-44 right-4 flex flex-col gap-1 items-end">
        {killFeed.map((e) => (
          <div key={e.id} className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1 text-[10px] shadow-xl"
            style={{ animation:'slideIn .25s ease' }}>
            <span className="font-bold text-[#00b4ff]">{e.killer}</span>
            <Target className="w-2.5 h-2.5 text-white/35" />
            <span className="text-white/55">{e.victim}</span>
            <Skull className="w-2.5 h-2.5 text-red-400" />
            <span className="text-white/30">{e.weapon}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadePulse { 0%,100%{opacity:.2} 50%{opacity:.7} }
      `}</style>
    </div>
  );
}
