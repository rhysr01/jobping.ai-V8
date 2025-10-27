import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import BuiltForStudents from "@/components/sections/BuiltForStudents";
import Pricing from "@/components/sections/Pricing";
import FinalCTA from "@/components/sections/FinalCTA";
import LogoWordmark from "@/components/LogoWordmark";

export default function Page() {
  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="container-page h-16 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <LogoWordmark />
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-zinc-300 hover:text-white transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-zinc-300 hover:text-white transition-colors">
              Pricing
            </a>
            <a href="/signup" className="btn-primary">
              Get Started
            </a>
          </div>
        </div>
      </nav>
      
      <Hero />
      <HowItWorks />
      <BuiltForStudents />
      <Pricing />
      <FinalCTA />
    </>
  );
}