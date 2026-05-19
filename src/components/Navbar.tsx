"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const update = () => {
      const sections = document.querySelectorAll<HTMLElement>("[data-nav-theme]");
      let activeTheme = "dark";
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 1 && rect.bottom > 1) {
          activeTheme = section.dataset.navTheme ?? "dark";
        }
      });
      setIsDark(activeTheme === "dark");
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  const bg = isDark ? "#000000" : "#ffffff";
  const fg = isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.88)";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-colors duration-300"
      style={{ background: bg, height: "64px", padding: "0 0 0 20px" }}
    >
      {/* ── Left: Hamburger ───────────────────────────────────── */}
      <button
        aria-label="Open menu"
        className="flex flex-col justify-center gap-[5px] w-10 h-10"
      >
        <span className="block transition-colors duration-300"
          style={{ width: "24px", height: "1.5px", background: fg, borderRadius: "1px" }} />
        <span className="block transition-colors duration-300"
          style={{ width: "24px", height: "1.5px", background: fg, borderRadius: "1px" }} />
        <span className="block transition-colors duration-300"
          style={{ width: "16px", height: "1.5px", background: fg, borderRadius: "1px" }} />
      </button>

      {/* ── Right: Location pin + KTM logo image ─────────────── */}
      <div className="flex items-center" style={{ gap: "20px" }}>

        {/* Stroke-only location pin — #FF6F16 */}
        <svg
          width="18" height="24" viewBox="0 0 18 24"
          fill="none" stroke="#FF6F16"
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 1C5.134 1 2 4.134 2 8c0 5.5 7 15 7 15S16 13.5 16 8c0-3.866-3.134-7-7-7z" />
          <circle cx="9" cy="8" r="2.5" />
        </svg>

        {/* KTM logo — 56 px on mobile, 64 px on desktop */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ktm-logo.jpg"
          alt="KTM"
          className="w-auto h-14 md:h-16 object-contain"
        />
      </div>
    </nav>
  );
}
