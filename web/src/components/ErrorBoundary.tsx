import React from 'react';
import { captureException } from '@/lib/sentry';

interface State { error: Error | null }
interface Props { children: React.ReactNode; fallback?: React.ReactNode }

/**
 * Top-level error boundary. Catches render-time React errors, forwards them
 * to Sentry (no-op when telemetry is off), and shows a minimal recovery UI
 * instead of a blank screen.
 *
 * NOTE: error boundaries do NOT catch async errors, event handlers, or
 * errors thrown during initial render of this component itself — those go
 * through window.onerror / unhandledrejection which Sentry hooks when
 * initialised.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, { componentStack: info.componentStack || '' });
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', fontFamily: 'system-ui, sans-serif', background: '#fafafa'
      }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            The page failed to render. Our team has been notified.
          </p>
          <button
            onClick={() => { this.setState({ error: null }); location.reload(); }}
            style={{
              padding: '0.5rem 1rem', background: '#111', color: 'white',
              border: 'none', borderRadius: '0.375rem', cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
