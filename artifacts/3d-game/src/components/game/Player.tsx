import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../../store/gameStore";
import { getTerrainHeight, getLocationName } from "./Terrain";

const MOVE_SPEED = 10;
const SPRINT_SPEED = 16;
const JUMP_VEL = 9;
const GRAVITY = -24;
const HARVEST_AMOUNT = 15;

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

  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const buildMode = useGameStore((s) => s.buildMode);
  const {
    shootWeapon, startReload, toggleBuildMode, setActiveSlot,
    setADS, setSprinting, addMaterial, useTactical, useUltimate,
    setSelectedBuildPiece, setLocationName, addDamageNumber,
  } = useGameStore();

  // Pointer lock
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const onClick = () => {
      if (!document.pointerLockElement) canvas.requestPointerLock();
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
      if (k === "e") { useTactical(); return; }
      if (k === "q") { useUltimate(); return; }
      if (k === "1") setActiveSlot(0);
      if (k === "2") setActiveSlot(1);
      if (k === "3") setActiveSlot(2);
      if (k === "4") setActiveSlot(3);
      if (k === "5") setActiveSlot(4);
      if (k === " ") {
        if (onGroundRef.current) {
          velRef.current.y = JUMP_VEL;
          onGroundRef.current = false;
        }
        e.preventDefault();
      }
      // Build piece selection in build mode
      if (buildMode) {
        if (k === "1") setSelectedBuildPiece("wall");
        if (k === "2") setSelectedBuildPiece("floor");
        if (k === "3") setSelectedBuildPiece("ramp");
        if (k === "4") setSelectedBuildPiece("roof");
        if (k === "5") setSelectedBuildPiece("stair");
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [buildMode, startReload, toggleBuildMode, setActiveSlot, useTactical, useUltimate, setSelectedBuildPiece]);

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
    const isSprinting = !!(keys["shift"] || keys["arrowup"]) && !!(keys["w"] || keys["arrowup"]);
    setSprinting(isSprinting);
    const speed = isSprinting ? SPRINT_SPEED : MOVE_SPEED;

    const fwd = new THREE.Vector3(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current));
    const rgt = new THREE.Vector3(Math.cos(yawRef.current), 0, -Math.sin(yawRef.current));
    const move = new THREE.Vector3();
    if (keys["w"] || keys["arrowup"]) move.add(fwd);
    if (keys["s"] || keys["arrowdown"]) move.sub(fwd);
    if (keys["a"] || keys["arrowleft"]) move.sub(rgt);
    if (keys["d"] || keys["arrowright"]) move.add(rgt);
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

    // Update location every 30 frames
    if (frameRef.current % 30 === 0) {
      setLocationName(getLocationName(posRef.current.x, posRef.current.z));
    }

    // Shooting / harvesting
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
          onShoot(
            posRef.current.clone().add(new THREE.Vector3(0, 1.65, 0)),
            d,
            (currentWeapon?.damage ?? 10) / pellets,
            true
          );
        }
      }
    }
    if (harvestCooldownRef.current > 0) harvestCooldownRef.current -= dt;

    // Storm check
    const store = useGameStore.getState();
    const dx = posRef.current.x - store.stormCenter.x;
    const dz = posRef.current.z - store.stormCenter.y;
    const distFromCenter = Math.sqrt(dx * dx + dz * dz);
    store.setInStorm(distFromCenter > store.stormRadius);
  });

  return null;
}
