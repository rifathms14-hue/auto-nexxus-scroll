"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import "./PixelCard.css";

// ─── Pixel class ──────────────────────────────────────────────────────────────
class Pixel {
  width: number; height: number; ctx: CanvasRenderingContext2D;
  x: number; y: number; color: string; speed: number; size: number;
  sizeStep: number; minSize: number; maxSizeInteger: number; maxSize: number;
  delay: number; counter: number; counterStep: number;
  isIdle: boolean; isReverse: boolean; isShimmer: boolean;

  constructor(
    canvas: HTMLCanvasElement, context: CanvasRenderingContext2D,
    x: number, y: number, color: string, speed: number, delay: number
  ) {
    this.width = canvas.width; this.height = canvas.height; this.ctx = context;
    this.x = x; this.y = y; this.color = color;
    this.speed = this.rnd(0.1, 0.9) * speed;
    this.size = 0; this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5; this.maxSizeInteger = 2;
    this.maxSize = this.rnd(this.minSize, this.maxSizeInteger);
    this.delay = delay; this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false; this.isReverse = false; this.isShimmer = false;
  }

  rnd(min: number, max: number) { return Math.random() * (max - min) + min; }

  draw() {
    const o = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + o, this.y + o, this.size, this.size);
  }

  appear() {
    this.isIdle = false;
    if (this.counter <= this.delay) { this.counter += this.counterStep; return; }
    if (this.size >= this.maxSize) this.isShimmer = true;
    if (this.isShimmer) this.shimmer(); else this.size += this.sizeStep;
    this.draw();
  }

  disappear() {
    this.isShimmer = false; this.counter = 0;
    if (this.size <= 0) { this.isIdle = true; return; }
    this.size -= 0.1;
    this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) this.isReverse = true;
    else if (this.size <= this.minSize) this.isReverse = false;
    this.isReverse ? (this.size -= this.speed) : (this.size += this.speed);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function effectiveSpeed(value: number, reduced: boolean): number {
  if (value <= 0 || reduced) return 0;
  if (value >= 100) return 0.1;
  return value * 0.001;
}

const VARIANTS: Record<string, { gap: number; speed: number; colors: string; noFocus: boolean }> = {
  default: { gap: 5,  speed: 35, colors: "#f8fafc,#f1f5f9,#cbd5e1", noFocus: false },
  blue:    { gap: 10, speed: 25, colors: "#e0f2fe,#7dd3fc,#0ea5e9", noFocus: false },
  yellow:  { gap: 3,  speed: 20, colors: "#fef08a,#fde047,#eab308", noFocus: false },
  pink:    { gap: 6,  speed: 80, colors: "#fecdd3,#fda4af,#e11d48", noFocus: true  },
  ktm:     { gap: 8,  speed: 70, colors: "#FF6F16,#E55A00,#FF9A4D", noFocus: true  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PixelCardHandle {
  appear:    () => void;
  disappear: () => void;
}

interface PixelCardProps {
  variant?:   string;
  gap?:       number;
  speed?:     number;
  colors?:    string;
  noFocus?:   boolean;
  noHover?:   boolean;   // suppress mouse-enter/leave auto-animation
  className?: string;
  style?:     React.CSSProperties;
  children?:  React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────
const PixelCard = forwardRef<PixelCardHandle, PixelCardProps>(function PixelCard(
  { variant = "default", gap, speed, colors, noFocus, noHover = false,
    className = "", style, children },
  ref
) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const pixelsRef     = useRef<Pixel[]>([]);
  const rafRef        = useRef<number>(0);
  const tPrevRef      = useRef<number>(0);
  const reduced       = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  ).current;

  const cfg      = VARIANTS[variant] ?? VARIANTS.default;
  const fGap     = gap    ?? cfg.gap;
  const fSpeed   = speed  ?? cfg.speed;
  const fColors  = colors ?? cfg.colors;
  const fNoFocus = noFocus ?? cfg.noFocus;

  // ── Build pixel grid ────────────────────────────────────────────────────
  const initPixels = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w === 0 || h === 0) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    canvasRef.current.width  = w;
    canvasRef.current.height = h;
    canvasRef.current.style.width  = `${w}px`;
    canvasRef.current.style.height = `${h}px`;

    const palette = fColors.split(",");
    const pxs: Pixel[] = [];
    for (let x = 0; x < w; x += fGap) {
      for (let y = 0; y < h; y += fGap) {
        const color = palette[Math.floor(Math.random() * palette.length)];
        const dx = x - w / 2, dy = y - h / 2;
        const delay = reduced ? 0 : Math.sqrt(dx * dx + dy * dy);
        pxs.push(new Pixel(canvasRef.current!, ctx, x, y, color,
          effectiveSpeed(fSpeed, reduced), delay));
      }
    }
    pixelsRef.current = pxs;
  };

  // ── Animation loop ──────────────────────────────────────────────────────
  const tick = (fnName: "appear" | "disappear") => {
    rafRef.current = requestAnimationFrame(() => tick(fnName));
    const now = performance.now();
    const passed = now - tPrevRef.current;
    if (passed < 1000 / 60) return;
    tPrevRef.current = now - (passed % (1000 / 60));

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    let allIdle = true;
    for (const px of pixelsRef.current) {
      px[fnName]();
      if (!px.isIdle) allIdle = false;
    }
    if (allIdle) cancelAnimationFrame(rafRef.current);
  };

  const play = (fn: "appear" | "disappear") => {
    cancelAnimationFrame(rafRef.current);
    tPrevRef.current = performance.now();
    rafRef.current = requestAnimationFrame(() => tick(fn));
  };

  // ── Expose imperative API ───────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    appear:    () => play("appear"),
    disappear: () => play("disappear"),
  }));

  // ── Setup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    tPrevRef.current = performance.now();
    initPixels();
    const ro = new ResizeObserver(initPixels);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { ro.disconnect(); cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fGap, fSpeed, fColors, fNoFocus]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`pixel-card ${className}`}
      style={style}
      onMouseEnter={noHover ? undefined : () => play("appear")}
      onMouseLeave={noHover ? undefined : () => play("disappear")}
      onFocus={fNoFocus || noHover ? undefined : (e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        play("appear");
      }}
      onBlur={fNoFocus || noHover ? undefined : (e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        play("disappear");
      }}
      tabIndex={fNoFocus ? -1 : 0}
    >
      <canvas className="pixel-canvas" ref={canvasRef} />
      {children}
    </div>
  );
});

export default PixelCard;
