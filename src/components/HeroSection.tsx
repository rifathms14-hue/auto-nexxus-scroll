"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 193;
const FRAME_PATH = (i: number) =>
  `/frames/frame_${String(i).padStart(4, "0")}.jpg`;

// ─── Scroll progress windows (6 scroll units across 500% total) ─────────────
// 1 unit ≈ 16.67% of total progress
//
// Set 1 (top-left):  reveal scroll 1 → fade scroll 3
// Set 2 (bottom-right): reveal scroll 4 → fade scroll 6

const TEXT_WINDOWS = {
  set1: { revealS: 0.02, revealE: 0.14, fadeS: 0.38, fadeE: 0.50 },
  set2: { revealS: 0.54, revealE: 0.66, fadeS: 0.88, fadeE: 0.98 },
} as const;

// ─── Orange accent colour ─────────────────────────────────────────────────────
const ORANGE = "hsla(24, 100%, 50%, 1)";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const frameRef   = useRef({ current: 0 });
  const imagesRef  = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);

  // ── Text set 1 refs ──────────────────────────────────────────
  const s1Eyebrow = useRef<HTMLParagraphElement>(null);
  const s1Heading = useRef<HTMLHeadingElement>(null);
  const s1Body    = useRef<HTMLParagraphElement>(null);

  // ── Text set 2 refs ──────────────────────────────────────────
  const s2Eyebrow = useRef<HTMLParagraphElement>(null);
  const s2Heading = useRef<HTMLHeadingElement>(null);
  const s2Body    = useRef<HTMLParagraphElement>(null);

  // ── Draw frame to canvas ──────────────────────────────────────
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const img    = imagesRef.current[index];
    if (!canvas || !img?.complete) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#030304";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  // ── Preload all frames ────────────────────────────────────────
  useEffect(() => {
    imagesRef.current = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
      const img = new Image();
      img.src = FRAME_PATH(i + 1);
      img.onload = () => {
        setLoadedCount((c) => {
          if (i === 0) drawFrame(0);
          return c + 1;
        });
      };
      return img;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Size canvas: full-width on mobile, 52vw on desktop ──────────
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const isMobile = window.innerWidth < 768;
      const w = isMobile
        ? window.innerWidth
        : Math.round(window.innerWidth * 0.52);
      const h = Math.round(w * (720 / 1280));
      canvas.width  = w;
      canvas.height = h;
      drawFrame(frameRef.current.current);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── GSAP ScrollTrigger ────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=500%",          // 6 scroll units
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;

          // ── Frame scrubbing ─────────────────────────────────
          const target = Math.min(
            Math.floor(p * (TOTAL_FRAMES - 1)),
            TOTAL_FRAMES - 1
          );
          if (target !== frameRef.current.current) {
            frameRef.current.current = target;
            drawFrame(target);
          }

          // ── Text set 1 ──────────────────────────────────────
          applyBlurTransition(s1Eyebrow.current, p, TEXT_WINDOWS.set1, 0);
          applyBlurTransition(s1Heading.current, p, TEXT_WINDOWS.set1, 1);
          applyBlurTransition(s1Body.current,    p, TEXT_WINDOWS.set1, 2);

          // ── Text set 2 ──────────────────────────────────────
          applyBlurTransition(s2Eyebrow.current, p, TEXT_WINDOWS.set2, 0);
          applyBlurTransition(s2Heading.current, p, TEXT_WINDOWS.set2, 1);
          applyBlurTransition(s2Body.current,    p, TEXT_WINDOWS.set2, 2);
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden bg-[#030304]"
    >
      {/* ── Loading bar ─────────────────────────────────────── */}
      {loadedCount < TOTAL_FRAMES && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#030304]">
          <div className="w-48 h-px bg-white/10 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-white/30 transition-all duration-75"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] tracking-[0.2em] text-white/20 uppercase">
            {pct}%
          </span>
        </div>
      )}

      {/* ── Canvas — centered, 52vw, hard-light ─────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        style={{ mixBlendMode: "hard-light" }}
      />

      {/* ── Film grain ──────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-20 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "160px 160px",
        }}
      />

      {/* ══════════════════════════════════════════════════════
          TEXT SET 1 — top-left
          Appears: scroll 1 | Disappears: scroll 3
      ══════════════════════════════════════════════════════ */}
      <div className="absolute top-12 md:top-[160px] left-12 md:left-[200px] z-30 max-w-[280px] md:max-w-[340px] flex flex-col gap-3 pointer-events-none select-none">
        <p
          ref={s1Eyebrow}
          className="text-[18px] md:text-[24px] font-medium leading-[1.2] uppercase md:normal-case"
          style={{
            fontFamily: "var(--font-blender), sans-serif",
            color: ORANGE,
            opacity: 0,
            filter: "blur(20px)",
            willChange: "opacity, filter, transform",
          }}
        >
          Precision, Layer by Layer
        </p>

        <h2
          ref={s1Heading}
          className="text-[24px] md:text-[36px] font-[800] leading-[1.1]"
          style={{
            fontFamily: "var(--font-blender), sans-serif",
            color: "hsla(0, 0%, 100%, 0.92)",
            opacity: 0,
            filter: "blur(20px)",
            willChange: "opacity, filter, transform",
          }}
        >
          Every component inside the RC&nbsp;390 engine exists for a reason.
        </h2>

        <p
          ref={s1Body}
          className="hidden"
          style={{ opacity: 0 }}
        >
          From forged internals to friction-optimized engineering, performance
          here isn&apos;t added later — it&apos;s built into the foundation from
          the very first movement.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          TEXT SET 2 — bottom-right
          Appears: scroll 4 | Disappears: scroll 6
      ══════════════════════════════════════════════════════ */}
      <div className="absolute bottom-12 md:bottom-[160px] right-12 md:right-[200px] z-30 max-w-[280px] md:max-w-[340px] flex flex-col gap-3 pointer-events-none select-none">
        <p
          ref={s2Eyebrow}
          className="text-[18px] md:text-[24px] font-medium leading-[1.2] uppercase md:normal-case"
          style={{
            fontFamily: "var(--font-blender), sans-serif",
            color: ORANGE,
            opacity: 0,
            filter: "blur(20px)",
            willChange: "opacity, filter, transform",
          }}
        >
          Engineered to Stay Aggressive
        </p>

        <h2
          ref={s2Heading}
          className="text-[24px] md:text-[36px] font-[800] leading-[1.1]"
          style={{
            fontFamily: "var(--font-blender), sans-serif",
            color: "hsla(0, 0%, 100%, 0.92)",
            opacity: 0,
            filter: "blur(20px)",
            willChange: "opacity, filter, transform",
          }}
        >
          Lightweight architecture.&nbsp;High&#8209;revving response.
        </h2>

        <p
          ref={s2Body}
          className="hidden"
          style={{ opacity: 0 }}
        >
          Race-bred precision tuned for the street.
          <br />
          This isn&apos;t just an engine being assembled. It&apos;s performance
          being engineered in real time.
        </p>
      </div>

      {/* ── Scroll hint ──────────────────────────────────────── */}
      <div className="hidden absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none">
        <span
          style={{ fontFamily: "var(--font-blender), sans-serif", fontWeight: 300 }}
          className="text-[9px] tracking-[0.25em] text-white/25 uppercase"
        >
          Scroll
        </span>
        <div className="w-px h-7 bg-white/15 animate-pulse" />
      </div>
    </section>
  );
}

