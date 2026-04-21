import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Settings2, BookOpen, Info, Facebook, Twitter, Linkedin } from 'lucide-react';

// Pan-African markets we launch into (flag emojis render in all modern browsers).
const COUNTRIES: { name: string; flag: string }[] = [
  { name: 'Cameroon',      flag: '🇨🇲' },
  { name: 'Nigeria',       flag: '🇳🇬' },
  { name: 'Ghana',         flag: '🇬🇭' },
  { name: "Côte d'Ivoire", flag: '🇨🇮' },
  { name: 'Senegal',       flag: '🇸🇳' },
  { name: 'Kenya',         flag: '🇰🇪' },
  { name: 'Uganda',        flag: '🇺🇬' },
  { name: 'Tanzania',      flag: '🇹🇿' },
  { name: 'Rwanda',        flag: '🇷🇼' },
  { name: 'South Africa',  flag: '🇿🇦' },
  { name: 'Zambia',        flag: '🇿🇲' },
  { name: 'Benin',         flag: '🇧🇯' },
];

export const SiteFooter: React.FC = () => (
  <footer className="bg-brand-dark text-slate-200">
    <div className="max-w-7xl mx-auto px-6 py-14 grid lg:grid-cols-12 gap-10">
      <div className="lg:col-span-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">SchoolPay</span>
        </div>
        <p className="text-sm leading-relaxed text-slate-300 max-w-sm">
          The multi-tenant mobile-money payment platform built for schools across Africa.
        </p>
      </div>

      <div className="lg:col-span-2">
        <div className="flex items-center gap-2 text-white font-semibold mb-4">
          <Settings2 className="w-4 h-4" />
          Solutions
        </div>
        <ul className="space-y-2 text-sm">
          <li><Link to="/features" className="hover:text-white">Get Paid</Link></li>
          <li><Link to="/providers" className="hover:text-white">Providers</Link></li>
          <li><Link to="/features#multi-tenant" className="hover:text-white">Multi-Tenant</Link></li>
          <li><Link to="/features#security" className="hover:text-white">Security</Link></li>
          <li><Link to="/features#analytics" className="hover:text-white">Analytics</Link></li>
        </ul>
      </div>

      <div className="lg:col-span-3">
        <div className="flex items-center gap-2 text-white font-semibold mb-4">
          <BookOpen className="w-4 h-4" />
          Documentation
        </div>
        <ul className="space-y-2 text-sm">
          <li><Link to="/developers" className="hover:text-white">Introduction</Link></li>
          <li><Link to="/developers#getting-started" className="hover:text-white">Getting Started</Link></li>
          <li><Link to="/developers#api" className="hover:text-white">API Reference</Link></li>
          <li><Link to="/developers#widget" className="hover:text-white">Widget Integration</Link></li>
          <li><Link to="/developers#webhooks" className="hover:text-white">Webhooks</Link></li>
          <li><Link to="/developers#errors" className="hover:text-white">Error Codes</Link></li>
        </ul>
      </div>

      <div className="lg:col-span-2">
        <div className="flex items-center gap-2 text-white font-semibold mb-4">
          <Info className="w-4 h-4" />
          Resources
        </div>
        <ul className="space-y-2 text-sm">
          <li><Link to="/about" className="hover:text-white">About</Link></li>
          <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
          <li><a href="/health" className="hover:text-white">Status</a></li>
          <li><Link to="/developers#support" className="hover:text-white">Support</Link></li>
        </ul>
      </div>

      <div className="lg:col-span-2">
        <div className="text-white font-semibold mb-4">Open API is available in:</div>
        <div className="grid grid-cols-4 gap-2">
          {COUNTRIES.map((c) => (
            <div
              key={c.name}
              title={c.name}
              className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center text-xl"
            >
              <span aria-label={c.name}>{c.flag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="border-t border-slate-800/70">
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-5">
          <Link to="/legal/terms" className="hover:text-white">Terms &amp; Conditions</Link>
          <Link to="/legal/disclaimer" className="hover:text-white">Disclaimer</Link>
          <Link to="/legal/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link to="/legal/cookies" className="hover:text-white">Cookie Policy</Link>
        </div>
        <div className="flex items-center gap-4">
          <span>Follow us</span>
          <a href="#" aria-label="Facebook" className="hover:text-white"><Facebook className="w-4 h-4" /></a>
          <a href="#" aria-label="Twitter" className="hover:text-white"><Twitter className="w-4 h-4" /></a>
          <a href="#" aria-label="LinkedIn" className="hover:text-white"><Linkedin className="w-4 h-4" /></a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pb-5 text-[11px] text-slate-500">
        © {new Date().getFullYear()} SchoolPay SaaS. All rights reserved.
      </div>
    </div>
  </footer>
);
