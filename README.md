# NagarSetu — AI-Based Grievance Lodging & Tracking System

Frontend foundation for a civic grievance platform. Citizens report issues
(potholes, garbage, water leakage, street lights, drainage, electricity) and the
platform's AI classifies the complaint, detects priority, routes it to the right
department and tracks it to resolution.

**Scope of this codebase: frontend only.** There is no backend, no database and
no mock API server. Screens render from local fixtures in `src/utils/mockData.js`,
and authentication is UI-only — `authService` returns a placeholder session and
never validates a credential.

## Stack

React 19 · Vite 8 · JavaScript (JSX) · Bootstrap 5 (grid + utilities only) ·
Bootstrap Icons · React Router 7 · Axios · plain CSS with a token-based design
system. No Tailwind.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built output |
| `npm run lint` | Oxlint over the source tree |
| `npm run smoke` | Server-renders every route and the authenticated shell, failing on any render error |

`npm run smoke` is the fast regression check. A dev server returns HTTP 200 for
every SPA path whether or not the page renders, so the smoke test renders each
route through React's SSR path instead and surfaces bad imports, undefined
components and prop crashes as real failures.

To point the app at a backend later, copy `.env.example` to `.env` and set
`VITE_API_BASE_URL`. Nothing calls the API client yet.

## Routes

| Path | Screen | Layout |
| --- | --- | --- |
| `/` | Landing page (11 sections) | `PublicLayout` |
| `/track` | Public complaint lookup by ID | `PublicLayout` |
| `/login` | Sign in, with demo-login shortcut | `AuthLayout` |
| `/register` | Create account | `AuthLayout` |
| `/citizen/dashboard` | Citizen dashboard | `ProtectedRoute` → `DashboardLayout` |
| `*` | Not found | — |

Paths live in `PATHS` (`src/utils/constants.js`) so links and route guards can't
drift apart. `ProtectedRoute` takes an `allow` list of roles and redirects to
`/login` when the UI-only session doesn't match.

## Structure

```
src/
├── components/
│   ├── common/       Button, Card, StatCard, StatusBadge, PriorityBadge,
│   │                 Modal, ToastStack, LoadingSpinner, EmptyState,
│   │                 PageHeader, Breadcrumb, FormField, Avatar,
│   │                 SectionHeading, RoleSwitch
│   ├── complaints/   ComplaintCard, ComplaintStatusTracker
│   ├── dashboard/    WelcomeBanner, QuickActionCard
│   ├── landing/      Hero, AIWorkflow, CivicProblems, WhyPlatform,
│   │                 HowItWorks, Features, StatsBand, Benefits, CTASection
│   └── layout/       Navbar, Sidebar, Topbar, Footer, Brand
├── context/          AuthContext, ToastContext (+ contexts.js)
├── hooks/            useAuth, useToast, useCountUp, useScrollReveal,
│                     useMediaQuery, useScrollPosition, useDocumentTitle
├── layouts/          PublicLayout, AuthLayout, DashboardLayout
├── pages/            Landing, TrackComplaint, NotFound,
│                     auth/{Login,Register}, citizen/Dashboard
├── routes/           AppRoutes, ProtectedRoute, ScrollToTop
├── services/         apiClient, authService, complaintService
├── styles/           tokens, base, utilities, components, landing,
│                     auth, animations (chained from index.css)
└── utils/            constants, formatters, validators, mockData
```

Context objects live in `src/context/contexts.js`, separate from the provider
components, so each provider module exports only components — required by the
react-refresh lint rule.

## Design system

All visual decisions come from custom properties in `src/styles/tokens.css`:
colour ramps, spacing scale, radii, shadows, typography, easing curves and a
z-index scale. Bootstrap's `--bs-*` variables are bridged onto those tokens so
the grid and utilities inherit the palette instead of fighting it.

Visuals are CSS-only — no stock photography. Depth comes from blurred radial
`.glow` elements, dot grids and layered cards. Every `.glow` needs a sizing
class alongside it, since the base class sets no dimensions.

Motion is restrained: scroll-reveal on section entry, count-up on statistics,
and short transitions on interactive states. Everything collapses under
`prefers-reduced-motion: reduce`.

## Where the backend plugs in

`src/services/` is the only layer that would change. Each function carries a
`TODO(api):` comment marking the exact line to swap for an `apiClient` call:

- `authService` — `login`, `register`, `demoLogin`, `logout`
- `complaintService` — `getMyComplaints`, `getMyStats`, `getComplaintById`, `trackComplaint`

`apiClient` already attaches the bearer token and `Accept-Language` header,
normalises error shapes to `{ status, message, original }`, and clears the
stored session on a 401.

## Not built yet

Lodge Complaint form (text, voice, image upload), complaint detail page, the
officer/admin dashboards behind the existing role foundation, notifications,
profile settings, and real i18n wiring for the multilingual UI.
