import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

/* CONFIG — todos los valores ajustables de la escena viven aquí. */
export const CONFIG = {
  colors: {
    galaxy: "#26215C",
    velox: "#534AB7",
    force: "#7F77DD",
    aura: "#AFA9EC",
    ice: "#EEEDFE",
    bg: "#0B0920",
  },
  tunnelParticles: 26000,
  cloudParticles: 9000,
  cameraLerp: 0.06,
  mouseParallax: 0.3,
  fog: { near: 14, far: 80 },
};

type P = MutableRefObject<number>;

/** Sub-progreso 0..1 dentro de un tramo [a,b] del scroll global. */
const seg = (p: number, a: number, b: number) => THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);
const smooth = (x: number) => x * x * (3 - 2 * x);
/** Ventana de aparición/desaparición de un acto. */
const win = (p: number, a: number, b: number, fade = 0.02) =>
  Math.min(smooth(THREE.MathUtils.clamp((p - a) / fade, 0, 1)), smooth(THREE.MathUtils.clamp((b - p) / fade, 0, 1)));

/* --------------------------------------------------- Fondo estelar siempre visible */
function Starfield({ quality }: { quality: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = Math.floor(3500 * quality);
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 2] = -Math.random() * 70 - 5;
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pos, 3));
  }, [count]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.01;
  });
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={0.14}
        color={CONFIG.colors.aura}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---------------------------------------------------------------- Túnel */
function Tunnel({ progress, quality }: { progress: P; quality: number }) {
  const count = Math.floor(CONFIG.tunnelParticles * quality);
  const ref = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color(CONFIG.colors.velox);
    const c2 = new THREE.Color(CONFIG.colors.aura);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 4.2 + Math.random() * 1.6;
      const z = -Math.random() * 120;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = z;
      const c = c1.clone().lerp(c2, Math.random());
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return {
      geometry: g,
      material: new THREE.PointsMaterial({
        size: 0.055,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    };
  }, [count]);

  useFrame((_, dt) => {
    const p = progress.current;
    const o = ref.current;
    if (!o) return;
    const fade = 1 - smooth(seg(p, 0.20, 0.32));
    (o.material as THREE.PointsMaterial).opacity = fade;
    o.visible = fade > 0.01;
    // el túnel se abre y fragmenta cuando llega la consecuencia
    const burst = smooth(seg(p, 0.18, 0.34));
    o.scale.setScalar(1 + burst * 2.4);
    o.rotation.z += dt * 0.05;
    o.position.z = (p * 60) % 20;
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

/* ------------------------------------------------- Ensamblaje / constelación */
function Constellation({ progress, quality }: { progress: P; quality: number }) {
  const group = useRef<THREE.Group>(null);
  const nodes = Math.floor(70 * quality) + 20;

  const { points, lines, targets, scatter } = useMemo(() => {
    const targets: THREE.Vector3[] = [];
    const scatter: THREE.Vector3[] = [];
    for (let i = 0; i < nodes; i++) {
      // malla esférica ordenada (destino) vs. nube dispersa (origen)
      const phi = Math.acos(1 - (2 * (i + 0.5)) / nodes);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      targets.push(
        new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)).multiplyScalar(4.6),
      );
      scatter.push(new THREE.Vector3().randomDirection().multiplyScalar(7 + Math.random() * 5));
    }
    const pg = new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(nodes * 3), 3),
    );
    const pairs: [number, number][] = [];
    for (let i = 0; i < nodes; i++) {
      for (let j = i + 1; j < nodes; j++) {
        if (targets[i]!.distanceTo(targets[j]!) < 1.9) pairs.push([i, j]);
      }
    }
    const lg = new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(pairs.length * 6), 3),
    );
    (lg as unknown as { userData: { pairs: [number, number][] } }).userData = { pairs };
    return {
      points: pg,
      lines: lg,
      targets,
      scatter,
    };
  }, [nodes]);

  useFrame(({ clock }) => {
    const p = progress.current;
    const g = group.current;
    if (!g) return;
    const vis = win(p, 0.22, 0.62, 0.05);
    g.visible = vis > 0.01;
    if (!g.visible) return;
    const form = smooth(seg(p, 0.24, 0.46));
    const pa = points.attributes["position"] as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < targets.length; i++) {
      const sc = scatter[i]!;
      const tg = targets[i]!;
      const x = THREE.MathUtils.lerp(sc.x, tg.x, form);
      const y = THREE.MathUtils.lerp(sc.y, tg.y, form) + Math.sin(t + i) * 0.04;
      const z = THREE.MathUtils.lerp(sc.z, tg.z, form);
      pa.setXYZ(i, x, y, z);
    }
    pa.needsUpdate = true;

    const pairs = (lines as unknown as { userData: { pairs: [number, number][] } }).userData.pairs;
    const la = lines.attributes["position"] as THREE.BufferAttribute;
    for (let k = 0; k < pairs.length; k++) {
      const [i, j] = pairs[k]!;
      la.setXYZ(k * 2, pa.getX(i), pa.getY(i), pa.getZ(i));
      la.setXYZ(k * 2 + 1, pa.getX(j), pa.getY(j), pa.getZ(j));
    }
    la.needsUpdate = true;

    g.rotation.y = t * 0.12;
    ((g.children[0] as THREE.Points).material as THREE.PointsMaterial).opacity = vis;
    ((g.children[1] as THREE.LineSegments).material as THREE.LineBasicMaterial).opacity = vis * form * 0.5;
  });

  return (
    <group ref={group} position={[2.5, 0.5, 4]}>
      <points geometry={points}>
        <pointsMaterial
          size={0.34}
          color={CONFIG.colors.ice}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={CONFIG.colors.force} transparent depthWrite={false} />
      </lineSegments>
    </group>
  );
}

