# SchoolPay — web client

Vite + React + TypeScript + Tailwind + shadcn/ui frontend for the multi-tenant School Payment SaaS.

Talks to the Express/Postgres API in `../src` over `/api/*`. No Supabase client — auth is JWT issued by `/api/auth/login`.

## Scripts

```bash
npm install
npm run dev        # vite dev server on :8080
npm run build      # production build to dist/
npm run preview    # preview the production build
npm run lint       # eslint
```

## Environment

The dev server proxies `/api/*` and `/webhooks/*` to `http://localhost:3000` (the Express backend). Start the backend in a second terminal with `npm start` from the repo root.

## Project layout

```
src/
  components/
    ui/                shadcn/ui primitives
    dashboard/         Layout + page-specific components
      pages/           One component per route (Overview, Students, …)
    landing/           Marketing + signup/login
    AppLayout.tsx      Auth gate: Landing vs Dashboard
    theme-provider.tsx Light/dark/system
  contexts/
    AuthContext.tsx    JWT token, current user, current school
    AppContext.tsx     Sidebar open/close
  hooks/
    usePermissions.ts  Role → permission mapping
    use-mobile.tsx
    use-toast.ts
  lib/
    api.ts             `fetch`-based client for /api/*
    format.ts          Currency, date, status/provider colors
    utils.ts           cn()
  pages/
    Index.tsx, NotFound.tsx
```
