import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { CAR_WINDOW, F1Car, carPhase } from "./F1Car";

const FOG = "#0a0820";
const GRID = "#534AB7";
const PARTICLE_COLORS = ["#534AB7", "#7F77DD", "#AFA9EC", "#EEEDFE"];

type Ref = MutableRefObject<number>;

/* ---------------------------------------------------------------- Keyframes */
type Key = { at: number; v: [number, number, number] };

/** Keyframes por índice de sección (0 = primera pantalla). */
const FOCUS: Key[] = [
  { at: 0, v: [0, 0, 0] },
  { at: 2, v: [0, 0, -18] },
  { at: 4, v: [0, 0, -55] }, // sección 5 → cubo 1
  { at: 5, v: [0, 0, -95] }, // sección 6 → cubo 2
  { at: 6, v: [0, 0, -140] }, // sección 7 → cubo 3
  { at: 9, v: [0, 0, -210] },
];

/** Posición relativa de la cámara respecto del focus. */
const OFFSET: Key[] = [
  { at: 0, v: [0, 1.2, 16] },
  { at: 4, v: [0, 0.8, 14] },
  { at: 5, v: [0, 0.8, 14] },
  { at: 6, v: [0, 0.8, 14] },
  { at: 9, v: [0, 1.4, 16] },
];

function sampleKeys(keys: Key[], t: number, out: THREE.Vector3) {
  const first = keys[0]!;
  const last = keys[keys.length - 1]!;
  if (t <= first.at) return out.set(...first.v);
  if (t >= last.at) return out.set(...last.v);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]!;
    const b = keys[i + 1]!;
    if (t >= a.at && t <= b.at) {
      const r = (t - a.at) / (b.at - a.at);
      const s = r * r * (3 - 2 * r); // smoothstep
      return out.set(
        THREE.MathUtils.lerp(a.v[0], b.v[0], s),
        THREE.MathUtils.lerp(a.v[1], b.v[1], s),
        THREE.MathUtils.lerp(a.v[2], b.v[2], s),
      );
    }
  }
  return out.set(...last.v);
}

/* ------------------------------------------------------------------- Cámara */
function CameraRig({ section }: { section: Ref }) {
  const { camera } = useThree();
  const focus = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());
  const smoothed = useRef(0);

  useFrame(() => {
    smoothed.current += (section.current - smoothed.current) * 0.12;
    const t = smoothed.current;
    sampleKeys(FOCUS, t, focus.current);
    sampleKeys(OFFSET, t, offset.current);
    // órbita lenta alrededor del carro durante la sección 5 (no altera focus/lookAt)
    const inCar = t > CAR_WINDOW[0] - 0.4 && t < CAR_WINDOW[1] + 0.4;
    if (inCar) {
      const a = carPhase(t) * Math.PI * 0.55 - 0.25;
      const o = offset.current;
      const x = o.x * Math.cos(a) + o.z * Math.sin(a);
      const z = -o.x * Math.sin(a) + o.z * Math.cos(a);
      o.set(x, o.y + 0.9, z);
    }
    camera.position.copy(focus.current).add(offset.current);
    camera.lookAt(focus.current);
  });

  return null;
}

/* ---------------------------------------------------------- Cubos de prueba */
function TestCubes() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const data: { z: number; color: string }[] = [
    { z: -95, color: "#4ADE80" },
    { z: -140, color: "#FACC15" },
  ];

  useFrame((_, dt) => {
    refs.current.forEach((m) => {
      if (m) {
        m.rotation.x += dt * 0.4;
        m.rotation.y += dt * 0.6;
      }
    });
  });

  return (
    <>
      {data.map((c, i) => (
        <mesh
          key={c.z}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[0, 0, c.z]}
        >
          <boxGeometry args={[4, 4, 4]} />
          <meshStandardMaterial
            color={c.color}
            emissive={c.color}
            emissiveIntensity={0.5}
            fog={false}
          />
        </mesh>
      ))}
    </>
  );
}

/** Grilla synthwave infinita que acompaña a la cámara. */
function SpeedGrid() {
  const group = useRef<THREE.Group>(null);
  const a = useRef<THREE.GridHelper>(null);
  const b = useRef<THREE.GridHelper>(null);
  const run = useRef(0);
  const size = 120;

  useFrame(({ camera }, dt) => {
    run.current = (run.current + dt * 14) % size;
    if (group.current) group.current.position.z = camera.position.z;
    if (a.current) a.current.position.z = run.current - size;
    if (b.current) b.current.position.z = run.current - size * 2;
  });

  return (
    <group ref={group} position={[0, -3.4, 0]}>
      <gridHelper ref={a} args={[size, 60, GRID, GRID]}>
        <lineBasicMaterial attach="material" color={GRID} transparent opacity={0.5} fog />
      </gridHelper>
      <gridHelper ref={b} args={[size, 60, GRID, GRID]}>
        <lineBasicMaterial attach="material" color={GRID} transparent opacity={0.5} fog />
      </gridHelper>
    </group>
  );
}

/** Campo de partículas flotante con blending aditivo, siempre alrededor de la cámara. */
function ParticleField({ count = 30000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = PARTICLE_COLORS.map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 170;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 170;
      const c = palette[Math.floor(Math.random() * palette.length)]!;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [count]);

  useFrame(({ camera, clock }, dt) => {
    const o = ref.current;
    if (!o) return;
    o.rotation.y += dt * 0.012;
    o.position.z = camera.position.z - 40;
    o.position.y = Math.sin(clock.elapsedTime * 0.15) * 0.6;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.09}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/** Monta el carro sólo cuando la sección 5 está cerca del viewport. */
function LazyCar({ section }: { section: Ref }) {
  const [show, setShow] = useState(false);
  useFrame(() => {
    if (!show && section.current > CAR_WINDOW[0] - 2) setShow(true);
  });
  if (!show) return null;
  return (
    <Suspense fallback={null}>
      <F1Car section={section} />
      <Environment preset="night" />
    </Suspense>
  );
}

export function Background3D({ section }: { section: Ref }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 65, near: 0.1, far: 400, position: [0, 1.2, 16] }}
      onCreated={({ gl, scene }) => {
        gl.shadowMap.enabled = false;
        gl.setClearColor(0x000000, 0);
        scene.fog = new THREE.Fog(FOG, 14, 95);
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 8, 6]} intensity={0.6} color="#AFA9EC" />
      <directionalLight position={[-8, -4, -6]} intensity={0.35} color="#534AB7" />
      <CameraRig section={section} />
      <SpeedGrid />
      <ParticleField />
      <TestCubes />
      <LazyCar section={section} />
      <EffectComposer enableNormalPass={false}>
        <Bloom intensity={0.45} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
