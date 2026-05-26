import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '@/utils/terrain';
import { useGameStore } from '@/store/gameStore';
import { ProceduralSoldier } from './ProceduralSoldier';

const CAMERA_DIST   = 5.5;
const CAMERA_HEIGHT = 1.8;
const IDLE_TIMEOUT  = 6; // seconds before cinematic cam

export function SoldierCharacter() {
  const { camera } = useThree();
  const setAmmo          = useGameStore(s => s.setAmmo);
  const addKillFeedEntry = useGameStore(s => s.addKillFeedEntry);
  const touchInput       = useGameStore(s => s.touchInput);
  const setPlayerActive  = useGameStore(s => s.setPlayerActive);

  const keys        = useRef({ w:false, a:false, s:false, d:false, shift:false });
  const yaw         = useRef(0);
  const pitch       = useRef(0.15);
  const pos         = useRef(new THREE.Vector3(0, 10, 0));
  const velY        = useRef(0);
  const grounded    = useRef(false);
  const lastShot    = useRef(0);
  const idleTimer   = useRef(0);
  const cinemaAngle = useRef(0);
  const cinemaPos   = useRef(new THREE.Vector3(0, 30, 80));

  // Soldier visual refs (direct mutation for zero re-renders)
  const groupRef  = useRef<THREE.Group>(null);
  const lArmRef   = useRef<THREE.Group>(null);
  const rArmRef   = useRef<THREE.Group>(null);
  const lLegRef   = useRef<THREE.Group>(null);
  const rLegRef   = useRef<THREE.Group>(null);
  const limbTime  = useRef(0);

  useEffect(() => {
    const k = keys.current;
    const down = (e: KeyboardEvent) => {
      if (e.key==='w'||e.key==='W'||e.key==='ArrowUp')    k.w=true;
      if (e.key==='s'||e.key==='S'||e.key==='ArrowDown')  k.s=true;
      if (e.key==='a'||e.key==='A'||e.key==='ArrowLeft')  k.a=true;
      if (e.key==='d'||e.key==='D'||e.key==='ArrowRight') k.d=true;
      if (e.key==='Shift') k.shift=true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key==='w'||e.key==='W'||e.key==='ArrowUp')    k.w=false;
      if (e.key==='s'||e.key==='S'||e.key==='ArrowDown')  k.s=false;
      if (e.key==='a'||e.key==='A'||e.key==='ArrowLeft')  k.a=false;
      if (e.key==='d'||e.key==='D'||e.key==='ArrowRight') k.d=false;
      if (e.key==='Shift') k.shift=false;
    };

    // Desktop mouse drag (no pointer lock — works on iOS too)
    let md=false, lmx=0, lmy=0;
    const mdown = (e: MouseEvent) => { if(e.button===0){md=true;lmx=e.clientX;lmy=e.clientY;} };
    const mup   = () => { md=false; };
    const mmove = (e: MouseEvent) => {
      if(!md) return;
      const dx=e.clientX-lmx, dy=e.clientY-lmy;
      lmx=e.clientX; lmy=e.clientY;
      yaw.current   -= dx*0.003;
      pitch.current -= dy*0.003;
      pitch.current  = Math.max(-0.45, Math.min(0.65, pitch.current));
    };

    window.addEventListener('keydown',down);
    window.addEventListener('keyup',up);
    window.addEventListener('mousedown',mdown);
    window.addEventListener('mouseup',mup);
    window.addEventListener('mousemove',mmove);
    return () => {
      window.removeEventListener('keydown',down);
      window.removeEventListener('keyup',up);
      window.removeEventListener('mousedown',mdown);
      window.removeEventListener('mouseup',mup);
      window.removeEventListener('mousemove',mmove);
    };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k  = keys.current;
    const ti = touchInput;

    // Touch look
    if (ti.lookDx!==0||ti.lookDy!==0) {
      yaw.current   -= ti.lookDx*0.004;
      pitch.current -= ti.lookDy*0.004;
      pitch.current  = Math.max(-0.45,Math.min(0.65,pitch.current));
    }

    // Detect player activity
    const kbMove   = k.w||k.s||k.a||k.d;
    const tMove    = Math.abs(ti.moveX)>0.1||Math.abs(ti.moveY)>0.1;
    const isActive = kbMove||tMove||ti.shooting||ti.jumping||Math.abs(ti.lookDx)>1;

    if (isActive) {
      idleTimer.current = 0;
      setPlayerActive(true);
    } else {
      idleTimer.current += dt;
      if (idleTimer.current > IDLE_TIMEOUT) setPlayerActive(false);
    }

    const playerActive = idleTimer.current < IDLE_TIMEOUT;

    // ── Movement ────────────────────────────────────────────────
    const speed  = k.shift ? 11 : 5.5;
    const dir    = new THREE.Vector3();
    if (k.w) dir.z-=1; if (k.s) dir.z+=1;
    if (k.a) dir.x-=1; if (k.d) dir.x+=1;
    if (tMove) { dir.x=ti.moveX; dir.z=ti.moveY; }

    const moving = dir.lengthSq()>0;
    if (moving) {
      dir.normalize().multiplyScalar(speed*dt);
      dir.applyAxisAngle(new THREE.Vector3(0,1,0), yaw.current);
      pos.current.add(dir);
    }

    // Gravity
    velY.current -= 22*dt;
    pos.current.y += velY.current*dt;
    const gh = getTerrainHeight(pos.current.x, pos.current.z);
    if (pos.current.y <= gh+1.05) {
      pos.current.y = gh+1.05;
      velY.current  = 0;
      grounded.current = true;
    } else {
      grounded.current = false;
    }
    if (ti.jumping && grounded.current) { velY.current=9; grounded.current=false; }

    // Shoot
    if (ti.shooting) {
      const now = state.clock.elapsedTime;
      if (now - lastShot.current > 0.09) {
        lastShot.current = now;
        const cur = useGameStore.getState().ammo;
        if (cur>0) {
          setAmmo(cur-1);
          if (Math.random()<0.05) {
            const v=['Ghost','Shadow','Apex_01','Wraith'];
            const w=['AR-15','SMG','Sniper'];
            addKillFeedEntry({ killer:'YOU', victim:v[Math.floor(Math.random()*v.length)], weapon:w[Math.floor(Math.random()*w.length)] });
          }
        }
      }
    }

    // ── Camera ──────────────────────────────────────────────────
    if (playerActive) {
      // Follow camera
      const cp = Math.cos(pitch.current);
      const sp = Math.sin(pitch.current);
      const cx = pos.current.x + Math.sin(yaw.current)*CAMERA_DIST*cp;
      const cy = pos.current.y + CAMERA_HEIGHT + sp*CAMERA_DIST;
      const cz = pos.current.z + Math.cos(yaw.current)*CAMERA_DIST*cp;
      camera.position.lerp(new THREE.Vector3(cx,cy,cz), 0.12);
      camera.lookAt(pos.current.x, pos.current.y+1.4, pos.current.z);
    } else {
      // ── CINEMATIC AUTO-ROTATE ────────────────────────────────
      cinemaAngle.current += dt * 0.12;
      const r = 130 + Math.sin(cinemaAngle.current*0.3)*40;
      const h = 55 + Math.sin(cinemaAngle.current*0.2)*20;
      const tx = Math.sin(cinemaAngle.current)*r;
      const tz = Math.cos(cinemaAngle.current)*r;
      cinemaPos.current.lerp(new THREE.Vector3(tx, h, tz), 0.025);
      camera.position.copy(cinemaPos.current);
      camera.lookAt(0, 5, 0);
    }

    // ── Update visual group ──────────────────────────────────────
    const g = groupRef.current;
    if (!g) return;
    g.position.copy(pos.current);
    g.rotation.y = yaw.current + Math.PI;

    // Limb animation
    if (moving) limbTime.current += dt*(k.shift?9:5);
    const swing = moving ? Math.sin(limbTime.current)*0.5 : 0;
    if (lArmRef.current) lArmRef.current.rotation.x =  swing;
    if (rArmRef.current) rArmRef.current.rotation.x = -swing;
    if (lLegRef.current) lLegRef.current.rotation.x = -swing;
    if (rLegRef.current) rLegRef.current.rotation.x =  swing;
  });

  const hc='#2d3820', uc='#3d4a28', ac='#2a3020';
  const SKIN='#c4956a', BOOTS='#1a120a', GUN='#1a1a1a', GLOVES='#1e1208';

  return (
    <group ref={groupRef}>
      {/* HEAD */}
      <mesh position={[0,1.72,0]} castShadow>
        <sphereGeometry args={[0.155,16,16]} />
        <meshStandardMaterial color={SKIN} roughness={0.75} />
      </mesh>
      {/* HELMET */}
      <mesh position={[0,1.82,0]} castShadow>
        <sphereGeometry args={[0.175,16,10,0,Math.PI*2,0,Math.PI*0.6]} />
        <meshStandardMaterial color={hc} roughness={0.85} metalness={0.15} />
      </mesh>
      {/* NECK */}
      <mesh position={[0,1.53,0]}>
        <cylinderGeometry args={[0.065,0.07,0.1,8]} />
        <meshStandardMaterial color={SKIN} roughness={0.8} />
      </mesh>
      {/* TORSO */}
      <mesh position={[0,1.18,0]} castShadow>
        <boxGeometry args={[0.42,0.52,0.22]} />
        <meshStandardMaterial color={uc} roughness={0.88} />
      </mesh>
      <mesh position={[0,1.22,0.01]} castShadow>
        <boxGeometry args={[0.38,0.4,0.24]} />
        <meshStandardMaterial color={ac} roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0,0.88,0]}>
        <boxGeometry args={[0.38,0.14,0.2]} />
        <meshStandardMaterial color={uc} roughness={0.88} />
      </mesh>

      {/* LEFT ARM */}
      <group ref={lArmRef} position={[-0.27,1.28,0]}>
        <mesh position={[0,-0.14,0]} castShadow><cylinderGeometry args={[0.065,0.06,0.28,8]} /><meshStandardMaterial color={uc} roughness={0.88} /></mesh>
        <mesh position={[0,-0.34,0.04]} rotation={[-0.2,0,0]} castShadow><cylinderGeometry args={[0.055,0.05,0.24,8]} /><meshStandardMaterial color={uc} roughness={0.88} /></mesh>
        <mesh position={[0,-0.47,0.07]}><boxGeometry args={[0.09,0.08,0.06]} /><meshStandardMaterial color={GLOVES} roughness={0.9} /></mesh>
      </group>

      {/* RIGHT ARM */}
      <group ref={rArmRef} position={[0.27,1.28,0]}>
        <mesh position={[0,-0.14,0]} castShadow><cylinderGeometry args={[0.065,0.06,0.28,8]} /><meshStandardMaterial color={uc} roughness={0.88} /></mesh>
        <mesh position={[0,-0.34,0.04]} rotation={[-0.2,0,0]} castShadow><cylinderGeometry args={[0.055,0.05,0.24,8]} /><meshStandardMaterial color={uc} roughness={0.88} /></mesh>
        <mesh position={[0,-0.47,0.07]}><boxGeometry args={[0.09,0.08,0.06]} /><meshStandardMaterial color={GLOVES} roughness={0.9} /></mesh>
        {/* AR rifle */}
        <group position={[0.04,-0.42,0.28]} rotation={[-0.1,0,0]}>
          <mesh castShadow><boxGeometry args={[0.04,0.07,0.38]} /><meshStandardMaterial color={GUN} roughness={0.5} metalness={0.7} /></mesh>
          <mesh position={[0,0.01,0.28]} rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[0.012,0.014,0.22,8]} /><meshStandardMaterial color={GUN} metalness={0.8} /></mesh>
        </group>
      </group>

      {/* LEFT LEG */}
      <group ref={lLegRef} position={[-0.12,0.82,0]}>
        <mesh position={[0,-0.2,0]} castShadow><cylinderGeometry args={[0.08,0.072,0.4,8]} /><meshStandardMaterial color={uc} roughness={0.88} /></mesh>
        <mesh position={[0,-0.48,0.02]} rotation={[-0.05,0,0]} castShadow><cylinderGeometry args={[0.065,0.055,0.38,8]} /><meshStandardMaterial color={uc} roughness={0.88} /></mesh>
        <mesh position={[0,-0.7,0.04]} castShadow><boxGeometry args={[0.12,0.1,0.2]} /><meshStandardMaterial color={BOOTS} roughness={0.85} /></mesh>
      </group>

      {/* RIGHT LEG */}
      <group ref={rLegRef} position={[0.12,0.82,0]}>
        <mesh position={[0,-0.2,0]} castShadow><cylinderGeometry args={[0.08,0.072,0.4,8]} /><meshStandardMaterial color={uc} roughness={0.88} /></mesh>
        <mesh position={[0,-0.48,0.02]} rotation={[-0.05,0,0]} castShadow><cylinderGeometry args={[0.065,0.055,0.38,8]} /><meshStandardMaterial color={uc} roughness={0.88} /></mesh>
        <mesh position={[0,-0.7,0.04]} castShadow><boxGeometry args={[0.12,0.1,0.2]} /><meshStandardMaterial color={BOOTS} roughness={0.85} /></mesh>
      </group>
    </group>
  );
}
