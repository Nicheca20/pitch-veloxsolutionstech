import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const FOG = "#0a0820";
const GRID = "#534AB7";
const PARTICLE_COLORS = ["#534AB7", "#7F77DD", "#AFA9EC", "#EEEDFE"];

/** Grilla synthwave que corre hacia el espectador y se pierde en la niebla. */
function SpeedGrid() {
  const a = useRef<THREE.GridHelper>(null);
  const b = useRef<THREE.GridHelper>(null);
  const size = 120;

  useFrame((_, dt) => {
    for (const ref of [a, b]) {
      const g = ref.current;
      if (!g) continue;
      g.position.z += dt * 14;
      if (g.position.z > 0) g.position.z -= size;
    }
  });

  return (
    <group position={[0, -3.2, 0]}>
      <gridHelper ref={a} args={[size, 60, GRID, GRID]} position={[0, 0, 0]}>
        <lineBasicMaterial attach="material" color={GRID} transparent opacity={0.55} fog />
      </gridHelper>
      <gridHelper ref={b} args={[size, 60, GRID, GRID]} position={[0, 0, -size]}>
        <lineBasicMaterial attach="material" color={GRID} transparent opacity={0.55} fog />
      </gridHelper>
    </group>
  );
}

/** Campo de partículas flotante con blending aditivo. */
function ParticleField({ count = 30000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = PARTICLE_COLORS.map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 160;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 2] = -Math.random() * 130;
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

  useFrame((state, dt) => {
    const o = ref.current;
    if (!o) return;
    o.rotation.y += dt * 0.012;
    o.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.6;
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

export function Background3D() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 65, near: 0.1, far: 200, position: [0, 0.6, 12] }}
      onCreated={({ gl, scene }) => {
        gl.shadowMap.enabled = false;
        gl.setClearColor(0x000000, 0);
        scene.fog = new THREE.Fog(FOG, 12, 90);
      }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 8, 6]} intensity={0.5} color="#AFA9EC" />
      <directionalLight position={[-8, -4, -6]} intensity={0.35} color="#534AB7" />
      <SpeedGrid />
      <ParticleField />
    </Canvas>
  );
}
