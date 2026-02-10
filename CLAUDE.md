# CLAUDE.md — Coaching Assistant

## Project Overview

Hockey Coach Assistant — a full-stack web app for coaches to manage teams, players, practices, drills, and player progress. Built with React + TypeScript on the frontend and Supabase + Vercel serverless functions on the backend.

## Tech Stack

- **Frontend:** React 18, TypeScript 5.2, Vite 5, Tailwind CSS 3, Zustand
- **Backend:** Supabase (PostgreSQL + Auth + Storage), Vercel Functions
- **AI:** Anthropic Claude API
- **Testing:** Vitest, @testing-library/react
- **CI/CD:** GitHub Actions, Vercel

## Commands

```bash
npm run dev        # Start dev server (port 3000)
npm run build      # Production build
npm test           # Run tests with Vitest
npm run lint       # ESLint
npm run format     # Prettier format
```

## Project Structure

```
src/
  components/      # Reusable UI and feature components
  pages/           # Route pages (auth/, coach/, player/, drills/, progress/)
  services/        # Business logic layer (*.service.ts) — all Supabase calls go here
  store/           # Zustand stores (authStore.ts)
  hooks/           # Custom React hooks
  contexts/        # React contexts
  types/           # TypeScript type definitions (index.ts is the main types file)
  lib/             # Utility functions
  config/          # Supabase client setup
  routes/          # Route configuration
  test/            # Test files
api/               # Vercel serverless functions (files/, assistant/)
```

## Key Conventions

- **Imports:** Use `@/` path alias for all project imports.
- **Components:** Functional components only. PascalCase filenames. Props interfaces defined above the component.
- **Services:** Named export objects with async methods. Return `{ data, error }` pattern. Components never call Supabase directly.
- **Types:** Defined in `src/types/index.ts`. PascalCase interfaces. Use `ApiResponse<T>` for API returns.
- **Styling:** Tailwind utility classes only. Custom colors via CSS variables (HSL). Dark mode supported (`class` strategy).
- **State:** Zustand for global auth state. Local `useState` for component state. No Redux.
- **Forms:** react-hook-form for form state.
- **Naming:** PascalCase for components/types, camelCase for services/utils/hooks.
- **Error handling:** Try-catch in services, `{ code, message }` error objects, console.error for debugging.
- **Formatting:** Prettier — 2 spaces, single quotes, 100 char line width.

## Environment Variables

Required in `.env.local`:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Database

Supabase PostgreSQL with Row Level Security (RLS). Key tables: users, profiles, coaches, players, practices, drills, teams, announcements, files. All tables have `created_at` and `updated_at` timestamps.

## User Roles

Two roles: `coach` and `player`. Role-based access enforced via ProtectedRoute component and RLS policies.
