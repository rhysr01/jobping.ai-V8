'use client';

import { useEffect } from 'react';

export default function CTASection() {
  useEffect(() => {
    // Listen for Tally form submission events
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === 'https://tally.so' && event.data.includes('Tally.FormSubmitted')) {
        try {
          const data = JSON.parse(event.data);
          console.log('Form submitted:', data);
          
          // You can add custom handling here, like:
          // - Show a success message
          // - Redirect to a thank you page
          // - Track conversion events
          
          // Example: Show a simple alert (you can replace this with better UX)
          alert('Thank you for your submission! We\'ll send you your job matches shortly.');
        } catch (error) {
          console.error('Error parsing Tally form submission:', error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <section id="cta" className="mx-auto max-w-[80rem] px-6 md:px-8 py-20 md:py-24 text-center">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Get 5 instant matches — Free
        </h2>
        <p className="text-lg text-white/80 mb-8">
          Tell us about yourself and we'll find your perfect job matches
        </p>
        <div className="w-full max-w-4xl mx-auto">
          <iframe
            src="https://tally.so/embed/wLqWxQ?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
            width="100%"
            height="600"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            title="JobPing Registration Form"
            className="rounded-lg"
          />
        </div>
      </div>
    </section>
  );
}
