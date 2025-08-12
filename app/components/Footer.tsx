'use client';

import { motion } from 'framer-motion';
import { Mail, Shield, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0B0B0F] border-t border-[#374151] py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-[#0B0B0F] font-black text-sm">J</span>
              </div>
              <h3 className="text-white font-bold text-xl">JobPing</h3>
            </div>
            <p className="text-[#9CA3AF] leading-relaxed mb-6 max-w-md">
              AI-powered job matching for students and graduates. Stop scrolling job boards, 
              start landing interviews with personalized opportunities delivered to your inbox.
            </p>
            <div className="flex items-center gap-6 text-[#6B7280] text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>EU Friendly</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[#F8F9FA] font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-[#9CA3AF]">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">AI Matching</a></li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="text-[#F8F9FA] font-semibold mb-4">Support</h4>
            <ul className="space-y-3 text-[#9CA3AF]">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#374151] pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[#6B7280] text-sm">
              © 2024 JobPing AI. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[#6B7280] text-sm">
                <Mail className="w-4 h-4" />
                <span>support@jobping.ai</span>
              </div>
              <div className="text-[#6B7280] text-sm">
                Response within 24 hours
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}