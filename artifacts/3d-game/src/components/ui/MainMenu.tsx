import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../../store/gameStore";
import { CHARACTERS } from "../../data/characters";

const SEASON = 3;
const BATTLE_PASS_TIER = 47;
const BATTLE_PASS_MAX = 100;
const VBUCKS = 1340;

const TIPS = [
  "Harvest trees for wood, rocks for stone, and metal structures for metal!",
  "Build a 1x1 box to protect yourself when healing.",
  "Chests (golden glow) always contain Rare or better weapons.",
  "The storm shrinks every few minutes — watch the minimap circle.",
  "Use E for Tactical and Q for Ultimate when cooldowns are ready.",
];

const FEATURED_ITEMS = [
  { name: "Reaper Skin", rarity: "legendary", price: 2000, color: "#7c3aed", icon: "💀" },
  { name: "Neon Wings", rarity: "epic", price: 1500, color: "#db2777", icon: "🪽" },
  { name: "Storm Rider", rarity: "rare", price: 1200, color: "#2563eb", icon: "⚡" },
  { name: "Gold Wrap", rarity: "uncommon", price: 800, color: "#d97706", icon: "✨" },
];

const DAILY_QUESTS = [
  { text: "Deal 500 damage to opponents", current: 120, goal: 500, xp: 15000 },
  { text: "Outlive 20 opponents", current: 8, goal: 20, xp: 12000 },
  { text: "Harvest 200 stone", current: 45, goal: 200, xp: 8000 },
];

const NAV_TABS = [
  { id: "battle-royale", label: "BATTLE ROYALE", icon: "🎯" },
  { id: "creative", label: "CREATIVE", icon: "🏗️" },
  { id: "career", label: "CAREER", icon: "📋" },
  { id: "shop", label: "STORE", icon: "🛒" },
];

export default function MainMenu() {
  const setPhase = useGameStore((s) => s.setPhase);
  const reset = useGameStore((s) => s.reset);
  const [activeTab, setActiveTab] = useState("battle-royale");
  const [tipIdx, setTipIdx] = useState(0);
  const [showCharModal, setShowCharModal] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [charIdx, setCharIdx] = useState(0);
  const char = CHARACTERS[charIdx % CHARACTERS.length];

  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handlePlay = () => {
    reset();
    setPhase("character-select");
  };

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Background — island panorama */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url('/fortnite-bg.jpg')",
        backgroundSize: "cover", backgroundPosition: "center 40%",
        filter: "brightness(0.72) saturate(1.1)",
      }} />

      {/* Gradient overlays */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 50%, rgba(0,5,20,0.65) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 45%, rgba(0,0,0,0.35) 100%)" }} />

      {/* ── TOP BAR ── */}
      <TopBar charIdx={charIdx} setCharIdx={setCharIdx} char={char} />

      {/* ── CENTER CHARACTER ── */}
      <CharacterShowcase char={char} onCustomize={() => setShowCharModal(true)} />

      {/* ── BATTLE PASS BAR (below character, above nav) ── */}
      <BattlePassBar tier={BATTLE_PASS_TIER} max={BATTLE_PASS_MAX} />

      {/* ── BOTTOM SECTION ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        {/* Nav tabs */}
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Play / panel area */}
        <div style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.7))",
          padding: "14px 20px 24px",
          display: "flex", alignItems: "flex-end", gap: 14,
        }}>
          {/* Left panel — daily quests */}
          <div style={{ flex: 1, maxWidth: 260 }}>
            <DailyQuestsPanel />
          </div>

          {/* CENTER — PLAY BUTTON */}
          <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {/* Mode label */}
            <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "3px 16px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>SOLO</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>▼</span>
            </div>
            {/* Main play button */}
            <button
              className="lobby-btn-primary"
              onClick={handlePlay}
              style={{
                width: 240, height: 66, fontSize: 22, fontWeight: 900,
                letterSpacing: 5, textTransform: "uppercase", cursor: "pointer",
                background: "linear-gradient(135deg, #ff8c00 0%, #ff5500 40%, #ff8c00 100%)",
                border: "3px solid rgba(255,255,255,0.35)",
                borderRadius: 8, color: "#fff",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                boxShadow: "0 0 30px rgba(255,120,0,0.6), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
                transition: "transform 0.12s, box-shadow 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 50px rgba(255,120,0,0.9), 0 12px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 30px rgba(255,120,0,0.6), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)";
              }}
            >
              PLAY
            </button>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: 1.5 }}>30 PLAYERS · SOLO</div>
          </div>

          {/* Right panel — featured store items */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>FEATURED</div>
            <div style={{ display: "flex", gap: 6 }}>
              {FEATURED_ITEMS.map((item, i) => (
                <FeaturedItem key={i} item={item} hovered={hoveredItem === i} onHover={(v) => setHoveredItem(v ? i : null)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tip bar */}
      <div style={{
        position: "absolute", bottom: 148, left: "50%", transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.5)", borderRadius: 20, padding: "5px 18px",
        color: "rgba(255,255,255,0.55)", fontSize: 11, whiteSpace: "nowrap", zIndex: 10,
        border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 8, alignItems: "center",
      }}>
        <span style={{ color: "#ffd700", fontSize: 10 }}>💡</span>
        <span style={{ transition: "opacity 0.5s" }}>{TIPS[tipIdx]}</span>
      </div>
    </div>
  );
}

/* ── TOP BAR ── */
function TopBar({ charIdx, setCharIdx, char }: any) {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
      background: "linear-gradient(to bottom, rgba(0,0,0,0.82), transparent)",
      padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      {/* Left: Avatar + level */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%", cursor: "pointer",
          background: `radial-gradient(circle at 35% 35%, ${char.accentColor}, ${char.color})`,
          border: "2px solid rgba(255,255,255,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          boxShadow: `0 0 12px ${char.color}88`,
        }} onClick={() => setCharIdx((i: number) => (i + 1) % 8)}>
          {CHAR_ICONS[char.id]}
        </div>
        <div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 800, lineHeight: 1 }}>Commander</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
            <LevelBadge level={47} />
            <div style={{ height: 4, width: 60, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: "62%", height: "100%", background: "linear-gradient(90deg, #00d4ff, #0088ff)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Center: Game Logo */}
      <div style={{ textAlign: "center", lineHeight: 0.85 }}>
        <div style={{ fontSize: 9, letterSpacing: 7, color: "#00d4ff", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>SEASON {SEASON}</div>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, textTransform: "uppercase" }}>
          <span style={{ color: "#fff", textShadow: "0 0 20px rgba(0,200,255,0.4)" }}>APEX </span>
          <span style={{ color: "#00d4ff", textShadow: "0 0 20px rgba(0,200,255,0.7)" }}>FORT</span>
        </div>
      </div>

      {/* Right: V-Bucks + icons */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,215,0,0.35)",
          borderRadius: 20, padding: "5px 12px",
        }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ color: "#ffd700", fontWeight: 800, fontSize: 13 }}>{VBUCKS.toLocaleString()}</span>
        </div>
        <TopIconBtn icon="🔔" badge={3} />
        <TopIconBtn icon="👥" badge={0} />
        <TopIconBtn icon="⚙️" badge={0} />
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: number }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #ff8c00, #ff5500)",
      borderRadius: 3, padding: "1px 5px", fontSize: 9, fontWeight: 900, color: "#fff", letterSpacing: 1,
    }}>LVL {level}</div>
  );
}

