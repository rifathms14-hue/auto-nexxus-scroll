import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-[#030304] text-white antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
