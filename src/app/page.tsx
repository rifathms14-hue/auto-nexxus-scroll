import SmoothScroll from "@/components/SmoothScroll";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <SmoothScroll>
      <Navbar />
      <main>
        <HeroSection />
      </main>
    </SmoothScroll>
  );
}
