import { useEffect, useRef } from "react";
import * as THREE from "three";

interface GamePreview3DProps {
  genre: string;
  gameType?: string;
  title?: string;
}

export default function GamePreview3D({ genre, gameType, title }: GamePreview3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 800;
    const H = mount.clientHeight || 500;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    const gt = gameType || genre || "default";
    const isBR = gt.includes("battle") || genre === "battle-royale";
    const isFPS = gt.includes("fps") || genre === "fps";
    const isMobile = gt.includes("mobile");
    const isRPG = genre === "rpg";
    const isRacing = genre === "racing";

    // Background / fog
    if (isBR) {
      scene.background = new THREE.Color(0x87ceeb);
      scene.fog = new THREE.Fog(0x87ceeb, 80, 300);
    } else if (isFPS) {
      scene.background = new THREE.Color(0x8a9ba8);
      scene.fog = new THREE.Fog(0x8a9ba8, 50, 200);
    } else if (isMobile) {
      scene.background = new THREE.Color(0x6be5ff);
      scene.fog = new THREE.Fog(0x6be5ff, 100, 400);
    } else if (isRPG) {
      scene.background = new THREE.Color(0x2a1a0e);
      scene.fog = new THREE.FogExp2(0x2a1a0e, 0.008);
    } else if (isRacing) {
      scene.background = new THREE.Color(0x1a1a2e);
      scene.fog = new THREE.Fog(0x1a1a2e, 100, 500);
    } else {
      scene.background = new THREE.Color(0x0a0a1a);
      scene.fog = new THREE.Fog(0x0a0a1a, 80, 250);
    }

    // ── Camera ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    if (isFPS) {
      camera.position.set(0, 4, 0);
    } else {
      camera.position.set(0, 40, 80);
    }
    camera.lookAt(0, 0, 0);

    // ── Lights ────────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, isBR ? 0.8 : isMobile ? 0.9 : 0.4);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(isBR ? 0xfff0c0 : isFPS ? 0xc0d0ff : 0xffffff, isBR ? 2.5 : 1.8);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 500;
    sun.shadow.camera.left = -150;
    sun.shadow.camera.right = 150;
    sun.shadow.camera.top = 150;
    sun.shadow.camera.bottom = -150;
    scene.add(sun);

    if (isMobile || isRPG) {
      const fill = new THREE.HemisphereLight(0x87ceeb, 0x3d7a3d, 0.6);
      scene.add(fill);
    }

    // ── Terrain ───────────────────────────────────────────────────────────────
    const terrainMat = new THREE.MeshLambertMaterial({
      color: isBR ? 0x4a7c59 : isFPS ? 0x8a7a6a : isMobile ? 0x44cc66 : isRPG ? 0x2d4a1e : 0x333344,
    });

    if (isBR) {
      // Island terrain — round-ish map
      const terrainGeo = new THREE.CircleGeometry(120, 64);
      const terrain = new THREE.Mesh(terrainGeo, terrainMat);
      terrain.rotation.x = -Math.PI / 2;
      terrain.receiveShadow = true;
      scene.add(terrain);

      // Ocean
      const oceanGeo = new THREE.PlaneGeometry(400, 400);
      const oceanMat = new THREE.MeshLambertMaterial({ color: 0x1a6b9a, transparent: true, opacity: 0.85 });
      const ocean = new THREE.Mesh(oceanGeo, oceanMat);
      ocean.rotation.x = -Math.PI / 2;
      ocean.position.y = -0.5;
      scene.add(ocean);
    } else if (isRacing) {
      // Race track
      const trackGeo = new THREE.RingGeometry(35, 55, 64);
      const trackMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      const track = new THREE.Mesh(trackGeo, trackMat);
      track.rotation.x = -Math.PI / 2;
      scene.add(track);

      const groundGeo = new THREE.PlaneGeometry(300, 300);
      const groundMat = new THREE.MeshLambertMaterial({ color: 0x1a4a1a });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.1;
      scene.add(ground);
    } else {
      const groundGeo = new THREE.PlaneGeometry(300, 300);
      const ground = new THREE.Mesh(groundGeo, terrainMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
    }

    // ── Buildings / Structures ────────────────────────────────────────────────
    function addBuilding(x: number, z: number, w: number, h: number, d: number, color: number) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Windows
      const winMat = new THREE.MeshBasicMaterial({ color: 0xffee99, transparent: true, opacity: 0.6 });
      const winGeo = new THREE.PlaneGeometry(1.2, 1.5);
      const floorsCount = Math.floor(h / 4);
      for (let fl = 0; fl < floorsCount; fl++) {
        for (let wn = 0; wn < Math.floor(w / 3); wn++) {
          const win = new THREE.Mesh(winGeo, winMat);
          win.position.set(x - w / 2 + 1.5 + wn * 3, 2 + fl * 4, z + d / 2 + 0.01);
          scene.add(win);
        }
      }
    }

    if (isBR) {
      // Tilted Town-style locations
      addBuilding(-30, -10, 12, 18, 10, 0xc9a96e);
      addBuilding(-30, 5, 8, 12, 8, 0xb8956a);
      addBuilding(-15, -20, 10, 8, 8, 0xc0a060);
      addBuilding(20, 20, 14, 24, 12, 0x8a7b6a);
      addBuilding(20, 5, 9, 14, 9, 0x9a8a7a);
      addBuilding(40, -15, 16, 10, 12, 0xb0a090);
      addBuilding(5, 30, 11, 16, 10, 0xa09080);
      addBuilding(-45, 25, 8, 20, 8, 0xc8b070);
      // Supply drop tower
      const towerGeo = new THREE.CylinderGeometry(1.5, 2, 30, 8);
      const tower = new THREE.Mesh(towerGeo, new THREE.MeshLambertMaterial({ color: 0x888888 }));
      tower.position.set(-60, 15, -30);
      tower.castShadow = true;
      scene.add(tower);
    } else if (isFPS) {
      // COD Shipment-style layout
      const containerColors = [0x4a6a8a, 0x8a4a4a, 0x4a8a4a, 0x8a8a4a, 0x6a4a8a];
      const containerPositions = [
        [-20, 0, -10], [-20, 0, 10], [20, 0, -10], [20, 0, 10],
        [-5, 0, -20], [5, 0, -20], [-5, 0, 20], [5, 0, 20],
        [0, 0, 0],
      ];
      containerPositions.forEach(([cx, _cy, cz], i) => {
        addBuilding(cx, cz, 8, 4, 3, containerColors[i % containerColors.length]);
        if (i % 3 === 0) addBuilding(cx, cz - 5, 8, 4, 3, containerColors[(i + 1) % containerColors.length]);
      });
      // Perimeter walls
      addBuilding(-35, 0, 3, 6, 60, 0x6a6a6a);
      addBuilding(35, 0, 3, 6, 60, 0x6a6a6a);
    } else if (isMobile) {
      // Colorful cartoon buildings
      const mobileColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa8e6cf, 0xff8b94, 0x88d8b0];
      [[-25, -15], [-25, 15], [25, -15], [25, 15], [0, -30], [0, 30], [-40, 0], [40, 0]].forEach(([bx, bz], i) => {
        addBuilding(bx, bz, 8 + (i % 3) * 2, 10 + (i % 4) * 4, 8 + (i % 2) * 3, mobileColors[i % mobileColors.length]);
      });
    } else if (isRPG) {
      // Fantasy castle + village
      addBuilding(0, 0, 20, 40, 20, 0x8a7a6a);
      // Towers
      for (const [tx, tz] of [[-10, -10], [10, -10], [10, 10], [-10, 10]]) {
        const towerG = new THREE.CylinderGeometry(3, 3.5, 50, 8);
        const towerM = new THREE.Mesh(towerG, new THREE.MeshLambertMaterial({ color: 0x9a8a7a }));
        towerM.position.set(tx, 25, tz);
        towerM.castShadow = true;
        scene.add(towerM);
        const roofG = new THREE.ConeGeometry(4, 8, 8);
        const roofM = new THREE.Mesh(roofG, new THREE.MeshLambertMaterial({ color: 0x4a2a2a }));
        roofM.position.set(tx, 54, tz);
        scene.add(roofM);
      }
      // Village
      [[-40, -20], [-50, 10], [-35, 30], [40, -25], [50, 15]].forEach(([vx, vz]) => {
        addBuilding(vx, vz, 8, 6, 7, 0x8a6a4a);
      });
    } else {
      // Generic: sci-fi outpost
      addBuilding(-20, -10, 10, 14, 8, 0x2a4a6a);
      addBuilding(20, 10, 14, 20, 10, 0x1a3a5a);
      addBuilding(0, -25, 8, 8, 8, 0x3a5a7a);
      addBuilding(-30, 20, 6, 10, 6, 0x2a4a6a);
    }

    // ── Trees / Foliage ───────────────────────────────────────────────────────
    if (isBR || isMobile || isRPG) {
      const treePositions = Array.from({ length: isBR ? 40 : 20 }, () => [
        (Math.random() - 0.5) * 180,
        (Math.random() - 0.5) * 180,
      ]);
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
      const leafMat = new THREE.MeshLambertMaterial({ color: isMobile ? 0x44dd55 : isRPG ? 0x1a6a1a : 0x2d7a3d });

      treePositions.forEach(([tx, tz]) => {
        const h = 4 + Math.random() * 8;
        const trunkG = new THREE.CylinderGeometry(0.3, 0.5, h, 6);
        const trunk = new THREE.Mesh(trunkG, trunkMat);
        trunk.position.set(tx, h / 2, tz);
        trunk.castShadow = true;
        scene.add(trunk);

        const leafG = new THREE.ConeGeometry(2.5 + Math.random() * 1.5, 6 + Math.random() * 4, 7);
        const leaf = new THREE.Mesh(leafG, leafMat);
        leaf.position.set(tx, h + 2, tz);
        leaf.castShadow = true;
        scene.add(leaf);
      });
    }

    // ── Battle Royale: Storm Circle ───────────────────────────────────────────
    if (isBR) {
      const stormGeo = new THREE.RingGeometry(85, 95, 64);
      const stormMat = new THREE.MeshBasicMaterial({ color: 0x6600cc, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      const storm = new THREE.Mesh(stormGeo, stormMat);
      storm.rotation.x = -Math.PI / 2;
      storm.position.y = 0.3;
      scene.add(storm);

      const stormInnerGeo = new THREE.CircleGeometry(85, 64);
      const stormInnerMat = new THREE.MeshBasicMaterial({ color: 0x4400aa, transparent: true, opacity: 0.07 });
      const stormInner = new THREE.Mesh(stormInnerGeo, stormInnerMat);
      stormInner.rotation.x = -Math.PI / 2;
      stormInner.position.y = 0.1;
      scene.add(stormInner);

      // Parachuting players (dots)
      for (let i = 0; i < 8; i++) {
        const playerDot = new THREE.Mesh(
          new THREE.SphereGeometry(0.8, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xff4444 })
        );
        playerDot.position.set(
          (Math.random() - 0.5) * 140,
          15 + Math.random() * 30,
          (Math.random() - 0.5) * 140
        );
        scene.add(playerDot);
      }
    }

    // ── FPS: Cover Objects ────────────────────────────────────────────────────
    if (isFPS) {
      // Sandbags
      const sandbagMat = new THREE.MeshLambertMaterial({ color: 0xa8955a });
      for (let i = 0; i < 8; i++) {
        const bag = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 1), sandbagMat);
        bag.position.set((Math.random() - 0.5) * 50, 0.6, (Math.random() - 0.5) * 50);
        bag.castShadow = true;
        scene.add(bag);
      }
      // Barrels
      const barrelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      for (let i = 0; i < 6; i++) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2.5, 8), barrelMat);
        barrel.position.set((Math.random() - 0.5) * 50, 1.25, (Math.random() - 0.5) * 50);
        barrel.castShadow = true;
        scene.add(barrel);
      }
    }

    // ── Racing: Cars ─────────────────────────────────────────────────────────
    if (isRacing) {
      const carPositions = [[45, -10], [45, 0], [45, 10], [-45, -10]];
      const carColors = [0xff2222, 0x2266ff, 0x22cc44, 0xffaa22];
      carPositions.forEach(([cx, cz], i) => {
        const carBody = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 5.5), new THREE.MeshLambertMaterial({ color: carColors[i] }));
        carBody.position.set(cx, 0.75, cz);
        scene.add(carBody);
        const carTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1, 3), new THREE.MeshLambertMaterial({ color: carColors[i] }));
        carTop.position.set(cx, 2, cz - 0.5);
        scene.add(carTop);
        // Wheels
        const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const wheelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 12);
        [[-1.5, -1.8], [-1.5, 1.8], [1.5, -1.8], [1.5, 1.8]].forEach(([wx, wz]) => {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(cx + wx, 0.7, cz + wz);
          scene.add(wheel);
        });
      });
    }

    // ── Player Character (generic) ────────────────────────────────────────────
    if (!isFPS) {
      const playerGroup = new THREE.Group();
      const bodyMat = new THREE.MeshLambertMaterial({ color: isMobile ? 0xff6b35 : isBR ? 0x4a90d9 : 0x333333 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.6), bodyMat);
      body.position.y = 1;
      playerGroup.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), bodyMat);
      head.position.y = 2.6;
      playerGroup.add(head);
      const armGeo = new THREE.BoxGeometry(0.4, 1.5, 0.4);
      const lArm = new THREE.Mesh(armGeo, bodyMat);
      lArm.position.set(-0.9, 1.2, 0);
      lArm.rotation.z = 0.3;
      playerGroup.add(lArm);
      const rArm = new THREE.Mesh(armGeo, bodyMat);
      rArm.position.set(0.9, 1.2, 0);
      rArm.rotation.z = -0.3;
      playerGroup.add(rArm);
      const weaponGeo = new THREE.BoxGeometry(0.2, 0.2, 1.5);
      const weapon = new THREE.Mesh(weaponGeo, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
      weapon.position.set(1.1, 1.3, -0.5);
      playerGroup.add(weapon);
      playerGroup.position.set(0, 0, 5);
      scene.add(playerGroup);
    }

    // ── Stars (night scenes) ─────────────────────────────────────────────────
    if (!isBR && !isMobile) {
      const starGeo = new THREE.BufferGeometry();
      const starCount = 500;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 600;
        positions[i * 3 + 1] = 50 + Math.random() * 200;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 600;
      }
      starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true });
      scene.add(new THREE.Points(starGeo, starMat));
    }

    // ── Title Text Plane ──────────────────────────────────────────────────────
    // (canvas texture for title)
    if (title) {
      const canvas2d = document.createElement("canvas");
      canvas2d.width = 512;
      canvas2d.height = 64;
      const ctx = canvas2d.getContext("2d")!;
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, 512, 64);
      ctx.fillStyle = isBR ? "#00f0ff" : isMobile ? "#ffee00" : "#ffffff";
      ctx.font = "bold 40px monospace";
      ctx.textAlign = "center";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 8;
      ctx.fillText(title.toUpperCase(), 256, 48);
      const tex = new THREE.CanvasTexture(canvas2d);
      const labelGeo = new THREE.PlaneGeometry(40, 5);
      const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(0, isBR ? 45 : isFPS ? 12 : 40, 0);
      label.lookAt(camera.position);
      scene.add(label);
    }

    // ── Orbit Animation ───────────────────────────────────────────────────────
    let animId: number;
    let t = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      t += 0.003;

      if (isFPS) {
        // FPS fly-through
        camera.position.x = Math.sin(t * 0.5) * 30;
        camera.position.z = Math.cos(t * 0.5) * 30;
        camera.position.y = 4 + Math.sin(t * 2) * 1;
        camera.lookAt(0, 2, 0);
      } else {
        // Orbit from above
        const radius = isBR ? 110 : isRacing ? 80 : 85;
        const elevation = isBR ? 55 : isRPG ? 60 : 50;
        camera.position.x = Math.sin(t) * radius;
        camera.position.z = Math.cos(t) * radius;
        camera.position.y = elevation + Math.sin(t * 0.3) * 5;
        camera.lookAt(0, isBR ? 5 : 10, 0);
      }

      // Storm pulse
      if (isBR) {
        scene.children.forEach((c) => {
          if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshBasicMaterial && (c.material.color as THREE.Color).getHex() === 0x6600cc) {
            c.material.opacity = 0.3 + 0.2 * Math.sin(t * 3);
          }
        });
      }

      renderer.render(scene, camera);
    }

    animate();

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [genre, gameType, title]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 text-xs font-mono text-white/50 pointer-events-none">
        LIVE 3D PREVIEW — UE5 Scene
      </div>
      <div className="absolute top-3 right-3 text-xs font-mono px-2 py-1 rounded bg-black/50 text-cyan-400 pointer-events-none">
        ● REALTIME
      </div>
    </div>
  );
}
