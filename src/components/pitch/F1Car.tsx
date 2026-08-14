import { useFrame } from "@react-three/fiber";
import { softPointTexture } from "./soft-point";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

const MODEL = "/models/f1.glb";
useGLTF.preload(MODEL, true);

const VELOX = "#534AB7";
const FORCE = "#7F77DD";
const ICE = "#EEEDFE";

/** Punto de focus de la sección 5 (idéntico al del cubo rojo). */
export const CAR_FOCUS = new THREE.Vector3(0, 0, -55);
/** Ventana de scroll (índice de sección) de la sección 5. */
export const CAR_WINDOW: [number, number] = [3.6, 4.5];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

/** Progreso 0..1 dentro de la sección 5. */
export const carPhase = (section: number) =>
  clamp01((section - CAR_WINDOW[0]) / (CAR_WINDOW[1] - CAR_WINDOW[0]));

/* ------------------------------------------------------------------ Chispas */
function Sparks({ active }: { active: MutableRefObject<number> }) {
  const ref = useRef<THREE.Points>(null);
  const count = 260;

  const { geometry, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seeds = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 3.4,
      z: (Math.random() - 0.5) * 1.6,
      dir: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.6 + 0.4,
        (Math.random() - 0.5) * 2,
      ).normalize(),
      speed: 1.5 + Math.random() * 3,
      offset: Math.random(),
    }));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometry: g, seeds };
  }, []);

  useFrame(({ clock }) => {
    const o = ref.current;
    if (!o) return;
    const a = active.current;
    o.visible = a > 0.02;
    if (!o.visible) return;
    const attr = geometry.attributes["position"] as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i]!;
      const life = ((t * s.speed * 0.5 + s.offset) % 1);
      const d = life * 1.5;
      attr.setXYZ(i, s.x + s.dir.x * d, s.dir.y * d - life * life * 1.6, s.z + s.dir.z * d);
    }
    attr.needsUpdate = true;
    (o.material as THREE.PointsMaterial).opacity = a;
  });

  return (
    <points ref={ref} geometry={geometry} position={[0, -0.9, 0]} frustumCulled={false}>
      <pointsMaterial
        size={0.05}
        color={ICE}
        map={softPointTexture()}
        alphaMap={softPointTexture()}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* --------------------------------------------------------------- Semáforo */
function StartLights({ phase }: { phase: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const lamps = useRef<(THREE.Mesh | null)[]>([]);
  const RED = useMemo(() => new THREE.Color("#ff2f2f"), []);
  const AMBER = useMemo(() => new THREE.Color("#ff9a1f"), []);
  const GREEN = useMemo(() => new THREE.Color("#28ff92"), []);
  const OFF = useMemo(() => new THREE.Color("#141130"), []);
  const pairs = 5;

  useFrame(() => {
    const p = phase.current;

    // se acerca a la cámara junto con el carro (mismo easing) y luego se va
    const g = group.current;
    if (g) {
      const approach = smooth(clamp01(p / 0.42));
      const exit = smooth(clamp01((p - 0.7) / 0.3));
      g.position.z = THREE.MathUtils.lerp(-118, 7, approach) + exit * exit * 160;
      const s = THREE.MathUtils.lerp(0.55, 1, approach);
      g.scale.setScalar(s);
    }

    // secuencia: rojas una a una → ámbar → verde
    const RED_END = 0.5;
    const AMBER_END = 0.64;
    let stage: "red" | "amber" | "green";
    let lit: number;
    if (p < RED_END) {
      stage = "red";
      lit = Math.min(pairs, Math.max(0, Math.floor(((p - 0.14) / (RED_END - 0.14)) * pairs) + 1));
    } else if (p < AMBER_END) {
      stage = "amber";
      lit = pairs;
    } else {
      stage = "green";
      lit = pairs;
    }
    const c = stage === "green" ? GREEN : stage === "amber" ? AMBER : RED;

    lamps.current.forEach((m, i) => {
      if (!m) return;
      const col = Math.floor(i / 2);
      const on = p > 0.14 && col < lit;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.color.copy(on ? c : OFF);
      mat.emissive.copy(on ? c : OFF);
      mat.emissiveIntensity = on ? 3.2 : 0;
    });
  });


  const span = 9;
  return (
    <group position={[0, 0, 7]}>
      {/* postes */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * span) / 2, 1.4, 0]}>
          <boxGeometry args={[0.28, 5.6, 0.28]} />
          <meshStandardMaterial color="#241f4a" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* viga horizontal */}
      <mesh position={[0, 4.0, 0]}>
        <boxGeometry args={[span + 0.6, 0.85, 0.4]} />
        <meshStandardMaterial color="#1b1740" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* pares de luces */}
      {Array.from({ length: pairs * 2 }, (_, i) => {
        const col = Math.floor(i / 2);
        const row = i % 2;
        const x = (col - (pairs - 1) / 2) * 1.5;
        return (
          <mesh
            key={i}
            position={[x, 4.18 - row * 0.36, 0.24]}
            ref={(el) => {
              lamps.current[i] = el;
            }}
          >
            <sphereGeometry args={[0.15, 14, 10]} />
            <meshStandardMaterial color="#141130" />
          </mesh>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------- Marcas de piso (largada) */
function TrackMarks({ y = -0.95 }: { y?: number }) {
  return (
    <group position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* línea de largada */}
      <mesh position={[0, -7, 0]}>
        <planeGeometry args={[10, 0.35]} />
        <meshBasicMaterial
          color={ICE}
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* carriles del pit */}
      {[-3.2, 3.2].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <planeGeometry args={[0.14, 46]} />
          <meshBasicMaterial
            color={FORCE}
            transparent
            opacity={0.32}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {/* caja de parada */}
      <mesh position={[0, 0.6, 0]}>
        <planeGeometry args={[5.2, 0.12]} />
        <meshBasicMaterial
          color={VELOX}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------- Ruedas girando (halos) */
function SpinRings({ visible }: { visible: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const spots: [number, number][] = [
    [0.86, 1.55],
    [-0.86, 1.55],
    [0.9, -1.5],
    [-0.9, -1.5],
  ];

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const v = visible.current;
    g.visible = v > 0.02;
    if (!g.visible) return;
    g.children.forEach((c) => {
      c.rotation.z += dt * 14 * v;
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = v * 0.5;
    });
  });

  return (
    <group ref={group}>
      {spots.map(([x, z], i) => (
        <mesh key={i} position={[x, -0.42, z]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.36, 0.02, 6, 24]} />
          <meshBasicMaterial
            color={FORCE}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------- Carro */
export function F1Car({ section }: { section: MutableRefObject<number> }) {
  const { scene } = useGLTF(MODEL, true);
  const root = useRef<THREE.Group>(null);
  const car = useRef<THREE.Group>(null);
  const pit = useRef(0);
  const phase = useRef(0);
  const spin = useRef(0);

  /** Copia del modelo, centrada y escalada al mismo encuadre del cubo (≈4u). */
  const model = useMemo(() => {
    const m = scene.clone(true);
    const box = new THREE.Box3().setFromObject(m);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = 9 / size.z;
    m.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    m.scale.setScalar(scale);
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false;
        // materiales propios para poder atenuar la opacidad con el scroll
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mesh.material = Array.isArray(mesh.material)
          ? mats.map((mm) => {
              const c = (mm as THREE.Material).clone();
              c.transparent = true;
              c.depthWrite = true;
              return c;
            })
          : (() => {
              const c = (mats[0] as THREE.Material).clone();
              c.transparent = true;
              c.depthWrite = true;
              return c;
            })();
        // el GLB trae un piso plano de estudio: lo ocultamos
        mesh.geometry.computeBoundingBox();
        const bb = mesh.geometry.boundingBox;
        if (bb) {
          const dx = bb.max.x - bb.min.x;
          const dy = bb.max.y - bb.min.y;
          const dz = bb.max.z - bb.min.z;
          if (dy < 0.02 * Math.max(dx, dz)) mesh.visible = false;
        }
      }
    });

    return m;
  }, [scene]);

  useEffect(() => () => void model.traverse(() => {}), [model]);

  const setOpacity = (v: number) => {
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mm) => {
        (mm as THREE.Material).opacity = v;
      });
    });
  };

  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const s = carPhase(section.current);
    phase.current = s;
    // estrictamente dentro de su propia sección: nunca invade la 6 ni la 4
    const live = section.current >= CAR_WINDOW[0] && section.current <= CAR_WINDOW[1];
    g.visible = live;
    if (!live) {
      pit.current = 0;
      spin.current = 0;
      return;
    }

    // acercamiento continuo desde el fondo → parada (pit) → salida acelerando
    const approach = smooth(clamp01(s / 0.42));
    const exit = smooth(clamp01((s - 0.7) / 0.3));
    const z = THREE.MathUtils.lerp(-120, 0, approach) + exit * exit * 150;
    const stopped = clamp01((s - 0.42) / 0.08) * (1 - clamp01((s - 0.7) / 0.06));

    // fundido en ambos extremos: nunca aparece ni desaparece de golpe
    const fade = smooth(clamp01(s / 0.14)) * smooth(clamp01((1 - s) / 0.12));
    setOpacity(fade);

    pit.current = stopped * fade;
    spin.current = Math.max(1 - stopped, exit) * fade;

    if (car.current) {
      car.current.scale.setScalar(THREE.MathUtils.lerp(0.6, 1, approach));
      car.current.position.z = z;
      car.current.position.y = Math.sin(s * 40) * 0.015 * (1 - stopped);
    }
  });


  return (
    <group ref={root} position={CAR_FOCUS.toArray()} visible={false}>
      <group ref={car}>
        <primitive object={model} />
        <SpinRings visible={spin} />
        <Sparks active={pit} />
        {/* luz de acento pegada al carro */}
        <pointLight position={[0, 2.2, 1.5]} intensity={12} distance={12} color={VELOX} />
      </group>
      <StartLights phase={phase} />
      <TrackMarks />
    </group>
  );
}
