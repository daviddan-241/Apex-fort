import { useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';

const JOYSTICK_RADIUS = 52;

export function TouchControls() {
  const setTouchInput = useGameStore((s) => s.setTouchInput);

  // ── Left joystick (movement) ─────────────────────────────────────
  const moveBaseRef   = useRef<HTMLDivElement>(null);
  const moveStickRef  = useRef<HTMLDivElement>(null);
  const moveTouchId   = useRef<number | null>(null);
  const moveOrigin    = useRef({ x: 0, y: 0 });

  const onMoveStart = useCallback((e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    moveTouchId.current = t.identifier;
    moveOrigin.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onMoveMove = useCallback((e: React.TouchEvent) => {
    const t = Array.from(e.changedTouches).find(c => c.identifier === moveTouchId.current);
    if (!t) return;
    const dx = t.clientX - moveOrigin.current.x;
    const dy = t.clientY - moveOrigin.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamp = Math.min(dist, JOYSTICK_RADIUS);
    const nx = clamp === 0 ? 0 : (dx / dist) * clamp;
    const ny = clamp === 0 ? 0 : (dy / dist) * clamp;
    if (moveStickRef.current) {
      moveStickRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }
    setTouchInput({ moveX: nx / JOYSTICK_RADIUS, moveY: ny / JOYSTICK_RADIUS });
  }, [setTouchInput]);

  const onMoveEnd = useCallback((e: React.TouchEvent) => {
    if (!Array.from(e.changedTouches).some(c => c.identifier === moveTouchId.current)) return;
    moveTouchId.current = null;
    if (moveStickRef.current) moveStickRef.current.style.transform = 'translate(0,0)';
    setTouchInput({ moveX: 0, moveY: 0 });
  }, [setTouchInput]);

  // ── Right look area (camera) ──────────────────────────────────────
  const lookTouchId  = useRef<number | null>(null);
  const lookPrev     = useRef({ x: 0, y: 0 });

  const onLookStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    lookTouchId.current = t.identifier;
    lookPrev.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onLookMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = Array.from(e.changedTouches).find(c => c.identifier === lookTouchId.current);
    if (!t) return;
    const dx = t.clientX - lookPrev.current.x;
    const dy = t.clientY - lookPrev.current.y;
    lookPrev.current = { x: t.clientX, y: t.clientY };
    setTouchInput({ lookDx: dx, lookDy: dy });
    // Reset after 1 frame so accumulated deltas don't persist
    requestAnimationFrame(() => setTouchInput({ lookDx: 0, lookDy: 0 }));
  }, [setTouchInput]);

  const onLookEnd = useCallback((e: React.TouchEvent) => {
    if (!Array.from(e.changedTouches).some(c => c.identifier === lookTouchId.current)) return;
    lookTouchId.current = null;
    setTouchInput({ lookDx: 0, lookDy: 0 });
  }, [setTouchInput]);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none" style={{ touchAction: 'none' }}>

      {/* ── Left: Movement joystick ─────────────────────────────── */}
      <div
        className="absolute bottom-24 left-8 pointer-events-auto"
        onTouchStart={onMoveStart}
        onTouchMove={onMoveMove}
        onTouchEnd={onMoveEnd}
        onTouchCancel={onMoveEnd}
        style={{ touchAction: 'none', userSelect: 'none' }}
      >
        <div
          ref={moveBaseRef}
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: JOYSTICK_RADIUS * 2 + 20,
            height: JOYSTICK_RADIUS * 2 + 20,
            background: 'rgba(255,255,255,0.08)',
            border: '2px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            ref={moveStickRef}
            className="absolute rounded-full transition-none"
            style={{
              width: 46,
              height: 46,
              background: 'rgba(255,255,255,0.35)',
              border: '2px solid rgba(255,255,255,0.6)',
              boxShadow: '0 0 12px rgba(0,180,255,0.4)',
              transition: 'none',
            }}
          />
        </div>
        <div className="text-center text-[9px] text-white/30 mt-1 tracking-widest">MOVE</div>
      </div>

      {/* ── Right: Look area ────────────────────────────────────── */}
      <div
        className="absolute right-0 top-14 bottom-32 pointer-events-auto"
        style={{ width: '55%', touchAction: 'none', userSelect: 'none' }}
        onTouchStart={onLookStart}
        onTouchMove={onLookMove}
        onTouchEnd={onLookEnd}
        onTouchCancel={onLookEnd}
      />

      {/* ── Fire button ─────────────────────────────────────────── */}
      <div
        className="absolute bottom-24 right-8 pointer-events-auto flex flex-col gap-3 items-center"
        style={{ touchAction: 'none' }}
      >
        <button
          className="rounded-full flex items-center justify-center font-black text-white text-xs tracking-widest active:scale-90"
          style={{
            width: 64, height: 64,
            background: 'radial-gradient(circle, #ff3300, #cc1100)',
            border: '3px solid rgba(255,80,0,0.5)',
            boxShadow: '0 0 20px rgba(255,50,0,0.5)',
            touchAction: 'none',
          }}
          onTouchStart={(e) => { e.preventDefault(); setTouchInput({ shooting: true }); }}
          onTouchEnd={(e) => { e.preventDefault(); setTouchInput({ shooting: false }); }}
          onTouchCancel={(e) => { e.preventDefault(); setTouchInput({ shooting: false }); }}
        >
          FIRE
        </button>

        {/* ── Jump button ──────────────────────────────────────── */}
        <button
          className="rounded-full flex items-center justify-center font-bold text-white text-xs tracking-widest active:scale-90"
          style={{
            width: 50, height: 50,
            background: 'rgba(0,180,255,0.25)',
            border: '2px solid rgba(0,180,255,0.5)',
            boxShadow: '0 0 12px rgba(0,180,255,0.3)',
            touchAction: 'none',
          }}
          onTouchStart={(e) => { e.preventDefault(); setTouchInput({ jumping: true }); }}
          onTouchEnd={(e) => { e.preventDefault(); setTouchInput({ jumping: false }); }}
          onTouchCancel={(e) => { e.preventDefault(); setTouchInput({ jumping: false }); }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
