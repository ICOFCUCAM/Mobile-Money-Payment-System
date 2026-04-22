import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, GraduationCap, ArrowRight } from 'lucide-react';

type Props = {
  onSignIn: () => void;
  onGetStarted: () => void;
};

const links = [
  { to: '/',           label: 'Home',         end: true },
  { to: '/features',   label: 'Features' },
  { to: '/providers',  label: 'Providers' },
  { to: '/developers', label: 'Developers' },
  { to: '/pricing',    label: 'Pricing' },
  { to: '/about',      label: 'About' },
];

/**
 * Premium SaaS nav — translucent navy that turns solid on scroll. Gold hover
 * accent, royal-blue "Get Started" pill.
 */
export const SiteNav: React.FC<Props> = ({ onSignIn, onGetStarted }) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // On the dark hero we want the nav transparent; on scroll / inner pages it's solid.
  const solid = scrolled || pathname !== '/';

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-md ${
        solid
          ? 'bg-navy/95 border-b border-white/10 shadow-lg shadow-navy/20'
          : 'bg-navy/60 border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-royal to-royal-700 flex items-center justify-center shadow-md shadow-royal/40 ring-1 ring-white/10">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">SchoolPay</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[14px] text-white/85">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `transition-colors hover:text-gold ${
                  isActive ? 'text-gold font-semibold' : ''
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={onSignIn} className="text-white/90 hover:text-white transition-colors text-[14px] px-3 py-1.5">
            Sign in
          </button>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-1.5 bg-royal hover:bg-royal-700 text-white text-[14px] font-semibold px-4 py-2 rounded-full shadow-md shadow-royal/30 transition-colors"
          >
            Start Free Trial <ArrowRight className="w-3.5 h-3.5" />
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
        <div className="md:hidden border-t border-white/10 bg-navy">
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
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { onSignIn(); setOpen(false); }}
                className="flex-1 py-2 rounded-full border border-white/30 text-white"
              >
                Sign in
              </button>
              <button
                onClick={() => { onGetStarted(); setOpen(false); }}
                className="flex-1 py-2 rounded-full bg-royal text-white font-semibold"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
