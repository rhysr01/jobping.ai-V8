import { Star, MapPin, Clock, TrendingUp } from 'lucide-react';

export default function JobPreview() {
  const jobs = [
    { 
      title: 'Graduate Frontend Developer', 
      company: 'Adyen', 
      location: 'Amsterdam', 
      match: 94, 
      type: 'Graduate Programme',
      posted: '2 hours ago',
      trending: true
    },
    { 
      title: 'Junior Data Analyst', 
      company: 'Spotify', 
      location: 'Stockholm', 
      match: 87, 
      type: 'Entry-level',
      posted: '4 hours ago',
      trending: false
    },
    { 
      title: 'Associate Consultant', 
      company: 'Booking.com', 
      location: 'Amsterdam', 
      match: 91, 
      type: 'Graduate Role',
      posted: '1 hour ago',
      trending: true
    }
  ];

  return (
    <section className="py-32 bg-black relative overflow-hidden">
      {/* Sophisticated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-zinc-300/[0.02] to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-radial from-zinc-400/[0.015] to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-gradient-to-b from-white via-zinc-100 to-zinc-300 bg-clip-text mb-8 tracking-[-0.02em]">
            What lands in your inbox
          </h2>
          <p className="text-2xl text-zinc-400 leading-relaxed">
            Premium job matches, delivered twice weekly
          </p>
        </div>

        {/* Ultra Premium Email Container */}
        <div className="relative group">
          {/* Multi-layer Glow System */}
          <div className="absolute -inset-6 bg-gradient-to-r from-zinc-500/10 via-zinc-300/5 to-zinc-500/10 rounded-[3rem] blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
          <div className="absolute -inset-3 bg-gradient-to-r from-zinc-400/8 via-zinc-200/4 to-zinc-400/8 rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
          
          {/* Main Email Container */}
          <div className="relative bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 backdrop-blur-3xl rounded-[2rem] border border-zinc-700/50 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
            
            {/* Glass Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-white/[0.01] pointer-events-none" />
            
            <div className="relative p-12">
              {/* Premium Email Header */}
              <div className="flex items-center gap-6 pb-10 mb-10 border-b border-zinc-700/60">
                {/* Enhanced Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-zinc-600/80 to-zinc-800/60 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-zinc-500/40 shadow-xl">
                    <span className="text-white font-bold text-2xl tracking-tight">J</span>
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-zinc-900 shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-white font-bold text-3xl mb-3 tracking-[-0.01em]">Your JobPing Matches</h3>
                  <div className="flex items-center gap-4 text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-lg">Tuesday, 8:00 AM</span>
                    </div>
                    <div className="w-1 h-1 bg-zinc-600 rounded-full" />
                    <span className="text-lg font-medium text-zinc-300">3 perfect matches</span>
                  </div>
                </div>

                {/* Premium Badge */}
                <div className="bg-gradient-to-r from-zinc-700/60 to-zinc-800/40 backdrop-blur-sm px-4 py-2 rounded-full border border-zinc-600/50 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-white font-medium">Premium</span>
                  </div>
                </div>
              </div>

              {/* Ultra Premium Job Cards */}
              <div className="space-y-8">
                {jobs.map((job, i) => (
                  <div key={i} className="relative group/card">
                    {/* Card Glow Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-zinc-600/20 via-zinc-400/10 to-zinc-600/20 rounded-2xl blur opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative bg-gradient-to-r from-zinc-900/80 via-zinc-900/60 to-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-700/40 group-hover/card:border-zinc-600/60 transition-all duration-500 overflow-hidden">
                      
                      {/* Card Glass Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-white/[0.01] to-white/[0.03] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      
                      <div className="relative p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1">
                            <div className="flex items-start gap-4 mb-4">
                              <div>
                                <h4 className="text-white font-bold text-2xl mb-2 tracking-[-0.01em] group-hover/card:text-zinc-100 transition-colors">
                                  {job.title}
                                </h4>
                                <div className="flex items-center gap-3 text-zinc-400 text-lg">
                                  <span className="font-semibold text-zinc-300">{job.company}</span>
                                  <div className="w-1 h-1 bg-zinc-500 rounded-full" />
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{job.location}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Trending Badge */}
                              {job.trending && (
                                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-orange-400/30">
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-orange-400" />
                                    <span className="text-orange-300 text-xs font-semibold">Trending</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Premium Match Badge */}
                          <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-green-400/30 to-emerald-500/30 rounded-full blur opacity-60" />
                            <div className="relative bg-gradient-to-r from-green-400/20 to-emerald-500/20 backdrop-blur-sm px-5 py-3 rounded-full border border-green-400/40 shadow-xl">
                              <span className="text-green-300 font-bold text-lg">{job.match}% match</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Job Meta Information */}
                        <div className="flex items-center gap-6 text-zinc-500">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                            <span className="font-medium">{job.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{job.posted}</span>
                          </div>
                        </div>

                        {/* Subtle Action Hint */}
                        <div className="mt-6 pt-6 border-t border-zinc-800/50 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 text-sm">Perfect for recent graduates</span>
                            <div className="flex items-center gap-1 text-zinc-500">
                              <div className="w-1 h-1 bg-zinc-500 rounded-full animate-pulse" />
                              <div className="w-1 h-1 bg-zinc-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}} />
                              <div className="w-1 h-1 bg-zinc-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Email Footer with Premium Touches */}
              <div className="mt-12 pt-8 border-t border-zinc-700/50">
                <div className="flex items-center justify-between">
                  <div className="text-zinc-400">
                    <p className="text-lg">More graduate opportunities coming Thursday at 8:00 AM</p>
                  </div>
                  <div className="bg-gradient-to-r from-zinc-800/60 to-zinc-900/40 backdrop-blur-sm px-4 py-2 rounded-full border border-zinc-700/40">
                    <span className="text-zinc-300 font-medium">Powered by AI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
