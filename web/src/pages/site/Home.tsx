import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Wallet, ShieldCheck, Bell,
  UserCheck, Phone, FileText, Headphones, Play
} from 'lucide-react';
import { SiteLayoutWithAuthCtx, useAuthDialog } from '@/components/site/SiteLayout';
import { FadeIn } from '@/components/site/motion';

// Unsplash CDN photo URLs — portrait of an African man with a phone, women at a market,
// older gentleman doing a counter transaction. If any fails to load, the surrounding
// brand-colored backdrop still reads cleanly.
const HERO_PHOTO      = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1800&q=80';
const GET_PAID_PHOTO  = 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=1200&q=80';
const PAY_PHOTO       = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80';
const TESTIMONIAL_1   = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80';
const TESTIMONIAL_2   = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80';
const TESTIMONIAL_3   = 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80';
const TESTIMONIAL_4   = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=900&q=80';

const PillOutlineBtn: React.FC<React.PropsWithChildren<{ onClick?: () => void; href?: string; to?: string; className?: string }>> = ({ children, onClick, href, to, className = '' }) => {
  const cls = `inline-flex items-center justify-center px-7 py-2.5 rounded-full border-2 border-brand text-brand font-semibold hover:bg-brand hover:text-white transition-colors ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  if (href) return <a href={href} className={cls}>{children}</a>;
  return <button onClick={onClick} className={cls}>{children}</button>;
};

const HomeInner: React.FC = () => {
  const { setMode } = useAuthDialog();

  return (
    <>
      {/* ────────────────────────────── HERO ────────────────────────────── */}
      <section className="relative bg-brand text-white">
        <div className="relative w-full h-[560px] md:h-[640px] overflow-hidden">
          {/* Background photograph — dimmed so the overlay card reads. */}
          <img
            src={HERO_PHOTO}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.currentTarget.style.display = 'none'); }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand/70 via-brand/30 to-transparent" />

          {/* Overlay glass card on the right */}
          <div className="relative max-w-7xl mx-auto h-full px-6 flex items-center justify-end">
            <div className="max-w-lg w-full bg-brand/60 backdrop-blur-md border border-white/20 rounded-2xl p-8 md:p-10 shadow-2xl">
              <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">
                Unlimit your business growth!
              </h1>
              <p className="mt-4 text-white/85 text-base leading-relaxed">
                Collect and make payments to more than 60 millions of users across AFRICA — with automatic verification,
                student credit, and real-time dashboards.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setMode('register')}
                  className="inline-flex items-center px-7 py-3 rounded-full bg-brand-dark hover:bg-brand-900 text-white font-semibold border border-white/20"
                >
                  Get Started With API
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── DISCOVER PRODUCTS ─────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Discover products you can build with our API
            </h2>
          </FadeIn>

          {/* Get Paid — text left, photo right */}
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-24">
            <FadeIn>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-brand">Get Paid</h3>
              <p className="mt-4 text-slate-700 leading-relaxed max-w-xl">
                Our Get Paid APIs enable schools to collect payments from parents, businesses and students
                in different ways. Trigger a real-time payment within any digital channel (web, app) or issue
                an invoice against a student that can be paid any time through MoMo.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-y-3 gap-x-8 max-w-lg">
                {['Request Payment', 'Payment Status', 'Refund', 'Account Balance', 'Notify'].map((f) => (
                  <div key={f} className="font-semibold text-slate-900">{f}</div>
                ))}
              </div>
              <div className="mt-8">
                <PillOutlineBtn onClick={() => setMode('register')}>Subscribe</PillOutlineBtn>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="rounded-xl overflow-hidden shadow-lg bg-brand-light aspect-[4/3]">
                <img
                  src={GET_PAID_PHOTO}
                  alt="Parents using mobile money to pay school fees"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget.style.display = 'none'); }}
                />
              </div>
            </FadeIn>
          </div>

          {/* Pay — photo left, text right */}
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <FadeIn>
              <div className="rounded-xl overflow-hidden shadow-lg bg-brand-light aspect-[4/3]">
                <img
                  src={PAY_PHOTO}
                  alt="Bursar processing a mobile money transaction"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget.style.display = 'none'); }}
                />
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-brand">Pay</h3>
              <p className="mt-4 text-slate-700 leading-relaxed max-w-xl">
                We enable schools to disburse payments to suppliers, teachers and refunds to parents. Use it
                for salary payments, benefit disbursements, and any outgoing pay-out — including paying
                vendors directly through MoMo.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-y-3 gap-x-8 max-w-lg">
                {['Transfer', 'Transfer Status', 'Account Balance'].map((f) => (
                  <div key={f} className="font-semibold text-slate-900">{f}</div>
                ))}
              </div>
              <div className="mt-8">
                <PillOutlineBtn onClick={() => setMode('register')}>Subscribe</PillOutlineBtn>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─────────────── OTHER SOLUTIONS ─────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Other solutions
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-x-10 gap-y-14">
            {[
              { icon: TrendingUp, title: 'Remittance',
                body: 'The SchoolPay Remittance API enables secure cross-border money transfers via MoMo. Licensed providers send funds directly to a recipient’s wallet in supported countries.' },
              { icon: Wallet,    title: 'Distribute',
                body: 'We enable schools to distribute airtime top-ups, stipends, and bursaries to students and families — and earn commission when partnering with MTN and Orange.' },
              { icon: Phone,     title: 'Channel as a Service',
                body: 'Our Interact API lets schools expose and manage a sub-menu within the MoMo USSD and App channels, making the school’s service visible to millions of MoMo users.' },
              { icon: UserCheck, title: 'KYC / Account Validation',
                body: 'Pull verified KYC information on MoMo consumers directly so you don’t have to collect it from parents — simplifying enrolment and reducing fraud.' },
              { icon: ShieldCheck, title: 'Pre-approval',
                body: 'Use the MoMo PIN to contract parents for recurring tuition plans — each instalment is pre-approved and debits automatically each term.' },
              { icon: Bell,      title: 'Notify',
                body: 'Send customised SMS to MoMo consumers and businesses within a Pay or Get Paid transaction — receipts, reminders, and balance updates included.' },
            ].map((s) => (
              <FadeIn key={s.title}>
                <div className="flex gap-4">
                  <div className="shrink-0 w-14 h-14 rounded-full bg-gold flex items-center justify-center shadow-sm">
                    <s.icon className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-brand mb-2">{s.title}</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── SUCCESS STORIES ─────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
              SchoolPay API Success Stories
            </h2>
          </FadeIn>

          {/* Feature story */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <FadeIn>
              <blockquote className="font-display italic text-2xl md:text-3xl leading-snug text-slate-900">
                “We've seen improvements in accuracy and speed of processing payments with the integration
                of the SchoolPay API.”
              </blockquote>
              <div className="mt-6 font-bold text-slate-900">James Chama</div>
              <div className="text-slate-600 text-sm">Finance Director, Quin Chama Academy</div>
              <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-light text-brand text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-brand" /> Quin Chama · Cameroon
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <VideoCard poster={TESTIMONIAL_1} title="SchoolPay API Success Story with Quin Chama." />
            </FadeIn>
          </div>

          {/* 3 smaller cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { poster: TESTIMONIAL_2, title: 'Greenwood High',
                quote: '“We wanted to tap into the big subscriber base MoMo offers.”',
                name: 'Patience Ankuda' },
              { poster: TESTIMONIAL_3, title: 'Lycée Saint-Joseph',
                quote: '“We’ve made some integrations with SchoolPay APIs, which has eased the work of money transfer.”',
                name: 'Abdul Hamidu Juma' },
              { poster: TESTIMONIAL_4, title: 'Accra International',
                quote: '“We’ve seen improvements in accuracy and speed of processing payments with SchoolPay API.”',
                name: 'Medhi Matovu' },
            ].map((t) => (
              <FadeIn key={t.name}>
                <VideoCard poster={t.poster} title={t.title} compact />
                <p className="mt-4 font-semibold text-slate-900 leading-snug">{t.quote}</p>
                <div className="mt-2 font-bold text-slate-900">{t.name}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── RESOURCES / SUPPORT ─────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: FileText,  title: 'Resources',
                body: 'Read the developer’s guide to the SchoolPay API to get started on your integration.',
                to: '/developers' },
              { icon: Headphones, title: 'Support',
                body: 'Access the SchoolPay API community and support team to ensure your success.',
                to: '/developers#support' },
            ].map((c) => (
              <FadeIn key={c.title}>
                <Link
                  to={c.to}
                  className="block bg-white rounded-2xl p-12 shadow-sm border-b-4 border-gold hover:shadow-lg hover:-translate-y-0.5 transition-all text-center"
                >
                  <c.icon className="w-16 h-16 mx-auto text-brand stroke-[1.5]" />
                  <h3 className="font-display text-2xl font-bold text-slate-900 mt-6">{c.title}</h3>
                  <p className="mt-3 text-slate-600 max-w-sm mx-auto leading-relaxed">{c.body}</p>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

/**
 * A YouTube-style video card placeholder — thumbnail photo with a red play button.
 * Clickable but inert for the marketing site.
 */
const VideoCard: React.FC<{ poster: string; title: string; compact?: boolean }> = ({ poster, title, compact }) => (
  <div className={`relative rounded-lg overflow-hidden shadow-md bg-slate-900 ${compact ? 'aspect-video' : 'aspect-video'}`}>
    <img
      src={poster}
      alt={title}
      className="absolute inset-0 w-full h-full object-cover opacity-80"
      onError={(e) => { (e.currentTarget.style.display = 'none'); }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
    <div className="absolute top-3 left-3 right-3 flex items-center gap-2 text-white text-sm font-semibold drop-shadow">
      <span className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-[10px] font-bold text-brand">▶</span>
      <span className="truncate">{title}</span>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg">
        <Play className="w-7 h-7 text-white fill-white ml-0.5" />
      </div>
    </div>
  </div>
);

const Home: React.FC = () => (
  <SiteLayoutWithAuthCtx>
    <HomeInner />
  </SiteLayoutWithAuthCtx>
);

export default Home;
