export default function FAQSchema() {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does JobPing work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "JobPing sends you 5 hand-picked early-career job opportunities every week via email. Our AI matches roles to your profile and preferences, saving you hours of job searching."
        }
      },
      {
        "@type": "Question",
        "name": "Is JobPing free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! JobPing offers a free tier with 10 jobs on signup + 5 jobs per week. We also have a premium tier with 10 jobs on signup + 15 jobs per week (3× weekly) and additional features."
        }
      },
      {
        "@type": "Question",
        "name": "What types of jobs does JobPing find?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "JobPing specializes in early-career opportunities including internships, graduate schemes, trainee programs, and entry-level positions across Europe."
        }
      },
      {
        "@type": "Question",
        "name": "Can I unsubscribe anytime?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! You can unsubscribe at any time with one click. No questions asked, no hassle."
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
    />
  );
}
