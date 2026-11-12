import React, { useEffect, useRef } from 'react';

export type ConfettiIntensity = 'hero' | 'cart' | 'order';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  tiltAngle: number;
  tiltSpeed: number;
  shape: 'rect' | 'circle' | 'ribbon' | 'diamond';
  opacity: number;
  life: number;
  maxLife: number;
}

const FESTIVE_COLORS = [
  '#FFC700', // luminous gold
  '#FF9900', // saffron orange
  '#FF7A00', // deep saffron
  '#FFE066', // pale champagne gold
  '#FFFFFF', // crisp white
  '#FF3B6B', // festive magenta-rose
  '#10B981', // emerald
  '#0EA5E9', // turquoise
  '#E9CEE6', // soft lavender
];

export function triggerFestiveConfetti(intensity: ConfettiIntensity = 'hero'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<{ intensity: ConfettiIntensity }>('zariya:confetti', {
      detail: { intensity },
    })
  );
}

export const FestiveConfetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createParticle = (
      originX: number,
      originY: number,
      spreadAngle: number,
      baseSpeed: number,
      maxLife: number
    ): ConfettiParticle => {
      const angle = spreadAngle + (Math.random() - 0.5) * 1.1;
      const speed = baseSpeed * (0.45 + Math.random() * 0.75);
      const shapes: ConfettiParticle['shape'][] = ['rect', 'ribbon', 'diamond', 'circle'];
      return {
        x: originX + (Math.random() - 0.5) * 40,
        y: originY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 5 + Math.random() * 6,
        color: FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.16,
        tiltAngle: Math.random() * Math.PI,
        tiltSpeed: 0.08 + Math.random() * 0.08,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        opacity: 1,
        life: 0,
        maxLife,
      };
    };

    const spawnBurst = (intensity: ConfettiIntensity) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const next: ConfettiParticle[] = [];

      if (intensity === 'cart') {
        // Crisp celebratory burst near top-right cart & center
        const count = 48;
        for (let i = 0; i < count; i++) {
          next.push(
            createParticle(w * 0.85, 76, Math.PI * 0.65, 11, 125 + Math.random() * 45)
          );
        }
      } else if (intensity === 'order') {
        // Grand dual-cannon + top shower celebration for completed order
        const sideCount = 65;
        for (let i = 0; i < sideCount; i++) {
          next.push(
            createParticle(w * 0.12, h * 0.65, -Math.PI * 0.32, 16, 175 + Math.random() * 55)
          );
          next.push(
            createParticle(w * 0.88, h * 0.65, -Math.PI * 0.68, 16, 175 + Math.random() * 55)
          );
        }
        for (let i = 0; i < 45; i++) {
          next.push(
            createParticle(
              w * (0.2 + Math.random() * 0.6),
              -10,
              Math.PI * 0.5,
              7,
              185 + Math.random() * 50
            )
          );
        }
      } else {
        // 'hero': Festive corner + top canopy shower matching the sale poster
        const cornerCount = 45;
        for (let i = 0; i < cornerCount; i++) {
          next.push(
            createParticle(w * 0.08, 110, Math.PI * 0.2, 13, 155 + Math.random() * 50)
          );
          next.push(
            createParticle(w * 0.92, 110, Math.PI * 0.8, 13, 155 + Math.random() * 50)
          );
        }
        for (let i = 0; i < 36; i++) {
          next.push(
            createParticle(
              w * (0.15 + Math.random() * 0.7),
              -12,
              Math.PI * 0.5,
              6.5,
              165 + Math.random() * 55
            )
          );
        }
      }

      // Cap active particles so performance remains 60fps even on rapid clicks
      particlesRef.current = [...particlesRef.current.slice(-260), ...next];
      startLoop();
    };

    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const remaining: ConfettiParticle[] = [];
      for (const p of particlesRef.current) {
        p.life += 1;
        p.vy += 0.22; // gentle gravity
        p.vx *= 0.985; // air drag
        p.vy *= 0.99;
        p.x += p.vx + Math.sin(p.life * 0.08 + p.tiltAngle) * 0.65;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.tiltAngle += p.tiltSpeed;

        const fadeStart = p.maxLife * 0.72;
        if (p.life > fadeStart) {
          p.opacity = Math.max(0, 1 - (p.life - fadeStart) / (p.maxLife - fadeStart));
        }

        if (p.life < p.maxLife && p.y < h + 40 && p.opacity > 0.02) {
          remaining.push(p);

          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          const scaleY = Math.cos(p.tiltAngle);
          ctx.scale(1, Math.abs(scaleY) < 0.2 ? 0.2 : scaleY);
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.62);
          } else if (p.shape === 'ribbon') {
            ctx.fillRect(-p.size * 0.7, -2, p.size * 1.4, 3.6);
          } else if (p.shape === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(0, -p.size * 0.55);
            ctx.lineTo(p.size * 0.55, 0);
            ctx.lineTo(0, p.size * 0.55);
            ctx.lineTo(-p.size * 0.55, 0);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.34, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      particlesRef.current = remaining;
      if (remaining.length > 0) {
        rafIdRef.current = window.requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
        ctx.clearRect(0, 0, w, h);
      }
    };

    const startLoop = () => {
      if (rafIdRef.current === null) {
        rafIdRef.current = window.requestAnimationFrame(tick);
      }
    };

    const onConfettiEvent = (e: Event) => {
      const custom = e as CustomEvent<{ intensity?: ConfettiIntensity }>;
      spawnBurst(custom.detail?.intensity || 'hero');
    };

    window.addEventListener('zariya:confetti', onConfettiEvent);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('zariya:confetti', onConfettiEvent);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="festive-confetti-canvas"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
};
