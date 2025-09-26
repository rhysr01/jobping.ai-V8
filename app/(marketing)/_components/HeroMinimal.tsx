import LogoWordmark from './LogoWordmark';
import { HERO_TITLE, HERO_SUBTITLE } from '@/lib/copy';

export default function HeroMinimal() {
  return (
    <section className="relative isolate text-center py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-[80rem] px-6 md:px-8">
        <LogoWordmark />
        <h1 className="sr-only">{HERO_TITLE}</h1>
        <p className="mt-6 text-lg md:text-xl text-zinc-300 max-w-[60ch] mx-auto leading-7 md:leading-8 tracking-[0.005em] font-medium">
          {HERO_SUBTITLE}
        </p>
      </div>

      {/* spotlight behind the wordmark */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10
        bg-[radial-gradient(70%_45%_at_50%_5%,rgba(99,102,241,0.18),transparent_60%)]" />
    </section>
  );
}
