import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSentry } from './lib/sentry'
import { ErrorBoundary } from './components/ErrorBoundary'

// Fire-and-forget. No-op when VITE_SENTRY_DSN is unset.
initSentry();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
