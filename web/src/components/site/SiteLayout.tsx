import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SiteNav } from './SiteNav';
import { SiteFooter } from './SiteFooter';
import { AuthDialogs, AuthMode } from './AuthDialogs';

type Props = React.PropsWithChildren<{ defaultPlan?: string }>;

export const SiteLayout: React.FC<Props> = ({ children, defaultPlan }) => {
  const [mode, setMode] = useState<AuthMode>(null);
  const location = useLocation();

  // Scroll to top on route change; if the URL has a hash, scroll to that anchor.
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <SiteNav onSignIn={() => setMode('login')} onGetStarted={() => setMode('register')} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <AuthDialogs mode={mode} setMode={setMode} defaultPlan={defaultPlan} />
    </div>
  );
};

// Page context hook: a simple way for inner pages to trigger the auth dialogs.
// (They just use setMode via the top-of-tree SiteLayout — we expose it through
// a provider so nested cards can open the register dialog without prop-drilling.)
type Ctx = { setMode: (m: AuthMode) => void };
const AuthDialogContext = React.createContext<Ctx>({ setMode: () => {} });
export const useAuthDialog = () => React.useContext(AuthDialogContext);

export const SiteLayoutWithAuthCtx: React.FC<Props> = ({ children, defaultPlan }) => {
  const [mode, setMode] = useState<AuthMode>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  return (
    <AuthDialogContext.Provider value={{ setMode }}>
      <div className="min-h-screen flex flex-col bg-white text-slate-900">
        <SiteNav onSignIn={() => setMode('login')} onGetStarted={() => setMode('register')} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <AuthDialogs mode={mode} setMode={setMode} defaultPlan={defaultPlan} />
      </div>
    </AuthDialogContext.Provider>
  );
};
