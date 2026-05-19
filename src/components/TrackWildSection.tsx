"use client";

import { useEffect, useRef } from "react";
import NextImage from "next/image";
import "./TrackWildSection.css";

// ─── Card data ────────────────────────────────────────────────────────────────
const CARDS = [
  {
    id: "track",
    align: "left" as const,
    flip: false,
    heading: ["FOR THE", "TRACK"],
    copy: "Multi-stage racing championship that brings together riders from across India.",
    ariaLabel: "For the Track — explore multi-stage racing",
    helmet: { src: "/helmet-speed.png", alt: "KTM orange race helmet" },
  },
  {
    id: "wild",
    align: "right" as const,
    flip: false,
    heading: ["FOR THE", "WILD"],
    copy: "Closed-Circuit Off-Road training program designed by KTM Adventure Experts.",
    ariaLabel: "For the Wild — explore off-road training",
    helmet: { src: "/helmet-adventure.png", alt: "KTM adventure helmet" },
  },
] as const;

// ─── Tilt config ──────────────────────────────────────────────────────────────
const CFG = {
  maxRotX:    13,
  maxRotY:    18,
  betaOffset: 62,   // subtract to get delta from natural upright hold
  lerp:       0.06, // smoothing — lower = more inertia
  parallaxX:  3.5,
  parallaxY:  2.0,
  shadowBaseY:   14,
  shadowBaseBlur: 22,
  shadowTiltMul:  0.7,
};

// ─── iOS permission shim type ─────────────────────────────────────────────────
type DOEStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function TrackWildSection({ stacked = false }: { stacked?: boolean }) {
  const helmetRefs = useRef<(HTMLDivElement | null)[]>([]);
  const state = useRef({ targetX: 0, currentX: 0, targetY: 0, currentY: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof DeviceOrientationEvent === "undefined") return;

    // Respect reduced-motion at the JS level too (CSS !important handles the
    // visual fallback, but we skip the RAF loop to save battery)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active = true;

    // ── 60fps lerp loop ────────────────────────────────────────────────────
    const tick = () => {
      if (!active) return;
      rafRef.current = requestAnimationFrame(tick);

      const s = state.current;
      s.currentX += (s.targetX - s.currentX) * CFG.lerp;
      s.currentY += (s.targetY - s.currentY) * CFG.lerp;

      const cX  = s.currentX;
      const cY  = s.currentY;
      const mag = Math.sqrt(cX * cX + cY * cY);

      // Screen-space parallax before the 3-D rotation
      const tx =  cY * CFG.parallaxX;
      const ty = -cX * CFG.parallaxY;

      // Dynamic shadow tracks a top-centre light source
      const shadowX    = (-cY * 0.55).toFixed(1);
      const shadowY    = (CFG.shadowBaseY + cX * 0.4).toFixed(1);
      const shadowBlur = (CFG.shadowBaseBlur + mag * CFG.shadowTiltMul).toFixed(1);
      const shadowAlpha = (0.18 + mag * 0.008).toFixed(3);

      helmetRefs.current.forEach((el) => {
        if (!el) return;
        el.style.transform = [
          `perspective(850px)`,
          `translateX(${tx.toFixed(2)}px)`,
          `translateY(${ty.toFixed(2)}px)`,
          `rotateX(${cX.toFixed(3)}deg)`,
          `rotateY(${cY.toFixed(3)}deg)`,
        ].join(" ");
        el.style.filter =
          `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowAlpha}))`;
      });
    };

    rafRef.current = requestAnimationFrame(tick);

    // ── Sensor handler ─────────────────────────────────────────────────────
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Some devices return null values — bail if so
      if (e.gamma === null || e.beta === null) return;

      state.current.targetY = clamp(
        e.gamma * 0.38, -CFG.maxRotY, CFG.maxRotY,
      );
      state.current.targetX = clamp(
        -(e.beta - CFG.betaOffset) * 0.28, -CFG.maxRotX, CFG.maxRotX,
      );
    };

    // ── Attach the listener ────────────────────────────────────────────────
    // No isTouch gate — deviceorientation simply won't fire on desktops,
    // so the loop runs but cX/cY stay at 0 (transform: perspective(850px) = identity).
    const attachListener = () => {
      window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    };

    const DOE = DeviceOrientationEvent as DOEStatic;

    if (typeof DOE.requestPermission === "function") {
      // iOS 13+ — requestPermission must be called inside a user-gesture handler.
      // We listen for the very first touchstart on the document.
      const onFirstTouch = () => {
        DOE.requestPermission!()
          .then((s) => { if (s === "granted") attachListener(); })
          .catch(() => {});
      };
      document.addEventListener("touchstart", onFirstTouch, {
        once: true,
        passive: true,
      });
    } else {
      // Android + non-iOS browsers — attach immediately, no permission needed.
      attachListener();
    }

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section
      data-nav-theme="light"
      className={`ktw-section${stacked ? " ktw-section--stacked" : ""}`}
      aria-label="KTM Riding Programs"
    >
      <div className={`ktw-grid${stacked ? " ktw-grid--stacked" : ""}`}>
        {CARDS.map((card, i) => (
          <a
            key={card.id}
            href={`#${card.id}`}
            aria-label={card.ariaLabel}
            className={`ktw-card ktw-card--${card.align}${stacked ? " ktw-card--stacked" : ""}`}
          >
            {/* ── Text content ─────────────────────────────────── */}
            <div className="ktw-content">
              <h2 className="ktw-heading">
                {card.heading[0]}
                <br />
                {card.heading[1]}
              </h2>
              <p className="ktw-copy">{card.copy}</p>
              <span aria-hidden="true" className="ktw-cta">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
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

            {/* ── Helmet stage ─────────────────────────────────── */}
            <div className="ktw-stage">
              <div
                ref={(el) => { helmetRefs.current[i] = el; }}
                className={`ktw-helmet-wrap${stacked ? " ktw-helmet-wrap--stacked" : ""}`}
              >
                <NextImage
                  src={card.helmet.src}
                  alt={card.helmet.alt}
                  width={600}
                  height={600}
                  loading="lazy"
                  sizes="(max-width: 719px) calc(50vw + 20px), 44vw"
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

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
