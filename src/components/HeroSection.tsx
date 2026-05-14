"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 193;
const FRAME_PATH = (i: number) =>
  `/frames/frame_${String(i).padStart(4, "0")}.jpg`;

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef({ current: 0 });
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const isReadyRef = useRef(false);

  // --- Text refs ---
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const sublineRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);

  // --- Draw a specific frame index to canvas ---
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  // --- Preload all frames ---
  useEffect(() => {
    imagesRef.current = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
      const img = new Image();
      img.src = FRAME_PATH(i + 1);
      img.onload = () => {
        setLoadedCount((c) => {
          const next = c + 1;
          // Draw the first frame as soon as it's ready
          if (i === 0) drawFrame(0);
          if (next >= TOTAL_FRAMES) isReadyRef.current = true;
          return next;
        });
      };
      return img;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Size canvas to 52% of viewport, centered, aspect-locked ---
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const vw = window.innerWidth;
      const w = Math.round(vw * 0.52);
      const h = Math.round(w * (720 / 1280)); // native 16:9 ratio
      canvas.width = w;
      canvas.height = h;
      // Redraw current frame after resize
      drawFrame(frameRef.current.current);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- GSAP ScrollTrigger: scrub frame index + text ---
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Proxy object that GSAP will tween
      const proxy = { frame: 0 };

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=280%",
        scrub: 0.5,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const targetFrame = Math.min(
            Math.floor(progress * (TOTAL_FRAMES - 1)),
            TOTAL_FRAMES - 1
          );

          if (targetFrame !== frameRef.current.current) {
            frameRef.current.current = targetFrame;
            drawFrame(targetFrame);
          }

          // Text visibility based on progress
          const eRef = eyebrowRef.current;
          const hRef = headlineRef.current;
          const sRef = sublineRef.current;
          const scRef = scanRef.current;

          if (eRef && hRef && sRef && scRef) {
            // Eyebrow: fade in 5%→15%, hold, fade out 70%→80%
            const eyeIn = smoothStep(0.05, 0.15, progress);
            const eyeOut = 1 - smoothStep(0.70, 0.80, progress);
            eRef.style.opacity = String(Math.min(eyeIn, eyeOut));

            // Headline: fade in 10%→22%, fade out 72%→83%
            const headIn = smoothStep(0.10, 0.22, progress);
            const headOut = 1 - smoothStep(0.72, 0.83, progress);
            hRef.style.opacity = String(Math.min(headIn, headOut));
            hRef.style.transform = `translateY(${lerp(24, 0, Math.min(headIn, 1))}px)`;

            // Scan + subline: fade in 25%→38%, fade out 74%→85%
            const subIn = smoothStep(0.25, 0.38, progress);
            const subOut = 1 - smoothStep(0.74, 0.85, progress);
            const subAlpha = Math.min(subIn, subOut);
            scRef.style.transform = `scaleX(${Math.min(subIn, 1)})`;
            scRef.style.opacity = String(subAlpha);
            sRef.style.opacity = String(subAlpha);
          }
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden bg-[#030304] flex items-center justify-center"
    >
      {/* Loading bar */}
      {loadedCount < TOTAL_FRAMES && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#030304]">
          <div className="w-48 h-px bg-white/10 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-white/40 transition-all duration-100"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] tracking-[0.2em] text-white/20 uppercase">
            {pct}%
          </span>
        </div>
      )}

      {/* Canvas — centered, mix-blend-mode: hard-light, 52% viewport width */}
      <canvas
        ref={canvasRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ mixBlendMode: "hard-light" }}
      />

      {/* Grain overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "160px 160px",
        }}
      />

      {/* Text layer */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center pointer-events-none select-none px-6">
        {/* Eyebrow */}
        <div
          ref={eyebrowRef}
          style={{ opacity: 0 }}
          className="mb-6 text-[10px] font-light tracking-[0.25em] text-white/40 uppercase"
        >
          Auto Nexxus &nbsp;·&nbsp; GMS Platform
        </div>

        {/* Headline */}
        <div
          ref={headlineRef}
          style={{ opacity: 0, transform: "translateY(24px)" }}
        >
          <h1 className="text-[clamp(2.2rem,5.5vw,5.5rem)] font-extralight leading-[1.06] tracking-[-0.02em] text-white/90">
            Built for every
            <br />
            <span className="font-semibold text-white">garage in motion.</span>
          </h1>
        </div>

        {/* Scanline */}
        <div
          ref={scanRef}
          style={{ opacity: 0, transform: "scaleX(0)", transformOrigin: "left" }}
          className="my-7 w-20 h-px bg-white/20"
        />

        {/* Subline */}
        <div ref={sublineRef} style={{ opacity: 0 }} className="max-w-xs">
          <p className="text-[12px] font-light leading-relaxed text-white/35 tracking-wide">
            Service management, vehicle tracking, and technician ops —
            unified in one cloud platform.
          </p>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <span className="text-[9px] tracking-[0.25em] text-white/30 uppercase">Scroll</span>
        <div className="w-px h-7 bg-white/20 animate-pulse" />
      </div>
    </section>
  );
}

// --- Utility ---
function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}
