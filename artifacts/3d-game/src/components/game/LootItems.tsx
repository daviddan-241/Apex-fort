import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LootItem } from "../../types/game";
import { randomLoot, RARITY_COLORS } from "../../data/weapons";
import { useGameStore } from "../../store/gameStore";
import { getTerrainHeight } from "./Terrain";

const LOOT_SPAWN_POSITIONS: [number, number][] = [
  [0, 0], [-30, -20], [40, 30], [10, -50], [-15, 25],
  [50, -15], [-45, 40], [25, 60], [-60, -10], [35, -40],
  [-20, -60], [60, 20], [-10, 45], [30, -25], [-50, 10],
  [70, -30], [-70, 30], [20, 70], [-20, -70], [55, 55],
  [-55, -55], [0, -80], [80, 0], [-80, 0], [0, 80],
];

// Chests — special high-rarity loot
const CHEST_POSITIONS: [number, number][] = [
  [5, 5], [-35, -25], [42, 32], [12, -48], [-18, 28],
  [52, -18], [-48, 42], [28, 58], [-58, -12], [38, -42],
];

function spawnLoot(): LootItem[] {
  return LOOT_SPAWN_POSITIONS.map(([x, z], i) => {
    const weapon = randomLoot();
    return {
      id: `loot_${i}`,
      position: new THREE.Vector3(x, getTerrainHeight(x, z) + 0.6, z),
      weaponType: weapon.type,
      ammo: weapon.ammo,
      rarity: weapon.rarity,
    };
  });
}

export default function LootItems() {
  const [items, setItems] = useState<LootItem[]>(() => spawnLoot());
  const { pickupWeapon, addMaterial } = useGameStore();
  const rotRef = useRef(0);
  const playerRef = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    rotRef.current += delta * 1.5;

    // Get camera as player position
    playerRef.current.copy(state.camera.position);
    playerRef.current.y -= 1.75;

    const toPickup: string[] = [];
    items.forEach((item) => {
      const dx = playerRef.current.x - item.position.x;
      const dz = playerRef.current.z - item.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
        toPickup.push(item.id);
        const w = randomLoot();
        w.type = item.weaponType;
        w.rarity = item.rarity;
        pickupWeapon(w);
        addMaterial("wood", Math.floor(Math.random() * 20) + 5);
      }
    });
    if (toPickup.length > 0) {
      setItems((prev) => prev.filter((it) => !toPickup.includes(it.id)));
    }
  });

  return (
    <>
      {items.map((item) => (
        <LootMesh key={item.id} item={item} rotRef={rotRef} />
      ))}
      {CHEST_POSITIONS.map((pos, i) => (
        <ChestMesh key={`chest_${i}`} x={pos[0]} z={pos[1]} rotRef={rotRef} />
      ))}
    </>
  );
}

function LootMesh({ item, rotRef }: { item: LootItem; rotRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Group>(null);
  const color = RARITY_COLORS[item.rarity];

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = rotRef.current;
    meshRef.current.position.y = item.position.y + Math.sin(rotRef.current * 0.8) * 0.18;
  });

  return (
    <group ref={meshRef} position={[item.position.x, item.position.y, item.position.z]}>
      {/* Weapon crate */}
      <mesh castShadow>
        <boxGeometry args={[0.55, 0.38, 0.38]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
      {/* Rarity glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]}>
        <ringGeometry args={[0.5, 0.7, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
      {/* Point light glow */}
      <pointLight color={color} intensity={0.6} distance={3} />
    </group>
  );
}

function ChestMesh({ x, z, rotRef }: { x: number; z: number; rotRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Group>(null);
  const y = getTerrainHeight(x, z) + 0.5;
  const { pickupWeapon, addMaterial } = useGameStore();
  const openedRef = useRef(false);

  useFrame((state) => {
    if (!meshRef.current || openedRef.current) return;
    const px = state.camera.position.x;
    const pz = state.camera.position.z;
    const dx = px - x; const dz = pz - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2.8) {
      openedRef.current = true;
      // Drop epic/legendary weapon
      const epicWeapons = ["Shotgun_EPIC", "Sniper", "AR_RARE", "RPG"];
      const { WEAPONS } = require("../../data/weapons");
      const picked = WEAPONS[epicWeapons[Math.floor(Math.random() * epicWeapons.length)]];
      if (picked) pickupWeapon({ ...picked });
      addMaterial("wood", 50);
      addMaterial("stone", 30);
      addMaterial("metal", 20);
      if (meshRef.current) meshRef.current.visible = false;
    }
    if (meshRef.current) meshRef.current.rotation.y = rotRef.current * 0.3;
  });

  return (
    <group ref={meshRef} position={[x, y, z]}>
      {/* Chest body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.6, 0.7]} />
        <meshLambertMaterial color="#8B6914" />
      </mesh>
      {/* Chest lid */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.9, 0.18, 0.7]} />
        <meshLambertMaterial color="#a07820" />
      </mesh>
      {/* Metal trim */}
      <mesh position={[0, 0.01, 0.36]}>
        <boxGeometry args={[0.9, 0.62, 0.04]} />
        <meshLambertMaterial color="#888" />
      </mesh>
      {/* Golden glow */}
      <pointLight color="#ffd700" intensity={1.2} distance={5} />
      {/* Glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.31, 0]}>
        <ringGeometry args={[0.6, 0.9, 20]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}
