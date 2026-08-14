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

/* -------------------------------------------------------------------- Moto */
export function Bike({ section }: { section: MutableRefObject<number> }) {
  const { scene } = useGLTF(MODEL, true);
  const root = useRef<THREE.Group>(null);
  const rider = useRef<THREE.Group>(null);
  const power = useRef(0);
  const cloud = useRef(0);
  const spin = useRef(0);
  const wheels = useRef<THREE.Object3D[]>([]);



  const model = useMemo(() => {
    const m = scene.clone(true);
    // el eje largo del modelo es X: lo alineamos con Z (eje de avance)
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
    // la trompa mira hacia -X: la moto avanza de derecha a izquierda ante la cámara
    wrap.rotation.set(0, Math.PI, 0);


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
    // ruedas reales del GLB (si el modelo las trae como nodos separados)
    wheels.current = [];
    wrap.traverse((o) => {
      if (/wheel|rueda|tire|tyre|rim|disc/i.test(o.name)) wheels.current.push(o);
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

    const entry = smooth(clamp01(s / 0.14)); // nace de la estela del avión
    const out = smooth(clamp01((s - 0.82) / 0.18)); // disolvencia final
    power.current = entry;
    cloud.current = entry * (1 - out * 0.9);
    spin.current = (0.5 + s * 0.7) * dt * 60 * 0.06;
    wheels.current.forEach((w) => {
      w.rotation.z -= spin.current * 2.2;
    });


    const r = rider.current;
    if (r) {
      r.visible = true;
      // un solo paso continuo y monótono: entra por la derecha, pasa junto a la
      // cámara y sale por la izquierda, acercándose ligeramente (sensación de velocidad)
      const travel = s * s * (3 - 2 * s); // siempre creciente
      r.position.x = THREE.MathUtils.lerp(26, -30, travel);
      r.position.z = THREE.MathUtils.lerp(-24, 4, travel);
      r.position.y = -0.2 + (1 - entry) * 1.4;
      // derecha (vertical): sólo una leve inclinación natural al acelerar
      r.rotation.set(0, 0, -0.05 * entry + Math.sin(clock.elapsedTime * 1.2) * 0.02 * entry);
      r.scale.setScalar(0.92 + entry * 0.08);
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
        mat.opacity = 1 - out;
      });
    });
  });


  return (
    <group ref={root} position={BIKE_FOCUS.toArray()} visible={false}>
      <CloudTrack power={cloud} />
      <group ref={rider}>
        <primitive object={model} />
        <pointLight position={[0, 2, 3]} intensity={140} distance={45} color={VELOX} />
        <pointLight position={[6, 4, -6]} intensity={220} distance={55} color={FORCE} />
        <pointLight position={[-6, 2, 5]} intensity={180} distance={55} color={ICE} />
        <hemisphereLight args={[FORCE, VELOX, 1.6]} />
      </group>
    </group>
  );
}
