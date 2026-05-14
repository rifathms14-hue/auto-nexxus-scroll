"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const sublineRef = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=250%",
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Phase 1 (0 → 30%): Video rises from dim, scales up from 0.3 → 0.52
      tl.fromTo(
        videoWrapRef.current,
        { scale: 0.28, opacity: 0, y: 60 },
        { scale: 0.52, opacity: 1, y: 0, ease: "power2.out", duration: 3 },
        0
      )
        // Overlay fades out as video comes in
        .fromTo(
          overlayRef.current,
          { opacity: 1 },
          { opacity: 0.15, ease: "power1.out", duration: 3 },
          0
        )
        // Eyebrow fades in early
        .fromTo(
          eyebrowRef.current,
          { opacity: 0, letterSpacing: "0.3em" },
          { opacity: 1, letterSpacing: "0.15em", ease: "power2.out", duration: 2.5 },
          0.5
        )
        // Headline chars slide up
        .fromTo(
          headlineRef.current,
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, ease: "power3.out", duration: 2.5 },
          1
        )

        // Phase 2 (30 → 60%): Hold — video gently breathes, scanline sweeps
        .to(videoWrapRef.current, { scale: 0.54, ease: "sine.inOut", duration: 2 }, 3.5)
        .fromTo(
          scanlineRef.current,
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, ease: "power2.inOut", duration: 2 },
          3.5
        )
        .fromTo(
          sublineRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, ease: "power2.out", duration: 2 },
          4
        )

        // Phase 3 (60 → 100%): Video scales past, text burns out — cinematic exit
        .to(
          videoWrapRef.current,
          { scale: 0.68, opacity: 0.4, ease: "power3.in", duration: 3 },
          6
        )
        .to(
          [eyebrowRef.current, headlineRef.current, sublineRef.current, scanlineRef.current],
          { opacity: 0, y: -20, ease: "power2.in", duration: 2, stagger: 0.1 },
          6.2
        )
        .to(
          overlayRef.current,
          { opacity: 0.85, ease: "power2.in", duration: 3 },
          6
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen bg-[#030304] overflow-hidden flex flex-col items-center justify-center"
    >
      {/* Dark overlay — fades in/out to control exposure */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-[#030304] z-10 pointer-events-none"
      />

      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 z-20 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Video — centered, hard-light blend, 52% scale via wrapper */}
      <div
        ref={videoWrapRef}
        className="absolute inset-0 flex items-center justify-center z-30"
        style={{ transform: "scale(0.28)", opacity: 0 }}
      >
        <video
          ref={videoRef}
          src="/piston.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-contain"
          style={{ mixBlendMode: "hard-light" }}
        />
      </div>

      {/* Text layer — sits above video */}
      <div className="relative z-40 flex flex-col items-center text-center px-6 select-none pointer-events-none">
        {/* Eyebrow */}
        <div
          ref={eyebrowRef}
          className="opacity-0 mb-6 text-[10px] font-light tracking-[0.3em] text-white/40 uppercase"
        >
          Auto Nexxus &nbsp;·&nbsp; GMS Platform
        </div>

        {/* Headline */}
        <div
          ref={headlineRef}
          className="opacity-0"
        >
          <h1 className="text-[clamp(2.5rem,6vw,6rem)] font-extralight leading-[1.05] tracking-[-0.02em] text-white/90">
            Built for every
            <br />
            <span className="font-semibold text-white">garage in motion.</span>
          </h1>
        </div>

        {/* Scanline divider */}
        <div
          ref={scanlineRef}
          className="my-8 w-24 h-px bg-white/20 origin-left scale-x-0 opacity-0"
        />

        {/* Sub-line */}
        <div
          ref={sublineRef}
          className="opacity-0 max-w-sm"
        >
          <p className="text-[13px] font-light leading-relaxed text-white/35 tracking-wide">
            Service management, vehicle tracking, and technician ops —
            unified in one cloud platform.
          </p>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 opacity-40">
        <span className="text-[10px] tracking-[0.2em] text-white/50 uppercase">Scroll</span>
        <div className="w-px h-8 bg-white/30 animate-pulse" />
      </div>
    </section>
  );
}
