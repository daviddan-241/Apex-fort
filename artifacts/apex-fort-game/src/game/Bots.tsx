import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore, type BotState } from "@/store/gameStore";

const BOT_COLORS: Record<string, string> = {
  LOOTING: "#60a5fa",
  MOVING: "#22c55e",
  ENGAGING: "#ef4444",
  FLEEING: "#f59e0b",
};

function BotMesh({ bot }: { bot: BotState }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const stateTimer = useRef(Math.random() * 3);
  const moveTarget = useRef(new THREE.Vector3(
    bot.position[0] + (Math.random() - 0.5) * 40,
    0,
    bot.position[2] + (Math.random() - 0.5) * 40,
  ));

  const updateBot = useGameStore(s => s.updateBot);

  useFrame((state, delta) => {
    if (bot.isDead) return;
    const group = groupRef.current;
    if (!group) return;

    stateTimer.current -= delta;
    const playerPos = new THREE.Vector3(...useGameStore.getState().playerPosition);
    const { stormRadius, stormCenter, bots } = useGameStore.getState();
    const botPos = new THREE.Vector3(group.position.x, group.position.y, group.position.z);

    const distToPlayer = botPos.distanceTo(playerPos);
    const dx = botPos.x - stormCenter[0];
    const dz = botPos.z - stormCenter[1];
    const distFromCenter = Math.sqrt(dx * dx + dz * dz);
    const inStorm = distFromCenter > stormRadius;

    // State machine
    let currentState = bot.state;
    if (stateTimer.current <= 0) {
      stateTimer.current = 2 + Math.random() * 3;
      if (inStorm) {
        currentState = "FLEEING";
        // Move toward storm center
        moveTarget.current.set(
          botPos.x + (stormCenter[0] - botPos.x) * 0.5,
          0,
          botPos.z + (stormCenter[1] - botPos.z) * 0.5,
        );
      } else if (distToPlayer < 60) {
        currentState = "ENGAGING";
      } else if (distToPlayer < 120) {
        currentState = "MOVING";
        // Move toward player
        const dir = playerPos.clone().sub(botPos).normalize().multiplyScalar(25);
        moveTarget.current.set(botPos.x + dir.x, 0, botPos.z + dir.z);
      } else {
        currentState = "LOOTING";
        // Wander
        moveTarget.current.set(
          botPos.x + (Math.random() - 0.5) * 40,
          0,
          botPos.z + (Math.random() - 0.5) * 40,
        );
      }

      // Storm damage to bots
      if (inStorm) {
        const stormDps = [1, 3, 8, 15, 30][useGameStore.getState().stormPhase] ?? 5;
        const newHp = bot.hp - stormDps * stateTimer.current;
        if (newHp <= 0) {
          updateBot(bot.id, { isDead: true, hp: 0, state: currentState });
          useGameStore.getState().addKillFeedEntry("Storm", bot.name, "Storm");
          return;
        }
        updateBot(bot.id, { hp: newHp, state: currentState });
      } else {
        updateBot(bot.id, { state: currentState });
      }
    }

    // Movement
    const speed = currentState === "FLEEING" ? 7 : currentState === "ENGAGING" ? 4 : 5;
    const target = currentState === "ENGAGING" && distToPlayer > 15
      ? playerPos.clone()
      : moveTarget.current;
    target.y = group.position.y;
    const dir = target.clone().sub(botPos).normalize();

    if (target.distanceTo(botPos) > 1.5) {
      group.position.x += dir.x * speed * delta;
      group.position.z += dir.z * speed * delta;
      group.rotation.y = Math.atan2(dir.x, dir.z);
    }

    // Sync position
    updateBot(bot.id, {
      position: [group.position.x, group.position.y, group.position.z],
    });
  });

  if (bot.isDead) {
    return (
      <group position={bot.position}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.2, 0]}>
          <capsuleGeometry args={[0.3, 1, 4, 8]} />
          <meshLambertMaterial color="#333344" />
        </mesh>
      </group>
    );
  }

  const bodyColor = BOT_COLORS[bot.state] ?? "#60a5fa";
  const hpRatio = bot.hp / 100;

  return (
    <group ref={groupRef} position={bot.position}>
      {/* Body */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <capsuleGeometry args={[0.4, 1.4, 4, 8]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} castShadow position={[0, 2.3, 0]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshLambertMaterial color="#c08060" />
      </mesh>

      {/* HP bar (world space) */}
      <group position={[0, 3.2, 0]}>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[1.2, 0.12]} />
          <meshBasicMaterial color="#1a1a2a" depthTest={false} />
        </mesh>
        <mesh position={[-(0.6 - hpRatio * 0.6), 0, 0.01]}>
          <planeGeometry args={[1.2 * hpRatio, 0.10]} />
          <meshBasicMaterial color="#ef4444" depthTest={false} />
        </mesh>
      </group>

      {/* Name tag */}
      {bot.state === "ENGAGING" && (
        <mesh position={[0, 3.6, 0]}>
          <planeGeometry args={[0.8, 0.15]} />
          <meshBasicMaterial color="#ef444488" depthTest={false} transparent />
        </mesh>
      )}
    </group>
  );
}

export default function BotSystem() {
  const bots = useGameStore(s => s.bots);

  return (
    <group>
      {bots.map(bot => (
        <BotMesh key={bot.id} bot={bot} />
      ))}
    </group>
  );
}
