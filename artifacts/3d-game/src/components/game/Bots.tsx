import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../../store/gameStore";
import { Bot } from "../../types/game";
import { getTerrainHeight } from "./Terrain";

const BOT_COUNT = 29;
const BOT_NAMES = [
  "Reaper_X","NightHawk","GhostBlade","IronFist","Shadow99",
  "CyberWolf","Titan42","Blazer","Phantom","Raven",
  "Viper","SnipeKing","Crusher","Havoc","SteelMind",
  "RedFox","DarkStar","Striker","NeoKnight","Bandit",
  "Spectre","Vector","Hydra","Nomad","Wraith",
  "Saber","Lynx","Tempest","Volt",
];
const BOT_COLORS = [
  "#c0392b","#8e44ad","#16a085","#d35400","#2980b9",
  "#27ae60","#e74c3c","#9b59b6","#f39c12","#1abc9c",
  "#e67e22","#3498db","#2ecc71","#e91e63","#ff5722",
];
const MOVE_SPEED = 5;
const AGGRO_RANGE = 45;
const SHOOT_RANGE = 35;
const SHOOT_COOLDOWN = 1200;

function createBot(id: number): Bot {
  const angle = (id / BOT_COUNT) * Math.PI * 2;
  const radius = 30 + (id % 6) * 12;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  return {
    id: `bot_${id}`,
    position: new THREE.Vector3(x, getTerrainHeight(x, z) + 1, z),
    rotation: Math.random() * Math.PI * 2,
    health: 80 + Math.floor(Math.random() * 40),
    shield: Math.random() > 0.4 ? Math.floor(Math.random() * 80) : 0,
    isAlive: true,
    targetPosition: null,
    lastShotTime: 0,
    wanderTimer: Math.random() * 3,
    color: BOT_COLORS[id % BOT_COLORS.length],
    aggroRange: AGGRO_RANGE + (Math.random() - 0.5) * 10,
    state: "wandering",
    name: BOT_NAMES[id % BOT_NAMES.length],
  };
}

interface BotsProps {
  onShoot: (pos: THREE.Vector3, dir: THREE.Vector3, damage: number, fromPlayer: boolean) => void;
  playerRef: React.MutableRefObject<THREE.Vector3>;
  bulletsRef: React.MutableRefObject<Array<{ id: string; position: THREE.Vector3; direction: THREE.Vector3; speed: number; damage: number; fromPlayer: boolean }>>;
}

