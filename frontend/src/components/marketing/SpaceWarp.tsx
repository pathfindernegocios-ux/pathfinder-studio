// src/components/marketing/SpaceWarp.tsx
// Deep Field realista con física óptica: profundidad, difracción, bloom y scintillation
import React, { useEffect, useRef } from "react";

interface SpaceWarpProps {
  density?: number;
  intensity?: number;
}

interface Star {
  x: number;
  y: number;
  z: number;            // profundidad: 0 = lejos, 1 = cerca
  radius: number;
  brightness: number;
  color: string;
  driftX: number;
  driftY: number;
  twinklePhase: number;
  twinkleSpeed: number;
  twinkleAmplitude: number;
  spikeAngle: number;   // rotación de los picos de difracción
  spikeLength: number;  // 0 si no tiene
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  hue: string;
  opacity: number;
}

const SpaceWarp: React.FC<SpaceWarpProps> = ({
  density = 1600,
  intensity = 1,
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

    // Paleta astrofísica real — tipos espectrales O B A F G K M
    const STAR_COLORS = [
      { rgb: "255, 255, 255", weight: 22 },   // A (blanco)
      { rgb: "202, 215, 255", weight: 18 },   // B (azul-blanco)
      { rgb: "170, 191, 255", weight: 12 },   // O (azul)
      { rgb: "248, 247, 255", weight: 14 },   // F (blanco puro)
      { rgb: "255, 244, 234", weight: 12 },   // G (amarillo-blanco, como el Sol)
      { rgb: "255, 210, 161", weight: 10 },   // K (naranja)
      { rgb: "255, 204, 111", weight: 5 },    // K intenso
      { rgb: "255, 150, 100", weight: 4 },    // M (rojo)
      { rgb: "255, 100, 80", weight: 2 },     // M intenso (gigante roja)
      { rgb: "240, 200, 255", weight: 1 },    // Estrella peculiar violácea
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

    let stars: Star[] = [];
    let nebulas: Nebula[] = [];

    const initStars = () => {
      stars = [];
      const count = Math.floor((density * width * height) / (1920 * 1080));

      for (let i = 0; i < count; i++) {
        // Profundidad (z): 0 = fondo, 1 = frente
        // Distribución: más estrellas lejos (profundidad real)
        const z = Math.pow(Math.random(), 0.7);

        // Tamaño inversamente proporcional a la distancia
        // Estrellas cercanas se ven más grandes
        const sizeRandom = Math.random();
        let baseRadius: number;
        if (sizeRandom < 0.72) {
          baseRadius = 0.25 + Math.random() * 0.35;   // puntitos (72%)
        } else if (sizeRandom < 0.94) {
          baseRadius = 0.6 + Math.random() * 0.8;     // medianas (22%)
        } else {
          baseRadius = 1.4 + Math.random() * 2.2;     // grandes y brillantes (6%)
        }

        const radius = baseRadius * (0.4 + z * 0.9);

        // Difracción: solo las estrellas grandes y brillantes tienen picos
        const hasSpikes = baseRadius > 1.4 && Math.random() < 0.7;

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          radius,
          brightness: (0.3 + Math.random() * 0.7) * (0.5 + z * 0.5),
          color: pickColor(),
          // Parallax: estrellas cercanas drift más rápido (por perspectiva)
          driftX: (Math.random() - 0.5) * 0.015 * (0.3 + z),
          driftY: (Math.random() - 0.5) * 0.015 * (0.3 + z),
          twinklePhase: Math.random() * Math.PI * 2,
          // Scintillation real: frecuencia irregular por estrella
          twinkleSpeed: 0.005 + Math.random() * 0.04,
          twinkleAmplitude: 0.08 + Math.random() * 0.22,
          spikeAngle: Math.random() * Math.PI,
          spikeLength: hasSpikes ? radius * (3.5 + Math.random() * 3) : 0,
        });
      }

      // Nebulosas
      nebulas = [];
      const nebulaHues = [
        "139, 92, 246",
        "100, 120, 220",
        "200, 100, 180",
        "80, 140, 180",
        "180, 120, 200",
      ];
      for (let i = 0; i < 7; i++) {
        nebulas.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 80 + Math.random() * 200,
          hue: nebulaHues[Math.floor(Math.random() * nebulaHues.length)],
          opacity: 0.03 + Math.random() * 0.05,
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
      initStars();
    };

    const drawDiffractionSpikes = (star: Star, brightness: number) => {
      if (star.spikeLength <= 0) return;
      const len = star.spikeLength;
      const angle = star.spikeAngle;

      // 4 picos (cross) rotados — como un telescopio reflector con soporte de 4 patas
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

      // Picos secundarios (más cortos, rotados 45°)
      for (let i = 0; i < 4; i++) {
        const a = angle + Math.PI / 4 + (Math.PI / 2) * i;
        const x2 = star.x + Math.cos(a) * len * 0.4;
        const y2 = star.y + Math.sin(a) * len * 0.4;

        const grad = ctx.createLinearGradient(star.x, star.y, x2, y2);
        grad.addColorStop(0, `rgba(${star.color}, ${(brightness * 0.25).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${star.color}, 0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(0.3, star.radius * 0.2);
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    const draw = () => {
      // Fondo
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Nebulosas (blobs difusos)
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

      // Estrellas
      for (const star of stars) {
        // Scintillation real: combinación de 2 frecuencias (parpadeo irregular)
        star.twinklePhase += star.twinkleSpeed;
        const twinkle1 = Math.sin(star.twinklePhase);
        const twinkle2 = Math.sin(star.twinklePhase * 2.3 + 1.7);
        const twinkleFactor =
          1 - star.twinkleAmplitude + (twinkle1 * 0.6 + twinkle2 * 0.4) * star.twinkleAmplitude;

        const finalBrightness = Math.min(1, star.brightness * twinkleFactor * intensity);

        // Bloom óptico — solo para estrellas grandes
        if (star.radius > 1.0) {
          ctx.globalCompositeOperation = "lighter";
          const bloomRadius = star.radius * 6;
          const bloom = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, bloomRadius
          );
          bloom.addColorStop(0, `rgba(${star.color}, ${(finalBrightness * 0.35).toFixed(3)})`);
          bloom.addColorStop(0.3, `rgba(${star.color}, ${(finalBrightness * 0.12).toFixed(3)})`);
          bloom.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = bloom;
          ctx.beginPath();
          ctx.arc(star.x, star.y, bloomRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }

        // Difracción (solo estrellas grandes)
        if (star.spikeLength > 0) {
          drawDiffractionSpikes(star, finalBrightness);
        }

        // Núcleo de la estrella (3 capas para efecto de punto brillante)
        // Capa 1: halo exterior
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(${star.color}, ${(finalBrightness * 0.25).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Capa 2: núcleo medio
        ctx.fillStyle = `rgba(${star.color}, ${(finalBrightness * 0.6).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Capa 3: núcleo brillante (blanco si es muy brillante)
        const coreColor = finalBrightness > 0.75 ? "255, 255, 255" : star.color;
        ctx.fillStyle = `rgba(${coreColor}, ${finalBrightness.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";

        // Drift con parallax
        star.x += star.driftX;
        star.y += star.driftY;

        // Wrap
        if (star.x < -10) star.x = width + 10;
        if (star.x > width + 10) star.x = -10;
        if (star.y < -10) star.y = height + 10;
        if (star.y > height + 10) star.y = -10;
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density, intensity]);

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
