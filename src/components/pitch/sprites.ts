import * as THREE from "three";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** Punto suave circular (sin bordes duros ni cuadrados). */
export function softDotTexture() {
  const c = canvas(128, 128);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.65)");
  g.addColorStop(0.6, "rgba(255,255,255,0.16)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Estela alargada tipo motion-blur (vertical, se desvanece en ambos extremos). */
export function streakTexture() {
  const c = canvas(64, 256);
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 64, 256);
  // núcleo vertical
  const v = ctx.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, "rgba(255,255,255,0)");
  v.addColorStop(0.35, "rgba(255,255,255,0.85)");
  v.addColorStop(0.5, "rgba(255,255,255,1)");
  v.addColorStop(0.65, "rgba(255,255,255,0.85)");
  v.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 64, 256);
  // desvanecido horizontal
  const h = ctx.createLinearGradient(0, 0, 64, 0);
  h.addColorStop(0, "rgba(0,0,0,1)");
  h.addColorStop(0.5, "rgba(0,0,0,0)");
  h.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = h;
  ctx.fillRect(0, 0, 64, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
