"use client";
import { motion } from "framer-motion";

export default function HowItWorks() {
  const items = [
    { num: 1, title: "Tell us what you want", body: "Your target city, work authorization, language skills, and role preferences. Two minutes, done." },
    { num: 2, title: "We find jobs for you", body: "We monitor 1,000+ companies daily so you don't have to. Filtering, deduplicating, and matching everything to your exact criteria." },
    { num: 3, title: "Get roles that really match you", body: "Every week, one focused email with exactly five roles that fit your profile. Read it in under a minute." },
  ];

  return (
    <section className="section-pad">
      <div className="container-page">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="h2-section text-center px-4"
        >
          Stop searching. Start applying.
        </motion.h2>

        <div className="mt-8 sm:mt-12 grid gap-8 sm:gap-10 md:gap-12 md:grid-cols-3 text-center">
          {items.filter(x => x && x.title).map((x, index) => (
            <motion.div 
              key={x.num} 
              className="relative px-4"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.2,
                ease: [0.23, 1, 0.32, 1]
              }}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.3 }
              }}
            >
              <motion.div 
                className="number-chip mx-auto animate-pulseRing"
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, -5, 5, 0],
                  transition: { duration: 0.4 }
                }}
              >
                {x.num}
              </motion.div>
              <h3 className="mt-5 text-lg sm:text-xl font-semibold">{x.title}</h3>
              <p className="mt-2 p-muted text-sm sm:text-base">{x.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