export default function Bots({ onShoot, playerRef, bulletsRef }: BotsProps) {
  const botsRef = useRef<Bot[]>(Array.from({ length: BOT_COUNT }, (_, i) => createBot(i)));
  const { addKill, setPlayersAlive, takeDamage, addDamageNumber } = useGameStore();

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const now = Date.now();
    const playerPos = playerRef.current;
    const store = useGameStore.getState();
    let aliveCount = 1; // player

    botsRef.current.forEach((bot) => {
      if (!bot.isAlive) return;
      aliveCount++;

      const dx = playerPos.x - bot.position.x;
      const dz = playerPos.z - bot.position.z;
      const distToPlayer = Math.sqrt(dx * dx + dz * dz);

      // Check bullet hits on bot
      const hitBullets: typeof bulletsRef.current = [];
      bulletsRef.current.forEach((b) => {
        if (!b.fromPlayer) return;
        const bx = b.position.x - bot.position.x;
        const by = b.position.y - (bot.position.y + 1);
        const bz = b.position.z - bot.position.z;
        const dist = Math.sqrt(bx * bx + by * by + bz * bz);
        if (dist < 1.5) {
          hitBullets.push(b);
          let remaining = b.damage;
          const isCrit = Math.random() < 0.15;
          const dmg = isCrit ? b.damage * 1.5 : b.damage;
          const shieldAbsorb = Math.min(bot.shield, dmg);
          bot.shield = Math.max(0, bot.shield - shieldAbsorb);
          remaining = Math.max(0, dmg - shieldAbsorb);
          bot.health -= remaining;
          const sx = window.innerWidth / 2 + (Math.random() - 0.5) * 80;
          const sy = window.innerHeight / 2 + (Math.random() - 0.5) * 80;
          addDamageNumber(Math.round(dmg), sx, sy, isCrit);
          if (bot.health <= 0) {
            bot.isAlive = false;
            addKill(bot.name, store.currentWeapon?.name ?? "AR");
          }
          bot.state = "chasing";
        }
      });
      // Remove hit bullets
      if (hitBullets.length > 0) {
        bulletsRef.current = bulletsRef.current.filter(b => !hitBullets.includes(b));
      }

      if (!bot.isAlive) return;

      // Storm damages bots too
      const sdx = bot.position.x - store.stormCenter.x;
      const sdz = bot.position.z - store.stormCenter.y;
      if (Math.sqrt(sdx * sdx + sdz * sdz) > store.stormRadius) {
        bot.health -= 1.5 * dt;
        if (bot.health <= 0) { bot.isAlive = false; return; }
      }

      // State machine
      if (distToPlayer < bot.aggroRange) {
        bot.state = distToPlayer < SHOOT_RANGE ? "shooting" : "chasing";
      } else {
        if (bot.state === "chasing") bot.state = "wandering";
      }

      // Wander
      if (bot.state === "wandering") {
        bot.wanderTimer -= dt;
        if (bot.wanderTimer <= 0) {
          bot.wanderTimer = 2 + Math.random() * 4;
          const wanderDist = 15 + Math.random() * 25;
          const wanderAngle = Math.random() * Math.PI * 2;
          bot.targetPosition = new THREE.Vector3(
            Math.max(-110, Math.min(110, bot.position.x + Math.cos(wanderAngle) * wanderDist)),
            0,
            Math.max(-110, Math.min(110, bot.position.z + Math.sin(wanderAngle) * wanderDist))
          );
        }
        if (bot.targetPosition) {
          const tx = bot.targetPosition.x - bot.position.x;
          const tz = bot.targetPosition.z - bot.position.z;
          const d = Math.sqrt(tx * tx + tz * tz);
          if (d > 1) {
            const speed = MOVE_SPEED * 0.6;
            bot.position.x += (tx / d) * speed * dt;
            bot.position.z += (tz / d) * speed * dt;
            bot.rotation = Math.atan2(tx, tz);
          }
        }
      }

      // Chase
      if (bot.state === "chasing") {
        const speed = MOVE_SPEED;
        if (distToPlayer > 3) {
          bot.position.x += (dx / distToPlayer) * speed * dt;
          bot.position.z += (dz / distToPlayer) * speed * dt;
          bot.rotation = Math.atan2(dx, dz);
        }
      }

      // Shoot
      if (bot.state === "shooting" && now - bot.lastShotTime > SHOOT_COOLDOWN + Math.random() * 800) {
        bot.lastShotTime = now;
        bot.rotation = Math.atan2(dx, dz);
        const shootDir = new THREE.Vector3(dx, 0.1, dz).normalize();
        // add small spread
        shootDir.add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.12,
          (Math.random() - 0.5) * 0.06,
          (Math.random() - 0.5) * 0.12
        )).normalize();
        const shootPos = bot.position.clone().add(new THREE.Vector3(0, 1.4, 0));
        onShoot(shootPos, shootDir, 12 + Math.random() * 8, false);

        // Check if this shot hits the player
        const closeness = Math.max(0, 1 - distToPlayer / SHOOT_RANGE);
        if (Math.random() < 0.35 * closeness) {
          const dmg = 8 + Math.floor(Math.random() * 12);
          takeDamage(dmg);
        }
      }

      // Ground stick
      const th = getTerrainHeight(bot.position.x, bot.position.z);
      bot.position.y = th + 0.05;
    });

    setPlayersAlive(aliveCount);
  });

  return (
    <group>
      {botsRef.current.map((bot) => (
        <BotMesh key={bot.id} bot={bot} />
      ))}
    </group>
  );
}

function BotMesh({ bot }: { bot: Bot }) {
  const meshRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.copy(bot.position);
    meshRef.current.rotation.y = bot.rotation;
    meshRef.current.visible = bot.isAlive;
  });
  return (
    <group ref={meshRef}>
      {/* Body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.38, 1.1, 4, 8]} />
        <meshLambertMaterial color={bot.color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <sphereGeometry args={[0.3, 7, 6]} />
        <meshLambertMaterial color={bot.color} />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <sphereGeometry args={[0.32, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color="#333" />
      </mesh>
      {/* Gun */}
      <mesh position={[0.45, 1.1, -0.3]} rotation={[0, 0, Math.PI / 12]} castShadow>
        <boxGeometry args={[0.08, 0.12, 0.5]} />
        <meshLambertMaterial color="#222" />
      </mesh>
      {/* Health bar */}
      <group position={[0, 2.6, 0]}>
        <mesh>
          <planeGeometry args={[1, 0.12]} />
          <meshBasicMaterial color="#222" />
        </mesh>
        <mesh position={[-(0.5 - (bot.health / 200) * 0.5), 0, 0.01]}>
          <planeGeometry args={[(bot.health / 200), 0.10]} />
          <meshBasicMaterial color={bot.health > 50 ? "#2ecc71" : "#e74c3c"} />
        </mesh>
        {bot.shield > 0 && (
          <mesh position={[0, 0.14, 0.01]}>
            <planeGeometry args={[(bot.shield / 160), 0.08]} />
            <meshBasicMaterial color="#5bc8ff" />
          </mesh>
        )}
      </group>
    </group>
  );
}
