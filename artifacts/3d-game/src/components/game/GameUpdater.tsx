import { useEffect, useState } from "react";

interface Patch {
  version: string;
  icon: string;
  title: string;
  notes: string[];
}

let patchBase = 1;
let patchMinor = 0;

function generatePatch(): Patch {
  patchMinor++;
  if (patchMinor > 9) { patchBase++; patchMinor = 0; }
  const pools: Patch[] = [
    {
      version: `v${patchBase}.${patchMinor}.0`,
      icon: "⚔️",
      title: "Weapon Rebalance",
      notes: ["AR damage +8%", "Shotgun spread tightened", "SMG fire rate improved"],
    },
    {
      version: `v${patchBase}.${patchMinor}.0`,
      icon: "🌍",
      title: "World Update",
      notes: ["New vehicle spawn added near Dusty Depot", "Extra loot chests in Retail Row", "Storm warning now 2s earlier"],
    },
    {
      version: `v${patchBase}.${patchMinor}.0`,
      icon: "🛡️",
      title: "Balance Patch",
      notes: ["Shield regen starts 1s faster", "Tactical cooldown –5s", "Bot accuracy adjusted"],
    },
    {
      version: `v${patchBase}.${patchMinor}.0`,
      icon: "🚗",
      title: "Vehicle Update",
      notes: ["Vehicle top speed +15%", "Bike handling improved", "Trucks now take reduced storm damage"],
    },
    {
      version: `v${patchBase}.${patchMinor}.0`,
      icon: "🏆",
      title: "Season XP Boost",
      notes: ["XP from eliminations doubled this hour", "Quest XP +500 bonus", "Legendary drop rate +2%"],
    },
    {
      version: `v${patchBase}.${patchMinor}.0`,
      icon: "🗺️",
      title: "Map Update",
      notes: ["Fatal Fields: new barn structure", "Salty Springs: bridge added", "Tilted Towers: rooftop loot"],
    },
  ];
  return pools[Math.floor(Math.random() * pools.length)];
}

export default function GameUpdater() {
  const [patch, setPatch] = useState<Patch | null>(null);
  const [visible, setVisible] = useState(false);

  const showPatch = (p: Patch) => {
    setPatch(p);
    setVisible(true);
    setTimeout(() => setVisible(false), 6000);
  };

  useEffect(() => {
    // First patch notification after 45 seconds
    const first = setTimeout(() => showPatch(generatePatch()), 45000);

    // Auto-upgrade every 4 minutes thereafter
    const interval = setInterval(() => showPatch(generatePatch()), 240000);

    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  if (!patch || !visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 100, right: 20, zIndex: 9000,
      width: 280,
      background: "linear-gradient(135deg, rgba(15,25,50,0.97), rgba(10,15,35,0.97))",
      border: "1px solid rgba(0,180,255,0.35)",
      borderLeft: "3px solid #00d4ff",
      borderRadius: 8,
      padding: "12px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(0,180,255,0.15)",
      animation: `${visible ? "slideInRight 0.4s ease-out" : "slideOutRight 0.4s ease-in"} forwards`,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Close */}
      <button
        onClick={() => setVisible(false)}
        style={{ position: "absolute", top: 6, right: 8, background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 14 }}
      >✕</button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #00d4ff, #0044ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{patch.icon}</div>
        <div>
          <div style={{ color: "#00d4ff", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>AUTO UPDATE · {patch.version}</div>
          <div style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>{patch.title}</div>
        </div>
      </div>

      {/* Notes */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 8 }}>
        {patch.notes.map((note, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#00d4ff", flexShrink: 0 }} />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>{note}</span>
          </div>
        ))}
      </div>

      {/* Progress bar animating across */}
      <div style={{ marginTop: 10, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, #00d4ff, #0088ff)", animation: "shrinkbar 6s linear forwards" }} />
      </div>
    </div>
  );
}