function TopIconBtn({ icon, badge }: { icon: string; badge: number }) {
  return (
    <div style={{ position: "relative", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.08)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", fontSize: 16 }}>
      {icon}
      {badge > 0 && (
        <div style={{
          position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%",
          background: "#ff3300", fontSize: 8, fontWeight: 900, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "notification-pulse 2s infinite",
        }}>{badge}</div>
      )}
    </div>
  );
}

/* ── CHARACTER SHOWCASE ── */
function CharacterShowcase({ char, onCustomize }: any) {
  return (
    <div style={{
      position: "absolute", right: "8%", top: "50%", transform: "translateY(-55%)",
      display: "flex", flexDirection: "column", alignItems: "center", zIndex: 5,
    }}>
      {/* Character 3D-ish avatar */}
      <div style={{ animation: "lobby-float 3.5s ease-in-out infinite", position: "relative" }}>
        {/* Glow base */}
        <div style={{
          position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)",
          width: 120, height: 20, borderRadius: "50%",
          background: `radial-gradient(ellipse, ${char.color}66, transparent 70%)`,
          filter: "blur(4px)",
        }} />
        {/* Main character body */}
        <div style={{ position: "relative", width: 130, height: 200 }}>
          {/* Body */}
          <div style={{
            position: "absolute", left: "50%", top: 50, transform: "translateX(-50%)",
            width: 70, height: 110, borderRadius: "35% 35% 20% 20% / 30% 30% 20% 20%",
            background: `linear-gradient(160deg, ${char.accentColor}, ${char.color})`,
            boxShadow: `0 0 30px ${char.color}88, 0 20px 40px rgba(0,0,0,0.5)`,
          }} />
          {/* Head */}
          <div style={{
            position: "absolute", left: "50%", top: 8, transform: "translateX(-50%)",
            width: 52, height: 52, borderRadius: "50%",
            background: `radial-gradient(circle at 35% 30%, ${char.accentColor}, ${char.color})`,
            boxShadow: `0 0 20px ${char.color}99`,
            border: `3px solid ${char.accentColor}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 22 }}>
              {CHAR_ICONS[char.id]}
            </div>
          </div>
          {/* Weapon */}
          <div style={{
            position: "absolute", right: -10, top: 80,
            width: 14, height: 55, borderRadius: 3,
            background: "linear-gradient(160deg, #666, #333)",
            transform: "rotate(15deg)",
            boxShadow: "0 0 8px rgba(0,0,0,0.5)",
          }} />
          {/* Legs */}
          {[-14, 14].map((x, i) => (
            <div key={i} style={{
              position: "absolute", left: `calc(50% + ${x}px)`, top: 148,
              width: 22, height: 52, borderRadius: "0 0 8px 8px",
              background: `linear-gradient(160deg, ${char.color}cc, ${char.color}88)`,
            }} />
          ))}
        </div>
      </div>

      {/* Name + rarity */}
      <div style={{
        marginTop: 8, background: "rgba(0,0,0,0.7)", border: `2px solid ${char.color}66`,
        borderRadius: 6, padding: "6px 18px", textAlign: "center",
      }}>
        <div style={{ color: char.accentColor, fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" }}>{char.name}</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 1, marginTop: 1 }}>BATTLE PASS · TIER 47</div>
      </div>
      <button
        onClick={onCustomize}
        style={{
          marginTop: 6, fontSize: 10, fontWeight: 800, letterSpacing: 2, padding: "5px 16px",
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 4, color: "rgba(255,255,255,0.7)", cursor: "pointer", textTransform: "uppercase",
        }}
      >CUSTOMIZE</button>
    </div>
  );
}

/* ── BATTLE PASS BAR ── */
function BattlePassBar({ tier, max }: { tier: number; max: number }) {
  return (
    <div style={{
      position: "absolute", bottom: 196, left: 16, right: 16, zIndex: 10,
      background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 6, padding: "7px 14px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", borderRadius: 4, padding: "3px 8px", fontSize: 9, fontWeight: 900, letterSpacing: 2, color: "#000", whiteSpace: "nowrap" }}>
        BATTLE PASS S{SEASON}
      </div>
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, whiteSpace: "nowrap" }}>Tier {tier}/{max}</div>
      <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
        {/* Tick marks */}
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: `${(i + 1) * 10}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.1)" }} />
        ))}
        <div style={{
          width: `${(tier / max) * 100}%`, height: "100%",
          background: "linear-gradient(90deg, #ffd700, #ff8c00)",
          transition: "width 1s ease",
        }} />
      </div>
      <div style={{ color: "#ffd700", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>
        🎁 {max - tier} tiers left
      </div>
    </div>
  );
}