// ─── Blur transition helper ────────────────────────────────────────────────────
// Drives opacity, blur, and a subtle Y shift purely from scroll progress.
// staggerIndex staggers each element slightly so they don't reveal in unison.

function applyBlurTransition(
  el: HTMLElement | null,
  p: number,
  window: { revealS: number; revealE: number; fadeS: number; fadeE: number },
  staggerIndex: number
) {
  if (!el) return;

  const lag = staggerIndex * 0.018; // stagger per element

  const revealT = smoothStep(window.revealS + lag, window.revealE + lag, p);
  const fadeT   = smoothStep(window.fadeS,          window.fadeE,          p);

  // Opacity: ramp up on reveal, ramp down on fade
  const opacity = revealT * (1 - fadeT);

  // Blur: 20px → 0 on reveal, 0 → 20px on fade
  const blur = lerp(20, 0, revealT) + lerp(0, 20, fadeT);

  // Subtle vertical shift: lifts in on reveal, drifts up slightly on fade
  const yIn  = lerp(14, 0, revealT);
  const yOut = lerp(0, -8, fadeT);
  const y    = yIn + yOut;

  el.style.opacity   = String(Math.max(0, Math.min(1, opacity)));
  el.style.filter    = `blur(${blur.toFixed(2)}px)`;
  el.style.transform = `translateY(${y.toFixed(2)}px)`;
}

// ─── Math utils ───────────────────────────────────────────────────────────────
function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
