import { useState, useEffect } from "react";
import { useGameStore } from "../../store/gameStore";
import { CHARACTERS } from "../../data/characters";

const CHAR_ICONS: Record<string, string> = {
  soldier: "🪖", ninja: "🥷", cyber: "🤖", warrior: "⚔️",
  ghost: "👻", hero: "🦸", assassin: "🗡️", thief: "🎭",
};

const MODES = [
  { id: "br",    label: "BATTLE ROYALE", sub: "Solo · Fill",    tag: "",       img: "🎯", color: "#1a4a8a" },
  { id: "squad", label: "BLITZ ROYALE",  sub: "Squad · Fill",   tag: "HOT",    img: "⚡", color: "#4a1a6a" },
  { id: "build", label: "ZERO BUILD",    sub: "Duos · Fill",    tag: "NEW",    img: "🏗️", color: "#1a6a4a" },
  { id: "team",  label: "TEAM RUMBLE",   sub: "Team · Fill",    tag: "",       img: "👥", color: "#6a4a1a" },
];

const SQUAD_SLOTS = [
  { name: "Rumi-974", platform: "🎮", status: "online",  icon: "🥷" },
  { name: "JaxPlayer",platform: "📱", status: "online",  icon: "🤖" },
  { name: null,       platform: "",   status: "empty",   icon: "" },
];

const NEWS_CARDS = [
  { title: "BATTLE ROYALE",   tag: "",       color: "#2a4a8a", img: "🎯" },
  { title: "THE MANDALORIAN", tag: "NEW",    color: "#3a2a5a", img: "⚔️" },
  { title: "BATTLE LAB",      tag: "",       color: "#1a3a3a", img: "🔬" },
  { title: "SUPER POWERS",    tag: "UPDATED",color: "#4a2a1a", img: "💥" },
  { title: "RELOAD",          tag: "HOT",    color: "#5a1a1a", img: "🔄" },
];

const TIPS = [
  "Build a 1×1 box for cover while you heal",
  "High ground wins fights — always push for elevation",
  "Always loot supply drops — they have legendary loot",
  "The storm shrinks — watch your minimap circle",
  "Harvest metal from cars for the strongest builds",
];

