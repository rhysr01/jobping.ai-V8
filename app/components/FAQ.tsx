'use client';

import { useState } from 'react';
import { FAQ_DATA } from '@/data/faq';
import { ChevronDown } from 'lucide-react';

type FAQItem = { question: string; answer: string };

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0])); // First item open by default

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className="py-20 md:py-28 bg-black scroll-mt-20 md:scroll-mt-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="bg-white/5 rounded-xl p-6 md:p-8 border border-white/10">
          <h2 className="text-white font-semibold text-lg md:text-xl mb-6 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {FAQ_DATA.map((item: FAQItem, index: number) => (
              <button
                key={index}
                onClick={() => toggleItem(index)}
                className="w-full bg-[#0a0a0a] hover:bg-[#111111] rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all text-left group"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-medium">{item.question}</h3>
                  <span className="text-white/40 group-hover:text-white/60 transition transform group-hover:scale-110">
                    {openItems.has(index) ? '−' : '+'}
                  </span>
                </div>
                {openItems.has(index) && (
                  <p className="text-[#a0a0a0] mt-4 leading-relaxed">
                    {item.answer}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
