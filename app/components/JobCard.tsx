'use client';

import { motion } from 'framer-motion';
import { Briefcase, MapPin, Clock } from 'lucide-react';

interface JobCardProps {
  index: number;
  title: string;
  company: string;
  match: number;
  location?: string;
  type?: string;
}

export function JobCard({ index, title, company, match, location, type }: JobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={`group relative overflow-hidden ${
        index === 0 
          ? 'ring-2 ring-black ring-offset-2' 
          : 'hover:ring-2 hover:ring-black hover:ring-offset-2'
      } bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300`}
    >
      {/* Premium Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-black group-hover:text-black transition-colors duration-200 truncate">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 font-medium">{company}</p>
              </div>
              
              {/* Match Score */}
              <div className="flex-shrink-0">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                  className="relative"
                >
                  <span className="inline-flex items-center justify-center w-12 h-12 bg-black text-white font-bold text-sm rounded-lg group-hover:scale-110 transition-transform duration-200">
                    {match}%
                  </span>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </motion.div>
              </div>
            </div>
            
            {/* Meta Information */}
            {(location || type) && (
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{location}</span>
                  </div>
                )}
                {type && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{type}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Premium Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Match Score</span>
            <span className="font-medium">{match}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${match}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 + 0.3, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-black to-gray-700 rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
