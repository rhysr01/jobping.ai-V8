import { HOW_IT_WORKS_TITLE, HOW_IT_WORKS_STEPS } from '@/lib/copy';

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[80rem] px-6 md:px-8 py-20 md:py-24">
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-16">{HOW_IT_WORKS_TITLE}</h2>
      <div className="grid md:grid-cols-3 gap-12 text-center">
        {HOW_IT_WORKS_STEPS.map((step, i) => (
          <div key={step.title} className="relative">
            {/* Indigo bubble background */}
            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 
                          shadow-2xl shadow-brand-500/25 grid place-items-center text-2xl font-bold text-white
                          border-2 border-brand-300/30 relative z-10">
              {i + 1}
            </div>
            {/* Glow effect behind bubble */}
            <div className="mx-auto h-20 w-20 rounded-full bg-brand-500/20 blur-xl absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            
            <h3 className="mt-6 text-xl font-bold text-white">{step.title}</h3>
            <p className="mt-2 text-base text-zinc-300 font-medium">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
