import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../../store/gameStore";

// Global mobile input shared with Player.tsx
export interface MobileInput {
  moveX: number; moveY: number;
  lookDeltaX: number; lookDeltaY: number;
  fire: boolean; jump: boolean; reload: boolean;
  build: boolean; crouch: boolean; ads: boolean;
  slot: number | null;
  tactical: boolean; ultimate: boolean;
}

declare global {
  interface Window { __mobileInput: MobileInput; __isMobile: boolean; }
}

const DEFAULT: MobileInput = { moveX:0, moveY:0, lookDeltaX:0, lookDeltaY:0, fire:false, jump:false, reload:false, build:false, crouch:false, ads:false, slot:null, tactical:false, ultimate:false };
if (typeof window !== "undefined") { window.__mobileInput = { ...DEFAULT }; window.__isMobile = false; }

const JOYSTICK_RADIUS = 55;
const JOYSTICK_KNOB = 26;

export function isMobileDevice() {
  return window.innerWidth <= 900 || ("ontouchstart" in window);
}

export default function MobileControls() {
  const [show, setShow] = useState(false);
  const buildMode = useGameStore((s) => s.buildMode);
  const toggleBuildMode = useGameStore((s) => s.toggleBuildMode);
  const setActiveSlot = useGameStore((s) => s.setActiveSlot);
  const weapons = useGameStore((s) => s.weapons);
  const activeSlot = useGameStore((s) => s.activeSlot);
  const startReload = useGameStore((s) => s.startReload);
  const useTactical = useGameStore((s) => s.useTactical);
  const useUltimate = useGameStore((s) => s.useUltimate);

  // Joystick state
  const joystickActive = useRef(false);
  const joystickOrigin = useRef({ x: 0, y: 0 });
  const joystickKnob = useRef({ x: 0, y: 0 });
  const joystickPointerId = useRef<number | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  // Right-drag look
  const lookActive = useRef(false);
  const lookLast = useRef({ x: 0, y: 0 });
  const lookPointerId = useRef<number | null>(null);

  // Fire hold
  const fireRef = useRef(false);

  useEffect(() => {
    const check = () => { const m = isMobileDevice(); setShow(m); window.__isMobile = m; };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!show) return null;

  const HALF = window.innerWidth / 2;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const x = e.clientX, y = e.clientY;
    // Left half = joystick
    if (x < HALF * 0.6 && joystickPointerId.current === null) {
      joystickActive.current = true;
      joystickOrigin.current = { x, y };
      joystickKnob.current = { x: 0, y: 0 };
      joystickPointerId.current = e.pointerId;
      setKnobPos({ x: 0, y: 0 });
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    }
    // Right half = camera pan
    else if (x > HALF * 0.6 && lookPointerId.current === null) {
      lookActive.current = true;
      lookLast.current = { x, y };
      lookPointerId.current = e.pointerId;
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Joystick
    if (e.pointerId === joystickPointerId.current && joystickActive.current) {
      const dx = e.clientX - joystickOrigin.current.x;
      const dy = e.clientY - joystickOrigin.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(dist, JOYSTICK_RADIUS);
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * clamped;
      const ky = Math.sin(angle) * clamped;
      joystickKnob.current = { x: kx, y: ky };
      setKnobPos({ x: kx, y: ky });
      window.__mobileInput.moveX = kx / JOYSTICK_RADIUS;
      window.__mobileInput.moveY = ky / JOYSTICK_RADIUS;
    }
    // Look
    if (e.pointerId === lookPointerId.current && lookActive.current) {
      const dx = e.clientX - lookLast.current.x;
      const dy = e.clientY - lookLast.current.y;
      window.__mobileInput.lookDeltaX += dx * 0.006;
      window.__mobileInput.lookDeltaY += dy * 0.005;
      lookLast.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId === joystickPointerId.current) {
      joystickActive.current = false;
      joystickPointerId.current = null;
      joystickKnob.current = { x: 0, y: 0 };
      setKnobPos({ x: 0, y: 0 });
      window.__mobileInput.moveX = 0;
      window.__mobileInput.moveY = 0;
    }
    if (e.pointerId === lookPointerId.current) {
      lookActive.current = false;
      lookPointerId.current = null;
    }
  };

  return (
    <>
      {/* ── Transparent touch capture layer (full screen) ── */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 100, touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* ── LEFT: Virtual Joystick ── */}
      <div style={{
        position: "fixed", bottom: 90, left: 28, zIndex: 110,
        width: JOYSTICK_RADIUS * 2 + 20, height: JOYSTICK_RADIUS * 2 + 20,
        pointerEvents: "none",
      }}>
        {/* Outer ring */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.3)",
        }} />
        {/* Inner ring */}
        <div style={{
          position: "absolute",
          left: "50%", top: "50%",
          transform: "translate(-50%,-50%)",
          width: JOYSTICK_RADIUS, height: JOYSTICK_RADIUS,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.12)",
        }} />
        {/* Knob */}
        <div style={{
          position: "absolute",
          left: "50%", top: "50%",
          transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
          width: JOYSTICK_KNOB * 2, height: JOYSTICK_KNOB * 2,
          borderRadius: "50%",
          background: joystickActive.current ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.25)",
          border: "2px solid rgba(255,255,255,0.5)",
          transition: joystickActive.current ? "none" : "transform 0.1s",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }} />
      </div>

      {/* ── LEFT EXTRA: Sprint (double-tap joystick area, or dedicated button) ── */}
      <TouchButton bottom={200} left={30} size={40} label="🏃" opacity={0.55}
        onStart={() => { window.__mobileInput.crouch = true; }}
        onEnd={() => { window.__mobileInput.crouch = false; }}
      />

      {/* ── RIGHT SIDE BUTTONS ── */}

      {/* FIRE (big red) */}
      <TouchButton bottom={70} right={24} size={76}
        label="🔫" bgColor="rgba(220,30,30,0.75)" border="3px solid rgba(255,80,80,0.6)"
        fontSize={28}
        onStart={() => { window.__mobileInput.fire = true; fireRef.current = true; }}
        onEnd={() => { window.__mobileInput.fire = false; fireRef.current = false; }}
      />

      {/* JUMP */}
      <TouchButton bottom={160} right={30} size={58}
        label="⬆️" bgColor="rgba(0,180,80,0.7)" border="2px solid rgba(0,255,100,0.5)"
        onStart={() => { window.__mobileInput.jump = true; }}
        onEnd={() => { window.__mobileInput.jump = false; }}
      />

      {/* ADS */}
      <TouchButton bottom={70} right={114} size={54}
        label="🎯" bgColor="rgba(0,120,220,0.7)" border="2px solid rgba(0,160,255,0.5)"
        onStart={() => { window.__mobileInput.ads = true; }}
        onEnd={() => { window.__mobileInput.ads = false; }}
      />

      {/* RELOAD */}
      <TouchButton bottom={160} right={112} size={46}
        label="↻" fontSize={22} bgColor="rgba(200,150,0,0.7)" border="2px solid rgba(255,200,0,0.5)"
        onStart={() => { startReload(); }}
      />

      {/* BUILD */}
      <TouchButton bottom={230} right={24} size={52}
        label={buildMode ? "🔫" : "🏗️"} bgColor={buildMode ? "rgba(255,200,0,0.8)" : "rgba(80,80,80,0.7)"}
        border={`2px solid ${buildMode ? "rgba(255,220,0,0.8)" : "rgba(255,255,255,0.2)"}`}
        onStart={() => { toggleBuildMode(); }}
      />

      {/* TACTICAL */}
      <TouchButton bottom={230} right={90} size={44}
        label="⚡" fontSize={18} bgColor="rgba(0,180,220,0.7)" border="2px solid rgba(0,220,255,0.5)"
        onStart={() => { useTactical(); }}
      />

      {/* ULTIMATE */}
      <TouchButton bottom={230} right={148} size={44}
        label="💥" fontSize={18} bgColor="rgba(180,0,200,0.7)" border="2px solid rgba(220,0,255,0.5)"
        onStart={() => { useUltimate(); }}
      />

      {/* ── BOTTOM CENTER: Weapon slots (compact) ── */}
      <div style={{ position: "fixed", bottom: 8, left: "50%", transform: "translateX(-50%)", zIndex: 110, display: "flex", gap: 4 }}>
        {weapons.map((w, i) => (
          <div
            key={i}
            onPointerDown={() => setActiveSlot(i)}
            style={{
              width: 48, height: 56,
              background: activeSlot === i ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.6)",
              border: `2px solid ${activeSlot === i ? (w ? getWeaponColor(w.rarity) : "#fff") : "rgba(255,255,255,0.2)"}`,
              borderRadius: 5, position: "relative", overflow: "hidden",
              touchAction: "none", zIndex: 111,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            }}
          >
            {w ? (
              <>
                <span style={{ fontSize: 16 }}>{getWeaponEmoji(w.type)}</span>
                <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>{w.type === "Pickaxe" ? "∞" : w.ammo}</span>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: getWeaponColor(w.rarity) }} />
              </>
            ) : (
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 16 }}>+</span>
            )}
            <div style={{ position: "absolute", top: 1, left: 3, color: "rgba(255,255,255,0.5)", fontSize: 8 }}>{i+1}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Reusable Touch Button ── */
