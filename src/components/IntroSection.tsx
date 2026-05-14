"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: "40+", label: "Active Garages" },
  { value: "12k", label: "Vehicles Managed" },
  { value: "98%", label: "SLA Adherence" },
];

export default function IntroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        itemsRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          ease: "power3.out",
          duration: 1,
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const addToRefs = (el: HTMLDivElement | null, i: number) => {
    if (el) itemsRef.current[i] = el;
  };

  return (
    <section
      ref={sectionRef}
      className="bg-[#030304] w-full py-40 px-6"
    >
      <div className="max-w-5xl mx-auto">
        {/* Label */}
        <div
          ref={(el) => addToRefs(el as HTMLDivElement, 0)}
          className="opacity-0 text-[10px] tracking-[0.25em] text-white/30 uppercase mb-10"
        >
          Platform Overview
        </div>

        {/* Headline */}
        <div ref={(el) => addToRefs(el as HTMLDivElement, 1)} className="opacity-0 mb-20">
          <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] font-extralight leading-tight tracking-tight text-white/80">
            One system. Every job,<br />
            <span className="text-white font-medium">every technician, every bay.</span>
          </h2>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-px border border-white/5">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              ref={(el) => addToRefs(el as HTMLDivElement, i + 2)}
              className="opacity-0 p-8 border border-white/5 flex flex-col gap-2"
            >
              <span className="text-[clamp(2rem,5vw,4rem)] font-light text-white tracking-tight">
                {stat.value}
              </span>
              <span className="text-[11px] text-white/35 tracking-[0.15em] uppercase">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
