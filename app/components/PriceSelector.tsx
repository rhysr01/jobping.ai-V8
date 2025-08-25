'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type PlanKey = 'free' | 'premium';

const PLANS: Record<PlanKey, { title: string; price: string; bullets: string[] }> = {
  free: {
    title: 'Free',
    price: '€0',
    bullets: ['6 jobs/week', 'Email delivery', 'Basic filters'],
  },
  premium: {
    title: 'Premium',
    price: '€15',
    bullets: ['15 jobs every 2 days', 'Priority AI matching', 'Advanced filters'],
  },
};

export default function PriceSelector() {
  const params = useSearchParams();
  const initial = (params.get('plan') as PlanKey) || 'free';
  const [selected, setSelected] = useState<PlanKey>(initial);

  useEffect(() => {
    // keep URL in sync if navigated directly
    if ((params.get('plan') as PlanKey) !== selected) {
      // no-op: selection is the source of truth here
    }
  }, [params, selected]);

  const onChoose = (plan: PlanKey) => {
    setSelected(plan);
    // mirror selection in URL for Signup to read
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('plan', plan);
      window.history.replaceState(null, '', url.toString());
    }
    // smooth scroll to signup
    const el = document.getElementById('signup');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="pricing" className="scroll-mt-[96px] border-t border-[#374151]">
      <div className="container-frame py-24 md:py-32">
        <h2 className="text-[#F8F9FA] font-bold text-4xl lg:text-5xl mb-20 text-center">
          Choose your plan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {(['free', 'premium'] as PlanKey[]).map((key) => (
            <PlanBubble
              key={key}
              k={key}
              data={PLANS[key]}
              selected={selected === key}
              onClick={() => onChoose(key)}
            />
          ))}
        </div>

        {/* Central CTA as a secondary affordance */}
        <div className="mt-16 flex justify-center">
          <button
            onClick={() => onChoose(selected)}
            className="btn-primary text-lg px-8 py-4"
            aria-label="Get started with selected plan"
          >
            Get Started Free
          </button>
        </div>
      </div>
    </section>
  );
}

function PlanBubble({
  k,
  data,
  selected,
  onClick,
}: {
  k: PlanKey;
  data: { title: string; price: string; bullets: string[] };
  selected: boolean;
  onClick: () => void;
}) {
  const outline = selected ? 'ring-2 ring-white/20' : '';
  const label = k === 'free' ? 'Choose Free plan' : 'Choose Premium plan';

  return (
    <div
      role="button"
      aria-pressed={selected}
      aria-label={label}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={`p-8 md:p-12 transition-all duration-300 ease-out hover:-translate-y-2 cursor-pointer ${outline}`}
    >
      <div className="text-center">
        <h3 className="text-[#F8F9FA] font-bold text-3xl mb-2">{data.title}</h3>
        <p className="text-[#D1D5DB] text-2xl mb-8">{data.price}</p>
        
        <ul className="space-y-4 mb-8">
          {data.bullets.map((b) => (
            <li key={b} className="text-[#D1D5DB] text-lg">
              {b}
            </li>
          ))}
        </ul>

        <div className="text-center">
          <span className="text-[#9CA3AF] text-sm">Choose plan</span>
        </div>
      </div>
    </div>
  );
}