/* ------------------------------------------------------------ Acto 1 · F1 */
function PitStop({ progress }: { progress: P }) {
  const group = useRef<THREE.Group>(null);
  const car = useRef<THREE.Group>(null);
  const crew = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group>(null);

  const crewSeeds = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({ x: (i % 4) * 1.1 - 1.65, z: i < 4 ? -1.5 : 1.5, ph: i })),
    [],
  );

  useFrame(({ clock }) => {
    const p = progress.current;
    const g = group.current;
    if (!g) return;
    const vis = win(p, 0.58, 0.73, 0.03);
    g.visible = vis > 0.01;
    if (!g.visible) return;
    const s = seg(p, 0.58, 0.73);
    const t = clock.elapsedTime;

    // entrada rápida a pits, parada, salida
    const inLap = smooth(THREE.MathUtils.clamp(s / 0.28, 0, 1));
    const out = smooth(THREE.MathUtils.clamp((s - 0.8) / 0.2, 0, 1));
    if (car.current) {
      car.current.position.x = THREE.MathUtils.lerp(-26, 0, inLap) + out * 30;
      car.current.position.y = -1.2;
    }
    if (wheels.current) {
      const moving = 1 - Math.min(1, Math.max(0, (s - 0.28) / 0.05)) + out;
      wheels.current.children.forEach((w) => (w.rotation.z -= 0.9 * moving));
    }
    // mecánicos: llegan, trabajan (oscilan), se retiran
    const work = THREE.MathUtils.clamp((s - 0.28) / 0.12, 0, 1) * (1 - out);
    if (crew.current) {
      crew.current.children.forEach((m, i) => {
        const seed = crewSeeds[i]!;
        m.position.x = seed.x;
        m.position.z = THREE.MathUtils.lerp(seed.z * 3.2, seed.z, work);
        m.position.y = -1.15 + Math.abs(Math.sin(t * 9 + seed.ph)) * 0.22 * work;
        (m as THREE.Mesh).scale.setScalar(0.6 + work * 0.4);
      });
    }
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m && "opacity" in m) {
        m.transparent = true;
        (m as THREE.MeshBasicMaterial).opacity = vis;
      }
    });
  });

  return (
    <group ref={group} position={[3, 0.8, 2]} scale={1.6}>
      {/* pista */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[120, 22]} />
        <meshBasicMaterial color={CONFIG.colors.galaxy} />
      </mesh>
      <gridHelper args={[120, 60, CONFIG.colors.velox, CONFIG.colors.galaxy]} position={[0, -1.98, 0]} />
      <group ref={car}>
        <mesh>
          <boxGeometry args={[4.4, 0.4, 1.1]} />
          <meshBasicMaterial color={CONFIG.colors.force} wireframe />
        </mesh>
        <mesh position={[0.1, 0.35, 0]}>
          <boxGeometry args={[1.5, 0.4, 0.7]} />
          <meshBasicMaterial color={CONFIG.colors.aura} wireframe />
        </mesh>
        <mesh position={[-2.3, 0.25, 0]}>
          <boxGeometry args={[0.3, 0.55, 1.5]} />
          <meshBasicMaterial color={CONFIG.colors.aura} wireframe />
        </mesh>
        <group ref={wheels}>
          {[
            [1.6, 0.85],
            [1.6, -0.85],
            [-1.6, 0.85],
            [-1.6, -0.85],
          ].map(([x, z]: number[], i: number) => (
            <mesh key={i} position={[x!, -0.1, z!]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.42, 0.16, 6, 12]} />
              <meshBasicMaterial color={CONFIG.colors.ice} wireframe />
            </mesh>
          ))}
        </group>
      </group>
      <group ref={crew}>
        {crewSeeds.map((_, i) => (
          <mesh key={i}>
            <capsuleGeometry args={[0.18, 0.5, 3, 6]} />
            <meshBasicMaterial color={CONFIG.colors.aura} wireframe />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* --------------------------------------------------------- Acto 2 · Avión */
function Takeoff({ progress }: { progress: P }) {
  const group = useRef<THREE.Group>(null);
  const plane = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const p = progress.current;
    const g = group.current;
    if (!g) return;
    const vis = win(p, 0.71, 0.84, 0.03);
    g.visible = vis > 0.01;
    if (!g.visible) return;
    const s = seg(p, 0.71, 0.84);
    const roll = smooth(THREE.MathUtils.clamp(s / 0.55, 0, 1));
    const lift = smooth(THREE.MathUtils.clamp((s - 0.5) / 0.5, 0, 1));
    if (plane.current) {
      plane.current.position.x = THREE.MathUtils.lerp(-30, 26, roll);
      plane.current.position.y = -1.4 + lift * 16;
      plane.current.rotation.z = lift * 0.42;
    }
    if (flame.current) {
      const th = 0.6 + roll * 2.2;
      flame.current.scale.set(th, 1, 1);
      (flame.current.material as THREE.MeshBasicMaterial).opacity = vis * (0.5 + Math.abs(Math.sin(clock.elapsedTime * 25)) * 0.5);
    }
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m && "opacity" in m && o !== flame.current) {
        m.transparent = true;
        (m as THREE.MeshBasicMaterial).opacity = vis;
      }
    });
  });

  return (
    <group ref={group} position={[3, 0.8, 2]} scale={1.5}>
      <gridHelper args={[140, 50, CONFIG.colors.velox, CONFIG.colors.galaxy]} position={[0, -2.2, 0]} />
      <group ref={plane}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.5, 3.6, 4, 10]} />
          <meshBasicMaterial color={CONFIG.colors.ice} wireframe />
        </mesh>
        <mesh position={[-0.2, 0, 0]}>
          <boxGeometry args={[1.4, 0.08, 7]} />
          <meshBasicMaterial color={CONFIG.colors.force} wireframe />
        </mesh>
        <mesh position={[-2.2, 0.7, 0]}>
          <boxGeometry args={[0.9, 1.2, 0.08]} />
          <meshBasicMaterial color={CONFIG.colors.force} wireframe />
        </mesh>
        <mesh ref={flame} position={[-3.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.32, 2.4, 8, 1, true]} />
          <meshBasicMaterial color={CONFIG.colors.aura} transparent blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/* --------------------------------------------------------- Acto 3 · Cheeta */
