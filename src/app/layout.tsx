import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const blender = localFont({
  src: [
    { path: "../../public/fonts/BlenderTrial-Thin.otf",   weight: "100", style: "normal" },
    { path: "../../public/fonts/BlenderTrial-Book.otf",   weight: "300", style: "normal" },
    { path: "../../public/fonts/BlenderTrial-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/BlenderTrial-Bold.otf",   weight: "700", style: "normal" },
    { path: "../../public/fonts/BlenderTrial-Strong.otf", weight: "800", style: "normal" },
  ],
  variable: "--font-blender",
  display: "block",
});

export const metadata: Metadata = {
  title: "Auto Nexxus — Precision Engine Management",
  description: "Cloud-based garage management platform built for the next generation of automotive service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={blender.variable}>
      <body
        className="bg-[#030304] text-white antialiased overflow-x-hidden"
        style={{ fontFamily: "var(--font-blender), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
