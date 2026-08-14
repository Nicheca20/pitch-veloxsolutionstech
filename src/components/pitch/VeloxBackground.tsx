// @ts-nocheck
import { useEffect, useRef } from "react";

/**
 * VeloxBackground
 * Fondo fijo (canvas 2D) detrás de todo el contenido:
 * cielo con degradé, estrellas, estelas radiales de velocidad,
 * horizonte luminoso y piso infinito con reflejo.
 *
 * Uso: colócalo como PRIMER elemento del layout. Va con position:fixed
 * y z-index:0, así que el contenido y la escena 3D deben ir por encima
 * (z-index >= 1). No captura clics (pointer-events:none).
 */
export default function VeloxBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Paleta de marca
    const GALAXY = "#08070f";
    const MID = "#17114a";
    const VELOX = "#534AB7";
    const FORCE = "#7F77DD";
    const AURA = "#AFA9EC";
    const ICE = "#EEEDFE";

    // perf: el fondo es un degradé suave; 1.25x basta y ahorra ~60% de fill-rate
    const DPR = 0.75; // perf: el fondo es sólo degradés y líneas suaves; se escala vía CSS
    let W = 0;
    let H = 0;
    let staticCv: HTMLCanvasElement | null = null;
    let staticDirty = true;
    let horizon = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      horizon = H * 0.5;
      buildGradients();
    }
    // perf: los degradés no cambian por frame; se cachean por tamaño
    let skyGrad: CanvasGradient;
    let horizonGrad: CanvasGradient;
    let floorGrad: CanvasGradient;
    let reflectGrad: CanvasGradient;
    function buildGradients() {
      skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
      skyGrad.addColorStop(0, GALAXY);
      skyGrad.addColorStop(1, MID);
      horizonGrad = ctx.createLinearGradient(0, horizon - 80, 0, horizon + 10);
      horizonGrad.addColorStop(0, "rgba(127,119,221,0)");
      horizonGrad.addColorStop(1, "rgba(175,169,236,0.55)");
      floorGrad = ctx.createLinearGradient(0, horizon, 0, H);
      floorGrad.addColorStop(0, "#140f38");
      floorGrad.addColorStop(1, "#0a0820");
      reflectGrad = ctx.createLinearGradient(0, horizon, 0, horizon + 140);
      reflectGrad.addColorStop(0, "rgba(175,169,236,0.28)");
      reflectGrad.addColorStop(1, "rgba(83,74,183,0)");
      staticDirty = true;
    }

    // perf: todo lo que no cambia por frame (cielo, estrellas, piso, líneas
    // convergentes) se pinta una sola vez en un canvas offscreen.
    function buildStatic() {
      staticDirty = false;
      const cv = staticCv ?? (staticCv = document.createElement("canvas"));
      cv.width = Math.max(1, Math.round(W * DPR));
      cv.height = Math.max(1, Math.round(H * DPR));
      const c = cv.getContext("2d");
      if (!c) return;
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      c.clearRect(0, 0, W, H);
      c.fillStyle = skyGrad;
      c.fillRect(0, 0, W, horizon);
      c.fillStyle = ICE;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]!;
        c.globalAlpha = s.b;
        c.fillRect(s.x * W, s.y * horizon, s.s, s.s);
      }
      c.globalAlpha = 1;
      c.fillStyle = horizonGrad;
      c.fillRect(0, horizon - 80, W, 90);
      c.fillStyle = floorGrad;
      c.fillRect(0, horizon, W, H - horizon);
      c.fillStyle = reflectGrad;
      c.fillRect(0, horizon, W, 140);
      const cx = W / 2;
      c.strokeStyle = VELOX;
      c.globalAlpha = 0.28;
      c.lineWidth = 0.6;
      c.beginPath();
      for (let m = -7; m <= 7; m++) {
        c.moveTo(cx + m * (W / 7), H);
        c.lineTo(cx, horizon);
      }
      c.stroke();
      c.strokeStyle = AURA;
      c.globalAlpha = 0.85;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, horizon);
      c.lineTo(W, horizon);
      c.stroke();
      c.globalAlpha = 1;
    }

    resize();
    let onResizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(onResizeRaf);
      onResizeRaf = requestAnimationFrame(resize);
    };
    window.addEventListener("resize", onResize);

    // Estrellas
    const stars = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: Math.random() * 1.6 + 0.3,
      b: Math.random() * 0.6 + 0.3,
    }));

    // Estelas radiales (cielo) — nacen del punto de fuga
    const streaks = Array.from({ length: 44 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: Math.random(),
      sp: Math.random() * 0.007 + 0.004,
      len: Math.random() * 55 + 25,
    }));

    // Estelas sobre el piso — corren hacia la cámara
    const fstreaks = Array.from({ length: 34 }, () => ({
      x: (Math.random() - 0.5) * 2,
      z: Math.random(),
      sp: Math.random() * 0.014 + 0.008,
    }));

    let t = 0;
    let raf = 0;

    function line(
      x1: number, y1: number, x2: number, y2: number,
      col: string, w: number, a: number
    ) {
      ctx.strokeStyle = col;
      ctx.globalAlpha = a;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    let last = 0;
    // 60fps para que el fondo no se vea "a saltos"; el paso de tiempo se
    // reduce a la mitad para conservar la misma velocidad aparente.
    const FRAME = 1000 / 60;

    function draw(now?: number) {
      raf = requestAnimationFrame(draw);
      const ts = now ?? 0;
      if (ts - last < FRAME) return;
      last = ts;
      t += 1;
      const cx = W / 2;

      // Cielo
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, horizon);

      // Estrellas
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        ctx.globalAlpha = s.b * (0.6 + 0.4 * Math.sin(t * 0.03 + i));
        ctx.fillStyle = ICE;
        ctx.fillRect(s.x * W, s.y * horizon, s.s, s.s);
      }
      ctx.globalAlpha = 1;

      // Estelas radiales del cielo
      for (let j = 0; j < streaks.length; j++) {
        const st = streaks[j];
        st.r += st.sp;
        if (st.r > 1) st.r = 0;
        const rr = st.r * Math.max(W, H) * 0.8;
        const x1 = cx + Math.cos(st.a) * rr;
        const y1 = horizon + Math.sin(st.a) * rr * 0.55;
        const x2 = cx + Math.cos(st.a) * (rr + st.len);
        const y2 = horizon + Math.sin(st.a) * (rr + st.len) * 0.55;
        const col = st.r > 0.6 ? ICE : st.r > 0.3 ? AURA : FORCE;
        // solo pintamos las del hemisferio superior (cielo)
        if (y1 < horizon) line(x1, y1, x2, y2, col, 1 + st.r * 1.2, 0.08 + st.r * 0.5);
      }

      // Glow del horizonte
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, horizon - 80, W, 90);
      line(0, horizon, W, horizon, AURA, 2, 0.85);
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.04);
      line(0, horizon, W, horizon, ICE, 4, 0.22 * pulse);

      // Piso base
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, horizon, W, H - horizon);

      // Reflejo del horizonte sobre el piso (efecto espejo)
      ctx.fillStyle = reflectGrad;
      ctx.fillRect(0, horizon, W, 140);

      // Brillos verticales que caen (reflejo)
      for (let r = 0; r < 5; r++) {
        const rx = cx + ((r - 2) / 2) * W * 0.42;
        ctx.globalAlpha = 0.1 + 0.05 * Math.sin(t * 0.05 + r);
        ctx.fillStyle = reflectGrad;
        ctx.fillRect(rx - 16, horizon, 32, 100);
      }
      ctx.globalAlpha = 1;

      // Líneas de perspectiva horizontales que se acercan
      const off = (t * 0.009) % 1;
      for (let n = 0; n < 14; n++) {
        const tt = (n + off) / 14;
        const persp = tt * tt;
        const y = horizon + persp * (H - horizon);
        const glow = 1 - tt;
        line(0, y, W, y, FORCE, 0.6 + glow * 1.2, 0.12 + glow * 0.5);
      }

      // Líneas verticales convergentes al punto de fuga
      for (let m = -7; m <= 7; m++) {
        const bx = cx + m * (W / 7);
        line(bx, H, cx, horizon, VELOX, 0.6, 0.28);
      }

      // Estelas sobre el piso (velocidad)
      for (let f = 0; f < fstreaks.length; f++) {
        const v = fstreaks[f];
        v.z += v.sp;
        if (v.z > 1) {
          v.z = 0;
          v.x = (Math.random() - 0.5) * 2;
        }
        const p1 = v.z * v.z;
        const y = horizon + p1 * (H - horizon);
        const x = cx + v.x * (W * 0.5) * (0.2 + p1);
        const p2 = Math.min(1, v.z + 0.07);
        const p2s = p2 * p2;
        const y2 = horizon + p2s * (H - horizon);
        const x2 = cx + v.x * (W * 0.5) * (0.2 + p2s);
        const c = v.z > 0.55 ? ICE : AURA;
        line(x, y, x2, y2, c, 0.8 + p1 * 2.6, 0.22 + p1 * 0.65);
      }

    }
    draw();

    // perf: no gastar frames cuando la pestaña no está visible
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      cancelAnimationFrame(onResizeRaf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
        background:
          "linear-gradient(160deg,#08070f 0%,#100c2e 50%,#17114a 100%)",
      }}
    />
  );
}
