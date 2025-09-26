import HeroMinimal from './(marketing)/_components/HeroMinimal';
import NavbarMinimal from './(marketing)/_components/NavbarMinimal';
import BuiltForStudents from './(marketing)/_components/BuiltForStudents';
import CTASection from './(marketing)/_components/CTASection';
import HowItWorks from './(marketing)/_components/HowItWorks';
import PricingSection from './(marketing)/_components/PricingSection';

export default function Page() {
  return (
    <div id="main" className="min-h-screen text-white antialiased">
      <NavbarMinimal />
      <HeroMinimal />
      <hr className="mx-auto my-12 w-full max-w-[80rem] border-t border-white/10" />
      <BuiltForStudents />
      <hr className="mx-auto my-12 w-full max-w-[80rem] border-t border-white/10" />
      <CTASection />
      <hr className="mx-auto my-12 w-full max-w-[80rem] border-t border-white/10" />
      <HowItWorks />
      <hr className="mx-auto my-12 w-full max-w-[80rem] border-t border-white/10" />
      <PricingSection />
      
      {/* Sticky mobile CTA */}
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:hidden">
        <a 
          href="https://tally.so/r/wLqWxQ?utm_source=landing&utm_medium=sticky&utm_campaign=free"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full text-center text-lg py-4 shadow-2xl"
        >
          Get 5 matches — Free
        </a>
      </div>
    </div>
  );
}