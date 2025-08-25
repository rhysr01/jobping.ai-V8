'use client';

import { useSearchParams } from 'next/navigation';

export function SignupHeader() {
  const params = useSearchParams();
  const plan = (params.get('plan') === 'premium' ? 'Premium' : 'Free') as 'Free' | 'Premium';

  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-[#F8F9FA] font-bold text-2xl lg:text-3xl">
        {plan === 'Premium' ? 'Get started — Premium' : 'Get started — Free'}
      </h2>
      <span className="text-[#9CA3AF] text-sm">No credit card required • Cancel anytime</span>
    </div>
  );
}
