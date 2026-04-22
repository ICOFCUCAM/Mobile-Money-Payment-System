import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import ApiKeyRevealDialog from "@/components/ApiKeyRevealDialog";

// Home loads eagerly — it's the landing page, first paint matters.
import Home from "./pages/site/Home";

/*
 * Everything else is lazy-loaded. React splits each import() into its own
 * chunk; Vite emits a separate JS file per route. That means a visitor who
 * lands on / only downloads ~200KB (Home + shared vendor), not the whole
 * site + dashboard + Subscribe flow + BillingAdmin UI + react-simple-maps.
 * Each additional route fetches just-in-time when clicked.
 */
const Features       = lazy(() => import("./pages/site/Features"));
const Providers      = lazy(() => import("./pages/site/Providers"));
const Pricing        = lazy(() => import("./pages/site/Pricing"));
const About          = lazy(() => import("./pages/site/About"));
const Developers     = lazy(() => import("./pages/site/Developers"));
const Pay            = lazy(() => import("./pages/site/Pay"));
const Subscribe      = lazy(() => import("./pages/Subscribe"));
const BillingAdmin   = lazy(() => import("./pages/BillingAdmin"));
const NotFound       = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword  = lazy(() => import("./pages/ResetPassword"));

// The dashboard stack is the heaviest — ~30 shadcn/ui components + recharts +
// framer-motion code paths we don't need until a user logs in. Split it out.
const DashboardLayout = lazy(() => import("@/components/dashboard/DashboardLayout"));

const queryClient = new QueryClient();

/** Full-page spinner shown while a lazy chunk is loading. */
const ChunkFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

/**
 * Authenticated users always land in the dashboard regardless of the current path
 * (so refreshing on /features while logged in still shows the app). Unauthenticated
 * users see the marketing site pages.
 */
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <ChunkFallback />;
  if (user) {
    return (
      <AppProvider>
        <Suspense fallback={<ChunkFallback />}>
          <DashboardLayout />
        </Suspense>
      </AppProvider>
    );
  }
  return <>{children}</>;
};

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          {/* Renders regardless of auth state — survives the guest→
               authenticated flip that happens the instant register() runs. */}
          <ApiKeyRevealDialog />
          <BrowserRouter>
            <Suspense fallback={<ChunkFallback />}>
              <Routes>
                {/* Hosted pay page works for both auth and anon — public UX */}
                <Route path="/pay" element={<Pay />} />
                {/* Billing / subscribe — requires auth, pure page (no dashboard chrome) */}
                <Route path="/billing/subscribe" element={<Subscribe />} />
                {/* Platform-admin only — server-side enforced */}
                <Route path="/admin/billing" element={<BillingAdmin />} />
                {/* Password reset flows always render */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Marketing site — gated so authenticated users see dashboard */}
                <Route path="/" element={<AuthGate><Home /></AuthGate>} />
                <Route path="/features" element={<AuthGate><Features /></AuthGate>} />
                <Route path="/providers" element={<AuthGate><Providers /></AuthGate>} />
                <Route path="/pricing" element={<AuthGate><Pricing /></AuthGate>} />
                <Route path="/developers" element={<AuthGate><Developers /></AuthGate>} />
                <Route path="/about" element={<AuthGate><About /></AuthGate>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
