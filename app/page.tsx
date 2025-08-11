'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { Pricing } from './components/Pricing';
import { Signup } from './components/Signup';
import { Footer } from './components/Footer';
import { JobCard } from './components/JobCard';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Sample job data for demonstration
  const sampleJobs = [
    {
      title: "Sales Devel",
      company: "TechCorp",
      match: 94,
      location: "dublin,ireland",
      type: "Full-time",
      salary: "$120k - $180k"
    },
    {
      title: "Data Analyst",
      company: "StartupXYZ",
      match: 87,
      location: "Remote",
      type: "Contract",
      salary: "$80k - $120k"
    },
    {
      title: "Product Manager",
      company: "InnovateCo",
      match: 82,
      location: "New York, NY",
      type: "Full-time",
      salary: "$140k - $200k"
    },
    {
      title: "UX Designer",
      company: "DesignStudio",
      match: 78,
      location: "London, UK",
      type: "Full-time",
      salary: "£60k - £90k"
    },
    {
      title: "Backend Engineer",
      company: "ScaleTech",
      match: 91,
      location: "Austin, TX",
      type: "Full-time",
      salary: "$130k - $190k"
    }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-gradient-to-br from-gray-50 to-transparent rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-1/2 w-[600px] h-[600px] bg-gradient-to-tl from-gray-50 to-transparent rounded-full blur-3xl opacity-30" />
      </div>

      <Header />
      
      <main className="relative">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center">
          <Hero />
        </section>
        
        {/* Job Matches Every 48 Hours Preview */}
        <section className="py-40 bg-gradient-to-b from-white to-gray-50/50 relative">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              className="text-center mb-20"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-sm font-medium mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                AI-Curated Matches
              </motion.div>
              <h2 className="text-5xl font-bold text-black mb-8 tracking-tight">
                Your Job Matches Every 48 Hours
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                See what AI-curated opportunities look like in your inbox. 
                Personalized to your skills, experience, and visa status.
              </p>
            </motion.div>
            
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {sampleJobs.map((job, index) => (
                <JobCard
                  key={index}
                  index={index}
                  title={job.title}
                  company={job.company}
                  match={job.match}
                  location={job.location}
                  type={job.type}
                />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-40 bg-white relative">
          <Features />
        </section>

        {/* How It Works Section */}
        <section className="py-40 bg-gradient-to-b from-gray-50/50 to-white relative">
          <HowItWorks />
        </section>

        {/* Pricing Section */}
        <section className="py-40 bg-white relative">
          <Pricing />
        </section>

        {/* Signup Section */}
        <section className="relative">
          <Signup />
        </section>
      </main>

      <Footer />
    </div>
  );
}
