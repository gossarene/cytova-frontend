# Cytova Frontend

React + TypeScript SPA for the Cytova medical laboratory SaaS platform.

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
```

The dev server proxies `/api` to `http://localhost:8000` (Django backend).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 3000) |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router v6 (data router) |
| Server state | TanStack Query |
| Client state | Zustand (auth store) |
| Forms | React Hook Form + Zod |
| UI | shadcn/ui + Tailwind CSS v4 |
| HTTP | Axios (JWT interceptors) |
| Icons | Lucide React |
| Toasts | Sonner |

## Project Structure

```
src/
├── config/          # Environment, constants, route paths
├── lib/
│   ├── api/         # Axios client, query client, API types
│   ├── auth/        # Zustand auth store, JWT utils, types
│   ├── permissions/ # Permission constants, hooks, <Can> component
│   └── utils/       # cn(), date/currency formatters
├── components/
│   ├── ui/          # shadcn/ui primitives (button, input, dialog, ...)
│   └── shared/      # Composed app components (PageHeader, StatusBadge, ...)
├── layouts/         # AuthLayout, TenantLayout, PublicLayout, PlatformLayout
├── guards/          # AuthGuard, GuestGuard, PermissionGuard, ...
├── pages/           # Auth, public, platform, error pages
├── modules/         # Feature modules (dashboard, patients, requests, ...)
└── router/          # Route definitions split by layer
```

## Three Application Layers

| Layer | URL | Layout |
|-------|-----|--------|
| Public website | `cytova.io` | PublicLayout |
| Auth | `{lab}.cytova.io/login` | AuthLayout |
| Tenant app | `{lab}.cytova.io/*` | TenantLayout (sidebar + topbar) |
| Platform admin | `admin.cytova.io/platform/*` | PlatformLayout |

## Permission System

Permissions use `module.action` codes (e.g. `patients.create`, `results.publish`). The JWT contains a `permissions` array hydrated into a `Set<string>` in the auth store.

```tsx
// Hook
const canPublish = usePermission('results.publish')

// Component
<Can permission="results.publish">
  <Button>Publish</Button>
</Can>
```

Sidebar navigation auto-filters based on user permissions via `useSidebarNav()`.

## Environment Variables

Copy `.env.example` to `.env.local`:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api/v1` | Backend API base path |
| `VITE_PLATFORM_API_BASE_URL` | — | Platform admin API URL |
| `VITE_APP_NAME` | `Cytova` | Application display name |

## Design System

- **Primary**: Teal (#0D9488) — healthcare-oriented
- **Font**: Inter (self-hosted, 400/500/600/700)
- **Dark mode**: CSS variables ready, not activated in Phase 1
- **Status colors**: Mapped to entity states (DRAFT=slate, CONFIRMED=blue, IN_PROGRESS=amber, COMPLETED=emerald, etc.)
