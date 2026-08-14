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

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
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
    }
    resize();
    window.addEventListener("resize", resize);

    // Estrellas
    const stars = Array.from({ length: 110 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: Math.random() * 1.6 + 0.3,
      b: Math.random() * 0.6 + 0.3,
    }));

    // Estelas radiales (cielo) — nacen del punto de fuga
    const streaks = Array.from({ length: 80 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: Math.random(),
      sp: Math.random() * 0.007 + 0.004,
      len: Math.random() * 55 + 25,
    }));

    // Estelas sobre el piso — corren hacia la cámara
    const fstreaks = Array.from({ length: 60 }, () => ({
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

    function draw() {
      t += 1;
      const cx = W / 2;

      // Cielo
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, GALAXY);
      sky.addColorStop(1, MID);
      ctx.fillStyle = sky;
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
      const hg = ctx.createLinearGradient(0, horizon - 80, 0, horizon + 10);
      hg.addColorStop(0, "rgba(127,119,221,0)");
      hg.addColorStop(1, "rgba(175,169,236,0.55)");
      ctx.fillStyle = hg;
      ctx.fillRect(0, horizon - 80, W, 90);
      line(0, horizon, W, horizon, AURA, 2, 0.85);
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.04);
      line(0, horizon, W, horizon, ICE, 4, 0.22 * pulse);

      // Piso base
      const fl = ctx.createLinearGradient(0, horizon, 0, H);
      fl.addColorStop(0, "#140f38");
      fl.addColorStop(1, "#0a0820");
      ctx.fillStyle = fl;
      ctx.fillRect(0, horizon, W, H - horizon);

      // Reflejo del horizonte sobre el piso (efecto espejo)
      const rf = ctx.createLinearGradient(0, horizon, 0, horizon + 140);
      rf.addColorStop(0, "rgba(175,169,236,0.28)");
      rf.addColorStop(1, "rgba(83,74,183,0)");
      ctx.fillStyle = rf;
      ctx.fillRect(0, horizon, W, 140);

      // Brillos verticales que caen (reflejo)
      for (let r = 0; r < 7; r++) {
        const rx = cx + ((r - 3) / 3) * W * 0.42;
        const rg = ctx.createLinearGradient(rx, horizon, rx, horizon + 100);
        rg.addColorStop(0, "rgba(238,237,254," + (0.12 + 0.06 * Math.sin(t * 0.05 + r)) + ")");
        rg.addColorStop(1, "rgba(238,237,254,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(rx - 16, horizon, 32, 100);
      }

      // Líneas de perspectiva horizontales que se acercan
      const off = (t * 0.009) % 1;
      for (let n = 0; n < 20; n++) {
        const tt = (n + off) / 20;
        const persp = tt * tt;
        const y = horizon + persp * (H - horizon);
        const glow = 1 - tt;
        line(0, y, W, y, FORCE, 0.6 + glow * 1.2, 0.12 + glow * 0.5);
      }

      // Líneas verticales convergentes al punto de fuga
      for (let m = -10; m <= 10; m++) {
        const bx = cx + m * (W / 10);
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

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
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
