import { softPointTexture } from "./soft-point";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, MeshReflectorMaterial } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { CAR_WINDOW, F1Car, carPhase } from "./F1Car";
import { JET_WINDOW, Jet } from "./Jet";
import { BIKE_WINDOW, Bike } from "./Bike";

const FOG = "#0a0820";
const GRID = "#7F77DD";
const PARTICLE_COLORS = ["#26215C", "#534AB7", "#7F77DD", "#AFA9EC", "#EEEDFE"];
const ACCENT_COLORS = ["#AFA9EC", "#EEEDFE", "#7F77DD"];


type Ref = MutableRefObject<number>;

/* ---------------------------------------------------------------- Keyframes */
type Key = { at: number; v: [number, number, number] };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (x: number) => x * x * (3 - 2 * x);

/**
 * Intensidad global del túnel (velocidad de grilla, brillo, streaks).
 * 1 en reposo; sube gradualmente al acercarse a la sección 5 (build-up).
 */
function tunnelIntensity(t: number) {
  const buildUp = smoothstep(clamp01((t - 1.2) / 2.2)); // 0 en sec 1 → 1 en sec ~3.4
  const settle = 1 - smoothstep(clamp01((t - 3.6) / 0.8)); // se calma al entrar al carro
  return 1 + buildUp * settle * 1.6;
}

/** Altura del piso reflectante (los modelos apoyan sobre él). */
export const FLOOR_Y = -1.25;

/**
 * Factor de "velocidad" según la sección: pico en las secciones con vehículo,
 * más calmado en las secciones de solo texto para que el título se lea.
 */
function speedFactor(t: number) {
  const bump = (a: number, b: number) =>
    smoothstep(clamp01((t - (a - 0.5)) / 0.6)) * (1 - smoothstep(clamp01((t - b) / 0.6)));
  const vehicles = Math.max(
    bump(CAR_WINDOW[0], CAR_WINDOW[1]),
    bump(JET_WINDOW[0], JET_WINDOW[1]),
    bump(BIKE_WINDOW[0], BIKE_WINDOW[1]),
  );
  return 0.7 + vehicles * 1.5;
}

/** Intensidad combinada usada por grilla, estelas y partículas. */
const flow = (t: number) => tunnelIntensity(t) * speedFactor(t);

/** Keyframes por índice de sección (0 = primera pantalla). */
const FOCUS: Key[] = [
  { at: 0, v: [0, 0, 0] },
  { at: 1, v: [0, 0, -7] },
  { at: 2, v: [0, 0, -18] },
  { at: 3, v: [0, 0, -34] },
  { at: 4, v: [0, 0, -55] }, // sección 5 → carro
  { at: 4.5, v: [0, 0.6, -75] }, // puente: la cámara sigue la pista
  { at: 5, v: [0, 1.2, -95] }, // sección 6 → avión (mirando algo hacia arriba)
  { at: 5.5, v: [0, 0.8, -118] }, // puente: la estela baja hasta la banda de nubes
  { at: 6, v: [0, 0, -140] }, // sección 7 → moto
  { at: 9, v: [0, 0, -210] },
];

