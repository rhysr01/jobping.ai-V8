export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "JobPing",
    "description": "Weekly job matches for early-career roles across Europe — delivered to your inbox. 5 hand-picked roles per email.",
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
