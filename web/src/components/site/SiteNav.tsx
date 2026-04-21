import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';

type Props = {
  onSignIn: () => void;
  onGetStarted: () => void;
};

/**
 * Nav architecture mirrors the MTN MoMo developer portal:
 *   [ logo ]  [ centered links ]  [ sign-in / sign-up text links ]
 *
 * Palette is OUR blue/indigo (not MTN's teal + gold).
 */
const links = [
  { to: '/',           label: 'Home',         end: true },
  { to: '/features',   label: 'Features' },
  { to: '/providers',  label: 'Providers' },
  { to: '/developers', label: 'Documentation' },
  { to: '/pricing',    label: 'Pricing' },
  { to: '/about',      label: 'About' },
];

export const SiteNav: React.FC<Props> = ({ onSignIn, onGetStarted }) => {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-40 bg-blue-950 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">SchoolPay</span>
        </Link>

        <div className="hidden md:flex items-center gap-9 text-[15px]">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `transition-colors hover:text-blue-300 ${
                  isActive ? 'text-blue-300 font-semibold' : 'text-white/90'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-5">
          <button onClick={onSignIn} className="text-white hover:text-blue-300 transition-colors text-[15px]">
            Sign in
          </button>
          <button
            onClick={onGetStarted}
            className="text-white hover:text-blue-300 transition-colors text-[15px] font-medium"
          >
            Sign up
          </button>
        </div>

        <button
          className="md:hidden p-2 rounded-lg text-white hover:bg-white/10"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-blue-900">
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-2 py-2 rounded-md text-sm ${
                    isActive ? 'bg-white/10 text-blue-300 font-semibold' : 'text-white/90 hover:bg-white/5'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { onSignIn(); setOpen(false); }}
                className="flex-1 py-2 rounded-md border border-white/30 text-white"
              >
                Sign in
              </button>
              <button
                onClick={() => { onGetStarted(); setOpen(false); }}
                className="flex-1 py-2 rounded-md bg-blue-600 text-white font-semibold"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
