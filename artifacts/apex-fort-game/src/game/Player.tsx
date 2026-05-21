import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";

const SPEED = 10;
const SPRINT_MULT = 1.8;
const JUMP_FORCE = 12;
const LOOK_SENSITIVITY = 0.002;
const FIRE_COOLDOWN_MS: Record<string, number> = {
  "Pistol": 220, "SMG": 90, "Assault Rifle": 175, "Shotgun": 850,
  "Sniper Rifle": 1100, "LMG": 125, "Melee": 600, "Explosive": 2000,
};

const keys = new Set<string>();
let yaw = 0;
let pitch = 0;
let isGrounded = false;
let lastFireTime = 0;
let lastDamageTime = 0;
let showDamageFlash = false;

export default function Player() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const {
    setPlayerPosition, shoot: storeShoot, bots, killBot, loot, pickupLoot,
    playerPosition, buildMode, toggleBuildMode, cycleBuildPiece,
    weapons, activeWeaponIndex, reload, finishReload, takeDamage,
    addKillFeedEntry, recordShot, recordDamage, switchWeapon,
  } = useGameStore();

  // Pointer lock
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const onClick = () => {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
    };
    canvas.addEventListener("click", onClick);
    return () => canvas.removeEventListener("click", onClick);
  }, []);

  // Key listeners
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (e.code === "KeyR") reload();
      if (e.code === "KeyB") toggleBuildMode();
      if (e.code === "KeyV") cycleBuildPiece();
      if (e.code.startsWith("Digit")) {
        const n = parseInt(e.code.replace("Digit", "")) - 1;
        switchWeapon(n);
      }
    };
    const onUp = (e: KeyboardEvent) => keys.delete(e.code);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [reload, toggleBuildMode, cycleBuildPiece, switchWeapon]);

  // Mouse look
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        yaw -= e.movementX * LOOK_SENSITIVITY;
        pitch -= e.movementY * LOOK_SENSITIVITY;
        pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 4, pitch));
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Shooting
  const handleShoot = useCallback(() => {
    const weapon = weapons[activeWeaponIndex];
    if (!weapon || buildMode) return;
    const cooldown = FIRE_COOLDOWN_MS[weapon.type] ?? 200;
    const now = Date.now();
    if (now - lastFireTime < cooldown) return;
    lastFireTime = now;

    const fired = storeShoot();
    if (!fired) return;

    // Raycast against bots
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
    const origin = camera.position.clone();
    const ray = new THREE.Ray(origin, dir);

    let hit = false;
    let closestDist = Infinity;
    let hitBotId = "";

    for (const bot of bots) {
      if (bot.isDead) continue;
      const botPos = new THREE.Vector3(...bot.position);
      const sphere = new THREE.Sphere(botPos, 1.5);
      const pt = new THREE.Vector3();
      if (ray.intersectSphere(sphere, pt)) {
        const dist = origin.distanceTo(pt);
        if (dist < closestDist) {
          closestDist = dist;
          hitBotId = bot.id;
          hit = true;
        }
      }
    }

    recordShot(hit);

    if (hit && hitBotId) {
      // Damage falloff based on weapon type and range
      let dmg = weapon.damage;
      if (weapon.type === "Shotgun") {
        // Shotgun pellets — 8 pellets, each with spread
        dmg = weapon.damage * (0.3 + Math.random() * 0.7);
      } else if (weapon.type === "Sniper Rifle") {
        dmg = weapon.damage; // no falloff
      } else {
        dmg = weapon.damage * Math.max(0.4, 1 - closestDist / 200);
      }
      dmg = Math.round(dmg);
      recordDamage(dmg);

      const bot = bots.find(b => b.id === hitBotId);
      if (bot) {
        const newHp = bot.hp - dmg;
        if (newHp <= 0) {
          killBot(hitBotId, weapon.name);
        } else {
          useGameStore.getState().updateBot(hitBotId, { hp: newHp });
        }
      }
    }

    // Auto reload when empty
    const updatedWeapon = useGameStore.getState().weapons[activeWeaponIndex];
    if (updatedWeapon?.ammo === 0) {
      reload();
      setTimeout(() => finishReload(), (weapon.type === "Shotgun" ? 0.6 : weapon.type === "Sniper Rifle" ? 3.2 : 2.4) * 1000);
    }
  }, [bots, weapons, activeWeaponIndex, buildMode, camera, storeShoot, killBot, recordShot, recordDamage, reload, finishReload, pitch]);

  // Mouse click → shoot
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && document.pointerLockElement) handleShoot();
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [handleShoot]);

  // Bot AI damage to player
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastDamageTime < 800) return;
      const pos = new THREE.Vector3(...useGameStore.getState().playerPosition);
      for (const bot of useGameStore.getState().bots) {
        if (bot.isDead) continue;
        const botPos = new THREE.Vector3(...bot.position);
        const dist = pos.distanceTo(botPos);
        if (dist < 35 && bot.state === "ENGAGING") {
          // Accuracy-based hit check
          const accuracy = 0.3 + (35 - dist) / 35 * 0.5;
          if (Math.random() < accuracy) {
            useGameStore.getState().takeDamage(8 + Math.random() * 12);
            lastDamageTime = now;
            showDamageFlash = true;
            setTimeout(() => { showDamageFlash = false; }, 300);
          }
          break;
        }
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Reload timer
  useEffect(() => {
    const interval = setInterval(() => {
      const weapon = useGameStore.getState().weapons[useGameStore.getState().activeWeaponIndex];
      if (weapon?.isReloading) {
        const reloadTime = weapon.type === "Shotgun" ? 600 : weapon.type === "Sniper Rifle" ? 3200 : 2400;
        setTimeout(() => useGameStore.getState().finishReload(), reloadTime);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useFrame((_, delta) => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    const vel = rb.linvel();
    const pos = rb.translation();

    // Ground check
    isGrounded = pos.y < 3.5;

    // Movement
    const isSprinting = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const speed = SPEED * (isSprinting ? SPRINT_MULT : 1);

    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const moveDir = new THREE.Vector3();

    if (keys.has("KeyW")) moveDir.add(forward);
    if (keys.has("KeyS")) moveDir.sub(forward);
    if (keys.has("KeyA")) moveDir.sub(right);
    if (keys.has("KeyD")) moveDir.add(right);

    if (moveDir.length() > 0) moveDir.normalize().multiplyScalar(speed);

    // Jump
    const jumpVel = (keys.has("Space") && isGrounded) ? JUMP_FORCE : vel.y;

    rb.setLinvel({ x: moveDir.x, y: jumpVel, z: moveDir.z }, true);

    // Update camera
    camera.position.set(pos.x, pos.y + 1.5, pos.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // Sync to store (throttled)
    setPlayerPosition([pos.x, pos.y, pos.z]);

    // Loot pickup check (E key)
    if (keys.has("KeyE")) {
      const playerPos = new THREE.Vector3(pos.x, pos.y, pos.z);
      for (const item of useGameStore.getState().loot) {
        if (item.collected) continue;
        const itemPos = new THREE.Vector3(...item.position);
        if (playerPos.distanceTo(itemPos) < 4) {
          pickupLoot(item.id);
          break;
        }
      }
    }

    // Storm update
    useGameStore.getState().updateStorm(delta);
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[0, 5, 0]}
      enabledRotations={[false, false, false]}
      linearDamping={6}
      colliders={false}
      mass={80}
    >
      <CapsuleCollider args={[0.8, 0.5]} />
      <mesh ref={meshRef} visible={false}>
        <capsuleGeometry args={[0.5, 1.6, 4, 8]} />
        <meshBasicMaterial color="blue" />
      </mesh>
    </RigidBody>
  );
}
