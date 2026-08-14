import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

const MODEL = "/models/moto.glb";
useGLTF.preload(MODEL, true);

const VELOX = "#534AB7";
const FORCE = "#7F77DD";
const ICE = "#EEEDFE";

/** Punto de focus de la sección 7 (idéntico al del cubo amarillo). */
export const BIKE_FOCUS = new THREE.Vector3(0, 0, -140);
/** Ventana de scroll (índice de sección) de la sección 7. */
export const BIKE_WINDOW: [number, number] = [5.55, 6.6];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

/** Progreso 0..1 dentro de la sección 7. */
export const bikePhase = (section: number) =>
  clamp01((section - BIKE_WINDOW[0]) / (BIKE_WINDOW[1] - BIKE_WINDOW[0]));

/** Banda de nubes/estela que hereda del avión y hace de pista. */
function CloudTrack({ power }: { power: MutableRefObject<number> }) {
  const ref = useRef<THREE.Points>(null);
  const count = 900;

  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [VELOX, FORCE, ICE].map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = -1.4 + (Math.random() - 0.5) * 1.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
      const c = palette[Math.floor(Math.random() * palette.length)]!;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);

  useFrame((_, dt) => {
    const o = ref.current;
    if (!o) return;
    const p = power.current;
    o.visible = p > 0.01;
    if (!o.visible) return;
    const attr = geometry.attributes["position"] as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const z = arr[i * 3 + 2]! + dt * (20 + p * 70);
      arr[i * 3 + 2] = z > 45 ? z - 90 : z;
    }
    attr.needsUpdate = true;
    (o.material as THREE.PointsMaterial).opacity = p * 0.6;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.16}
        vertexColors
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/** Anillos que giran a la altura de las ruedas (el GLB no trae ruedas separadas). */
function WheelRings({ spin, radius }: { spin: MutableRefObject<number>; radius: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    refs.current.forEach((m) => {
      if (m) m.rotation.z -= spin.current;
    });
  });
  const spots: [number, number, number][] = [
    [0, -1.05, -3.2],
    [0, -1.05, 3.2],
  ];
  return (
    <>
      {spots.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={p}
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry args={[radius, 0.035, 8, 40]} />
          <meshBasicMaterial
            color={FORCE}
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

/* -------------------------------------------------------------------- Moto */
export function Bike({ section }: { section: MutableRefObject<number> }) {
  const { scene } = useGLTF(MODEL, true);
  const root = useRef<THREE.Group>(null);
  const rider = useRef<THREE.Group>(null);
  const power = useRef(0);
  const cloud = useRef(0);
  const spin = useRef(0);


  const model = useMemo(() => {
    const m = scene.clone(true);
    // el eje largo del modelo es X: lo alineamos con Z (avance hacia -Z)
    const raw = new THREE.Box3().setFromObject(m);
    const rs = new THREE.Vector3();
    raw.getSize(rs);
    if (rs.x > rs.z) m.rotation.y = -Math.PI / 2;

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
    // avanza hacia la cámara (+Z) en un 3/4 para lucir el frente
    wrap.rotation.y = Math.PI;

    wrap.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mm) => {
        const mat = mm as THREE.MeshStandardMaterial;
        if (!mat || !("isMeshStandardMaterial" in mat)) return;
        mat.envMapIntensity = 1.6;
        // conservamos la librea original del modelo; sólo un realce sutil
        mat.emissive = new THREE.Color(VELOX);
        mat.emissiveIntensity = 0.12;
        mat.roughness = Math.min(mat.roughness, 0.7);
        mat.needsUpdate = true;
      });
    });
    return wrap;
  }, [scene]);

  useFrame(({ clock }, dt) => {
    const g = root.current;
    if (!g) return;
    const s = bikePhase(section.current);
    // estrictamente dentro de la sección 7: nubes y moto no invaden la 6 ni la 8
    const live = section.current >= BIKE_WINDOW[0] && section.current <= BIKE_WINDOW[1];
    g.visible = live;
    if (!live) {
      power.current = 0;
      cloud.current = 0;
      return;
    }

    const entry = smooth(clamp01(s / 0.16)); // nace de la estela del avión
    const cruise = smooth(clamp01((s - 0.22) / 0.36)); // pasada lateral
    const exit = smooth(clamp01((s - 0.58) / 0.42)); // se va a toda velocidad
    power.current = entry * (1 - exit * 0.4);
    cloud.current = smooth(clamp01(s / 0.12)) * (1 - exit * 0.9);
    spin.current = (0.35 + cruise * 0.5) * dt * 60 * 0.06;


    const r = rider.current;
    if (r) r.visible = true;
    if (r) {

      // nace lejos en la estela y se acerca a la cámara, luego se aleja a fondo
      r.position.z = THREE.MathUtils.lerp(-34, -9, entry) - exit * 95;
      r.position.y = -0.2 + (1 - entry) * 2.4;
      r.position.x = -3.4 + cruise * 2.6 + Math.sin(clock.elapsedTime * 0.6) * 0.5 * cruise;
      r.rotation.z = 0.16 * cruise + Math.sin(clock.elapsedTime * 1.3) * 0.06 * cruise;
      r.rotation.y = 0.55 - cruise * 0.35;
      const fade = 1 - exit;
      r.scale.setScalar((0.85 + entry * 0.15) * fade + 0.001);
    }
    // disolvencia general para dar paso al wordmark del CTA
    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mm) => {
        const mat = mm as THREE.Material & { opacity: number; transparent: boolean };
        if (!mat) return;
        mat.transparent = true;
        mat.opacity = 1 - exit;
      });
    });
  });

  return (
    <group ref={root} position={BIKE_FOCUS.toArray()} visible={false}>
      <CloudTrack power={cloud} />
      <group ref={rider}>
        <primitive object={model} />
        <WheelRings spin={spin} radius={1.05} />
        <pointLight position={[0, 2, 3]} intensity={140} distance={45} color={VELOX} />
        <pointLight position={[6, 4, -6]} intensity={220} distance={55} color={FORCE} />
        <pointLight position={[-6, 2, 5]} intensity={180} distance={55} color={ICE} />
        <hemisphereLight args={[FORCE, VELOX, 1.6]} />
      </group>
    </group>
  );
}