/** Posición relativa de la cámara respecto del focus. */
const OFFSET: Key[] = [
  { at: 0, v: [0, 1.2, 16] },
  { at: 1, v: [0.8, 1.0, 13] },
  { at: 2, v: [-0.9, 1.4, 12] },
  { at: 3, v: [0.6, 0.9, 13] },
  { at: 4, v: [0, 0.8, 14] },
  { at: 4.5, v: [0, 0.2, 15] }, // se agacha a ras de pista tras el carro
  { at: 5, v: [0, -0.6, 14] }, // por debajo del avión que despega
  { at: 5.5, v: [0, 0.4, 14.5] },
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

  useFrame(({ clock }, dt) => {
    // suavizado independiente del framerate: misma sensación a 30 o 144 fps
    smoothed.current += (section.current - smoothed.current) * (1 - Math.exp(-dt * 7));
    const t = smoothed.current;
    sampleKeys(FOCUS, t, focus.current);
    sampleKeys(OFFSET, t, offset.current);
    // órbita lenta alrededor del carro durante la sección 5 (no altera focus/lookAt)
    const inCar = t > CAR_WINDOW[0] - 0.4 && t < CAR_WINDOW[1];
    if (inCar) {
      // se desvanece al final para no arrastrar el encuadre a la sección 6
      const fade = clamp01((CAR_WINDOW[1] - t) / 0.35);
      const a = (carPhase(t) * Math.PI * 0.55 - 0.25) * fade;
      const o = offset.current;
      const x = o.x * Math.cos(a) + o.z * Math.sin(a);
      const z = -o.x * Math.sin(a) + o.z * Math.cos(a);
      o.set(x, o.y + 0.9 * fade, z);
    }

    // deriva sutil en el túnel (secciones 0-4) para que nunca se sienta estático
    if (!inCar && t < CAR_WINDOW[0]) {
      const e = clock.elapsedTime;
      offset.current.x += Math.sin(e * 0.35) * 0.5;
      offset.current.y += Math.cos(e * 0.27) * 0.28;
    }
    camera.position.copy(focus.current).add(offset.current);
    camera.lookAt(focus.current);

  });

  return null;
}

/* -------------------------------------------------------- (sin cubos de prueba) */


/** Pulso de entrada: oleada de energía en los primeros segundos del hook. */
function usePulse(section: Ref) {
  const born = useRef(0);
  return (elapsed: number) => {
    if (!born.current) born.current = elapsed;
    const e = elapsed - born.current;
    if (section.current > 1.1) return 0;
    const near = 1 - clamp01(section.current / 1.1);
    const wave = Math.exp(-Math.pow((e - 0.9) / 0.55, 2)); // campana ~0.9s
    return wave * near;
  };
}

/**
 * "Carretera" synthwave: plano con grilla procedural de líneas finas y luminosas,
 * con degradé de brillo hacia el horizonte y color entre velox y aura.
 */
