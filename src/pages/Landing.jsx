import { useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

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
