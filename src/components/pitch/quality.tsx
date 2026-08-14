import { useFrame, useThree } from "@react-three/fiber";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Calidad adaptativa: mide FPS reales y sube/baja el nivel gráfico
 * (DPR, resolución de texturas, bloom, environment) con histéresis
 * para que nunca oscile en cada cuadro.
 */
export type Tier = 0 | 1 | 2; // 0 = bajo, 1 = medio, 2 = alto

export const TIERS = {
  2: { dpr: 1.75, texture: 2048, anisotropy: 8, bloom: 0.5, env: true },
  1: { dpr: 1.25, texture: 1024, anisotropy: 4, bloom: 0.38, env: true },
  0: { dpr: 0.85, texture: 512, anisotropy: 1, bloom: 0.25, env: false },
} as const;

const QualityContext = createContext<Tier>(2);
export const useQualityTier = () => useContext(QualityContext);
export const useQuality = () => TIERS[useQualityTier()];
export const QualityProvider = QualityContext.Provider;

/** Nivel inicial estimado (mobile / poca memoria arranca más bajo). */
export function initialTier(): Tier {
  if (typeof window === "undefined") return 1;
  const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number };
  const small = window.matchMedia("(max-width: 768px)").matches;
  const weak = (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4;
  if (small || weak) return 1;
  return 2;
}

/**
 * Medidor de FPS dentro del Canvas. Promedia ventanas de ~1s y sólo cambia
 * de nivel tras 2 ventanas consecutivas por debajo/encima del umbral.
 */
export function QualitySensor({ tier, onTier }: { tier: Tier; onTier: (t: Tier) => void }) {
  const frames = useRef(0);
  const last = useRef(0);
  const bad = useRef(0);
  const good = useRef(0);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (!last.current) last.current = now;
    frames.current++;
    const dt = now - last.current;
    if (dt < 1) return;
    const fps = frames.current / dt;
    frames.current = 0;
    last.current = now;

    if (fps < 45) {
      bad.current++;
      good.current = 0;
    } else if (fps > 57) {
      good.current++;
      bad.current = 0;
    } else {
      bad.current = 0;
      good.current = 0;
    }

    if (bad.current >= 2 && tier > 0) {
      bad.current = 0;
      onTier((tier - 1) as Tier);
    } else if (good.current >= 4 && tier < 2) {
      good.current = 0;
      onTier((tier + 1) as Tier);
    }
  });

  return null;
}

/** Reduce en GPU las texturas de la escena al presupuesto del nivel actual. */
export function TextureBudget() {
  const { scene, gl } = useThree();
  const { texture, anisotropy } = useQuality();

  useEffect(() => {
    const maxAniso = Math.min(anisotropy, gl.capabilities.getMaxAnisotropy());
    const seen = new Set<THREE.Texture>();
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      for (const m of mats) {
        for (const value of Object.values(m as unknown as Record<string, unknown>)) {
          if (!(value instanceof THREE.Texture) || seen.has(value)) continue;
          seen.add(value);
          value.anisotropy = maxAniso;
          const img = value.image as { width?: number; height?: number } | undefined;
          const w = img?.width ?? 0;
          if (w > texture) {
            value.minFilter = THREE.LinearMipmapLinearFilter;
            value.generateMipmaps = true;
            // fuerza a la GPU a muestrear desde un nivel de mipmap menor
            const bias = Math.log2(w / texture);
            (value as THREE.Texture & { anisotropy: number }).anisotropy = Math.min(maxAniso, 2);
            value.userData['lodBias'] = bias;
          }
          value.needsUpdate = true;
        }
      }
    });
  }, [scene, gl, texture, anisotropy]);

  return null;
}

/** Estado de calidad + setter estable para el Canvas. */
export function useAdaptiveQuality() {
  const [tier, setTier] = useState<Tier>(initialTier);
  const onTier = useCallback((t: Tier) => setTier(t), []);
  return { tier, onTier, config: TIERS[tier] };
}