/* ── NAV BAR ── */
function NavBar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (t: string) => void }) {
  return (
    <div style={{
      background: "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.85))",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      display: "flex", justifyContent: "center",
    }}>
      {NAV_TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, maxWidth: 180, padding: "11px 6px 8px",
              background: active ? "rgba(255,255,255,0.08)" : "transparent",
              border: "none", borderTop: active ? "3px solid #ff8c00" : "3px solid transparent",
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              transition: "all 0.15s", position: "relative",
            }}
          >
            <span style={{ fontSize: 18 }}>{tab.icon}</span>
            <span style={{ color: active ? "#fff" : "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", transition: "color 0.15s" }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── FEATURED ITEM ── */
function FeaturedItem({ item, hovered, onHover }: { item: any; hovered: boolean; onHover: (v: boolean) => void }) {
  return (
    <div
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        width: 62, height: 70, borderRadius: 6, cursor: "pointer",
        background: `linear-gradient(160deg, ${item.color}88, ${item.color}44)`,
        border: `2px solid ${hovered ? item.color : item.color + "55"}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        transition: "all 0.15s",
        transform: hovered ? "scale(1.08) translateY(-2px)" : "scale(1)",
        boxShadow: hovered ? `0 0 16px ${item.color}88` : "none",
      }}
    >
      <span style={{ fontSize: 20 }}>{item.icon}</span>
      <div style={{ color: "#fff", fontSize: 8, fontWeight: 800, textAlign: "center", lineHeight: 1.2, padding: "0 3px" }}>{item.name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <span style={{ fontSize: 8 }}>⭐</span>
        <span style={{ color: "#ffd700", fontSize: 8, fontWeight: 700 }}>{item.price}</span>
      </div>
    </div>
  );
}

/* ── DAILY QUESTS ── */
function DailyQuestsPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>DAILY QUESTS</div>
      {DAILY_QUESTS.map((q, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "5px 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 10 }}>{q.text}</span>
            <span style={{ color: "#ffd700", fontSize: 9, fontWeight: 700 }}>{(q.xp / 1000).toFixed(0)}K XP</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${(q.current / q.goal) * 100}%`, height: "100%", background: "#00d4ff" }} />
            </div>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>{q.current}/{q.goal}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const CHAR_ICONS: Record<string, string> = {
  soldier: "🪖", ninja: "🥷", cyber: "🤖", warrior: "⚔️",
  ghost: "👻", hero: "🦸", assassin: "🗡️", thief: "🎭",
};
