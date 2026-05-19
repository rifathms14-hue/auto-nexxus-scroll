"use client";

import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import "./TiltedCard.css";

const SPRING = { damping: 30, stiffness: 100, mass: 2 };

export interface TiltedCardHandle {
  setGyro: (x: number, y: number) => void;
}

interface Props {
  imageSrc: string;
  altText?: string;
  captionText?: string;
  containerWidth?: string;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showTooltip?: boolean;
  displayOverlayContent?: boolean;
  overlayContent?: React.ReactNode;
}

const TiltedCard = forwardRef<TiltedCardHandle, Props>(function TiltedCard(
  {
    imageSrc,
    altText = "Tilted card image",
    captionText = "",
    containerWidth = "100%",
    scaleOnHover = 1.05,
    rotateAmplitude = 14,
    showTooltip = false,
    displayOverlayContent = false,
    overlayContent = null,
  },
  ref
) {
  const figureRef = useRef<HTMLElement>(null);
  const [lastY, setLastY] = useState(0);

  const x         = useMotionValue(0);
  const y         = useMotionValue(0);
  const rotateX   = useSpring(useMotionValue(0), SPRING);
  const rotateY   = useSpring(useMotionValue(0), SPRING);
  const scale     = useSpring(1, SPRING);
  const opacity   = useSpring(0);
  const rotateCap = useSpring(0, { stiffness: 350, damping: 30, mass: 1 });

  // Imperative API so TrackWildSection can drive tilt from gyroscope without re-renders
  useImperativeHandle(ref, () => ({
    setGyro(gx: number, gy: number) {
      rotateX.set(gx);
      rotateY.set(gy);
    },
  }));

  function handleMouse(e: React.MouseEvent<HTMLElement>) {
    if (!figureRef.current) return;
    const rect = figureRef.current.getBoundingClientRect();
    const ox = e.clientX - rect.left - rect.width / 2;
    const oy = e.clientY - rect.top - rect.height / 2;
    rotateX.set((oy / (rect.height / 2)) * -rotateAmplitude);
    rotateY.set((ox / (rect.width / 2)) *  rotateAmplitude);
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
    rotateCap.set(-(oy - lastY) * 0.6);
    setLastY(oy);
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
    opacity.set(1);
  }

  function handleMouseLeave() {
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateCap.set(0);
  }

  return (
    <figure
      ref={figureRef as React.RefObject<HTMLElement>}
      className="tilted-card-figure"
      style={{ width: containerWidth }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="tilted-card-inner"
        style={{ rotateX, rotateY, scale }}
      >
        <img
          src={imageSrc}
          alt={altText}
          className="tilted-card-img"
          draggable={false}
        />
        {displayOverlayContent && overlayContent && (
          <motion.div className="tilted-card-overlay">{overlayContent}</motion.div>
        )}
      </motion.div>

      {showTooltip && (
        <motion.figcaption
          className="tilted-card-caption"
          style={{ x, y, opacity, rotate: rotateCap }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
});

export default TiltedCard;
