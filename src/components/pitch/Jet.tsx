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
export const JET_WINDOW: [number, number] = [4.55, 5.5];

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
    g.scale.set(1, 1, (0.5 + p * 1.6) * flicker);
    g.children.forEach((c) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = p * 0.55 * flicker;
    });
  });

  return (
    <group ref={core} position={[0, 0.15, 3.2]}>
      {[
        [-0.3, 0.13, FORCE],
        [0.3, 0.13, FORCE],
        [-0.3, 0.07, ICE],
        [0.3, 0.07, ICE],
      ].map(([x, r, color], i) => (
        <mesh key={i} position={[x as number, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[r as number, 1.5, 14, 1, true]} />
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
/** Toberas: mismas posiciones que los conos del postquemador. */
const NOZZLES: [number, number, number][] = [
  [-0.28, 0.15, 3.6],
  [0.28, 0.15, 3.6],
];

function Trail({ power }: { power: MutableRefObject<number> }) {
  const ref = useRef<THREE.Points>(null);
  const count = 420;

  const { geometry, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seeds = Array.from({ length: count }, (_, i) => {
      const n = NOZZLES[i % NOZZLES.length]!;
      return {
        ox: n[0],
        oy: n[1],
        oz: n[2],
        jx: (Math.random() - 0.5) * 0.22,
        jy: (Math.random() - 0.5) * 0.22,
        spread: 0.25 + Math.random() * 0.9,
        speed: 0.35 + Math.random() * 0.9,
        offset: Math.random(),
      };
    });
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
      // nace exactamente en la tobera y se abre hacia atrás (+Z) cayendo un poco
      attr.setXYZ(
        i,
        s.ox + (s.jx + s.ox * 0.35) * life * s.spread,
        s.oy + s.jy * life * s.spread - life * 1.1,
        s.oz + d,
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

    // orientar: el eje más largo es el fuselaje → alinearlo con Z
    const measure = () => {
      m.updateWorldMatrix(true, true);
      return new THREE.Box3().setFromObject(m, true).getSize(new THREE.Vector3());
    };
    let rs = measure();
    if (rs.y > rs.x && rs.y > rs.z) {
      m.rotation.x = -Math.PI / 2; // modelo Z-up: lo acostamos
      rs = measure();
    }
    if (rs.x > rs.z) {
      m.rotation.y += Math.PI / 2;
      rs = measure();
    }

    const wrap = new THREE.Group();
    wrap.add(m);
    m.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(m, true);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = 8 / Math.max(size.z, 0.001);
    console.log('JETDBG', size.toArray(), scale);
    m.position.set(-center.x, -center.y, -center.z);
    wrap.scale.setScalar(scale);
    wrap.rotation.y = Math.PI; // la nariz del modelo mira a +Z: la giramos hacia -Z

    wrap.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mm) => {
          const mat = mm as THREE.MeshStandardMaterial;
          if (!mat || !("isMeshStandardMaterial" in mat)) return;
          mat.envMapIntensity = 1.6;
          // este modelo SÍ trae PBR: conservamos sus texturas, sólo un leve realce
          mat.emissive = new THREE.Color(VELOX);
          mat.emissiveIntensity = 0.12;
          mat.roughness = Math.min(mat.roughness, 0.7);
          mat.toneMapped = true;
          mat.needsUpdate = true;
        });
      }
    });
    return wrap;
  }, [scene]);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const s = jetPhase(section.current);
    // nunca coincide con el carro: sólo vive dentro de su ventana
    const live = section.current >= JET_WINDOW[0] && section.current <= JET_WINDOW[1];
    g.visible = live;
    if (!live) {
      power.current = 0;
      return;
    }

    // surge desde abajo por la misma pista → rotación de nariz → despegue
    const roll = smooth(clamp01(s / 0.35)); // acelera y asoma sobre la pista
    const lift = smooth(clamp01((s - 0.38) / 0.62)); // sube
    power.current = clamp01(s / 0.2) * (0.35 + roll * 0.65);

    if (craft.current) {
      craft.current.position.z = THREE.MathUtils.lerp(30, 16, roll) - lift * lift * 70;
      // arranca por debajo del encuadre y emerge subiendo
      craft.current.position.y = THREE.MathUtils.lerp(-5, -0.6, roll) + lift * lift * 12;
      craft.current.rotation.x = -lift * 0.42;
      craft.current.rotation.z = Math.sin(clock.elapsedTime * 0.8) * 0.05 * lift;
    }

  });

  return (
    <group ref={root} position={JET_FOCUS.toArray()} visible={false}>
      <group ref={craft}>
        <primitive object={model} />
        <Afterburner power={power} />
        <Trail power={power} />
        <pointLight position={[0, 2.5, 4]} intensity={90} distance={40} color={VELOX} />
        <pointLight position={[7, 6, -8]} intensity={160} distance={50} color={FORCE} />
        <pointLight position={[-8, 3, 6]} intensity={120} distance={50} color={ICE} />
        <hemisphereLight args={[FORCE, VELOX, 1.2]} />
      </group>
    </group>
  );
}
