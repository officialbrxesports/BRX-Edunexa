import { Connected } from "@/components/landing/Connected";
import { Courses } from "@/components/landing/Courses";
import { ExperienceBand } from "@/components/landing/ExperienceBand";
import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { InstitutionTypes } from "@/components/landing/InstitutionTypes";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Stats } from "@/components/landing/Stats";
import { Updates } from "@/components/landing/Updates";
import { Workflow } from "@/components/landing/Workflow";

export default function HomePage() {
  return (
    <>
      <LandingHeader />

      <main className="min-h-screen overflow-x-clip bg-white text-slate-900">
        <Hero />
        <Stats />
        <InstitutionTypes />
        <Connected />
        <Features />
        <ExperienceBand />
        <Courses />
        <Workflow />
        <Updates />
        <FinalCta />
      </main>

      <Footer />
    </>
  );
}
