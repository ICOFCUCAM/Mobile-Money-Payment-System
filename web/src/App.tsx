import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/site/Home";
import Features from "./pages/site/Features";
import Providers from "./pages/site/Providers";
import Pricing from "./pages/site/Pricing";
import About from "./pages/site/About";
import Developers from "./pages/site/Developers";
import Pay from "./pages/site/Pay";
import Subscribe from "./pages/Subscribe";

const queryClient = new QueryClient();

/**
 * Authenticated users always land in the dashboard regardless of the current path
 * (so refreshing on /features while logged in still shows the app). Unauthenticated
 * users see the marketing site pages.
 */
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (user) {
    return (
      <AppProvider>
        <DashboardLayout />
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
          <BrowserRouter>
            <Routes>
              {/* Hosted pay page works for both auth and anon — public UX */}
              <Route path="/pay" element={<Pay />} />
              {/* Billing / subscribe — requires auth, pure page (no dashboard chrome) */}
              <Route path="/billing/subscribe" element={<Subscribe />} />
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
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
