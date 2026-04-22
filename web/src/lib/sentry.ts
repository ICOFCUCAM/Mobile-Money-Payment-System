/**
 * Frontend Sentry wrapper — opt-in via VITE_SENTRY_DSN.
 *
 * Mirrors the backend wrapper in src/core/sentry.js: if the DSN is unset,
 * every export is a cheap no-op, so call sites don't need to guard.
 *
 * Init is async + lazy so the SDK is only fetched when telemetry is on —
 * no wasted bytes in the main bundle when Sentry is off (local dev, preview
 * deploys without telemetry, etc.).
 */

type SentryLike = typeof import('@sentry/react');

let sentry: SentryLike | null = null;
let initPromise: Promise<SentryLike | null> | null = null;

export function isEnabled() {
  return !!import.meta.env.VITE_SENTRY_DSN;
}

export function initSentry(): Promise<SentryLike | null> {
  if (initPromise) return initPromise;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    initPromise = Promise.resolve(null);
    return initPromise;
  }

  initPromise = import('@sentry/react')
    .then((mod) => {
      mod.init({
        dsn,
        environment: import.meta.env.MODE || 'development',
        release: import.meta.env.VITE_RELEASE || undefined,
        // Start conservative — errors only, no performance tracing yet.
        tracesSampleRate: 0,
        // Chrome extension noise and ad blockers produce a lot of these;
        // cut the obvious ones before they burn the quota.
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'ResizeObserver loop completed with undelivered notifications.',
          'Non-Error promise rejection captured',
        ],
      });
      sentry = mod;
      return mod;
    })
    .catch((err) => {
      // Don't let Sentry itself take down the app. Log and continue.
      // eslint-disable-next-line no-console
      console.warn('[sentry] init failed:', err);
      return null;
    });
  return initPromise;
}

export function setUser(user: { id?: string; email?: string; school_id?: string } | null) {
  if (!sentry) return;
  if (!user) {
    sentry.setUser(null);
    return;
  }
  sentry.setUser({ id: user.id, email: user.email });
  if (user.school_id) sentry.setTag('school_id', user.school_id);
}

export function captureException(err: unknown, ctx?: Record<string, unknown>) {
  if (!sentry) return;
  if (ctx) {
    sentry.withScope((scope) => {
      Object.entries(ctx).forEach(([k, v]) => {
        if (typeof v === 'string') scope.setTag(k, v);
      });
      sentry!.captureException(err);
    });
  } else {
    sentry.captureException(err);
  }
}