export default function MainMenu() {
  const setPhase = useGameStore((s) => s.setPhase);
  const reset = useGameStore((s) => s.reset);
  const [activeMode, setActiveMode] = useState("squad");
  const [activeTab, setActiveTab] = useState("play");
  const [tipIdx, setTipIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(2); // default cyber = ice-look
  const char = CHARACTERS[charIdx % CHARACTERS.length];

  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const selectedMode = MODES.find(m => m.id === activeMode) ?? MODES[0];

  const handlePlay = () => { reset(); setPhase("character-select"); };

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", fontFamily: "'Segoe UI', system-ui, sans-serif", userSelect: "none" }}>

      {/* ── HERO BACKGROUND (IMG_5050 - ninja warrior) ── */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url('/lobby-hero.jpg')",
        backgroundSize: "cover", backgroundPosition: "center 30%",
        filter: "brightness(0.55) saturate(1.2)",
      }} />

      {/* Purple/sunset atmosphere overlay matching IMG_5049 */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(40,10,60,0.75) 0%, rgba(60,20,30,0.45) 40%, rgba(20,30,60,0.65) 100%)" }} />
      {/* Bottom fade */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to top, rgba(0,0,0,0.92), transparent)" }} />
      {/* Top fade */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "15%", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }} />

      {/* ── TOP NAV BAR (matches IMG_5049 exactly) ── */}
      <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ── CENTER: Character Showcase on Platform ── */}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -58%)", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 5 }}>

        {/* Player name tag above character */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
          background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 20, padding: "4px 14px", backdropFilter: "blur(8px)",
        }}>
          <div style={{ background: "linear-gradient(135deg, #9b59b6, #6c3483)", borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 900, color: "#fff" }}>37</div>
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>TheCassiniJohn</span>
          <span style={{ fontSize: 12 }}>📱</span>
          <span style={{ fontSize: 12, opacity: 0.5 }}>🔇</span>
        </div>

        {/* Character body — ice/armor style like IMG_5049 */}
        <CharacterShowcase char={char} charIdx={charIdx} setCharIdx={setCharIdx} />

        {/* Glowing platform */}
        <div style={{ position: "relative", marginTop: -8, width: 180, height: 18 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: `radial-gradient(ellipse, ${char.accentColor}88 0%, transparent 70%)`, filter: "blur(8px)" }} />
          {/* Platform circle disc */}
          <div style={{ position: "absolute", inset: 4, top: 6, borderRadius: "50%", border: `1.5px solid ${char.accentColor}55`, background: `linear-gradient(to bottom, ${char.accentColor}22, transparent)` }} />
        </div>

        {/* Squad slots below character */}
        <div style={{ display: "flex", gap: 28, marginTop: 10 }}>
          {SQUAD_SLOTS.map((slot, i) => (
            <SquadSlot key={i} slot={slot} charColor={char.accentColor} />
          ))}
        </div>
      </div>

      {/* ── LEFT: News card (small, like IMG_5049 top-left) ── */}
      <div style={{ position: "absolute", left: 16, top: 58, zIndex: 10, width: 168 }}>
        <NewsCard title="ISLAND UPDATE" tag="NEW" subtitle="New POIs added: Cyber City, Sunset Shores" color="#1a3a5a" icon="🗺️" />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ position: "absolute", right: 12, top: 58, bottom: 80, zIndex: 10, display: "flex", flexDirection: "column", gap: 6, width: 210 }}>
        {/* Victory progress */}
        <VictoryWingsCard />
        {/* Rewards */}
        <RewardsCard />
        {/* Level badge */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ background: "linear-gradient(135deg, #ff8c00, #ff5500)", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 900, letterSpacing: 1, color: "#fff" }}>LVL 31</div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Music player */}
        <MusicPlayer />
        {/* Chat/Emote/Back buttons */}
        <div style={{ display: "flex", gap: 5 }}>
          {["CHAT", "EMOTE", "BACK"].map(label => (
            <button key={label} onClick={label === "BACK" ? undefined : undefined} style={{
              flex: 1, padding: "8px 0", background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 5, color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 1,
              cursor: "pointer", backdropFilter: "blur(6px)",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── BOTTOM LEFT: Mode card + PLAY ── */}
      <div style={{ position: "absolute", bottom: 80, left: 12, zIndex: 10, width: 200 }}>
        <ModeCard mode={selectedMode} onPlay={handlePlay} onModeChange={() => {
          const idx = MODES.findIndex(m => m.id === activeMode);
          setActiveMode(MODES[(idx + 1) % MODES.length].id);
        }} />
      </div>

      {/* ── BOTTOM CENTER: News carousel ── */}
      <div style={{ position: "absolute", bottom: 0, left: 220, right: 230, zIndex: 10, height: 76 }}>
        <div style={{ display: "flex", gap: 6, height: "100%", alignItems: "flex-end", paddingBottom: 8, overflowX: "auto" }}>
          {NEWS_CARDS.map((card, i) => (
            <NewsCarouselCard key={i} card={card} />
          ))}
        </div>
      </div>

      {/* ── Tip bar ── */}
      <div style={{ position: "absolute", bottom: 82, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.5)", borderRadius: 20, padding: "4px 16px", border: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ color: "#ffd700", fontSize: 10 }}>💡</span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, whiteSpace: "nowrap" }}>{TIPS[tipIdx]}</span>
      </div>
    </div>
  );
}

/* ── TOP NAV BAR ── */
function TopNavBar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (t: string) => void }) {
  const NAV = [
    { id: "play",   icon: "▶",  label: "PLAY" },
    { id: "shop",   icon: "🛒", label: "" },
    { id: "locker", icon: "👕", label: "" },
    { id: "quests", icon: "⭐", label: "", badge: 3 },
    { id: "career", icon: "📋", label: "" },
    { id: "trophy", icon: "🏆", label: "" },
    { id: "shield", icon: "🛡️", label: "" },
  ];
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
      background: "rgba(0,0,0,0.72)", borderBottom: "1px solid rgba(255,255,255,0.06)",
      display: "flex", alignItems: "stretch", height: 48,
      backdropFilter: "blur(12px)",
    }}>
      {NAV.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: active ? "rgba(255,255,255,0.1)" : "transparent",
            borderBottom: active ? "2px solid #fff" : "2px solid transparent",
            border: "none", padding: "0 14px", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
            position: "relative", minWidth: 42,
          }}>
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.label && <span style={{ color: active ? "#fff" : "rgba(255,255,255,0.55)", fontSize: 8, fontWeight: 800, letterSpacing: 1 }}>{tab.label}</span>}
            {tab.badge && <div style={{ position: "absolute", top: 4, right: 8, width: 12, height: 12, borderRadius: "50%", background: "#f39c12", fontSize: 7, fontWeight: 900, color: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>{tab.badge}</div>}
          </button>
        );
      })}

      {/* V-Bucks */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", borderLeft: "1px solid rgba(255,255,255,0.08)", marginLeft: 4 }}>
        <span style={{ fontSize: 13 }}>⭐</span>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>1,800</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Player avatar top right */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #e94560, #1a1a2e)",
          border: "2px solid rgba(255,255,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
        }}>🥷</div>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71", border: "1.5px solid rgba(0,0,0,0.5)" }} />
      </div>
    </div>
  );
}

