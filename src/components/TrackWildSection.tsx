"use client";

import { useEffect, useRef, useCallback } from "react";
import NextImage from "next/image";
import "./TrackWildSection.css";

// ─── Card data ────────────────────────────────────────────────────────────────
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
  maxRotX:    9,
  maxRotY:    8,
  betaOffset: 62,
  lerp:       0.06,
  parallaxX:  2.5,
  parallaxY:  3.0,
  shadowBaseY:    14,
  shadowBaseBlur: 22,
  shadowTiltMul:  0.4,
};

type DOEStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function TrackWildSection({ stacked = false }: { stacked?: boolean }) {
  const helmetRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tiltState  = useRef({ targetX: 0, currentX: 0, targetY: 0, currentY: 0 });
  const rafRef     = useRef<number>(0);

  // ── Stable orientation handler ─────────────────────────────────────────────
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.gamma === null || e.beta === null) return;
    tiltState.current.targetY = clamp(e.gamma * 0.45, -CFG.maxRotY, CFG.maxRotY);
    tiltState.current.targetX = clamp(
      -(e.beta - CFG.betaOffset) * 0.38, -CFG.maxRotX, CFG.maxRotX,
    );
  }, []);

  // ── RAF loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active = true;

    const tick = () => {
      if (!active) return;
      rafRef.current = requestAnimationFrame(tick);

      const s = tiltState.current;
      s.currentX += (s.targetX - s.currentX) * CFG.lerp;
      s.currentY += (s.targetY - s.currentY) * CFG.lerp;

      const cX  = s.currentX;
      const cY  = s.currentY;
      const mag = Math.sqrt(cX * cX + cY * cY);

      const tx =  cY * CFG.parallaxX;
      const ty = -cX * CFG.parallaxY;

      const shadowX    = (-cY * 0.55).toFixed(1);
      const shadowY    = (CFG.shadowBaseY + cX * 0.4).toFixed(1);
      const shadowBlur = (CFG.shadowBaseBlur + mag * CFG.shadowTiltMul).toFixed(1);
      const shadowA    = (0.18 + mag * 0.008).toFixed(3);

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
          `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowA}))`;
      });
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sensor setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof DeviceOrientationEvent === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const DOE = DeviceOrientationEvent as DOEStatic;

    if (typeof DOE.requestPermission === "function") {
      // iOS 13+ — needs a user-gesture to call requestPermission().
      // We piggyback on the very first touchend anywhere on the page
      // (a qualifying gesture in Safari) so there is zero visible UI.
      if (stacked) {
        // Stacked section: wait for the face-off instance to grant & broadcast.
        const onGranted = () => {
          window.addEventListener("deviceorientation", handleOrientation, { passive: true });
        };
        window.addEventListener("ktw-gyro-granted", onGranted, { once: true });
        return () => {
          window.removeEventListener("ktw-gyro-granted", onGranted);
          window.removeEventListener("deviceorientation", handleOrientation);
        };
      }

      // Face-off section: silently request on first touch — no button needed.
      const requestOnTouch = () => {
        (DOE.requestPermission!() as Promise<"granted" | "denied">)
          .then((result) => {
            if (result === "granted") {
              window.addEventListener("deviceorientation", handleOrientation, { passive: true });
              window.dispatchEvent(new CustomEvent("ktw-gyro-granted"));
            }
          })
          .catch(() => { /* denied or unavailable — stay static */ });
      };
      document.addEventListener("touchend", requestOnTouch, { once: true, passive: true });
      return () => {
        document.removeEventListener("touchend", requestOnTouch);
        window.removeEventListener("deviceorientation", handleOrientation);
      };
    }

    // Android / non-iOS — no permission gate, attach directly.
    window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [handleOrientation, stacked]);

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
