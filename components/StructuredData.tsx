export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "JobPing",
    "description": "No logins. Zero scrolling. Jobs in your inbox. Weekly matches for early-career roles across Europe.",
    "url": "https://www.getjobping.com",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR",
      "description": "Free tier with 5 jobs per week"
    },
    "featureList": [
      "AI-powered job matching",
      "Weekly email delivery",
      "Early-career focused",
      "European job market",
      "No spam, unsubscribe anytime"
    ],
    "publisher": {
      "@type": "Organization",
      "name": "JobPing",
      "url": "https://www.getjobping.com"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
