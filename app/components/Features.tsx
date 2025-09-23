import { Search, Mail, Target } from 'lucide-react';

export default function Features() {
  return (
    <section className="py-32 bg-gradient-to-b from-black via-zinc-950 to-black relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
        backgroundSize: '50px 50px'
      }} />
      
      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-gradient-to-b from-white to-zinc-300 bg-clip-text mb-8 tracking-[-0.02em]">
            Real personalised jobs into your inbox
          </h2>
          <p className="text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            AI-curated opportunities from 50+ sources, delivered every 48 hours to EU students and graduates.
          </p>
        </div>

        {/* Premium Glass Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              icon: Target, 
              title: "EU Student-Focused", 
              desc: "Graduate programmes, internships & entry-level roles",
              gradient: "from-zinc-900/50 to-zinc-900/20"
            },
            { 
              icon: Search, 
              title: "AI-Curated", 
              desc: "Hand-picked from 50+ job sources across Europe",
              gradient: "from-zinc-800/60 to-zinc-900/30"
            },
            { 
              icon: Mail, 
              title: "Inbox Delivery", 
              desc: "Personalised job matches delivered twice weekly",
              gradient: "from-zinc-900/40 to-zinc-900/10"
            }
          ].map((item, i) => (
            <div key={i} className={`relative group text-center p-10 rounded-3xl bg-gradient-to-br ${item.gradient} backdrop-blur-xl border border-zinc-700/30 hover:border-zinc-600/50 transition-all duration-500 hover:scale-105`}>
              
              {/* Glass Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-white/[0.01] rounded-3xl pointer-events-none" />
              
              {/* Premium Icon Container */}
              <div className="relative w-20 h-20 bg-gradient-to-br from-zinc-700/50 to-zinc-800/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:from-zinc-600/60 group-hover:to-zinc-700/40 transition-all duration-500 border border-zinc-600/30 group-hover:border-zinc-500/50 group-hover:scale-110">
                <item.icon className="w-9 h-9 text-zinc-300 group-hover:text-white transition-colors duration-300" />
              </div>
              
              <h3 className="text-2xl font-semibold text-white mb-4 tracking-[-0.01em]">{item.title}</h3>
              <p className="text-zinc-400 leading-relaxed text-lg">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
