"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  parallaxZ:  18,
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

  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

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
      const tz =  mag * CFG.parallaxZ;  // depth — helmet floats toward viewer as tilt increases

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
          `translateZ(${tz.toFixed(2)}px)`,
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
      if (stacked) {
        // Stacked section on iOS: wait for face-off section to grant permission
        const onGranted = () => {
          window.addEventListener("deviceorientation", handleOrientation, { passive: true });
        };
        window.addEventListener("ktw-gyro-granted", onGranted, { once: true });
        return () => {
          window.removeEventListener("ktw-gyro-granted", onGranted);
          window.removeEventListener("deviceorientation", handleOrientation);
        };
      } else {
        setShowIOSPrompt(true);
      }
    } else {
      window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [handleOrientation, stacked]);

  // ── iOS permission ─────────────────────────────────────────────────────────
  const requestIOSPermission = useCallback(async () => {
    const DOE = DeviceOrientationEvent as DOEStatic;
    if (typeof DOE.requestPermission !== "function") return;
    try {
      const result = await DOE.requestPermission();
      if (result === "granted") {
        window.addEventListener("deviceorientation", handleOrientation, { passive: true });
        window.dispatchEvent(new CustomEvent("ktw-gyro-granted"));
      }
    } catch {
      // denied — fail silently
    }
    setShowIOSPrompt(false);
  }, [handleOrientation]);

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

      {/* iOS motion permission prompt */}
      {showIOSPrompt && !stacked && (
        <div className="ktw-ios-prompt">
          <button
            onClick={requestIOSPermission}
            className="ktw-ios-prompt__btn"
            aria-label="Enable gyroscope tilt effect"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <path d="M12 18h.01" />
            </svg>
            Tap to feel the motion
          </button>
        </div>
      )}
    </section>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
