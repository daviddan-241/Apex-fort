import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../../store/gameStore";
import { getTerrainHeight, getLocationName, VEHICLE_SPAWNS } from "./Terrain";
import { VehicleState } from "../../types/game";

const MOVE_SPEED = 10;
const SPRINT_SPEED = 16;
const JUMP_VEL = 9;
const GRAVITY = -24;
const HARVEST_AMOUNT = 15;
const VEHICLE_ENTER_DIST = 5;
const VEHICLE_EXIT_OFFSET = 3;

// Vehicle physics constants
const CAR_MAX_SPEED = 28;
const TRUCK_MAX_SPEED = 18;
const BIKE_MAX_SPEED = 24;
const VEHICLE_ACCEL = 14;
const VEHICLE_BRAKE = 20;
const VEHICLE_FRICTION = 6;
const VEHICLE_TURN_SPEED = 1.8;

interface PlayerProps {
  onShoot: (pos: THREE.Vector3, dir: THREE.Vector3, damage: number, fromPlayer: boolean) => void;
  onHarvest?: (mat: "wood" | "stone" | "metal") => void;
}

export default function Player({ onShoot, onHarvest }: PlayerProps) {
  const { camera } = useThree();
  const posRef = useRef(new THREE.Vector3(0, 5, 0));
  const velRef = useRef(new THREE.Vector3());
  const onGroundRef = useRef(false);
  const keysRef = useRef<Record<string, boolean>>({});
  const lastShotRef = useRef(0);
  const shootPressedRef = useRef(false);
  const harvestCooldownRef = useRef(0);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const frameRef = useRef(0);
  const jumpPressedRef = useRef(false);
  // Vehicle state refs
  const vehicleSpeedRef = useRef(0);
  const enterCooldownRef = useRef(0);

  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const buildMode = useGameStore((s) => s.buildMode);
  const inVehicle = useGameStore((s) => s.inVehicle);
  const vehicleId = useGameStore((s) => s.vehicleId);
  const {
    shootWeapon, startReload, toggleBuildMode, setActiveSlot,
    setADS, setSprinting, addMaterial, useTactical, useUltimate,
    setSelectedBuildPiece, setLocationName, addDamageNumber,
    enterVehicle, exitVehicle, setVehicleSpeed,
  } = useGameStore();

  useEffect(() => {
    (window as any).__playerYaw = 0;
    if (!(window as any).__vehicleStates) {
      (window as any).__vehicleStates = VEHICLE_SPAWNS.map((v) => ({ ...v }));
    }
  }, []);

  // Pointer lock (desktop)
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const onClick = () => {
      if (!document.pointerLockElement && !(window as any).__isMobile) canvas.requestPointerLock();
    };
    canvas.addEventListener("click", onClick);
    return () => canvas.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = e.type === "keydown";
      if (e.type !== "keydown") return;
      if (k === "r") { startReload(); return; }
      if (k === "b") { toggleBuildMode(); return; }
      if (k === "e") {
        // Vehicle entry/exit takes priority
        const store = useGameStore.getState();
        if (store.inVehicle) {
          // Exit vehicle
          exitVehicle();
          const vs: VehicleState[] = (window as any).__vehicleStates ?? [];
          const v = vs.find(s => s.id === store.vehicleId);
          if (v) {
            v.occupied = false;
            // Offset player position to side of vehicle
            posRef.current.set(v.x + Math.sin(v.yaw + Math.PI / 2) * VEHICLE_EXIT_OFFSET, getTerrainHeight(v.x, v.z) + 1, v.z + Math.cos(v.yaw + Math.PI / 2) * VEHICLE_EXIT_OFFSET);
          }
          enterCooldownRef.current = 0.5;
        } else if (enterCooldownRef.current <= 0) {
          // Try to enter nearby vehicle
          const vs: VehicleState[] = (window as any).__vehicleStates ?? [];
          for (const v of vs) {
            if (v.occupied) continue;
            const dx = posRef.current.x - v.x;
            const dz = posRef.current.z - v.z;
            if (Math.sqrt(dx * dx + dz * dz) < VEHICLE_ENTER_DIST) {
              enterVehicle(v.id);
              v.occupied = true;
              vehicleSpeedRef.current = v.speed;
              yawRef.current = v.yaw;
              return;
            }
          }
          useTactical();
        }
        return;
      }
      if (k === "q") { useUltimate(); return; }
      if (!inVehicle) {
        if (!buildMode) {
          if (k === "1") setActiveSlot(0);
          if (k === "2") setActiveSlot(1);
          if (k === "3") setActiveSlot(2);
          if (k === "4") setActiveSlot(3);
          if (k === "5") setActiveSlot(4);
        }
        if (k === " ") {
          if (onGroundRef.current) {
            velRef.current.y = JUMP_VEL;
            onGroundRef.current = false;
          }
          e.preventDefault();
        }
        if (buildMode) {
          if (k === "1") setSelectedBuildPiece("wall");
          if (k === "2") setSelectedBuildPiece("floor");
          if (k === "3") setSelectedBuildPiece("ramp");
          if (k === "4") setSelectedBuildPiece("roof");
          if (k === "5") setSelectedBuildPiece("stair");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [buildMode, inVehicle, startReload, toggleBuildMode, setActiveSlot, useTactical, useUltimate,
      setSelectedBuildPiece, enterVehicle, exitVehicle]);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      yawRef.current -= e.movementX * 0.0022;
      pitchRef.current -= e.movementY * 0.0022;
      pitchRef.current = Math.max(-1.1, Math.min(0.7, pitchRef.current));
    };
    const onDown = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      if (e.button === 0) shootPressedRef.current = true;
      if (e.button === 2) setADS(true);
    };
    const onUp = (e: MouseEvent) => {
      if (e.button === 0) shootPressedRef.current = false;
      if (e.button === 2) setADS(false);
    };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [setADS]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    frameRef.current++;
    const keys = keysRef.current;
    if (enterCooldownRef.current > 0) enterCooldownRef.current -= dt;

    // ── Mobile input ──
    const mob = (window as any).__mobileInput;
    if (mob) {
      if (mob.lookDeltaX !== 0 || mob.lookDeltaY !== 0) {
        yawRef.current -= mob.lookDeltaX;
        pitchRef.current -= mob.lookDeltaY;
        pitchRef.current = Math.max(-1.1, Math.min(0.7, pitchRef.current));
        mob.lookDeltaX = 0;
        mob.lookDeltaY = 0;
      }
      if (mob.fire) shootPressedRef.current = true;
      else if (!(window as any).__isMobile) { /* desktop */ }
      else shootPressedRef.current = false;

      if (mob.jump && !jumpPressedRef.current && onGroundRef.current) {
        velRef.current.y = JUMP_VEL;
        onGroundRef.current = false;
        jumpPressedRef.current = true;
      }
      if (!mob.jump) jumpPressedRef.current = false;
    }

    // ──────────────────────────────
    // VEHICLE DRIVING MODE
    // ──────────────────────────────
    const store = useGameStore.getState();
    if (store.inVehicle && store.vehicleId) {
      const vs: VehicleState[] = (window as any).__vehicleStates ?? [];
      const v = vs.find(s => s.id === store.vehicleId);
      if (v) {
        const maxSpd = v.type === "car" ? CAR_MAX_SPEED : v.type === "truck" ? TRUCK_MAX_SPEED : BIKE_MAX_SPEED;
        const mobMoveX = mob?.moveX ?? 0;
        const mobMoveY = mob?.moveY ?? 0;

        const accel = (keys["w"] || keys["arrowup"] || mobMoveY < -0.1) ? 1 :
                      (keys["s"] || keys["arrowdown"] || mobMoveY > 0.1) ? -0.4 : 0;
        const turn  = (keys["a"] || keys["arrowleft"]  || mobMoveX < -0.1) ? -1 :
                      (keys["d"] || keys["arrowright"] || mobMoveX > 0.1) ? 1 : 0;

        // Speed update
        if (accel !== 0) {
          vehicleSpeedRef.current += accel * VEHICLE_ACCEL * dt;
        } else {
          // Friction
          const sign = vehicleSpeedRef.current > 0 ? -1 : 1;
          vehicleSpeedRef.current += sign * VEHICLE_FRICTION * dt;
          if (Math.abs(vehicleSpeedRef.current) < 0.1) vehicleSpeedRef.current = 0;
        }
        vehicleSpeedRef.current = Math.max(-maxSpd * 0.4, Math.min(maxSpd, vehicleSpeedRef.current));

        // Turning (only when moving)
        if (Math.abs(vehicleSpeedRef.current) > 0.5) {
          const turnFactor = Math.min(1, Math.abs(vehicleSpeedRef.current) / 5);
          v.yaw -= turn * VEHICLE_TURN_SPEED * dt * turnFactor * Math.sign(vehicleSpeedRef.current);
        }
        yawRef.current = v.yaw;

        // Move vehicle
        v.x -= Math.sin(v.yaw) * vehicleSpeedRef.current * dt;
        v.z -= Math.cos(v.yaw) * vehicleSpeedRef.current * dt;
        v.speed = vehicleSpeedRef.current;

        // Clamp to world bounds
        v.x = Math.max(-114, Math.min(114, v.x));
        v.z = Math.max(-114, Math.min(114, v.z));

        // Player rides on vehicle
        const ty = getTerrainHeight(v.x, v.z);
        const vehicleH = v.type === "truck" ? 2.0 : v.type === "car" ? 1.4 : 1.2;
        posRef.current.set(v.x, ty + vehicleH, v.z);

        // Set speed in store for HUD
        if (frameRef.current % 4 === 0) setVehicleSpeed(Math.abs(vehicleSpeedRef.current));

        // 3rd-person camera — farther back and higher for vehicle
        const camDist = v.type === "truck" ? 10 : 7;
        const camHeight = v.type === "truck" ? 5 : 3.8;
        const camX = v.x + Math.sin(v.yaw) * camDist;
        const camZ = v.z + Math.cos(v.yaw) * camDist;
        camera.position.set(camX, ty + camHeight, camZ);
        camera.lookAt(v.x, ty + vehicleH, v.z);

        // Update location
        if (frameRef.current % 30 === 0) setLocationName(getLocationName(v.x, v.z));
        (window as any).__playerYaw = v.yaw;
        return;
      }
    }

    // ──────────────────────────────
    // NORMAL FOOT MOVEMENT
    // ──────────────────────────────
    const mobMoveX = mob?.moveX ?? 0;
    const mobMoveY = mob?.moveY ?? 0;
    const hasMobMove = Math.abs(mobMoveX) > 0.05 || Math.abs(mobMoveY) > 0.05;

    const isSprinting = (!hasMobMove && !!(keys["shift"]) && !!(keys["w"] || keys["arrowup"]));
    setSprinting(isSprinting);
    const speed = isSprinting ? SPRINT_SPEED : MOVE_SPEED;

    const fwd = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
    const rgt = new THREE.Vector3(Math.cos(yawRef.current), 0, -Math.sin(yawRef.current));
    const move = new THREE.Vector3();

    if (hasMobMove) {
      move.addScaledVector(fwd, -mobMoveY);
      move.addScaledVector(rgt, mobMoveX);
    } else {
      if (keys["w"] || keys["arrowup"]) move.add(fwd);
      if (keys["s"] || keys["arrowdown"]) move.sub(fwd);
      if (keys["a"] || keys["arrowleft"]) move.sub(rgt);
      if (keys["d"] || keys["arrowright"]) move.add(rgt);
    }
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed);

    velRef.current.x = move.x;
    velRef.current.z = move.z;
    velRef.current.y += GRAVITY * dt;
    posRef.current.addScaledVector(velRef.current, dt);

    const th = getTerrainHeight(posRef.current.x, posRef.current.z);
    if (posRef.current.y <= th + 0.05) {
      posRef.current.y = th + 0.05;
      velRef.current.y = 0;
      onGroundRef.current = true;
    } else {
      onGroundRef.current = false;
    }

    const bound = 115;
    posRef.current.x = Math.max(-bound, Math.min(bound, posRef.current.x));
    posRef.current.z = Math.max(-bound, Math.min(bound, posRef.current.z));

    camera.position.copy(posRef.current).add(new THREE.Vector3(0, 1.75, 0));
    camera.quaternion.setFromEuler(new THREE.Euler(pitchRef.current, yawRef.current, 0, "YXZ"));
    (window as any).__playerYaw = yawRef.current;

    if (frameRef.current % 30 === 0) setLocationName(getLocationName(posRef.current.x, posRef.current.z));

    // ── Shooting / harvesting ──
    const now = Date.now();
    const fireRate = currentWeapon?.fireRate ?? 300;
    if (shootPressedRef.current && !buildMode && now - lastShotRef.current >= fireRate) {
      lastShotRef.current = now;
      if (currentWeapon?.type === "Pickaxe") {
        if (harvestCooldownRef.current <= 0) {
          harvestCooldownRef.current = 0.55;
          const mats: ("wood" | "stone" | "metal")[] = ["wood", "stone", "metal"];
          const mat = mats[Math.floor(Math.random() * mats.length)];
          addMaterial(mat, HARVEST_AMOUNT);
          onHarvest?.(mat);
          addDamageNumber(HARVEST_AMOUNT, window.innerWidth / 2, window.innerHeight / 2 - 40);
        }
      } else if (shootWeapon()) {
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
        const spread = currentWeapon?.spread ?? 0.04;
        const pellets = currentWeapon?.pellets ?? 1;
        for (let p = 0; p < pellets; p++) {
          const d = dir.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * spread * 2,
            (Math.random() - 0.5) * spread * 2,
            0
          )).normalize();
          onShoot(posRef.current.clone().add(new THREE.Vector3(0, 1.65, 0)), d, (currentWeapon?.damage ?? 10) / pellets, true);
        }
      }
    }
    if (harvestCooldownRef.current > 0) harvestCooldownRef.current -= dt;

    // Storm check
    const dx = posRef.current.x - store.stormCenter.x;
    const dz = posRef.current.z - store.stormCenter.y;
    store.setInStorm(Math.sqrt(dx * dx + dz * dz) > store.stormRadius);
  });

  return null;
}
