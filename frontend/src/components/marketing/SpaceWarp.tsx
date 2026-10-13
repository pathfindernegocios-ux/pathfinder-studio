// src/components/marketing/SpaceWarp.tsx
// Deep Field + Star Trails — dos variantes visuales
import React, { useEffect, useRef } from "react";

interface SpaceWarpProps {
  /** "deepfield" = estrellas estáticas con física óptica. "startrails" = arcos curvos lentos. */
  variant?: "deepfield" | "startrails";
  density?: number;
  intensity?: number;
  /** Centro de rotación (0-1). Solo aplica a startrails. */
  centerX?: number;
  centerY?: number;
}

const SpaceWarp: React.FC<SpaceWarpProps> = ({
  variant = "deepfield",
  density = 1400,
  intensity = 1,
  centerX = 0.5,
  centerY = 0.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Paleta astrofísica
    const STAR_COLORS = [
      { rgb: "255, 255, 255", weight: 22 },
      { rgb: "202, 215, 255", weight: 18 },
      { rgb: "170, 191, 255", weight: 12 },
      { rgb: "248, 247, 255", weight: 14 },
      { rgb: "255, 244, 234", weight: 12 },
      { rgb: "255, 210, 161", weight: 10 },
      { rgb: "255, 204, 111", weight: 5 },
      { rgb: "255, 150, 100", weight: 4 },
      { rgb: "240, 200, 255", weight: 3 },
    ];

    const pickColor = () => {
      const total = STAR_COLORS.reduce((s, c) => s + c.weight, 0);
      let r = Math.random() * total;
      for (const c of STAR_COLORS) {
        r -= c.weight;
        if (r <= 0) return c.rgb;
      }
      return STAR_COLORS[0].rgb;
    };

    // ── Estrellas para deepfield ──
    interface FieldStar {
      x: number;
      y: number;
      z: number;
      radius: number;
      brightness: number;
      color: string;
      driftX: number;
      driftY: number;
      twinklePhase: number;
      twinkleSpeed: number;
      twinkleAmplitude: number;
      spikeAngle: number;
      spikeLength: number;
    }

    // ── Estrellas para startrails ──
    interface TrailStar {
      orbitRadius: number;   // 0-1, distancia al centro
      angle: number;         // ángulo actual
      speed: number;         // velocidad angular (rad/frame)
      trailLength: number;   // largo del arco en radianes
      brightness: number;
      thickness: number;
      color: string;
      brightnessBoost: number;
    }

    interface Nebula {
      x: number;
      y: number;
      radius: number;
      hue: string;
      opacity: number;
    }

    let fieldStars: FieldStar[] = [];
    let trailStars: TrailStar[] = [];
    let nebulas: Nebula[] = [];

    const initFieldStars = () => {
      fieldStars = [];
      const count = Math.floor((density * width * height) / (1920 * 1080));
      for (let i = 0; i < count; i++) {
        const z = Math.pow(Math.random(), 0.7);
        const sizeRandom = Math.random();
        let baseRadius: number;
        if (sizeRandom < 0.72) baseRadius = 0.25 + Math.random() * 0.35;
        else if (sizeRandom < 0.94) baseRadius = 0.6 + Math.random() * 0.8;
        else baseRadius = 1.4 + Math.random() * 2.2;
        const radius = baseRadius * (0.4 + z * 0.9);
        const hasSpikes = baseRadius > 1.4 && Math.random() < 0.7;

        fieldStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          radius,
          brightness: (0.3 + Math.random() * 0.7) * (0.5 + z * 0.5),
          color: pickColor(),
          driftX: (Math.random() - 0.5) * 0.015 * (0.3 + z),
          driftY: (Math.random() - 0.5) * 0.015 * (0.3 + z),
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.005 + Math.random() * 0.04,
          twinkleAmplitude: 0.08 + Math.random() * 0.22,
          spikeAngle: Math.random() * Math.PI,
          spikeLength: hasSpikes ? radius * (3.5 + Math.random() * 3) : 0,
        });
      }
    };

    const initTrailStars = () => {
      trailStars = [];
      const count = Math.floor(density * 1.8);
      for (let i = 0; i < count; i++) {
        // Distribución: muchas más estrellas lejos del centro (aunque en la foto las hay en todos lados)
        const u = Math.random();
        const orbitRadius = Math.pow(u, 0.55);

        // Velocidad angular: realista — más lento lejos
        // v = ω * r. Para que se vea lento pero fluido: ω base muy baja
        const baseSpeed = 0.00008 + Math.random() * 0.00012;
        const speed = baseSpeed / (0.3 + orbitRadius * 1.5);

        // Trail más largo en estrellas grandes
        const sizeRandom = Math.random();
        const thickness = sizeRandom < 0.6
          ? 0.4 + Math.random() * 0.4
          : 0.8 + Math.random() * 1.2;

        // Trail: 0.02 a 0.12 radianes (1-7 grados)
        const trailLength = 0.02 + Math.random() * 0.10;

        trailStars.push({
          orbitRadius,
          angle: Math.random() * Math.PI * 2,
          speed,
          trailLength,
          brightness: 0.35 + Math.random() * 0.65,
          thickness,
          color: pickColor(),
          brightnessBoost: sizeRandom < 0.6 ? 1 : 1.4,
        });
      }
    };

    const initNebulas = () => {
      nebulas = [];
      const nebulaHues = [
        "139, 92, 246",
        "100, 120, 220",
        "200, 100, 180",
        "80, 140, 180",
      ];
      for (let i = 0; i < 6; i++) {
        nebulas.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 80 + Math.random() * 180,
          hue: nebulaHues[Math.floor(Math.random() * nebulaHues.length)],
          opacity: 0.025 + Math.random() * 0.04,
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (variant === "deepfield") initFieldStars();
      else initTrailStars();
      initNebulas();
    };

    // ── DIBUJO: Deep Field ──
    const drawDiffractionSpikes = (star: FieldStar, brightness: number) => {
      if (star.spikeLength <= 0) return;
      const len = star.spikeLength;
      const angle = star.spikeAngle;

      for (let i = 0; i < 4; i++) {
        const a = angle + (Math.PI / 2) * i;
        const x2 = star.x + Math.cos(a) * len;
        const y2 = star.y + Math.sin(a) * len;
        const grad = ctx.createLinearGradient(star.x, star.y, x2, y2);
        grad.addColorStop(0, `rgba(${star.color}, ${(brightness * 0.55).toFixed(3)})`);
        grad.addColorStop(0.4, `rgba(${star.color}, ${(brightness * 0.15).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${star.color}, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(0.4, star.radius * 0.35);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    const drawDeepField = () => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "lighter";
      for (const n of nebulas) {
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
        grad.addColorStop(0, `rgba(${n.hue}, ${(n.opacity * intensity).toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(${n.hue}, ${(n.opacity * 0.35 * intensity).toFixed(3)})`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(n.x - n.radius, n.y - n.radius, n.radius * 2, n.radius * 2);
      }
      ctx.globalCompositeOperation = "source-over";

      for (const star of fieldStars) {
        star.twinklePhase += star.twinkleSpeed;
        const twinkle1 = Math.sin(star.twinklePhase);
        const twinkle2 = Math.sin(star.twinklePhase * 2.3 + 1.7);
        const twinkleFactor =
          1 - star.twinkleAmplitude + (twinkle1 * 0.6 + twinkle2 * 0.4) * star.twinkleAmplitude;
        const finalBrightness = Math.min(1, star.brightness * twinkleFactor * intensity);

        if (star.radius > 1.0) {
          ctx.globalCompositeOperation = "lighter";
          const bloomRadius = star.radius * 6;
          const bloom = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, bloomRadius);
          bloom.addColorStop(0, `rgba(${star.color}, ${(finalBrightness * 0.35).toFixed(3)})`);
          bloom.addColorStop(0.3, `rgba(${star.color}, ${(finalBrightness * 0.12).toFixed(3)})`);
          bloom.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = bloom;
          ctx.beginPath();
          ctx.arc(star.x, star.y, bloomRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }

        if (star.spikeLength > 0) drawDiffractionSpikes(star, finalBrightness);

        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(${star.color}, ${(finalBrightness * 0.25).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${star.color}, ${(finalBrightness * 0.6).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 1.3, 0, Math.PI * 2);
        ctx.fill();
        const coreColor = finalBrightness > 0.75 ? "255, 255, 255" : star.color;
        ctx.fillStyle = `rgba(${coreColor}, ${finalBrightness.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";

        star.x += star.driftX;
        star.y += star.driftY;
        if (star.x < -10) star.x = width + 10;
        if (star.x > width + 10) star.x = -10;
        if (star.y < -10) star.y = height + 10;
        if (star.y > height + 10) star.y = -10;
      }
    };

    // ── DIBUJO: Star Trails ──
    const drawStarTrails = () => {
      // Fondo
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Nebulosas
      ctx.globalCompositeOperation = "lighter";
      for (const n of nebulas) {
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
        grad.addColorStop(0, `rgba(${n.hue}, ${(n.opacity * intensity * 0.7).toFixed(3)})`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(n.x - n.radius, n.y - n.radius, n.radius * 2, n.radius * 2);
      }
      ctx.globalCompositeOperation = "source-over";

      const cx = width * centerX;
      const cy = height * centerY;
      const maxRadius = Math.sqrt(width * width + height * height) * 0.95;

      // Dibujar cada estrella como un arco (trail)
      ctx.lineCap = "round";
      for (const star of trailStars) {
        const r = star.orbitRadius * maxRadius;

        // Arco: desde (angle - trailLength) hasta angle
        const startAngle = star.angle - star.trailLength;
        const endAngle = star.angle;

        // Brillo
        const distFactor = 1 - Math.min(1, r / maxRadius);
        const brightness = Math.min(1, star.brightness * (0.4 + distFactor * 0.4) * intensity * star.brightnessBoost);

        // Color con gradiente — más brillante en la punta (endAngle)
        const startX = cx + Math.cos(startAngle) * r;
        const startY = cy + Math.sin(startAngle) * r;
        const endX = cx + Math.cos(endAngle) * r;
        const endY = cy + Math.sin(endAngle) * r;

        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, `rgba(${star.color}, 0)`);
        grad.addColorStop(0.35, `rgba(${star.color}, ${(brightness * 0.25).toFixed(3)})`);
        grad.addColorStop(0.85, `rgba(${star.color}, ${(brightness * 0.85).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${star.color}, ${brightness.toFixed(3)})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = star.thickness;

        ctx.beginPath();
        // Dibujar el arco. ctx.arc(x, y, radius, startAngle, endAngle)
        // Necesitamos ir desde startAngle hasta endAngle en sentido correcto
        const clockwise = star.speed > 0;
        ctx.arc(cx, cy, r, startAngle, endAngle, !clockwise);
        ctx.stroke();

        // Punta brillante (la estrella)
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(${star.color}, ${(brightness * 0.9).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(endX, endY, star.thickness * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";

        // Avanzar el ángulo
        star.angle += star.speed;
      }
    };

    const draw = () => {
      if (variant === "deepfield") drawDeepField();
      else drawStarTrails();
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [variant, density, intensity, centerX, centerY]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
};

export default SpaceWarp;
