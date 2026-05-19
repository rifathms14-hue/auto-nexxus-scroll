"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import TiltedCard, { type TiltedCardHandle } from "./TiltedCard";
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
  maxRotX:    6,
  maxRotY:    9,
  betaOffset: 62,
};

type DOEStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function TrackWildSection({ stacked = false }: { stacked?: boolean }) {
  const tiltedCardRefs = useRef<(TiltedCardHandle | null)[]>([]);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  // ── Stable orientation handler ─────────────────────────────────────────────
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.gamma === null || e.beta === null) return;
    const rx = clamp(-(e.beta - CFG.betaOffset) * 0.28, -CFG.maxRotX, CFG.maxRotX);
    const ry = clamp(e.gamma * 0.38, -CFG.maxRotY, CFG.maxRotY);
    tiltedCardRefs.current.forEach(card => card?.setGyro(rx, ry));
  }, []);

  // ── Sensor setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof DeviceOrientationEvent === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const DOE = DeviceOrientationEvent as DOEStatic;

    if (typeof DOE.requestPermission === "function") {
      if (stacked) {
        // Stacked section: wait for face-off to grant permission via custom event
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

  // ── iOS permission: called synchronously from button onClick ───────────────
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
      // Permission denied — fail silently
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
              <div className={`ktw-helmet-wrap${stacked ? " ktw-helmet-wrap--stacked" : ""}`}>
                <TiltedCard
                  ref={(el) => { tiltedCardRefs.current[i] = el; }}
                  imageSrc={card.helmet.src}
                  altText={card.helmet.alt}
                  rotateAmplitude={9}
                  scaleOnHover={1.04}
                  showTooltip={false}
                />
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* iOS motion permission prompt — only on face-off, only iOS 13+ */}
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
