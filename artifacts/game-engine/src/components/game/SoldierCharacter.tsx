import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '@/utils/terrain';
import { useGameStore } from '@/store/gameStore';
import { ProceduralSoldier } from './ProceduralSoldier';

const CAMERA_DISTANCE = 5.5;
const CAMERA_HEIGHT   = 1.8;

export function SoldierCharacter() {
  const { camera } = useThree();
  const setAmmo            = useGameStore((s) => s.setAmmo);
  const addKillFeedEntry   = useGameStore((s) => s.addKillFeedEntry);
  const touchInput         = useGameStore((s) => s.touchInput);

  const keys        = useRef({ w: false, a: false, s: false, d: false, shift: false });
  const yaw         = useRef(0);
  const pitch       = useRef(0.15);
  const position    = useRef(new THREE.Vector3(0, 10, 0));
  const velocityY   = useRef(0);
  const isGrounded  = useRef(false);
  const lastShot    = useRef(0);
  const spacePressed = useRef(false);

  // Soldier visual state
  const [playerPos] = useState(() => new THREE.Vector3(0, 10, 0));
  const [rotY, setRotY] = useState(0);
  const [moving, setMoving]   = useState(false);
  const [running, setRunning] = useState(false);

  // ── Keyboard (desktop) ───────────────────────────────────────────
  useEffect(() => {
    const k = keys.current;
    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp')    k.w = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown')  k.s = true;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft')  k.a = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') k.d = true;
      if (e.key === 'Shift') k.shift = true;
      if (e.key === ' ') { spacePressed.current = true; e.preventDefault(); }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp')    k.w = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown')  k.s = false;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft')  k.a = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') k.d = false;
      if (e.key === 'Shift') k.shift = false;
      if (e.key === ' ') spacePressed.current = false;
    };

    // Desktop mouse look — NO pointer lock (works on all platforms)
    let mouseDown = false;
    let lastMX = 0, lastMY = 0;
    const onMouseDown = (e: MouseEvent) => { if (e.button === 0) { mouseDown = true; lastMX = e.clientX; lastMY = e.clientY; } };
    const onMouseUp   = () => { mouseDown = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDown) return;
      const dx = e.clientX - lastMX;
      const dy = e.clientY - lastMY;
      lastMX = e.clientX; lastMY = e.clientY;
      yaw.current   -= dx * 0.003;
      pitch.current -= dy * 0.003;
      pitch.current  = Math.max(-0.45, Math.min(0.65, pitch.current));
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k  = keys.current;
    const ti = touchInput;

    // ── Touch look ─────────────────────────────────────────────────
    if (ti.lookDx !== 0 || ti.lookDy !== 0) {
      yaw.current   -= ti.lookDx * 0.004;
      pitch.current -= ti.lookDy * 0.004;
      pitch.current  = Math.max(-0.45, Math.min(0.65, pitch.current));
    }

    // ── Movement ───────────────────────────────────────────────────
    const isShifting   = k.shift || running;
    const speed        = isShifting ? 11 : 5.5;
    const kbMoving     = k.w || k.s || k.a || k.d;
    const touchMoving  = Math.abs(ti.moveX) > 0.1 || Math.abs(ti.moveY) > 0.1;
    const isMoving     = kbMoving || touchMoving;

    const dir = new THREE.Vector3();

    if (kbMoving) {
      if (k.w) dir.z -= 1; if (k.s) dir.z += 1;
      if (k.a) dir.x -= 1; if (k.d) dir.x += 1;
    } else if (touchMoving) {
      dir.x = ti.moveX; dir.z = ti.moveY;
    }

    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(speed * dt);
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
      position.current.add(dir);
    }

    // ── Gravity ────────────────────────────────────────────────────
    velocityY.current -= 22 * dt;
    position.current.y += velocityY.current * dt;

    // ── Terrain collision ──────────────────────────────────────────
    const groundY = getTerrainHeight(position.current.x, position.current.z);
    if (position.current.y <= groundY + 1.05) {
      position.current.y = groundY + 1.05;
      velocityY.current  = 0;
      isGrounded.current = true;
    } else {
      isGrounded.current = false;
    }

    // ── Jump ───────────────────────────────────────────────────────
    const doJump = spacePressed.current || ti.jumping;
    if (doJump && isGrounded.current) {
      velocityY.current  = 9;
      isGrounded.current = false;
    }

    // ── Shoot ──────────────────────────────────────────────────────
    if (ti.shooting) {
      const now = state.clock.elapsedTime;
      if (now - lastShot.current > 0.09) {
        lastShot.current = now;
        const cur = useGameStore.getState().ammo;
        if (cur > 0) {
          setAmmo(cur - 1);
          if (Math.random() < 0.06) {
            const victims  = ['Ghost', 'Shadow', 'Apex_01', 'Player_7', 'Wraith', 'Striker'];
            const weapons  = ['AR-15', 'SMG', 'Sniper', 'Shotgun'];
            addKillFeedEntry({
              killer: 'YOU',
              victim: victims[Math.floor(Math.random() * victims.length)],
              weapon: weapons[Math.floor(Math.random() * weapons.length)],
            });
          }
        }
      }
    }

    // ── Camera (third-person) ──────────────────────────────────────
    const cosPitch = Math.cos(pitch.current);
    const sinPitch = Math.sin(pitch.current);
    const cx = position.current.x + Math.sin(yaw.current) * CAMERA_DISTANCE * cosPitch;
    const cy = position.current.y + CAMERA_HEIGHT + sinPitch * CAMERA_DISTANCE;
    const cz = position.current.z + Math.cos(yaw.current) * CAMERA_DISTANCE * cosPitch;
    camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.14);
    camera.lookAt(position.current.x, position.current.y + 1.4, position.current.z);

    // ── Update visual state ────────────────────────────────────────
    playerPos.copy(position.current);
    setRotY(yaw.current + Math.PI);
    setMoving(isMoving);
    setRunning(isShifting && isMoving);
  });

  return (
    <ProceduralSoldier
      position={playerPos}
      rotationY={rotY}
      moving={moving}
      running={running}
    />
  );
}
