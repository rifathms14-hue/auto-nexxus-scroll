"use client";

import { useEffect, useRef } from "react";
import NextImage from "next/image";
import "./TrackWildSection.css";

// ─── Card data — helmets only ─────────────────────────────────────────────────
const CARDS = [
  {
    id: "track",
    align: "left" as const,
    heading: ["FOR THE", "TRACK"],
    copy: "Multi-stage racing championship that brings together riders from across India.",
    ariaLabel: "For the Track — explore multi-stage racing",
    helmet: { src: "/helmet-speed.png", alt: "KTM orange race helmet" },
  },
  {
    id: "wild",
    align: "right" as const,
    heading: ["FOR THE", "WILD"],
    copy: "Closed-Circuit Off-Road training program designed by KTM Adventure Experts.",
    ariaLabel: "For the Wild — explore off-road training",
    helmet: { src: "/helmet-adventure.png", alt: "KTM adventure helmet" },
  },
] as const;

// ─── Tilt config ──────────────────────────────────────────────────────────────
const CFG = {
  maxRotX:    13,   // °  front-back rotation ceiling
  maxRotY:    18,   // °  left-right rotation ceiling
  betaOffset: 62,   // °  natural upright hold angle (subtracting gives Δ from neutral)
  lerpSpeed:  0.06, // 0–1, lower = silkier but more lag; 0.06 feels like inertia
  // Parallax: slight screen-space translate as angle changes (reinforces depth)
  parallaxX:  3.5,  // px per degree of Y rotation
  parallaxY:  2.0,  // px per degree of X rotation
  // Shadow: simulated top-centre light source
  shadowBaseY:   14, // px, base vertical shadow offset
  shadowBaseBlur:22, // px, base blur
  shadowTiltMul:  0.7, // extra px of blur per degree of total tilt magnitude
};

// ─── iOS permission shim ──────────────────────────────────────────────────────
type DOEStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function TrackWildSection() {
  // one ref per card helmet wrapper div
  const helmetRefs = useRef<(HTMLDivElement | null)[]>([]);

  // shared tilt state — updated by sensor, consumed by RAF
  const state = useRef({
    targetX: 0,  currentX: 0,
    targetY: 0,  currentY: 0,
  });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Gate: touch / mobile only
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (!isTouch) return;

    // Gate: respect prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active = true;

    // ── RAF animation loop (lerp + write transforms) ────────────────────────
    const tick = () => {
      if (!active) return;
      rafRef.current = requestAnimationFrame(tick);

      const s  = state.current;
      const α  = CFG.lerpSpeed;

      // Lerp toward sensor targets
      s.currentX += (s.targetX - s.currentX) * α;
      s.currentY += (s.targetY - s.currentY) * α;

      const cX = s.currentX;
      const cY = s.currentY;

      // Total tilt magnitude for shadow intensity scaling
      const mag = Math.sqrt(cX * cX + cY * cY);

      // Parallax translation (screen-space, so goes BEFORE rotations in the
      // transform list — keeps translation axis aligned to screen edges)
      const tx =  cY * CFG.parallaxX;
      const ty = -cX * CFG.parallaxY;

      // Shadow: light from top-centre; shifts opposite to tilt direction
      const shadowX    = (-cY * 0.55).toFixed(1);
      const shadowY    = (CFG.shadowBaseY + cX * 0.4).toFixed(1);
      const shadowBlur = (CFG.shadowBaseBlur + mag * CFG.shadowTiltMul).toFixed(1);
      const shadowOpacity = (0.18 + mag * 0.008).toFixed(3);

      helmetRefs.current.forEach((el) => {
        if (!el) return;

        // perspective() must be first in the transform list
        el.style.transform = [
          `perspective(850px)`,
          `translateX(${tx.toFixed(2)}px)`,
          `translateY(${ty.toFixed(2)}px)`,
          `rotateX(${cX.toFixed(3)}deg)`,
          `rotateY(${cY.toFixed(3)}deg)`,
        ].join(" ");

        el.style.filter = [
          `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px`,
          `rgba(0,0,0,${shadowOpacity}))`,
        ].join(" ");
      });
    };

    rafRef.current = requestAnimationFrame(tick);

    // ── Sensor handler ──────────────────────────────────────────────────────
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // gamma: left/right tilt  (-90°…+90°)
      // beta:  front/back tilt  (-180°…+180°), ~60–80° when held upright
      const gamma = e.gamma ?? 0;
      const beta  = e.beta  ?? CFG.betaOffset;

      // Y-rotation: phone tilts right → positive gamma → helmet rotates right
      state.current.targetY = clamp(gamma * 0.38, -CFG.maxRotY, CFG.maxRotY);

      // X-rotation: relative to natural hold angle; tilt toward you → helmet tips back
      state.current.targetX = clamp(
        -(beta - CFG.betaOffset) * 0.28,
        -CFG.maxRotX,
        CFG.maxRotX,
      );
    };

    // ── Attach sensor listener (with iOS permission gate) ───────────────────
    const attachListener = () => {
      window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    };

    const DOE = DeviceOrientationEvent as DOEStatic;

    if (typeof DOE.requestPermission === "function") {
      // iOS 13+ — must call inside a user-gesture handler
      const onFirstTouch = () => {
        DOE.requestPermission!()
          .then((s) => { if (s === "granted") attachListener(); })
          .catch(() => {});
      };
      document.addEventListener("touchstart", onFirstTouch, { once: true, passive: true });
    } else {
      // Android + non-iOS browsers — no permission needed
      attachListener();
    }

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section
      data-nav-theme="light"
      className="ktw-section"
      aria-label="KTM Riding Programs"
    >
      <div className="ktw-grid">
        {CARDS.map((card, i) => (
          <a
            key={card.id}
            href={`#${card.id}`}
            aria-label={card.ariaLabel}
            className={`ktw-card ktw-card--${card.align}`}
          >
            {/* ── Top content ──────────────────────────────────── */}
            <div className="ktw-content">
              <h2 className="ktw-heading">
                {card.heading[0]}
                <br />
                {card.heading[1]}
              </h2>

              <p className="ktw-copy">{card.copy}</p>

              <span aria-hidden="true" className="ktw-cta">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M2 12L12 2M12 2H5M12 2V9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>

            {/* ── Image stage ──────────────────────────────────── */}
            {/*
              perspective lives on .ktw-stage (CSS).
              JS writes perspective() + rotateX/Y + translateX/Y
              directly onto .ktw-helmet-wrap as inline transform.
            */}
            <div className="ktw-stage">
              <div
                ref={(el) => { helmetRefs.current[i] = el; }}
                className="ktw-helmet-wrap"
              >
                <NextImage
                  src={card.helmet.src}
                  alt={card.helmet.alt}
                  width={600}
                  height={600}
                  loading="lazy"
                  sizes="(max-width: 719px) 88vw, 44vw"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

// ─── Util ─────────────────────────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
