import { BUILT_FOR_STUDENTS_TITLE, BUILT_FOR_STUDENTS_SUBTITLE, BUILT_FOR_STUDENTS_FEATURES } from '@/lib/copy';

export default function BuiltForStudents() {
  return (
    <section
      id="built"
      className="mx-auto max-w-[80rem] px-6 md:px-8 py-20 md:py-24"
    >
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
        {BUILT_FOR_STUDENTS_TITLE}
      </h2>

      <p className="mt-3 text-center text-zinc-300 max-w-[60ch] mx-auto">
        {BUILT_FOR_STUDENTS_SUBTITLE}
      </p>

      <div className="mt-10 grid md:grid-cols-3 gap-8 md:gap-12">
        {BUILT_FOR_STUDENTS_FEATURES.map((feature) => (
          <div
            key={feature.num}
            className="rounded-2xl bg-neutral-900/60 ring-1 ring-brand-500/10 p-8 md:p-10 relative overflow-hidden"
          >
            {/* Faint top gradient */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"></div>
            <div className="h-10 w-10 rounded-full border border-brand-500/45 bg-brand-500/15 text-brand-100 grid place-items-center text-sm font-medium shadow-[0_0_40px_rgba(99,102,241,0.20)]">
              {feature.num}
            </div>
            <h3 className="mt-4 font-semibold">{feature.title}</h3>
            <p className="mt-2 text-zinc-300">{feature.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
