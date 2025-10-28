import Link from 'next/link';

export default function Pricing() {
  return (
    <section className="py-16 md:py-24 bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white text-center mb-10">
          Choose your plan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Free Plan */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 md:p-8 flex flex-col">
            <div className="mb-4">
              <div className="text-sm uppercase tracking-wider text-zinc-400 font-semibold">Free</div>
              <div className="mt-1 text-2xl sm:text-3xl font-black text-white">5 roles on signup</div>
              <div className="text-lg font-bold text-brand-400">= 25 jobs/month</div>
            </div>
            <ul className="text-sm text-zinc-300 space-y-2 mb-6">
              <li>— Weekly email with 5 hand‑picked roles</li>
              <li>— Quality‑screened, early‑career friendly</li>
              <li>— No dashboards, zero spam</li>
            </ul>
            <div className="mt-auto">
              <Link href="/signup?tier=free" className="btn-primary inline-block w-full text-center">
                Get started — Free
              </Link>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-b from-white/10 to-white/[0.06] rounded-2xl border border-white/15 p-6 md:p-8 flex flex-col relative overflow-hidden">
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-brand-500/20 blur-2xl" aria-hidden />
            <div className="mb-4">
              <div className="text-sm uppercase tracking-wider text-brand-300 font-semibold">Premium</div>
              <div className="mt-1 text-2xl sm:text-3xl font-black text-white">10 roles on signup</div>
              <div className="text-xl sm:text-2xl font-black text-brand-300 mb-1">= 70+ jobs/month</div>
              <div className="text-zinc-400 text-xs">vs 25 on free tier</div>
            </div>
            <ul className="text-sm text-zinc-300 space-y-2 mb-6">
              <li>— New matches every 48 hours (Mon/Wed/Fri)</li>
              <li>— 24‑hour early access to fresh roles</li>
              <li>— Priority curation for your preferences</li>
            </ul>
            <div className="mt-auto">
              <Link href="/signup?tier=premium" className="btn-primary inline-block w-full text-center">
                Upgrade to Premium
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


