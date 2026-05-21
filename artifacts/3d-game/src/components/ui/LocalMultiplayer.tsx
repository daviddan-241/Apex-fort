import { useEffect, useState, useRef } from "react";

interface RemotePlayer {
  id: string;
  x: number;
  z: number;
  yaw: number;
  health: number;
  kills: number;
  name: string;
  lastSeen: number;
}

const CHANNEL_NAME = "apex-fort-local";
const LOCAL_PLAYER_ID = `player_${Math.random().toString(36).slice(2, 8)}`;
const LOCAL_PLAYER_NAME = `Player_${LOCAL_PLAYER_ID.slice(7)}`;

let bc: BroadcastChannel | null = null;

export function initLocalMultiplayer() {
  if (typeof BroadcastChannel === "undefined") return;
  if (bc) return;
  bc = new BroadcastChannel(CHANNEL_NAME);
}

export function broadcastPlayerState(x: number, z: number, yaw: number, health: number, kills: number) {
  if (!bc) return;
  bc.postMessage({ type: "state", id: LOCAL_PLAYER_ID, name: LOCAL_PLAYER_NAME, x, z, yaw, health, kills, ts: Date.now() });
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LocalMultiplayer({ visible, onClose }: Props) {
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [connected, setConnected] = useState(false);
  const [myId] = useState(LOCAL_PLAYER_ID);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (typeof BroadcastChannel === "undefined") return;

    initLocalMultiplayer();
    setConnected(true);

    bc!.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === "state" && msg.id !== myId) {
        setRemotePlayers(prev => {
          const filtered = prev.filter(p => p.id !== msg.id);
          return [...filtered, { id: msg.id, x: msg.x, z: msg.z, yaw: msg.yaw, health: msg.health, kills: msg.kills, name: msg.name, lastSeen: msg.ts }];
        });
      }
      if (msg.type === "ping" && msg.id !== myId) {
        bc!.postMessage({ type: "pong", id: myId, name: LOCAL_PLAYER_NAME });
      }
    };

    // Broadcast ping to announce presence
    bc!.postMessage({ type: "ping", id: myId, name: LOCAL_PLAYER_NAME });

    // Prune stale players
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      setRemotePlayers(prev => prev.filter(p => now - p.lastSeen < 5000));
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, myId]);

  if (!visible) return null;

  const hasBroadcastChannel = typeof BroadcastChannel !== "undefined";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: "linear-gradient(160deg, #0d1b3e, #1a0a3a)",
        border: "1px solid rgba(0,180,255,0.3)",
        borderRadius: 14, padding: "28px 32px", width: 420, maxWidth: "90vw",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ color: "#00d4ff", fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 3 }}>LOCAL NETWORK PLAY</div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>Same-Device Multiplayer</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        {!hasBroadcastChannel ? (
          <div style={{ background: "rgba(255,100,0,0.15)", border: "1px solid rgba(255,100,0,0.3)", borderRadius: 8, padding: "14px 16px", color: "#ff8844", fontSize: 12, lineHeight: 1.6 }}>
            ⚠️ Your browser doesn't support BroadcastChannel. Try Chrome or Firefox.
          </div>
        ) : (
          <>
            {/* Status */}
            <div style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#2ecc71" : "#ff4444", boxShadow: connected ? "0 0 8px #2ecc71" : "none" }} />
                <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{connected ? "Connected" : "Connecting..."}</span>
                <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.4)", fontSize: 10 }}>ID: {myId}</span>
              </div>
            </div>

            {/* How it works */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>HOW TO PLAY</div>
              {[
                "Open Apex Fort in 2+ browser tabs on the same device",
                "Enable Local Play in each tab from the main menu",
                "Players from other tabs appear in your game world",
                "Works fully offline — no internet required",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(0,212,255,0.2)", border: "1px solid rgba(0,212,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#00d4ff", fontWeight: 900, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>

            {/* Remote players */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
                PLAYERS ONLINE ({remotePlayers.length + 1})
              </div>
              {/* Me */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(0,212,255,0.08)", borderRadius: 6, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71" }} />
                <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{LOCAL_PLAYER_NAME}</span>
                <span style={{ marginLeft: "auto", color: "#00d4ff", fontSize: 9 }}>YOU</span>
              </div>
              {remotePlayers.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textAlign: "center", padding: "12px 0" }}>
                  No other players detected. Open another tab to see them here.
                </div>
              ) : (
                remotePlayers.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 6, marginBottom: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f39c12" }} />
                    <span style={{ color: "#fff", fontSize: 11 }}>{p.name}</span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9 }}>HP:{p.health}</span>
                    <span style={{ marginLeft: "auto", color: "#ffd700", fontSize: 9 }}>⚔️ {p.kills}</span>
                  </div>
                ))
              )}
            </div>

            {/* Bluetooth note */}
            <div style={{ background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
              <div style={{ color: "#f39c12", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 3 }}>ℹ️ ABOUT BLUETOOTH PLAY</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, lineHeight: 1.5 }}>
                Web browsers don't support Bluetooth P2P gaming between devices. This local play mode works across tabs on the same device. For cross-device LAN play, ensure both devices open the same hosted URL on your network.
              </div>
            </div>

            <button onClick={onClose} style={{
              width: "100%", padding: "13px 0", background: "linear-gradient(135deg, #00d4ff, #0088ff)",
              border: "none", borderRadius: 8, color: "#000", fontSize: 13, fontWeight: 900,
              letterSpacing: 2, textTransform: "uppercase", cursor: "pointer",
            }}>
              START PLAYING
            </button>
          </>
        )}
      </div>
    </div>
  );
}
