import { useFrame } from "@react-three/fiber";
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
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* --------------------------------------------------------------- Semáforo */
function StartLights({ phase }: { phase: MutableRefObject<number> }) {
  const lamps = useRef<(THREE.Mesh | null)[]>([]);
  const RED = useMemo(() => new THREE.Color("#ff2f2f"), []);
  const GREEN = useMemo(() => new THREE.Color("#28ff92"), []);
  const OFF = useMemo(() => new THREE.Color("#141130"), []);
  const pairs = 5;

  useFrame(() => {
    const p = phase.current;
    // rojas encendiéndose una a una durante el pit; verdes al acelerar
    const lit = p < 0.68 ? Math.min(pairs, Math.floor(((p - 0.2) / 0.48) * pairs) + 1) : pairs;
    const green = p >= 0.68;
    lamps.current.forEach((m, i) => {
      if (!m) return;
      const col = Math.floor(i / 2);
      const on = green || (col < lit && p > 0.2);
      const c = green ? GREEN : RED;
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

  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const s = carPhase(section.current);
    phase.current = s;
    // sigue vivo un poco antes de la ventana (entra desde el fondo) pero se apaga
    // en cuanto termina, para no coincidir nunca con el avión
    // estrictamente dentro de su propia sección: nunca invade la 6 ni la 4
    const live = section.current >= CAR_WINDOW[0] && section.current <= CAR_WINDOW[1];
    g.visible = live;
    if (!live) {
      pit.current = 0;
      spin.current = 0;
      return;
    }

    // entrada desde el fondo → parada → salida acelerando por la pista
    const enter = smooth(clamp01(s / 0.3));
    const exit = smooth(clamp01((s - 0.68) / 0.32));
    const z = THREE.MathUtils.lerp(-28, 0, enter) + exit * 120;
    const stopped = clamp01((s - 0.3) / 0.06) * (1 - clamp01((s - 0.68) / 0.06));

    pit.current = stopped;
    spin.current = Math.max(1 - stopped, exit);


    if (car.current) {
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
