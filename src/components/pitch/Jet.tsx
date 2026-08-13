import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

const MODEL = "/models/jet.glb";
useGLTF.preload(MODEL, true);

const VELOX = "#534AB7";
const FORCE = "#7F77DD";
const ICE = "#EEEDFE";

/** Punto de focus de la sección 6 (idéntico al del cubo verde). */
export const JET_FOCUS = new THREE.Vector3(0, 0, -95);
/** Ventana de scroll (índice de sección) de la sección 6. */
export const JET_WINDOW: [number, number] = [4.6, 6.05];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

/** Progreso 0..1 dentro de la sección 6. */
export const jetPhase = (section: number) =>
  clamp01((section - JET_WINDOW[0]) / (JET_WINDOW[1] - JET_WINDOW[0]));

/* ------------------------------------------------------------ Postquemador */
function Afterburner({ power }: { power: MutableRefObject<number> }) {
  const core = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const g = core.current;
    if (!g) return;
    const p = power.current;
    g.visible = p > 0.02;
    if (!g.visible) return;
    const flicker = 0.85 + Math.sin(clock.elapsedTime * 40) * 0.15;
    g.scale.set(1, 1, (0.5 + p * 2.6) * flicker);
    g.children.forEach((c) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = p * 0.85 * flicker;
    });
  });

  return (
    <group ref={core} position={[0, 0.05, 2.1]}>
      {[
        [-0.45, 0.42, FORCE],
        [0.45, 0.42, FORCE],
        [-0.45, 0.22, ICE],
        [0.45, 0.22, ICE],
      ].map(([x, r, color], i) => (
        <mesh key={i} position={[x as number, 0, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[r as number, 2.6, 14, 1, true]} />
          <meshBasicMaterial
            color={color as string}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------- Estela */
function Trail({ power }: { power: MutableRefObject<number> }) {
  const ref = useRef<THREE.Points>(null);
  const count = 420;

  const { geometry, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seeds = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 1.6,
      y: (Math.random() - 0.5) * 0.8,
      spread: 0.3 + Math.random() * 1.1,
      speed: 0.35 + Math.random() * 0.9,
      offset: Math.random(),
    }));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometry: g, seeds };
  }, []);

  useFrame(({ clock }) => {
    const o = ref.current;
    if (!o) return;
    const p = power.current;
    o.visible = p > 0.02;
    if (!o.visible) return;
    const attr = geometry.attributes["position"] as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i]!;
      const life = (t * s.speed + s.offset) % 1;
      const d = life * 20;
      attr.setXYZ(
        i,
        s.x + s.x * life * s.spread,
        s.y + s.y * life * s.spread - life * 1.2,
        2.4 + d,
      );
    }
    attr.needsUpdate = true;
    (o.material as THREE.PointsMaterial).opacity = p * 0.8;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.09}
        color={ICE}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* --------------------------------------------------------------------- Jet */
export function Jet({ section }: { section: MutableRefObject<number> }) {
  const { scene } = useGLTF(MODEL, true);
  const root = useRef<THREE.Group>(null);
  const craft = useRef<THREE.Group>(null);
  const power = useRef(0);

  /** Copia centrada, escalada y orientada con la nariz hacia -Z. */
  const model = useMemo(() => {
    const m = scene.clone(true);
    // orientar: el eje horizontal más largo es el fuselaje → alinearlo con Z
    const raw = new THREE.Box3().setFromObject(m);
    const rs = new THREE.Vector3();
    raw.getSize(rs);
    if (rs.x > rs.z) m.rotation.y = Math.PI / 2;

    const wrap = new THREE.Group();
    wrap.add(m);
    m.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(m, true);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = 13 / Math.max(size.z, 0.001);
    m.position.set(-center.x, -center.y, -center.z);
    wrap.scale.setScalar(scale);
    (window as unknown as Record<string, unknown>)["__jetScale"] = [scale, size.toArray()];

    wrap.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false;
      }
    });
    return wrap;
  }, [scene]);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const s = jetPhase(section.current);
    const live = section.current > JET_WINDOW[0] - 0.6 && section.current < JET_WINDOW[1] + 0.6;
    g.visible = live;
    if (!live) {
      power.current = 0;
      return;
    }

    // carreteo → aceleración → rotación de nariz → despegue
    const roll = smooth(clamp01(s / 0.45)); // acelera sobre la pista
    const lift = smooth(clamp01((s - 0.45) / 0.55)); // sube
    power.current = clamp01(s / 0.25) * (0.35 + roll * 0.65);

    if (craft.current) {
      craft.current.position.z = THREE.MathUtils.lerp(22, 2, roll) - lift * 11;
      craft.current.position.y = -1 + lift * lift * 5.5;
      craft.current.rotation.x = -lift * 0.42;
      craft.current.rotation.z = Math.sin(clock.elapsedTime * 0.8) * 0.05 * lift;
      (window as unknown as Record<string, unknown>)["__jet"] = {
        s,
        vis: g.visible,
        p: craft.current.getWorldPosition(new THREE.Vector3()).toArray(),
        sc: (window as unknown as Record<string, unknown>)["__jetScale"],
        bb: new THREE.Box3().setFromObject(craft.current).getSize(new THREE.Vector3()).toArray(),
      };
    }
  });

  return (
    <group ref={root} position={JET_FOCUS.toArray()} visible={false}>
      <group ref={craft}>
        <primitive object={model} />
        <Afterburner power={power} />
        <Trail power={power} />
        <pointLight position={[0, 1.8, 2.4]} intensity={18} distance={18} color={VELOX} />
        <pointLight position={[3, 3.5, -4]} intensity={26} distance={22} color={FORCE} />
        <pointLight position={[-4, 1.5, 3]} intensity={16} distance={20} color={ICE} />
      </group>
    </group>
  );
}