/* ── CHARACTER SHOWCASE ── */
function CharacterShowcase({ char, charIdx, setCharIdx }: { char: any; charIdx: number; setCharIdx: (i: number) => void }) {
  return (
    <div
      style={{ animation: "lobby-float 3.2s ease-in-out infinite", cursor: "pointer", position: "relative" }}
      onClick={() => setCharIdx(charIdx + 1)}
      title="Click to change character"
    >
      {/* Outer glow ring */}
      <div style={{
        position: "absolute", inset: -24, borderRadius: "50%",
        border: `1px solid ${char.accentColor}44`,
        animation: "pulse-ring 3s infinite",
      }} />
      {/* Character body — detailed like ice armor */}
      <div style={{ position: "relative", width: 140, height: 220 }}>
        {/* Legs */}
        {[[-16, 0], [16, 0]].map(([x], i) => (
          <div key={i} style={{ position: "absolute", bottom: 0, left: `calc(50% + ${x}px)`, transform: "translateX(-50%)" }}>
            {/* Upper leg */}
            <div style={{ width: 28, height: 55, borderRadius: "8px 8px 4px 4px", background: `linear-gradient(170deg, ${char.accentColor}, ${char.color})`, marginBottom: 1 }}>
              <div style={{ width: "70%", height: "40%", margin: "6px auto", borderRadius: 3, background: `${char.accentColor}66` }} />
            </div>
            {/* Lower leg / boot */}
            <div style={{ width: 26, height: 42, borderRadius: "4px 4px 6px 6px", background: `linear-gradient(160deg, ${char.color}, ${char.color}aa)`, marginLeft: 1 }}>
              <div style={{ position: "absolute", bottom: 0, left: -2, right: -2, height: 10, background: char.color, borderRadius: "0 0 8px 8px" }} />
            </div>
          </div>
        ))}
        {/* Torso — armored chest */}
        <div style={{
          position: "absolute", left: "50%", top: 80, transform: "translateX(-50%)",
          width: 88, height: 100, borderRadius: "22% 22% 14% 14% / 18% 18% 12% 12%",
          background: `linear-gradient(155deg, ${char.accentColor}, ${char.color}, ${char.color}88)`,
          boxShadow: `0 0 30px ${char.accentColor}55, 0 20px 40px rgba(0,0,0,0.6)`,
        }}>
          {/* Chest plate */}
          <div style={{ position: "absolute", top: 8, left: 8, right: 8, height: 35, borderRadius: "10px 10px 6px 6px", background: `${char.accentColor}66`, border: `1px solid ${char.accentColor}88` }} />
          {/* Belly armor */}
          <div style={{ position: "absolute", bottom: 8, left: 10, right: 10, height: 20, borderRadius: 4, background: `${char.color}88`, border: `1px solid ${char.accentColor}33` }} />
          {/* Glow center */}
          <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", width: 14, height: 14, borderRadius: "50%", background: char.accentColor, boxShadow: `0 0 12px ${char.accentColor}` }} />
        </div>
        {/* Shoulder pads */}
        {[[-52, 84], [52, 84]].map(([x, y], i) => (
          <div key={i} style={{
            position: "absolute", left: `calc(50% + ${x}px)`, top: y, transform: "translateX(-50%)",
            width: 24, height: 28, borderRadius: "50% 50% 30% 30%",
            background: `linear-gradient(140deg, ${char.accentColor}, ${char.color})`,
            boxShadow: `0 0 10px ${char.accentColor}55`,
          }} />
        ))}
        {/* Arms */}
        {[[-44, 96], [44, 96]].map(([x, y], i) => (
          <div key={i} style={{
            position: "absolute", left: `calc(50% + ${x}px)`, top: y, transform: `translateX(-50%) rotate(${i===0?"-5deg":"5deg"})`,
            width: 22, height: 68, borderRadius: "30% 30% 20% 20%",
            background: `linear-gradient(160deg, ${char.accentColor}cc, ${char.color})`,
          }}>
            {/* Forearm armor */}
            <div style={{ position: "absolute", top: "40%", left: 1, right: 1, bottom: 4, borderRadius: "0 0 10px 10px", background: `${char.accentColor}55` }} />
          </div>
        ))}
        {/* Head / Helmet */}
        <div style={{
          position: "absolute", left: "50%", top: 14, transform: "translateX(-50%)",
          width: 62, height: 66, borderRadius: "45% 45% 40% 40%",
          background: `radial-gradient(circle at 38% 28%, ${char.accentColor}, ${char.color})`,
          border: `2px solid ${char.accentColor}`,
          boxShadow: `0 0 20px ${char.accentColor}88, 0 0 40px ${char.accentColor}33`,
        }}>
          {/* Visor */}
          <div style={{ position: "absolute", top: "28%", left: "15%", right: "15%", height: "25%", borderRadius: 4, background: "linear-gradient(135deg, rgba(100,200,255,0.7), rgba(0,100,200,0.5))", boxShadow: "inset 0 0 6px rgba(255,255,255,0.3)" }} />
          {/* Helmet crest / spikes */}
          <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", width: 8, height: 16, borderRadius: "0 0 4px 4px", background: char.accentColor, clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
        </div>
        {/* Weapon (right hand) */}
        <div style={{ position: "absolute", right: -10, top: 100, transform: "rotate(12deg)" }}>
          <div style={{ width: 12, height: 55, borderRadius: "2px 2px 4px 4px", background: "linear-gradient(160deg, #555, #222)", boxShadow: `0 0 8px ${char.accentColor}55` }} />
          <div style={{ width: 18, height: 8, borderRadius: 2, background: "#333", marginTop: 2, marginLeft: -3 }} />
          {/* Energy glow on weapon */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 4, height: "100%", background: `linear-gradient(to bottom, ${char.accentColor}88, transparent)`, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

/* ── SQUAD SLOT ── */
function SquadSlot({ slot, charColor }: { slot: any; charColor: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        width: 54, height: 54, borderRadius: "50%",
        background: slot.status === "empty" ? "rgba(255,255,255,0.06)" : `radial-gradient(circle, ${charColor}44, rgba(0,0,0,0.5))`,
        border: `1.5px solid ${slot.status === "empty" ? "rgba(255,255,255,0.18)" : charColor + "66"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(8px)",
        boxShadow: slot.status !== "empty" ? `0 0 12px ${charColor}44` : "none",
      }}>
        {slot.status === "empty" ? (
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }}>+</span>
        ) : (
          <span style={{ fontSize: 22 }}>{slot.icon}</span>
        )}
      </div>
      {slot.name && (
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 8, fontWeight: 700, whiteSpace: "nowrap" }}>{slot.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "center" }}>
            <span style={{ fontSize: 8 }}>{slot.platform}</span>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#2ecc71" }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MODE CARD ── */
function ModeCard({ mode, onPlay, onModeChange }: { mode: any; onPlay: () => void; onModeChange: () => void }) {
  return (
    <div style={{ background: "rgba(0,0,0,0.82)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, overflow: "hidden", backdropFilter: "blur(16px)" }}>
      {/* Header banner */}
      <div style={{ background: mode.color, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{mode.img}</span>
        <span style={{ color: "#fff", fontSize: 12, fontWeight: 900, letterSpacing: 1 }}>{mode.label}</span>
        {mode.tag && <div style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", borderRadius: 3, padding: "1px 5px", fontSize: 7, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>{mode.tag}</div>}
      </div>
      {/* Sub-mode selector */}
      <div style={{ padding: "7px 12px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>≡=</span>
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700 }}>{mode.sub}</span>
        <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)", fontSize: 10, cursor: "pointer" }} onClick={onModeChange}>▼</span>
      </div>
      {/* PLAY button */}
      <div style={{ padding: "8px 12px" }}>
        <button
          className="lobby-btn-primary"
          onClick={onPlay}
          style={{
            width: "100%", padding: "11px 0", fontSize: 15, fontWeight: 900,
            letterSpacing: 5, cursor: "pointer",
            background: "linear-gradient(135deg, #f1c40f, #f39c12)",
            border: "none", borderRadius: 6, color: "#000",
            boxShadow: "0 0 20px rgba(241,196,15,0.4), 0 4px 12px rgba(0,0,0,0.5)",
            textTransform: "uppercase",
          }}
        >
          PLAY
        </button>
      </div>
    </div>
  );
}

/* ── VICTORY WINGS ── */
function VictoryWingsCard() {
  return (
    <div style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", backdropFilter: "blur(10px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: "linear-gradient(135deg, #9b59b6, #6c3483)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🪽</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#f39c12", fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>LEGENDARY VICTORY WINGS</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, marginTop: 1 }}>35 wins to advance</div>
        </div>
      </div>
      <div style={{ marginTop: 6, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: "20%", height: "100%", background: "linear-gradient(90deg, #9b59b6, #f39c12)" }} />
      </div>
    </div>
  );
}

/* ── REWARDS CARD ── */
function RewardsCard() {
  return (
    <div style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,180,0,0.3)", borderRadius: 8, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(10px)", cursor: "pointer" }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #f39c12, #e67e22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#000" }}>2</div>
      <div>
        <div style={{ color: "#ffd700", fontSize: 11, fontWeight: 900 }}>REWARDS TO CLAIM</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>Tap to collect</div>
      </div>
      <span style={{ marginLeft: "auto", color: "#ffd700", fontSize: 16 }}>›</span>
    </div>
  );
}

/* ── MUSIC PLAYER ── */
function MusicPlayer() {
  return (
    <div style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", backdropFilter: "blur(10px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ width: 28, height: 28, borderRadius: 4, background: "linear-gradient(135deg, #e94560, #1a1a2e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🎵</div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ color: "#fff", fontSize: 9, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Chapter 5 Island Theme</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 8 }}>Apex Fort OST</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
        {["◀◀", "⏸", "▶▶"].map(btn => (
          <button key={btn} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", padding: "2px 4px" }}>{btn}</button>
        ))}
        <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 1, overflow: "hidden", marginLeft: 4 }}>
          <div style={{ width: "35%", height: "100%", background: "#fff" }} />
        </div>
      </div>
    </div>
  );
}

/* ── SMALL NEWS CARD ── */
function NewsCard({ title, tag, subtitle, color, icon }: { title: string; tag: string; subtitle: string; color: string; icon: string }) {
  return (
    <div style={{ background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden", backdropFilter: "blur(10px)" }}>
      <div style={{ background: color, padding: "20px 12px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        {tag && <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 3, padding: "1px 5px", fontSize: 7, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>{tag}</div>}
        <div style={{ fontSize: 24 }}>{icon}</div>
        <div style={{ color: "#fff", fontSize: 10, fontWeight: 900, lineHeight: 1.2 }}>{title}</div>
      </div>
      <div style={{ padding: "5px 8px" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, lineHeight: 1.4, margin: 0 }}>{subtitle}</p>
      </div>
    </div>
  );
}

/* ── NEWS CAROUSEL CARD ── */
function NewsCarouselCard({ card }: { card: any }) {
  return (
    <div style={{
      flexShrink: 0, width: 110, height: 68,
      background: `linear-gradient(160deg, ${card.color}, rgba(0,0,0,0.7))`,
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
      display: "flex", flexDirection: "column", alignItems: "flex-start",
      justifyContent: "flex-end", padding: "5px 8px", cursor: "pointer",
      overflow: "hidden", position: "relative", backdropFilter: "blur(8px)",
      transition: "transform 0.15s",
    }}>
      <div style={{ position: "absolute", top: 4, right: 4, fontSize: 18 }}>{card.img}</div>
      {card.tag && <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 3, padding: "1px 5px", fontSize: 7, fontWeight: 900, color: "#fff", letterSpacing: 1, marginBottom: 2 }}>{card.tag}</div>}
      <div style={{ color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.2 }}>{card.title}</div>
    </div>
  );
}
