import React from 'react';
import { CheckCircle2 } from 'lucide-react';

type Tx = {
  student: string;
  country: string;
  flag: string;
  amount: string;
  provider: 'MTN' | 'Orange' | 'Airtel';
  ago: string;
};

const FEED: Tx[] = [
  { student: 'Amina N.',   country: 'Cameroon',  flag: '🇨🇲', amount: '45,000 XAF',  provider: 'MTN',    ago: 'just now' },
  { student: 'Kwame M.',   country: 'Ghana',     flag: '🇬🇭', amount: '850 GHS',     provider: 'MTN',    ago: '2s ago'   },
  { student: 'Zainab O.',  country: 'Nigeria',   flag: '🇳🇬', amount: '30,000 NGN',  provider: 'Airtel', ago: '3s ago'   },
  { student: 'Fatou D.',   country: 'Senegal',   flag: '🇸🇳', amount: '85,000 CFA',  provider: 'Orange', ago: '4s ago'   },
  { student: 'Mary K.',    country: 'Kenya',     flag: '🇰🇪', amount: '12,500 KES',  provider: 'Airtel', ago: '5s ago'   },
  { student: 'Adama S.',   country: "Côte d'Ivoire", flag: '🇨🇮', amount: '55,000 CFA', provider: 'MTN',  ago: '7s ago' },
  { student: 'Grace N.',   country: 'Uganda',    flag: '🇺🇬', amount: '180,000 UGX', provider: 'MTN',    ago: '9s ago'   },
  { student: 'Moussa B.',  country: 'Mali',      flag: '🇲🇱', amount: '60,000 CFA',  provider: 'Orange', ago: '11s ago'  },
  { student: 'Chiamaka A.',country: 'Nigeria',   flag: '🇳🇬', amount: '45,000 NGN',  provider: 'Airtel', ago: '12s ago'  },
  { student: 'Jean-Luc T.',country: 'Cameroon',  flag: '🇨🇲', amount: '120,000 XAF', provider: 'Orange', ago: '15s ago'  },
];

const providerChipCls = (p: Tx['provider']) =>
  p === 'MTN'    ? 'bg-yellow-400 text-yellow-950'
  : p === 'Orange' ? 'bg-orange-500 text-white'
  :                  'bg-red-500 text-white';

const Row: React.FC<{ t: Tx }> = ({ t }) => (
  <div className="shrink-0 inline-flex items-center gap-3 mr-8 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
    <span className="text-base" aria-hidden>{t.flag}</span>
    <span className="text-sm text-white font-medium">{t.student}</span>
    <span className="text-sm text-slate-400">·</span>
    <span className="text-sm text-slate-300">{t.country}</span>
    <span className="text-sm text-slate-400">·</span>
    <span className="text-sm font-mono text-gold font-semibold">{t.amount}</span>
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${providerChipCls(t.provider)}`}>{t.provider}</span>
    <span className="text-[11px] text-slate-500 ml-1">{t.ago}</span>
  </div>
);

/**
 * Scrolling live-transactions ticker. Duplicates the feed so the loop seams
 * invisibly. Pauses on hover.
 */
export const LiveTicker: React.FC = () => (
  <div className="relative overflow-hidden py-3 mask-fade">
    {/* Left/right fade-out masks */}
    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-navy to-transparent z-10 pointer-events-none" />
    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-navy to-transparent z-10 pointer-events-none" />

    <div className="flex items-center animate-ticker hover:[animation-play-state:paused]">
      {[...FEED, ...FEED].map((t, i) => (
        <Row key={i} t={t} />
      ))}
    </div>

    {/* Local keyframes — duplicated so the loop is seamless (feed is doubled). */}
    <style>{`
      @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .animate-ticker { animation: ticker 55s linear infinite; width: max-content; }
    `}</style>
  </div>
);
