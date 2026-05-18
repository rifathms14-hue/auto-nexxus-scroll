"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 193;
const FRAME_PATH        = (i: number) => `/frames/frame_${String(i).padStart(4, "0")}.jpg`;
const FRAME_PATH_MOBILE = (i: number) => `/frames-mobile/frame_${String(i).padStart(4, "0")}.jpg`;

const TEXT_WINDOWS = {
  set1: { revealS: 0.02, revealE: 0.14, fadeS: 0.38, fadeE: 0.50 },
  set2: { revealS: 0.54, revealE: 0.66, fadeS: 0.88, fadeE: 0.98 },
} as const;

const ORANGE = "hsla(24, 100%, 50%, 1)";

export default function HeroSection() {
  // ── Canvas / frame refs ───────────────────────────────────
  const engineRef      = useRef<HTMLElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const frameRef       = useRef({ current: 0 });
  const imagesRef      = useRef<HTMLImageElement[]>([]);

  // ── Loading state ─────────────────────────────────────────
  const [loadedCount, setLoadedCount]   = useState(0);
  const [minDelayDone, setMinDelayDone] = useState(false);
  const loadingDone = loadedCount >= TOTAL_FRAMES && minDelayDone;

  // ── Hero text: appears 4 s after loader clears ────────────
  const [heroTextVisible, setHeroTextVisible] = useState(false);

  // ── Text set 1 refs ───────────────────────────────────────
  const s1Eyebrow = useRef<HTMLParagraphElement>(null);
  const s1Heading = useRef<HTMLHeadingElement>(null);
  const s1Body    = useRef<HTMLParagraphElement>(null);

  // ── Text set 2 refs ───────────────────────────────────────
  const s2Eyebrow = useRef<HTMLParagraphElement>(null);
  const s2Heading = useRef<HTMLHeadingElement>(null);
  const s2Body    = useRef<HTMLParagraphElement>(null);

  // ── Draw frame to canvas ──────────────────────────────────
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

  // ── 2-second minimum loading hold ────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // ── Reveal hero text 4 s after loader clears ─────────────
  useEffect(() => {
    if (!loadingDone) return;
    const t = setTimeout(() => setHeroTextVisible(true), 4000);
    return () => clearTimeout(t);
  }, [loadingDone]);

  // ── Preload all frames (mobile or desktop set) ───────────
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const path = isMobile ? FRAME_PATH_MOBILE : FRAME_PATH;
    imagesRef.current = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
      const img = new Image();
      img.src = path(i + 1);
      img.onload = () => {
        setLoadedCount((c) => {
          if (i === 0) drawFrame(0);
          return c + 1;
        });
      };
      return img;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Size canvas: 80vw portrait on mobile, 42vw landscape on desktop ──
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const isMobile = window.innerWidth < 768;
      let w: number, h: number;
      if (isMobile) {
        w = Math.round(window.innerWidth * 0.80);
        h = Math.round(w * (960 / 540)); // portrait 9:16
      } else {
        w = Math.round(window.innerWidth * 0.42);
        h = Math.round(w * (720 / 1280)); // landscape 16:9
      }
      canvas.width  = w;
      canvas.height = h;
      drawFrame(frameRef.current.current);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── GSAP ScrollTrigger ────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: engineRef.current,
        start: "top top",
        end: "+=500%",
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;

          // ── Desktop: canvas frame scrub ─────────────────────
          const target = Math.min(
            Math.floor(p * (TOTAL_FRAMES - 1)),
            TOTAL_FRAMES - 1
          );
          if (target !== frameRef.current.current) {
            frameRef.current.current = target;
            drawFrame(target);
          }

          applyBlurTransition(s1Eyebrow.current, p, TEXT_WINDOWS.set1, 0);
          applyBlurTransition(s1Heading.current, p, TEXT_WINDOWS.set1, 1);
          applyBlurTransition(s1Body.current,    p, TEXT_WINDOWS.set1, 2);

          applyBlurTransition(s2Eyebrow.current, p, TEXT_WINDOWS.set2, 0);
          applyBlurTransition(s2Heading.current, p, TEXT_WINDOWS.set2, 1);
          applyBlurTransition(s2Body.current,    p, TEXT_WINDOWS.set2, 2);
        },
      });
    }, engineRef);

    return () => ctx.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          FIXED LOADING OVERLAY — sits above both sections
      ════════════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 z-[100] bg-[#030304] transition-opacity duration-700"
        style={{
          opacity: loadingDone ? 0 : 1,
          pointerEvents: loadingDone ? "none" : "auto",
        }}
      >
        {/* Mobile */}
        <video
          className="block md:hidden w-full h-full object-cover"
          autoPlay loop muted playsInline
        >
          <source src="/loading-mobile.mp4" type="video/mp4" />
        </video>
        {/* Desktop */}
        <video
          className="hidden md:block w-full h-full object-cover"
          autoPlay loop muted playsInline
        >
          <source src="/loading-desktop.mp4" type="video/mp4" />
        </video>
      </div>

      {/* ════════════════════════════════════════════════════════
          SECTION 1 — Banner video hero
      ════════════════════════════════════════════════════════ */}
      <section className="relative w-full h-screen overflow-hidden bg-[#030304]">

        {/* ── Video — plays once, holds last frame ─────────── */}
        {/* Mobile */}
        <video
          className="block md:hidden absolute inset-0 w-full h-full object-cover"
          autoPlay muted playsInline
        >
          <source src="/banner-mobile.mp4" type="video/mp4" />
        </video>
        {/* Desktop */}
        <video
          className="hidden md:block absolute inset-0 w-full h-full object-cover"
          autoPlay muted playsInline
        >
          <source src="/banner-desktop.mp4" type="video/mp4" />
        </video>

        {/* ── Dark gradient scrim so text reads cleanly ─────── */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#030304]/80 via-transparent to-transparent" />

        {/* ── Text + CTA ───────────────────────────────────── */}
        <div
          className="absolute z-20 bottom-[140px] md:bottom-[160px] left-8 md:left-[200px] flex flex-col gap-4 max-w-[320px] md:max-w-[520px] select-none transition-all duration-1000"
          style={{ opacity: heroTextVisible ? 1 : 0, transform: heroTextVisible ? "translateY(0px)" : "translateY(16px)" }}
        >
          <p
            className="text-[11px] md:text-[13px] font-medium tracking-[0.25em] uppercase"
            style={{ fontFamily: "var(--font-blender), sans-serif", color: ORANGE }}
          >
            KTM RC 390
          </p>

          <h1
            className="text-[36px] md:text-[64px] font-[800] leading-[1.05]"
            style={{ fontFamily: "var(--font-blender), sans-serif", color: "hsla(0,0%,100%,0.95)" }}
          >
            Born on the Track.
          </h1>

          <p
            className="text-[14px] md:text-[17px] font-light leading-[1.6]"
            style={{ fontFamily: "var(--font-blender), sans-serif", color: "hsla(0,0%,100%,0.55)" }}
          >
            Precision-engineered performance, built layer by layer for those who demand more from every ride.
          </p>

          <button
            className="mt-2 self-start flex items-center gap-3 px-7 py-3 text-[13px] md:text-[14px] font-medium tracking-[0.15em] uppercase transition-all duration-300 hover:gap-5"
            style={{
              fontFamily: "var(--font-blender), sans-serif",
              color: "#030304",
              background: ORANGE,
              letterSpacing: "0.15em",
            }}
          >
            Explore
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M1 5h12M8 1l5 4-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* ── Carousel indicator ────────────────────────────── */}
        <div
          className="absolute z-20 bottom-[60px] md:bottom-[72px] left-8 md:left-[200px] flex items-center gap-2 transition-all duration-1000 delay-200"
          style={{ opacity: heroTextVisible ? 1 : 0, transform: heroTextVisible ? "translateY(0px)" : "translateY(16px)" }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-px transition-all duration-300"
              style={{
                width: i === 0 ? "40px" : "20px",
                background: i === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
          <span
            className="ml-3 text-[10px] tracking-[0.2em] uppercase"
            style={{ fontFamily: "var(--font-blender), sans-serif", color: "rgba(255,255,255,0.3)" }}
          >
            01 / 03
          </span>
        </div>

      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 2 — Engine scroll animation
      ════════════════════════════════════════════════════════ */}
      <section
        ref={engineRef}
        className="relative w-full h-screen overflow-hidden bg-[#030304]"
      >
        {/* ── Canvas (mobile: 80vw portrait | desktop: 42vw landscape) ── */}
        <canvas
          ref={canvasRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ mixBlendMode: "hard-light" }}
        />

        {/* ── Film grain ───────────────────────────────────────── */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none z-20 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "160px 160px",
          }}
        />

        {/* ══ TEXT SET 1 — top-left ═══════════════════════════ */}
        <div className="absolute top-12 md:top-[160px] left-12 md:left-[200px] z-30 max-w-[280px] md:max-w-[340px] flex flex-col gap-3 pointer-events-none select-none">
          <p
            ref={s1Eyebrow}
            className="text-[18px] md:text-[24px] font-medium leading-[1.2] uppercase md:normal-case"
            style={{ fontFamily: "var(--font-blender), sans-serif", color: ORANGE, opacity: 0, filter: "blur(20px)", willChange: "opacity, filter, transform" }}
          >
            Precision, Layer by Layer
          </p>
          <h2
            ref={s1Heading}
            className="text-[24px] md:text-[36px] font-[800] leading-[1.1]"
            style={{ fontFamily: "var(--font-blender), sans-serif", color: "hsla(0,0%,100%,0.92)", opacity: 0, filter: "blur(20px)", willChange: "opacity, filter, transform" }}
          >
            Every component inside the RC&nbsp;390 engine exists for a reason.
          </h2>
          <p ref={s1Body} className="hidden" style={{ opacity: 0 }}>
            From forged internals to friction-optimized engineering, performance
            here isn&apos;t added later — it&apos;s built into the foundation from
            the very first movement.
          </p>
        </div>

        {/* ══ TEXT SET 2 — bottom-right ════════════════════════ */}
        <div className="absolute bottom-12 md:bottom-[160px] right-12 md:right-[200px] z-30 max-w-[280px] md:max-w-[340px] flex flex-col gap-3 pointer-events-none select-none">
          <p
            ref={s2Eyebrow}
            className="text-[18px] md:text-[24px] font-medium leading-[1.2] uppercase md:normal-case"
            style={{ fontFamily: "var(--font-blender), sans-serif", color: ORANGE, opacity: 0, filter: "blur(20px)", willChange: "opacity, filter, transform" }}
          >
            Engineered to Stay Aggressive
          </p>
          <h2
            ref={s2Heading}
            className="text-[24px] md:text-[36px] font-[800] leading-[1.1]"
            style={{ fontFamily: "var(--font-blender), sans-serif", color: "hsla(0,0%,100%,0.92)", opacity: 0, filter: "blur(20px)", willChange: "opacity, filter, transform" }}
          >
            Lightweight architecture.&nbsp;High&#8209;revving response.
          </h2>
          <p ref={s2Body} className="hidden" style={{ opacity: 0 }}>
            Race-bred precision tuned for the street.
            <br />
            This isn&apos;t just an engine being assembled. It&apos;s performance
            being engineered in real time.
          </p>
        </div>
      </section>
    </>
  );
}

// ─── Blur transition helper ───────────────────────────────────────────────────
function applyBlurTransition(
  el: HTMLElement | null,
  p: number,
  window: { revealS: number; revealE: number; fadeS: number; fadeE: number },
  staggerIndex: number
) {
  if (!el) return;
  const lag    = staggerIndex * 0.018;
  const revealT = smoothStep(window.revealS + lag, window.revealE + lag, p);
  const fadeT   = smoothStep(window.fadeS, window.fadeE, p);
  const opacity = revealT * (1 - fadeT);
  const blur    = lerp(20, 0, revealT) + lerp(0, 20, fadeT);
  const y       = lerp(14, 0, revealT) + lerp(0, -8, fadeT);
  el.style.opacity   = String(Math.max(0, Math.min(1, opacity)));
  el.style.filter    = `blur(${blur.toFixed(2)}px)`;
  el.style.transform = `translateY(${y.toFixed(2)}px)`;
}

function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