function TouchButton({ bottom, right, left, top, size, label, fontSize = 20, bgColor = "rgba(0,0,0,0.6)", border = "2px solid rgba(255,255,255,0.25)", opacity = 0.9, onStart, onEnd }: {
  bottom?: number; right?: number; left?: number; top?: number;
  size: number; label: string; fontSize?: number;
  bgColor?: string; border?: string; opacity?: number;
  onStart?: () => void; onEnd?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const style: React.CSSProperties = {
    position: "fixed", zIndex: 110,
    width: size, height: size, borderRadius: "50%",
    background: bgColor, border,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize, touchAction: "none", userSelect: "none", cursor: "pointer",
    opacity: pressed ? 1 : opacity,
    transform: pressed ? "scale(0.92)" : "scale(1)",
    transition: "transform 0.08s, opacity 0.08s",
    boxShadow: pressed ? "0 0 18px rgba(255,255,255,0.3)" : "0 2px 8px rgba(0,0,0,0.4)",
  };
  if (bottom !== undefined) style.bottom = bottom;
  if (right !== undefined) style.right = right;
  if (left !== undefined) style.left = left;
  if (top !== undefined) style.top = top;

  return (
    <div
      style={style}
      onPointerDown={(e) => { e.stopPropagation(); setPressed(true); onStart?.(); }}
      onPointerUp={(e) => { e.stopPropagation(); setPressed(false); onEnd?.(); }}
      onPointerLeave={() => { setPressed(false); onEnd?.(); }}
    >
      {label}
    </div>
  );
}

const RARITY_COLORS: Record<string, string> = {
  common: "#888", uncommon: "#2ecc71", rare: "#3498db", epic: "#9b59b6", legendary: "#f39c12"
};
function getWeaponColor(rarity: string) { return RARITY_COLORS[rarity] ?? "#888"; }
function getWeaponEmoji(type: string) {
  const m: Record<string, string> = { AR:"🪖", Shotgun:"💥", Sniper:"🎯", SMG:"⚡", Pistol:"🔫", Pickaxe:"⛏️", RPG:"🚀", Grenade:"💣" };
  return m[type] ?? "🔫";
}
