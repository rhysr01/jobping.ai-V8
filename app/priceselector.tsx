import { useState } from 'react';

interface PricingSelectorProps {
  onSelect?: (plan: 'free' | 'premium') => void;
}

export default function PricingSelector({ onSelect }: PricingSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | null>(null);

  const plans = [
    {
      name: 'Free',
      price: '€0',
      tier: 'Free Forever',
      description: 'Ideal for exploring the experience.',
      features: ['5 job matches daily', 'Email delivery', 'Basic filtering'],
      value: 'free'
    },
    {
      name: 'Premium',
      price: '€15',
      tier: 'Monthly Plan',
      description: 'Designed for serious jobseekers.',
      features: ['15 job matches daily', 'Priority AI matching', 'Advanced filters'],
      highlight: true,
      value: 'premium'
    }
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
      {plans.map((plan) => (
        <button
          key={plan.name}
          onClick={() => {
            setSelectedPlan(plan.value);
            onSelect?.(plan.value);
          }}
          className={`text-left p-6 rounded-3xl border transition-all duration-300 group relative overflow-hidden backdrop-blur-md ${
            selectedPlan === plan.value ? 'border-white/40 bg-white/5' : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-2xl font-semibold text-white/90 tracking-tight">{plan.name}</h3>
            <span className="text-xl text-white/70">{plan.price}</span>
          </div>
          <p className="text-white/50 text-sm italic mb-4">{plan.description}</p>
          <ul className="text-white/70 text-sm space-y-2 mb-2">
            {plan.features.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <span className="text-xs text-white/40 uppercase tracking-wider">{plan.tier}</span>
          {selectedPlan === plan.value && (
            <div className="absolute inset-0 bg-white/10 opacity-10 rounded-3xl pointer-events-none" />
          )}
        </button>
      ))}
    </div>
  );
}