function Cheetah({ progress, quality }: { progress: P; quality: number }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legs = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Points>(null);
  const count = Math.floor(CONFIG.cloudParticles * quality);

  const cloudGeo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12 - 2;
      pos[i * 3 + 2] = -4 - Math.random() * 24;
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pos, 3));
  }, [count]);

  useFrame(({ clock }) => {
    const p = progress.current;
    const g = group.current;
    if (!g) return;
    const vis = win(p, 0.82, 0.95, 0.03);
    g.visible = vis > 0.01;
    if (!g.visible) return;
    const s = seg(p, 0.82, 0.95);
    const t = clock.elapsedTime;
    if (body.current) {
      body.current.position.x = THREE.MathUtils.lerp(-8, 16, smooth(s));
      body.current.position.y = Math.sin(t * 11) * 0.28; // galope
      body.current.rotation.z = Math.sin(t * 11) * 0.07;
    }
    if (legs.current) {
      legs.current.children.forEach((l, i) => {
        l.rotation.z = Math.sin(t * 11 + i * Math.PI * 0.5) * 0.9;
      });
    }
    if (clouds.current) {
      clouds.current.rotation.y = t * 0.02;
      (clouds.current.material as THREE.PointsMaterial).opacity = vis * 0.3;
    }
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m && "opacity" in m && o !== clouds.current) {
        m.transparent = true;
        (m as THREE.MeshBasicMaterial).opacity = vis;
      }
    });
  });

  return (
    <group ref={group} position={[3.5, 1.6, 2]} scale={1.4}>
      <points ref={clouds} geometry={cloudGeo}>
        <pointsMaterial
          size={0.07}
          color={CONFIG.colors.aura}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <group ref={body}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.62, 2.2, 4, 10]} />
          <meshBasicMaterial color={CONFIG.colors.aura} wireframe />
        </mesh>
        <mesh position={[1.9, 0.45, 0]}>
          <sphereGeometry args={[0.5, 8, 6]} />
          <meshBasicMaterial color={CONFIG.colors.ice} wireframe />
        </mesh>
        <mesh position={[-2.1, 0.3, 0]} rotation={[0, 0, 0.5]}>
          <capsuleGeometry args={[0.1, 2.2, 3, 6]} />
          <meshBasicMaterial color={CONFIG.colors.force} wireframe />
        </mesh>
        <group ref={legs}>
          {[
            [1.1, 0.4],
            [1.1, -0.4],
            [-1.1, 0.4],
            [-1.1, -0.4],
          ].map(([x, z]: number[], i: number) => (
            <mesh key={i} position={[x!, -0.9, z!]}>
              <capsuleGeometry args={[0.12, 1.1, 3, 6]} />
              <meshBasicMaterial color={CONFIG.colors.force} wireframe />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------- Final: burst */
function Finale({ progress, quality }: { progress: P; quality: number }) {
  const count = Math.floor(14000 * quality);
  const ref = useRef<THREE.Points>(null);

  const { geo, dirs } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const dirs: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) dirs.push(new THREE.Vector3().randomDirection());
    return { geo: new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pos, 3)), dirs };
  }, [count]);

  useFrame(() => {
    const p = progress.current;
    const o = ref.current;
    if (!o) return;
    const vis = win(p, 0.9, 1.001, 0.03);
    o.visible = vis > 0.01;
    if (!o.visible) return;
    const s = smooth(seg(p, 0.9, 1));
    const a = geo.attributes["position"] as THREE.BufferAttribute;
    for (let i = 0; i < dirs.length; i++) {
      const r = 0.4 + s * (7 + (i % 11) * 0.6);
      a.setXYZ(i, dirs[i]!.x * r, dirs[i]!.y * r * 0.7, dirs[i]!.z * r);
    }
    a.needsUpdate = true;
    (o.material as THREE.PointsMaterial).opacity = vis;
    o.rotation.y += 0.002;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.07}
        color={CONFIG.colors.force}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ Cámara */
function CameraRig({ progress, reduced }: { progress: P; reduced: boolean }) {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const pos = useRef(new THREE.Vector3(0, 0, 14));

  useFrame(() => {
    const p = THREE.MathUtils.clamp(progress.current, 0, 1);
    if (reduced) {
      camera.position.set(0, 0.5, 15);
      camera.lookAt(0, 0, 0);
      return;
    }
    // Encuadre estable: la cámara siempre mira al centro de la escena,
    // con un leve desplazamiento según el scroll y el ratón.
    const z = 15 - Math.sin(p * Math.PI) * 2.5;
    const y = 0.4 + Math.sin(p * Math.PI * 2) * 0.8;
    const x = 2.2 + Math.sin(p * Math.PI * 3) * 1.2 + mouse.current.x * CONFIG.mouseParallax;
    pos.current.lerp(new THREE.Vector3(x, y + mouse.current.y * CONFIG.mouseParallax, z), CONFIG.cameraLerp);
    camera.position.copy(pos.current);
    camera.lookAt(-2.5, 0, 0);
  });

  useFrame(({ pointer }) => {
    mouse.current.x += (pointer.x - mouse.current.x) * 0.05;
    mouse.current.y += (pointer.y - mouse.current.y) * 0.05;
  });

  return null;
}

/* ------------------------------------------------- Medidor de rendimiento */
function PerfGuard({ onLow }: { onLow: () => void }) {
  const start = useRef(0);
  const frames = useRef(0);
  const fired = useRef(false);
  useFrame(({ clock }) => {
    if (fired.current) return;
    if (!start.current) start.current = clock.elapsedTime;
    frames.current++;
    const elapsed = clock.elapsedTime - start.current;
    if (elapsed > 2) {
      fired.current = true;
      if (frames.current / elapsed < 40) onLow();
    }
  });
  return null;
}

export function Scene({
  progress,
  quality,
  onLowPerf,
  reduced,
}: {
  progress: P;
  quality: number;
  onLowPerf: () => void;
  reduced: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 60, near: 0.1, far: 200, position: [0, 0, 14] }}
      onCreated={({ gl, scene }) => {
        gl.shadowMap.enabled = false;
        gl.setClearColor(CONFIG.colors.bg, 1);
        scene.fog = new THREE.Fog(CONFIG.colors.bg, CONFIG.fog.near, CONFIG.fog.far);
      }}
    >
      <ambientLight intensity={0.7} />
      <pointLight position={[8, 10, 8]} intensity={40} color={CONFIG.colors.force} />
      <Starfield quality={quality} />
      <PerfGuard onLow={onLowPerf} />
      <CameraRig progress={progress} reduced={reduced} />
      <Tunnel progress={progress} quality={quality} />
      <Constellation progress={progress} quality={quality} />
      <PitStop progress={progress} />
      <Takeoff progress={progress} />
      <Cheetah progress={progress} quality={quality} />
      <Finale progress={progress} quality={quality} />
    </Canvas>
  );
}
