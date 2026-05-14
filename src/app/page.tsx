import SmoothScroll from "@/components/SmoothScroll";
import HeroSection from "@/components/HeroSection";
import IntroSection from "@/components/IntroSection";

export default function Home() {
  return (
    <SmoothScroll>
      <main>
        <HeroSection />
        <IntroSection />
      </main>
    </SmoothScroll>
  );
}
