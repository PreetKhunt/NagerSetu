import Hero from "../components/landing/Hero";
import AIWorkflow from "../components/landing/AIWorkflow";
import CivicProblems from "../components/landing/CivicProblems";
import WhyPlatform from "../components/landing/WhyPlatform";
import HowItWorks from "../components/landing/HowItWorks";
import Features from "../components/landing/Features";
import StatsBand from "../components/landing/StatsBand";
import Benefits from "../components/landing/Benefits";
import CTASection from "../components/landing/CTASection";
import useDocumentTitle from "../hooks/useDocumentTitle";

/**
 * Marketing landing page.
 * Navbar and Footer come from PublicLayout, completing the 11 sections.
 */
export default function Landing() {
  useDocumentTitle("AI-Powered Civic Grievance Platform");

  return (
    <>
      <Hero />
      <AIWorkflow />
      <CivicProblems />
      <WhyPlatform />
      <HowItWorks />
      <Features />
      <StatsBand />
      <Benefits />
      <CTASection />
    </>
  );
}
