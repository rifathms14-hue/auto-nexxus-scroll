"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import NextImage from "next/image";
import PixelCard, { type PixelCardHandle } from "./PixelCard";
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

const PEOPLE_CARDS = [
  { img: "/people/Images.png",   name: "Nilesh Dhumal",   expertise: "Track Performance & Riding Dynamics"  },
  { img: "/people/Images-1.png", name: "Ouseph Chacko",   expertise: "Advanced Road Riding Techniques"      },
  { img: "/people/Images-2.png", name: "Rish John George",expertise: "Race-Bred Skill Development"          },
  { img: "/people/Images-3.png", name: "Vijendra Nilahri", expertise: "Off-Road & Dirt Track Mastery"       },
  { img: "/people/Images-4.png", name: "Varad More",       expertise: "Technical Precision & Control"       },
  { img: "/people/Images-5.png", name: "Emmanuel Jebaraj", expertise: "High-Speed Circuit Training"         },
  { img: "/people/Images-6.png", name: "Sangram Patil",    expertise: "Urban Performance Riding"            },
  // 8th card — duplicate of Nilesh Dhumal for grid consistency
  { img: "/people/Images.png",   name: "Nilesh Dhumal",   expertise: "Track Performance & Riding Dynamics"  },
];

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

  // ── People-card flip state ────────────────────────────────
  const [flipped, setFlipped]   = useState<boolean[]>(Array(8).fill(false));
  const pixelRefs               = useRef<(PixelCardHandle | null)[]>([]);
  const animating               = useRef<Set<number>>(new Set());
  const FLIP_MS                 = 680; // ms — pixel-peak timing

  const handleCardClick = useCallback((i: number) => {
    if (animating.current.has(i)) return;
    const pRef = pixelRefs.current[i];
    if (!pRef) return;

    animating.current.add(i);
    pRef.appear();                                    // phase 1: pixels cover

    setTimeout(() => {
      setFlipped(prev => {                            // phase 2: swap face
        const next = [...prev];
        next[i] = !next[i];
        return next;
      });
      pRef.disappear();                               // phase 3: pixels reveal

      setTimeout(() => animating.current.delete(i), FLIP_MS);
    }, FLIP_MS);
  }, []);

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
      <section data-nav-theme="dark" className="relative w-full h-screen overflow-hidden bg-[#030304]">

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
          className="absolute z-20 bottom-[140px] md:bottom-[160px] flex flex-col gap-4 select-none transition-all duration-1000"
          style={{
            left: "20px",
            right: "20px",
            opacity: heroTextVisible ? 1 : 0,
            transform: heroTextVisible ? "translateY(0px)" : "translateY(16px)",
          }}
        >
          <h1
            className="font-[800] leading-[1.05] break-words"
            style={{
              fontFamily: "var(--font-blender), sans-serif",
              color: "hsla(0,0%,100%,0.95)",
              fontSize: "clamp(40px, 9.5vw, 96px)",
            }}
          >
            Born on the Track.
          </h1>

          <p
            className="font-light leading-[1.6] max-w-[480px]"
            style={{
              fontFamily: "var(--font-blender), sans-serif",
              color: "hsla(0,0%,100%,0.55)",
              fontSize: "18px",
            }}
          >
            Precision-engineered performance, built layer by layer for those who demand more from every ride.
          </p>

          <button
            className="mt-2 self-start flex items-center gap-3 px-7 text-[14px] font-medium tracking-[0.15em] uppercase transition-all duration-300 hover:gap-5"
            style={{
              fontFamily: "var(--font-blender), sans-serif",
              color: "#030304",
              background: ORANGE,
              letterSpacing: "0.15em",
              height: "56px",
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
          className="absolute z-20 bottom-[60px] md:bottom-[72px] flex items-center gap-2 transition-all duration-1000 delay-200"
          style={{ left: "20px", opacity: heroTextVisible ? 1 : 0, transform: heroTextVisible ? "translateY(0px)" : "translateY(16px)" }}
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
        </div>

      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 2 — Engine scroll animation
      ════════════════════════════════════════════════════════ */}
      <section
        ref={engineRef}
        data-nav-theme="dark"
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
            className="text-[16px] font-medium leading-[1.2] uppercase tracking-[0.2em]"
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
            className="text-[16px] font-medium leading-[1.2] uppercase tracking-[0.2em]"
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

      {/* ════════════════════════════════════════════════════════
          SECTION 3 — People grid (2 rows × 4 columns)
      ════════════════════════════════════════════════════════ */}
      <section data-nav-theme="dark" className="w-full bg-[#030304] px-[20px] py-16 md:py-24">

        {/* Section heading — centred */}
        <div className="mb-10 md:mb-14 flex flex-col items-center gap-2 text-center">
          <p
            className="text-[16px] font-medium tracking-[0.2em] uppercase"
            style={{ fontFamily: "var(--font-blender), sans-serif", color: ORANGE }}
          >
            Our Experts
          </p>
          <h2
            className="font-[800] leading-[1.05]"
            style={{
              fontFamily: "var(--font-blender), sans-serif",
              color: "hsla(0,0%,100%,0.92)",
              fontSize: "clamp(28px, 5vw, 56px)",
            }}
          >
            The Expertise That Trains You for More.
          </h2>
        </div>

        {/* 2 × 4 grid — 16 px gap mobile, 28 px desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-7">
          {PEOPLE_CARDS.map((person, i) => (
            /* ── Gradient border + click wrapper ─────────────────── */
            <div
              key={i}
              className="group cursor-pointer"
              style={{ background: "linear-gradient(150deg, #666 0%, #000 100%)", padding: "1px" }}
              onClick={() => handleCardClick(i)}
            >
              {/* ── Card inner ──────────────────────────────────── */}
              <div
                className="relative flex flex-col overflow-hidden"
                style={{ background: "#0f0f0f" }}
              >
                {/* ── FRONT FACE ──────────────────────────────── */}
                <div
                  className="flex flex-col"
                  style={{
                    paddingBottom: "36px",
                    opacity: flipped[i] ? 0 : 1,
                    visibility: flipped[i] ? "hidden" : "visible",
                    transition: "none",
                  }}
                >
                  {/* ── Desktop: static reflection on hover ─── */}
                  <div
                    className="absolute inset-0 pointer-events-none z-10
                               hidden md:block
                               opacity-0 group-hover:opacity-100
                               transition-opacity duration-500"
                    style={{
                      background:
                        "linear-gradient(135deg,rgba(255,255,255,0.10) 0%,rgba(255,255,255,0.04) 38%,transparent 62%)",
                    }}
                  />

                  {/* ── Mobile: animated glare sweep every 1200 ms ─
                       Staggered by card index so they ripple across
                       the grid instead of all firing simultaneously  */}
                  <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden md:hidden">
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        width: "45%",
                        background:
                          "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.18) 50%,transparent 100%)",
                        animation: "card-glare 1200ms ease-in-out infinite",
                        animationDelay: `${i * 150}ms`,
                      }}
                    />
                  </div>

                  {/* Portrait */}
                  <div className="relative w-full aspect-square overflow-hidden">
                    <NextImage
                      src={person.img}
                      alt={person.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      style={{ objectFit: "cover", objectPosition: "top center" }}
                    />
                  </div>

                  {/* Name */}
                  <div className="text-center" style={{ marginTop: "32px" }}>
                    <p
                      className="font-[800] leading-tight"
                      style={{
                        fontFamily: "var(--font-blender), sans-serif",
                        color: "rgba(255,255,255,0.92)",
                        fontSize: "clamp(24px, 2.5vw, 32px)",
                      }}
                    >
                      {person.name}
                    </p>
                  </div>
                </div>

                {/* ── BACK FACE ───────────────────────────────── */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none"
                  style={{
                    background: "#0f0f0f",
                    padding: "28px 16px 36px",
                    opacity: flipped[i] ? 1 : 0,
                    visibility: flipped[i] ? "visible" : "hidden",
                    transition: "none",
                  }}
                >
                  {/* Orange accent bar */}
                  <div style={{ width: "32px", height: "2px", background: ORANGE, flexShrink: 0 }} />

                  {/* Eyebrow */}
                  <p
                    className="text-[11px] font-medium tracking-[0.25em] uppercase text-center"
                    style={{ fontFamily: "var(--font-blender), sans-serif", color: ORANGE }}
                  >
                    KTM Expert Trainer
                  </p>

                  {/* Name */}
                  <p
                    className="font-[800] leading-tight text-center"
                    style={{
                      fontFamily: "var(--font-blender), sans-serif",
                      color: "rgba(255,255,255,0.95)",
                      fontSize: "clamp(20px, 2vw, 28px)",
                    }}
                  >
                    {person.name}
                  </p>

                  {/* Expertise */}
                  <p
                    className="text-[13px] font-light leading-[1.6] text-center"
                    style={{ fontFamily: "var(--font-blender), sans-serif", color: "rgba(255,255,255,0.45)" }}
                  >
                    {person.expertise}
                  </p>

                  {/* Tap-to-return hint */}
                  <p
                    className="text-[9px] tracking-[0.22em] uppercase text-center"
                    style={{
                      fontFamily: "var(--font-blender), sans-serif",
                      color: "rgba(255,255,255,0.18)",
                      marginTop: "auto",
                      paddingTop: "20px",
                    }}
                  >
                    Tap to go back
                  </p>
                </div>

                {/* ── PIXEL TRANSITION OVERLAY (z-30, pointer-events:none) ── */}
                <PixelCard
                  ref={(el) => { pixelRefs.current[i] = el; }}
                  variant="ktm"
                  noHover
                  className="pixel-card-overlay"
                />
              </div>
            </div>
          ))}
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
