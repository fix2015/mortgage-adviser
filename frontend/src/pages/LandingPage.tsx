import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Calculator } from "@/components/landing/Calculator";
import { Pricing } from "@/components/landing/Pricing";
import { Demo } from "@/components/landing/Demo";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTA } from "@/components/landing/CTA";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ds-bg-primary">
      <Header />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Calculator />
      <Pricing />
      <Demo />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
