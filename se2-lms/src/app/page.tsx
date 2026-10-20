import dynamic from "next/dynamic";
import Footer from "@/components/Footer";
import Hero from "@/components/home/Hero";
import AboutSection from "@/components/home/AboutSection";
import SystemFeatures from "@/components/home/SystemFeatures";
import JourneyPanel from "@/components/features/JourneyPanel";
import ClassMockCard from "@/components/features/ClassMockCard";

const Navbar = dynamic(() => import("@/components/Navbar"), {
  ssr: false,
  loading: () => <div className="h-[72px] w-full bg-white/60" aria-hidden />,
});

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AboutSection />
        <section id="features" className="scroll-mt-24">
          <div className="hero-wash">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-14 items-center">
              <JourneyPanel />
              <ClassMockCard />
            </div>
          </div>
          <SystemFeatures />
        </section>
      </main>
      <Footer />
    </>
  );
}
