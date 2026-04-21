import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Facebook, Twitter, Linkedin, Mail, Globe2 } from 'lucide-react';

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
  <footer className="relative bg-navy text-slate-300 overflow-hidden">
    {/* Top gold hairline accent */}
    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
    {/* Soft glow blob */}
    <div className="absolute -top-32 right-0 w-[520px] h-[520px] rounded-full bg-royal/10 blur-3xl pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 grid lg:grid-cols-12 gap-12">
      <div className="lg:col-span-4">
        <Link to="/" className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal to-royal-700 flex items-center justify-center shadow-md shadow-royal/40 ring-1 ring-white/10">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">SchoolPay</span>
        </Link>
        <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
          The multi-tenant mobile-money payment platform built for schools across Africa. MTN, Orange, and
          Airtel — verified, credited, and audited in under two seconds.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full bg-white/5 hover:bg-royal hover:text-white border border-white/10 flex items-center justify-center transition-colors text-slate-400">
            <Twitter className="w-4 h-4" />
          </a>
          <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-white/5 hover:bg-royal hover:text-white border border-white/10 flex items-center justify-center transition-colors text-slate-400">
            <Linkedin className="w-4 h-4" />
          </a>
          <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/5 hover:bg-royal hover:text-white border border-white/10 flex items-center justify-center transition-colors text-slate-400">
            <Facebook className="w-4 h-4" />
          </a>
          <a href="mailto:hello@schoolpay.example" aria-label="Email" className="w-9 h-9 rounded-full bg-white/5 hover:bg-royal hover:text-white border border-white/10 flex items-center justify-center transition-colors text-slate-400">
            <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="text-xs uppercase tracking-widest text-gold font-semibold mb-4">Product</div>
        <ul className="space-y-2.5 text-sm">
          <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
          <li><Link to="/providers" className="hover:text-white transition-colors">Providers</Link></li>
          <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
          <li><Link to="/developers" className="hover:text-white transition-colors">API</Link></li>
          <li><Link to="/pay" className="hover:text-white transition-colors">Hosted Pay</Link></li>
        </ul>
      </div>

      <div className="lg:col-span-2">
        <div className="text-xs uppercase tracking-widest text-gold font-semibold mb-4">Developers</div>
        <ul className="space-y-2.5 text-sm">
          <li><Link to="/developers" className="hover:text-white transition-colors">Documentation</Link></li>
          <li><Link to="/developers#api" className="hover:text-white transition-colors">REST API</Link></li>
          <li><Link to="/developers#widget" className="hover:text-white transition-colors">Widget</Link></li>
          <li><Link to="/developers#webhooks" className="hover:text-white transition-colors">Webhooks</Link></li>
          <li><Link to="/developers#errors" className="hover:text-white transition-colors">Error codes</Link></li>
        </ul>
      </div>

      <div className="lg:col-span-2">
        <div className="text-xs uppercase tracking-widest text-gold font-semibold mb-4">Company</div>
        <ul className="space-y-2.5 text-sm">
          <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
          <li><a href="/health" className="hover:text-white transition-colors">Status</a></li>
          <li><Link to="/developers#support" className="hover:text-white transition-colors">Support</Link></li>
          <li><a href="mailto:hello@schoolpay.example" className="hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>

      <div className="lg:col-span-2">
        <div className="text-xs uppercase tracking-widest text-gold font-semibold mb-4 flex items-center gap-1.5">
          <Globe2 className="w-3.5 h-3.5" /> Available in
        </div>
        <div className="grid grid-cols-4 gap-2">
          {COUNTRIES.map((c) => (
            <div
              key={c.name}
              title={c.name}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg hover:bg-white/10 transition-colors"
            >
              <span aria-label={c.name}>{c.flag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="relative border-t border-white/10 bg-navy-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>© {new Date().getFullYear()} SchoolPay. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Cookies</a>
          <a href="#" className="hover:text-white transition-colors">Security</a>
        </div>
      </div>
    </div>
  </footer>
);
