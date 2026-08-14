import { useFrame } from "@react-three/fiber";
import { softPointTexture } from "./soft-point";
import { useGLTF } from "@react-three/drei";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

const MODEL = "/models/jet.glb";

const VELOX = "#534AB7";
const FORCE = "#7F77DD";
const ICE = "#EEEDFE";

/** Punto de focus de la sección 6 (idéntico al del cubo verde). */
export const JET_FOCUS = new THREE.Vector3(0, 0, -140);
/** Ventana de scroll (índice de sección) de la sección de El Cronista. */
export const JET_WINDOW: [number, number] = [7.0, 8.0];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
const smoother = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

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
  [-0.3, 0.15, 3.6],
  [0.3, 0.15, 3.6],
];


function Trail({ power }: { power: MutableRefObject<number> }) {
  const ref = useRef<THREE.Points>(null);
  const count = 140;

  const { geometry, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seeds = Array.from({ length: count }, (_, i) => {
      const n = NOZZLES[i % NOZZLES.length]!;
      return {
        ox: n[0],
        oy: n[1],
        oz: n[2],
        jx: (Math.random() - 0.5) * 0.1,
        jy: (Math.random() - 0.5) * 0.1,
        spread: 0.3 + Math.random() * 0.5,
        speed: 0.35 + Math.random() * 0.9,
        offset: Math.random(),
      };
    });

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometry: g, seeds };
  }, []);

  const tick = useRef(0);
  useFrame(({ clock }) => {
    const o = ref.current;
    if (!o) return;
    const p = power.current;
    o.visible = p > 0.02;
    if (!o.visible) return;
    (o.material as THREE.PointsMaterial).opacity = p * 0.8;
    if (++tick.current % 2) return;
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
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.09}
        color={ICE}
        map={softPointTexture()}
        alphaMap={softPointTexture()}
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
    const scale = 6 / Math.max(size.z, 0.001);
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
          mat.transparent = true; // permite el fundido de entrada/salida
          mat.depthWrite = true;
          mat.needsUpdate = true;
        });
      }
    });
    return wrap;
  }, [scene]);

  /** Materiales cacheados para el fundido (sin traverse por frame). */
  const fadeMats = useMemo(() => {
    const list: THREE.Material[] = [];
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => m && list.push(m));
    });
    return list;
  }, [model]);
  const opacity = useRef(0);

  /** Fase suavizada: seguimiento sin overshoot ni vibración en umbrales. */
  const phase = useRef<number | null>(null);

  useFrame((_, delta) => {
    const g = root.current;
    if (!g) return;
    const target = jetPhase(section.current);
    const live = section.current >= JET_WINDOW[0] && section.current <= JET_WINDOW[1];
    g.visible = live;
    if (!live) {
      power.current = 0;
      phase.current = null;
      return;
    }

    // seguimiento exponencial con delta capado (más lento: animación apreciable)
    const dt = Math.min(delta, 1 / 30);
    const follow = 1 - Math.exp(-7 * dt);
    if (phase.current === null) phase.current = target;
    phase.current += (target - phase.current) * follow;
    const s = clamp01(phase.current);

    // TIEMPO 1 (0.00–0.45): entrada heroica desde el horizonte hacia la cámara
    // TIEMPO 2 (0.45–0.68): se luce, grande y centrado, con banqueo suave
    // TIEMPO 3 (0.68–1.00): despegue ascendente y salida limpia hacia arriba
    const t1 = smoother(clamp01(s / 0.45));
    const hold = smoother(clamp01((s - 0.45) / 0.23));
    const t3 = smoother(clamp01((s - 0.68) / 0.32));

    // Z: llega muy cerca de cámara (plano protagonista) y luego se aleja subiendo
    const z = THREE.MathUtils.lerp(46, 2.4, t1) + t3 * t3 * -22;

    // Y: nace bajo el encuadre, se centra y luego asciende al cielo
    const y = THREE.MathUtils.lerp(-6.5, -0.5, t1) + hold * 0.3 + t3 * t3 * 16;

    // nariz: neutra al acercarse, se levanta en el despegue
    const pitch = -t3 * 0.55;

    // banqueo: sutil al lucirse, se endereza al ascender
    const roll = Math.sin(s * Math.PI * 1.6) * 0.22 * hold * (1 - t3) + t3 * 0.06;
    const yaw = 0.12 * hold * (1 - t3);

    // postquemador: enciende al entrar y va al máximo en el despegue
    const targetPower = clamp01(s / 0.18) * (0.45 + t1 * 0.25 + t3 * 0.3);
    power.current += (targetPower - power.current) * (1 - Math.exp(-10 * dt));

    // fundido de extremos: nunca hay pop
    const targetOpacity = smooth(clamp01(s / 0.1)) * (1 - smooth(clamp01((s - 0.9) / 0.1)));
    opacity.current += (targetOpacity - opacity.current) * (1 - Math.exp(-10 * dt));
    for (let i = 0; i < fadeMats.length; i++) {
      const m = fadeMats[i] as THREE.MeshStandardMaterial | undefined;
      if (m) m.opacity = opacity.current;
    }

    if (craft.current) {
      craft.current.position.set(0, y, z);
      craft.current.rotation.set(pitch, yaw, roll);
      const grow = THREE.MathUtils.lerp(0.9, 1, t1);
      craft.current.scale.setScalar(grow);
    }
  });



  return (
    <group ref={root} position={JET_FOCUS.toArray()} visible={false}>
      <group ref={craft}>
        <primitive object={model} />
        <Afterburner power={power} />
        <Trail power={power} />
        <pointLight position={[4, 5, -2]} intensity={140} distance={50} color={FORCE} />
      </group>
    </group>
  );
}