function SpeedGrid({ section }: { section: Ref }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uRun: { value: 0 },
          uIntensity: { value: 1 },
          uNear: { value: new THREE.Color("#AFA9EC") },
          uFar: { value: new THREE.Color("#534AB7") },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vLocal;
          void main() {
            vUv = uv;
            vLocal = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uRun; uniform float uIntensity;
          uniform vec3 uNear; uniform vec3 uFar;
          varying vec3 vLocal;

          float line(float coord, float width) {
            float g = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
            return 1.0 - smoothstep(0.0, width, g);
          }

          void main() {
            // el plano está rotado: x = lateral, y local = profundidad
            float depth = clamp(abs(vLocal.y) / 190.0, 0.0, 1.0);
            float side = clamp(abs(vLocal.x) / 120.0, 0.0, 1.0);

            // carriles de fuga (líneas finas a lo largo de la profundidad)
            float lanes = line(vLocal.x / 6.0, 0.7);
            // barridos que se acercan a la cámara (líneas transversales rápidas)
            float sweeps = line((vLocal.y + uRun) / 9.0, 0.55);
            float g = max(lanes * 0.9, sweeps);
            if (g < 0.01) discard;

            // más brillante cerca del horizonte, se apaga a los lados
            float horizon = smoothstep(0.05, 0.62, depth) * (1.0 - smoothstep(0.72, 1.0, depth));
            float glow = (0.35 + horizon * 1.25) * (1.0 - side * side);
            vec3 col = mix(uNear, uFar, smoothstep(0.15, 0.75, depth));
            float nearFade = smoothstep(4.0, 22.0, length(vLocal.xy));
            float a = g * glow * nearFade * 0.5 * uIntensity;
            gl_FragColor = vec4(col * (0.7 + glow * 0.8), a);
          }
        `,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ camera }, dt) => {
    const k = Math.min(3.2, flow(section.current));
    material.uniforms['uRun']!.value = (material.uniforms['uRun']!.value + dt * 16 * k) % 9;
    material.uniforms['uIntensity']!.value = 0.42 + (k - 1) * 0.22;
    if (mesh.current) mesh.current.position.z = camera.position.z;
  });

  return (
    <mesh
      ref={mesh}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, FLOOR_Y + 0.02, 0]}
      frustumCulled={false}
    >
      <planeGeometry args={[400, 400]} />
    </mesh>
  );
}

/** Piso infinito reflectante: los modelos se reflejan con blur suave. */
function ReflectiveFloor() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    if (mesh.current) mesh.current.position.z = camera.position.z;
  });
  return (
    <mesh
      ref={mesh}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, FLOOR_Y, 0]}
      frustumCulled={false}
    >
      <planeGeometry args={[420, 420]} />
      <MeshReflectorMaterial
        resolution={1024}
        mirror={0.95}
        mixBlur={2.2}
        mixStrength={3.2}
        blur={[220, 60]}
        depthScale={0.9}
        minDepthThreshold={0.2}
        maxDepthThreshold={1.2}
        color="#0a0820"
        metalness={0.9}
        roughness={0.45}
      />
    </mesh>
  );
}

/** Línea de horizonte luminosa que late (con bloom). */
function HorizonGlow() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ camera, clock }) => {
    const m = mesh.current;
    if (!m) return;
    m.position.set(camera.position.x * 0.2, FLOOR_Y + 1.6, camera.position.z - 185);
    if (mat.current) mat.current.opacity = 0.42 + Math.sin(clock.elapsedTime * 1.1) * 0.12;
  });
  return (
    <group>
      <mesh ref={mesh} frustumCulled={false}>
        <planeGeometry args={[520, 5]} />
        <meshBasicMaterial
          ref={mat}
          color="#AFA9EC"
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** Estrellas tenues en el cielo. */
function Stars({ count = 1400 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 150 + Math.random() * 110;
      const a = Math.random() * Math.PI * 2;
      const h = Math.random();
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = 20 + h * 130;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.z = camera.position.z;
  });
  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.9}
        sizeAttenuation
        map={softPointTexture()}
        alphaMap={softPointTexture()}
        color="#EEEDFE"
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}



/** Líneas de velocidad que atraviesan la cámara (cielo o a ras de piso). */
function Streaks({
  section,
  count = 700,
  ground = false,
  color = "#AFA9EC",
}: {
  section: Ref;
  count?: number;
  ground?: boolean;
  color?: string;
}) {
  const ref = useRef<THREE.LineSegments>(null);
  const mat = useRef<THREE.LineBasicMaterial>(null);
  const depth = 220;

  const { geometry, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 6);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 42;
      const a = Math.random() * Math.PI * 2;
      const x = ground ? (Math.random() - 0.5) * 90 : Math.cos(a) * r;
      const y = ground ? FLOOR_Y + 0.12 + Math.random() * 0.5 : Math.sin(a) * r * 0.45;
      const z = -Math.random() * depth;
      const len = 2 + Math.random() * 6;
      pos.set([x, y, z, x, y, z - len], i * 6);
      speeds[i] = 28 + Math.random() * 55;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometry: g, speeds };
  }, [count]);

  useFrame(({ camera, clock }, dt) => {
    const o = ref.current;
    if (!o) return;
    o.position.z = camera.position.z;
    const k = Math.min(3.2, flow(section.current));
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const d = speeds[i]! * k * dt;
      const i0 = i * 6;
      
      arr[i0 + 2] = arr[i0 + 2]! + d;
      arr[i0 + 5] = arr[i0 + 5]! + d;
      if (arr[i0 + 5]! > 12) {
        const shift = depth + Math.random() * 40;
        arr[i0 + 2] = arr[i0 + 2]! - shift;
        arr[i0 + 5] = arr[i0 + 5]! - shift;
      }
    }
    attr.needsUpdate = true;
    if (mat.current) {
      mat.current.opacity = Math.min(0.6, 0.12 + (k - 0.7) * 0.24);
      mat.current.color.setHSL(0.68, 0.55, 0.6 + Math.sin(clock.elapsedTime + (ground ? 1 : 0)) * 0.06);
    }
  });

  return (
    <lineSegments ref={ref} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        ref={mat}
        color={color}
        transparent
        opacity={0.2}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

/** Cielo con degradé: galaxy oscuro arriba → velox/force hacia el horizonte. */
function GradientSky() {
  const ref = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color("#08070f") },
          mid: { value: new THREE.Color("#17114a") },
          horizon: { value: new THREE.Color("#534AB7") },
          low: { value: new THREE.Color("#0b0920") },
        },
        vertexShader: `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 low;
          varying vec3 vPos;
          void main() {
            float h = normalize(vPos).y;
            vec3 c = mix(mid, top, smoothstep(0.05, 0.9, h));
            c = mix(c, horizon, smoothstep(0.28, 0.0, abs(h)) * 0.85);
            c = mix(c, low, smoothstep(-0.05, -0.6, h));
            gl_FragColor = vec4(c, 1.0);
          }
        `,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.copy(camera.position);
  });
  return (
    <mesh ref={ref} material={material} frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[300, 32, 24]} />
    </mesh>
  );
}

/** Material de puntos con forma suave (círculo o estela) calculada en el shader. */
function makePointMaterial(stretch: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uSize: { value: 0.11 },
      uScale: { value: 450 },
      uOpacity: { value: 0.85 },
      uStretch: { value: stretch },
    },
    vertexShader: `
      uniform float uSize; uniform float uScale;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(1.0, uSize * (uScale / max(0.1, -mv.z)));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uOpacity; uniform float uStretch;
      varying vec3 vColor;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        // uStretch > 1 comprime el eje X → forma alargada tipo estela
        float d = length(vec2(uv.x * uStretch, uv.y)) * 2.0;
        float a = 1.0 - smoothstep(0.0, 1.0, d);
        a = pow(a, 1.8);
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a * uOpacity);
      }
    `,
  });
}

/** Campo de partículas suaves con toda la paleta y brillo variable. */
function ParticleField({ section, count = 26000 }: { section: Ref; count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const drift = useRef(0);
  const pulse = usePulse(section);
  const material = useMemo(() => makePointMaterial(1), []);
  useEffect(() => () => material.dispose(), [material]);

  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = PARTICLE_COLORS.map((c) => new THREE.Color(c));
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 170;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 170;
      const c = palette[Math.floor(Math.random() * palette.length)]!;
      // brillo variable: la mayoría tenues, unas pocas muy vivas
      const b = 0.3 + Math.pow(Math.random(), 2.4) * 1.6;
      tmp.copy(c).multiplyScalar(b);
      col[i * 3] = tmp.r;
      col[i * 3 + 1] = tmp.g;
      col[i * 3 + 2] = tmp.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [count]);

  useFrame(({ camera, clock, size }, dt) => {
    const o = ref.current;
    if (!o) return;
    const k = Math.min(3.2, flow(section.current));
    const p = pulse(clock.elapsedTime);
    drift.current = (drift.current + dt * 9 * k) % 170;
    o.rotation.y += dt * 0.02 * k;
    o.position.z = camera.position.z - 40 + drift.current;
    o.position.y = Math.sin(clock.elapsedTime * 0.15) * 0.6;
    o.scale.setScalar(1 + p * 0.14);
    material.uniforms['uScale']!.value = size.height * 0.5;
    material.uniforms['uSize']!.value = 0.14 * (1 + (k - 1) * 0.5 + p * 1.4);
    material.uniforms['uOpacity']!.value = Math.min(1, 0.7 + p * 0.3);
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}

/** Estelas de velocidad: partículas alargadas (motion-blur) que cruzan la escena. */
function AccentStreaks({ section, count = 1800 }: { section: Ref; count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const material = useMemo(() => makePointMaterial(4.5), []);
  useEffect(() => () => material.dispose(), [material]);
  const depth = 200;

  const { geometry, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const palette = ACCENT_COLORS.map((c) => new THREE.Color(c));
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 46;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r * 0.5;
      pos[i * 3 + 2] = -Math.random() * depth;
      const c = palette[Math.floor(Math.random() * palette.length)]!;
      tmp.copy(c).multiplyScalar(0.9 + Math.random() * 1.6);
      col[i * 3] = tmp.r;
      col[i * 3 + 1] = tmp.g;
      col[i * 3 + 2] = tmp.b;
      speeds[i] = 22 + Math.random() * 60;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { geometry: g, speeds };
  }, [count]);

  useFrame(({ camera, size }, dt) => {
    const o = ref.current;
    if (!o) return;
    o.position.z = camera.position.z;
    const k = Math.min(3.2, flow(section.current));
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i0 = i * 3 + 2;
      arr[i0] = arr[i0]! + speeds[i]! * k * dt;
      if (arr[i0]! > 14) arr[i0] = arr[i0]! - (depth + Math.random() * 40);
    }
    attr.needsUpdate = true;
    material.uniforms['uScale']!.value = size.height * 0.5;
    material.uniforms['uSize']!.value = 0.75 * (1 + (k - 1) * 0.6);
    material.uniforms['uOpacity']!.value = 0.5;
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}



/** Bloom dinámico: golpe de brillo en el hook + build-up hacia la sección 5. */
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

/** Monta el avión sólo cuando la sección 6 está cerca del viewport. */
function LazyJet({ section }: { section: Ref }) {
  const [show, setShow] = useState(false);
  useFrame(() => {
    if (!show && section.current > JET_WINDOW[0] - 2) setShow(true);
  });
  if (!show) return null;
  return (
    <Suspense fallback={null}>
      <Jet section={section} />
    </Suspense>
  );
}


/** Monta la moto sólo cuando la sección 7 está cerca del viewport. */
function LazyBike({ section }: { section: Ref }) {
  const [show, setShow] = useState(false);
  useFrame(() => {
    if (!show && section.current > BIKE_WINDOW[0] - 2) setShow(true);
  });
  if (!show) return null;
  return (
    <Suspense fallback={null}>
      <Bike section={section} />
    </Suspense>
  );
}

function DynamicBloom({ section }: { section: Ref }) {
  const ref = useRef<{ intensity: number } | null>(null);
  const pulse = usePulse(section);
  useFrame(({ clock }) => {
    const k = Math.min(3.2, flow(section.current));
    const p = pulse(clock.elapsedTime);
    if (ref.current) ref.current.intensity = 0.62 + (k - 1) * 0.4 + p * 1.2;
  });
  return (
    <Bloom
      ref={ref as never}
      intensity={0.62}
      luminanceThreshold={0.42}
      luminanceSmoothing={0.5}
      kernelSize={KernelSize.LARGE}
    />
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
        scene.fog = new THREE.Fog(FOG, 18, 120);
      }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 6]} intensity={0.7} color="#AFA9EC" />
      <directionalLight position={[-8, -4, -6]} intensity={0.4} color="#534AB7" />
      <GradientSky />
      <Stars />
      <CameraRig section={section} />
      <ReflectiveFloor />
      <SpeedGrid section={section} />
      <HorizonGlow />
      <ParticleField section={section} />
      <AccentStreaks section={section} />
      <Streaks section={section} count={800} color="#AFA9EC" />
      <Streaks section={section} count={420} ground color="#7F77DD" />
      <LazyCar section={section} />
      <LazyJet section={section} />
      <LazyBike section={section} />
      <EffectComposer enableNormalPass={false}>
        <DynamicBloom section={section} />
      </EffectComposer>
    </Canvas>
  );
}

