import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { NPCSoldier, NPCHandle } from './NPCSoldier';
import { useGameStore } from '@/store/gameStore';

// Spawn points: 8 per team, spread across the map
const TEAM0_SPAWNS = [
  [-60, 0, -60], [-80, 0, 0], [-60, 0, 60], [-40, 0, -80],
  [-100, 0, -40], [-50, 0, 40], [-90, 0, 30], [-30, 0, -50],
].map(([x,,z]) => new THREE.Vector3(x, 0, z));

const TEAM1_SPAWNS = [
  [60, 0, 60], [80, 0, 0], [60, 0, -60], [40, 0, 80],
  [100, 0, 40], [50, 0, -40], [90, 0, -30], [30, 0, 50],
].map(([x,,z]) => new THREE.Vector3(x, 0, z));

const NPC_COUNT = 8; // per team

export function NPCManager() {
  const registry = useRef<Map<number, NPCHandle>>(new Map());
  const addKillFeedEntry = useGameStore(s => s.addKillFeedEntry);

  const weapons = ['AR-15', 'SMG', 'AK-47', 'M4', 'Sniper', 'Shotgun'];

  const handleKill = useCallback((killerTeam: 0 | 1, victimName: string) => {
    const teamName = killerTeam === 0 ? 'ALPHA' : 'BRAVO';
    addKillFeedEntry({
      killer: teamName,
      victim: victimName,
      weapon: weapons[Math.floor(Math.random() * weapons.length)],
    });
  }, [addKillFeedEntry]);

  return (
    <>
      {TEAM0_SPAWNS.slice(0, NPC_COUNT).map((spawn, i) => (
        <NPCSoldier
          key={`t0-${i}`}
          id={i}
          team={0}
          spawn={spawn}
          registry={registry.current}
          onKill={handleKill}
        />
      ))}
      {TEAM1_SPAWNS.slice(0, NPC_COUNT).map((spawn, i) => (
        <NPCSoldier
          key={`t1-${i}`}
          id={NPC_COUNT + i}
          team={1}
          spawn={spawn}
          registry={registry.current}
          onKill={handleKill}
        />
      ))}
    </>
  );
}
