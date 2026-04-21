import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

type Props = {
  onSignIn: () => void;
  onGetStarted: () => void;
};

const links = [
  { to: '/',             label: 'Home',       end: true },
  { to: '/features',     label: 'Features' },
  { to: '/providers',    label: 'Providers' },
  { to: '/developers',   label: 'Documentation' },
  { to: '/pricing',      label: 'Pricing' },
  { to: '/about',        label: 'About' },
];

/**
 * Coin logo badge — gold circle with an "S" styled to echo the MTN MoMo "A" mark.
 * Pure SVG so it scales and never 404s.
 */
const BrandMark: React.FC = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" aria-hidden="true">
    <circle cx="24" cy="24" r="22" fill="#ffc845" />
    <path
      d="M16 30c2 2 5 3 8 3 4 0 7-2 7-5 0-3-3-4-7-5-3-1-5-1-5-3s2-3 5-3c2 0 4 1 6 2l2-3c-2-1-5-2-8-2-4 0-7 2-7 5s3 4 7 5c3 1 5 1 5 3s-2 3-5 3c-2 0-5-1-7-2z"
      fill="#0b4d6b"
    />
  </svg>
);

export const SiteNav: React.FC<Props> = ({ onSignIn, onGetStarted }) => {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-40 bg-brand text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="font-display font-bold text-lg tracking-tight">SchoolPay</span>
        </Link>

        <div className="hidden md:flex items-center gap-9 text-[15px]">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `transition-colors hover:text-gold ${
                  isActive ? 'text-gold font-semibold' : 'text-white/90'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-5">
          <button onClick={onSignIn} className="text-white hover:text-gold transition-colors text-[15px]">
            Sign in
          </button>
          <button
            onClick={onGetStarted}
            className="text-white hover:text-gold transition-colors text-[15px] font-medium"
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
        <div className="md:hidden border-t border-white/10 bg-brand-dark">
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-2 py-2 rounded-md text-sm ${
                    isActive ? 'bg-white/10 text-gold font-semibold' : 'text-white/90 hover:bg-white/5'
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
                className="flex-1 py-2 rounded-md bg-gold text-brand-dark font-semibold"
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
