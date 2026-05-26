/**
 * NPCSoldier — zero React-state AI soldier.
 * All animation and game logic runs inside useFrame via direct ref mutation.
 * No setState → no re-renders → full 60 fps with 20+ NPCs.
 */
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '@/utils/terrain';

export interface NPCHandle {
  id: number;
  team: 0 | 1;
  getPos: () => THREE.Vector3;
  getState: () => 'patrol' | 'engage' | 'dead';
  takeDamage: (dmg: number) => void;
}

interface Props {
  id: number;
  team: 0 | 1;
  spawn: THREE.Vector3;
  registry: Map<number, NPCHandle>;
  onKill?: (killerTeam: 0 | 1, victimName: string) => void;
}

const NAMES = ['Ghost','Apex','Wraith','Shadow','Storm','Viper','Titan','Reaper','Nova','Blade','Hawk','Zero'];

const TEAM_COLORS: [string, string, string][] = [
  ['#2d4820','#3d5228','#2a3a20'], // team 0: green
  ['#4a1e1e','#5a2020','#3a2020'], // team 1: red
];
const SKIN='#c4956a', BOOTS='#1a120a', GUN='#1a1a1a', GLOVES='#1e1208';

export function NPCSoldier({ id, team, spawn, registry, onKill }: Props) {
  const groupRef    = useRef<THREE.Group>(null);
  const lArmRef     = useRef<THREE.Group>(null);
  const rArmRef     = useRef<THREE.Group>(null);
  const lLegRef     = useRef<THREE.Group>(null);
  const rLegRef     = useRef<THREE.Group>(null);
  const muzzleRef   = useRef<THREE.PointLight>(null);

  const pos         = useRef(spawn.clone());
  const rotY        = useRef(Math.random() * Math.PI * 2);
  const health      = useRef(100);
  const state       = useRef<'patrol'|'engage'|'dead'>('patrol');
  const waypoint    = useRef<THREE.Vector3|null>(null);
  const fireTimer   = useRef(Math.random() * 2);
  const fireInterval= useRef(1.5 + Math.random());
  const deadTimer   = useRef(0);
  const limbTime    = useRef(0);
  const name        = useRef(NAMES[id % NAMES.length]);

  const [hc, uc, ac] = TEAM_COLORS[team];

  useEffect(() => {
    const handle: NPCHandle = {
      id, team,
      getPos:   () => pos.current,
      getState: () => state.current,
      takeDamage(dmg) {
        if (state.current === 'dead') return;
        health.current = Math.max(0, health.current - dmg);
        if (health.current <= 0) state.current = 'dead';
      },
    };
    registry.set(id, handle);
    return () => { registry.delete(id); };
  }, [id, team, registry]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);

    // ── DEAD ────────────────────────────────────────────────────
    if (state.current === 'dead') {
      g.visible = false;
      deadTimer.current += dt;
      if (deadTimer.current > 8) {
        state.current = 'patrol';
        health.current = 100;
        deadTimer.current = 0;
        pos.current.copy(spawn);
        g.visible = true;
        fireTimer.current = 0;
      }
      return;
    }

    // ── Find nearest enemy ───────────────────────────────────────
    const found: { enemy: NPCHandle | null; dist: number } = { enemy: null, dist: Infinity };
    registry.forEach((npc) => {
      if (npc.id === id || npc.team === team || npc.getState() === 'dead') return;
      const d = pos.current.distanceTo(npc.getPos());
      if (d < found.dist) { found.dist = d; found.enemy = npc; }
    });
    const nearestEnemy = found.enemy;
    const nearestDist  = found.dist;

    let moving = false;
    let running = false;

    // ── ENGAGE ──────────────────────────────────────────────────
    if (nearestEnemy && nearestDist < 50) {
      state.current = 'engage';
      running = nearestDist > 22;
      const ePos = nearestEnemy.getPos();
      const toEnemy = new THREE.Vector3().subVectors(ePos, pos.current).normalize();
      rotY.current = Math.atan2(toEnemy.x, toEnemy.z);

      if (nearestDist > 20) {
        pos.current.addScaledVector(toEnemy, (running ? 6 : 3) * dt);
        moving = true;
      }

      if (nearestDist < 40) {
        fireTimer.current += dt;
        if (fireTimer.current >= fireInterval.current) {
          fireTimer.current = 0;
          fireInterval.current = 1.0 + Math.random() * 2.0;
          if (Math.random() > 0.3) {
            nearestEnemy.takeDamage(12 + Math.random() * 18);
            if (nearestEnemy.getState() === 'dead') {
              onKill?.(team, NAMES[nearestEnemy.id % NAMES.length]);
            }
          }
          if (muzzleRef.current) {
            muzzleRef.current.intensity = 12;
            setTimeout(() => { if (muzzleRef.current) muzzleRef.current.intensity = 0; }, 75);
          }
        }
      }
    } else {
      // ── PATROL ────────────────────────────────────────────────
      state.current = 'patrol';
      moving = true;
      if (!waypoint.current || pos.current.distanceTo(waypoint.current) < 3) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * 80;
        waypoint.current = new THREE.Vector3(
          spawn.x + Math.cos(angle) * radius,
          0,
          spawn.z + Math.sin(angle) * radius
        );
      }
      const toWP = new THREE.Vector3().subVectors(waypoint.current, pos.current).normalize();
      rotY.current = Math.atan2(toWP.x, toWP.z);
      pos.current.addScaledVector(toWP, 4.2 * dt);
    }

    // ── Terrain snap ────────────────────────────────────────────
    pos.current.y = getTerrainHeight(pos.current.x, pos.current.z) + 1.05;

    // ── Apply transforms ────────────────────────────────────────
    g.position.copy(pos.current);
    g.rotation.y = rotY.current;

    // ── Limb animation ──────────────────────────────────────────
    if (moving) limbTime.current += dt * (running ? 9 : 5);
    const swing = moving ? Math.sin(limbTime.current) * 0.5 : 0;
    if (lArmRef.current) lArmRef.current.rotation.x =  swing;
    if (rArmRef.current) rArmRef.current.rotation.x = -swing;
    if (lLegRef.current) lLegRef.current.rotation.x = -swing;
    if (rLegRef.current) rLegRef.current.rotation.x =  swing;
  });

  return (
    <group ref={groupRef}>
      {/* HEAD */}
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.155, 12, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.75} />
      </mesh>
      {/* HELMET */}
      <mesh position={[0, 1.82, 0]} castShadow>
        <sphereGeometry args={[0.175, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={hc} roughness={0.85} metalness={0.15} />
      </mesh>
      {/* NECK */}
      <mesh position={[0, 1.53, 0]}>
        <cylinderGeometry args={[0.065, 0.07, 0.1, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.8} />
      </mesh>
      {/* TORSO */}
      <mesh position={[0, 1.18, 0]} castShadow>
        <boxGeometry args={[0.42, 0.52, 0.22]} />
        <meshStandardMaterial color={uc} roughness={0.88} />
      </mesh>
      {/* VEST */}
      <mesh position={[0, 1.22, 0.01]} castShadow>
        <boxGeometry args={[0.38, 0.4, 0.24]} />
        <meshStandardMaterial color={ac} roughness={0.9} metalness={0.05} />
      </mesh>
      {/* PELVIS */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[0.38, 0.14, 0.2]} />
        <meshStandardMaterial color={uc} roughness={0.88} />
      </mesh>

      {/* LEFT ARM */}
      <group ref={lArmRef} position={[-0.27, 1.28, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.06, 0.28, 8]} />
          <meshStandardMaterial color={uc} roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.34, 0.04]} rotation={[-0.2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.05, 0.24, 8]} />
          <meshStandardMaterial color={uc} roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.47, 0.07]}>
          <boxGeometry args={[0.09, 0.08, 0.06]} />
          <meshStandardMaterial color={GLOVES} roughness={0.9} />
        </mesh>
      </group>

      {/* RIGHT ARM (holds rifle) */}
      <group ref={rArmRef} position={[0.27, 1.28, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.06, 0.28, 8]} />
          <meshStandardMaterial color={uc} roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.34, 0.04]} rotation={[-0.2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.05, 0.24, 8]} />
          <meshStandardMaterial color={uc} roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.47, 0.07]}>
          <boxGeometry args={[0.09, 0.08, 0.06]} />
          <meshStandardMaterial color={GLOVES} roughness={0.9} />
        </mesh>
        {/* Rifle */}
        <group position={[0.04, -0.42, 0.28]} rotation={[-0.1, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.04, 0.07, 0.38]} />
            <meshStandardMaterial color={GUN} roughness={0.5} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.01, 0.28]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.014, 0.22, 8]} />
            <meshStandardMaterial color={GUN} roughness={0.4} metalness={0.8} />
          </mesh>
        </group>
        {/* Muzzle flash */}
        <pointLight
          ref={muzzleRef}
          position={[0.04, -0.42, -0.5]}
          intensity={0}
          color={team === 0 ? '#aaff66' : '#ff8844'}
          distance={20}
          decay={2}
        />
      </group>

      {/* LEFT LEG */}
      <group ref={lLegRef} position={[-0.12, 0.82, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.072, 0.4, 8]} />
          <meshStandardMaterial color={uc} roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.48, 0.02]} rotation={[-0.05, 0, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.055, 0.38, 8]} />
          <meshStandardMaterial color={uc} roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.7, 0.04]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.2]} />
          <meshStandardMaterial color={BOOTS} roughness={0.85} />
        </mesh>
      </group>

      {/* RIGHT LEG */}
      <group ref={rLegRef} position={[0.12, 0.82, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.072, 0.4, 8]} />
          <meshStandardMaterial color={uc} roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.48, 0.02]} rotation={[-0.05, 0, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.055, 0.38, 8]} />
          <meshStandardMaterial color={uc} roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.7, 0.04]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.2]} />
          <meshStandardMaterial color={BOOTS} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}
