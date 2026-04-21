import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Props = {
  onSignIn: () => void;
  onGetStarted: () => void;
};

const links = [
  { to: '/features',     label: 'Features' },
  { to: '/providers',    label: 'Providers' },
  { to: '/pricing',      label: 'Pricing' },
  { to: '/developers',   label: 'Developers' },
  { to: '/about',        label: 'About' },
];

export const SiteNav: React.FC<Props> = ({ onSignIn, onGetStarted }) => {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">SchoolPay</span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-medium">SaaS</Badge>
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-slate-700">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `hover:text-slate-900 transition-colors ${isActive ? 'text-blue-700 font-semibold' : ''}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" onClick={onSignIn}>Sign In</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={onGetStarted}>Get Started</Button>
        </div>
        <button
          className="md:hidden p-2 rounded-lg border border-slate-200"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-2 py-2 rounded-md text-sm ${isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => { onSignIn(); setOpen(false); }}>Sign In</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => { onGetStarted(); setOpen(false); }}>Get Started</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
