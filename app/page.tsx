import HeroMinimal from './(marketing)/_components/HeroMinimal';
import NavbarMinimal from './(marketing)/_components/NavbarMinimal';
import HowItWorks from './(marketing)/_components/HowItWorks';
import BuiltForStudents from './(marketing)/_components/BuiltForStudents';
import PricingSection from './(marketing)/_components/PricingSection';

export default function Page() {
  return (
    <div id="main" className="min-h-screen text-white antialiased">
      <NavbarMinimal />
      <HeroMinimal />
      <hr className="mx-auto my-12 w-full max-w-[80rem] border-t border-white/10" />
      <HowItWorks />
      <hr className="mx-auto my-12 w-full max-w-[80rem] border-t border-white/10" />
      <BuiltForStudents />
      <hr className="mx-auto my-12 w-full max-w-[80rem] border-t border-white/10" />
      <PricingSection />
    </div>
  );
}