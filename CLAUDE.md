# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project
App Name: Classroom Inspection App

---

## Project Structure
#EVERYTHING SEEMS TO BE GOING WELL***

```
ClassroomInspection/
├── package.json              # root: concurrently scripts (dev/kill) for both servers
│
├── backend/                  # Express + PostgreSQL (pg) API (port 4000)
│   ├── server.js             # app entrypoint — mounts routers, GET /api/health, connects DB, error handler
│   ├── schema.sql            # legacy MSSQL DDL/seed — kept for reference, no longer run
│   ├── schema.postgres.sql   # current DDL + seed data — run via psql against DATABASE_URL
│   ├── .env                  # DATABASE_URL (postgresql://...), PORT, HOURLY_RATE
│   ├── db/
│   │   └── config.js         # pg Pool (connectDB/getPool) + NUMERIC/BIGINT type parsers
│   ├── helpers/
│   │   ├── thresholds.js     # temp/cleanliness alert thresholds + date-range→days mapping
│   │   └── withRetry.js      # retries a read once on a transient DB connection error
│   ├── controllers/
│   │   ├── usersController.js        # Users grid CRUD (list/create/update/delete)
│   │   ├── schoolsController.js      # Schools lookup (list)
│   │   ├── inspectionsController.js  # Inspections list/create
│   │   └── dashboardController.js    # Aggregated dashboard summary query
│   └── routes/
│       ├── users.js          # /api/users
│       ├── schools.js        # /api/schools
│       ├── inspections.js    # /api/inspections
│       └── dashboard.js      # /api/dashboard/summary
│
└── frontend/                 # Next.js 14 App Router (port 3000) — no auth, no Redux
    ├── app/
    │   ├── layout.tsx        # root layout — renders <Header> + children directly
    │   ├── page.tsx          # "/"              → Dashboard screen
    │   ├── users/
    │   │   └── page.tsx      # "/users"         → User Maintenance / Security screen (open to all)
    │   └── inspections/new/
    │       └── page.tsx      # "/inspections/new" → Record Inspection Entry screen
    ├── components/
    │   ├── Header.tsx        # top nav bar — static branding, no user/auth state
    │   ├── dashboard/        # StatCard, TempByDayChart, CleanlinessBySchoolChart
    │   ├── users/            # UsersTable (grid), EditUserModal (combined add/edit + permissions)
    │   └── inspections/      # StarRating
    ├── lib/
    │   └── api.ts            # fetch helpers + types: SchoolsApi, UsersApi, InspectionsApi, DashboardApi
    │                         # resolveApiBase()/apiFetch() probe GET /api/health on :4000, fall back
    │                         # to the Dockerized backend (NEXT_PUBLIC_API_URL_FALLBACK) if it's down
    ├── next.config.js        # rewrites() proxy block is commented out — dead code, see below
    └── tailwind.config.js    # hisd.* color palette used throughout (navy/teal/blue/red/amber/green)
```



### Screens implemented (Phase 1)
| Screen | Route | Backend endpoints |
|---|---|---|
| Dashboard | `/` | `GET /api/dashboard/summary`, `GET /api/schools` |
| Record Inspection Entry | `/inspections/new` | `POST /api/inspections` |
| User Maintenance / Security | `/users` | `GET/POST/PUT/DELETE /api/users`, `GET /api/schools` |

### Database tables (`backend/schema.postgres.sql`)
- `schools` — school_number (PK), school_name
- `users` — school_number (FK), network_id (unique), full_name, is_power_user, is_notification_recipient
- `inspections` — school_number (FK), classroom_number, temperature_reading, issue_description, cleanliness_rating (1-5), cleaning_notes, inspected_by, inspected_at

Controllers alias every column back to the original PascalCase names (`SchoolNumber`, `UserID`, ...) in `SELECT`, so `frontend/lib/api.ts`'s TypeScript types didn't need to change when the DB moved from MSSQL to Postgres. `backend/schema.sql` (T-SQL) is kept only as a historical reference for the pre-migration MSSQL schema — it is not run against anything anymore.

---

## Architecture — Next.js + Express

This app is **two independent servers** that only agree on a JSON contract — there's no Next.js API routes or server actions involved, no shared process.

```
Browser (localhost:3000)
   │
   │  fetch() calls from lib/api.ts (apiFetch → resolveApiBase)
   ▼
Next.js dev server (frontend/)          Express server (backend/, port 4000 — or Docker on 8091)
 - serves React pages/components   ◄───►  - REST API only, no HTML
 - no auth layer, no client state store    - owns all DB access (pg)
   beyond local useState                          │
                                                  ▼
                                           PostgreSQL (ClassroomInspection)
```

`npm run dev` at the root uses `concurrently` to boot both processes side by side ([package.json](package.json)) — they're not aware of each other as code, only as HTTP endpoints. That's why `frontend/lib/api.ts` needs `NEXT_PUBLIC_API_URL=http://localhost:4000/api` — it's telling one server where to find the other over the network. Run `npm run devfrontend` from the root to start only the Next.js dev server (e.g. when pointing at the Dockerized backend instead of a local one).

### Frontend routing (Next.js App Router)

File-system routing: a folder under `app/` becomes a URL segment, and a `page.tsx` inside it renders at that URL.

| Folder | URL | File |
|---|---|---|
| `app/` | `/` | `frontend/app/page.tsx` — Dashboard |
| `app/users/` | `/users` | `frontend/app/users/page.tsx` |
| `app/inspections/new/` | `/inspections/new` | `frontend/app/inspections/new/page.tsx` |

No router config file to maintain — a new screen just needs a new folder. `app/layout.tsx` is the one file that wraps **every** route (that's how `<Header>` ends up on every page without each `page.tsx` importing it).

`layout.tsx` is a **Server Component** by default (no `"use client"`), but `Header.tsx` and every `page.tsx` in this app are `"use client"` because they need `useState`/`useEffect`. A server component can render client components as children; not the reverse.

`Header.tsx`'s nav isn't routing config either — it's a plain array of `{label, href}` mapped to `<Link>`s. Adding a screen to the nav is a manual step, not something the App Router does automatically.

### Backend routing (Express) — router → controller

```
server.js                    routes/*.js                controllers/*.js
─────────                    ────────────                ─────────────────
app.use('/api/users', ──►    router.get('/', ──►         listUsers(req,res)
  usersRouter)                 listUsers)                  → getPool()
                              router.post('/', ──►             .query(text, params)
                                createUser)                  → res.json(...)
```

`server.js` mounts each router at a URL prefix:
```js
app.use('/api/users', usersRouter);
app.use('/api/schools', schoolsRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api/dashboard', dashboardRouter);
```
Each router file just maps an HTTP verb + sub-path to a controller function — no logic lives in the router itself. The controller is where the SQL happens, via the shared connection pool in `backend/db/config.js`.

### How frontend and backend connect

Every screen goes through **one file**: `frontend/lib/api.ts`. No component calls `fetch()` directly — they call `UsersApi.list()`, `DashboardApi.summary()`, etc. That file is the single place that knows the backend's URL/shape, and it's also where the TypeScript types (`AppUser`, `Inspection`, `DashboardSummary`...) live. If the backend's response shape changes, there's exactly one file to update.

Since the frontend (`:3000`) and backend (`:4000`) are different origins, the browser treats this as cross-origin — that's why `app.use(cors())` is in `server.js`. Without it, every `fetch()` from the browser would be blocked by CORS.

**Loose end worth knowing about**: `frontend/next.config.js` has a `rewrites()` block that proxies `/api/:path*` on the Next.js server to the backend. That's a *second*, unused path to the same backend — `lib/api.ts` always calls an absolute URL directly, so this rewrite would never fire even if it were live. It's now commented out (kept in the file for reference, not deleted) rather than being removed outright.

### Local vs. Docker backend fallback

`lib/api.ts` doesn't hardcode one backend URL — `resolveApiBase()` probes `GET http://localhost:4000/api/health` once per page load; if that fails (nothing running locally on :4000), it falls back to `NEXT_PUBLIC_API_URL_FALLBACK` (default `http://localhost:8091/api`, or a LAN IP if set), which is where the Dockerized backend is expected to be exposed (see the `docker run` command further down, which maps container port 4000 → host port 8091). The resolved base is cached in module state (`apiBasePromise`) so only the first API call of a session pays the health-check round trip; every `SchoolsApi`/`UsersApi`/`InspectionsApi`/`DashboardApi` call goes through the shared `apiFetch()` helper that uses it. `GET /api/health` on the backend is a plain `{ status: 'ok' }` route with no DB query, added specifically for this probe.

### A full request, end to end

Loading the Dashboard:
1. Browser hits `/` → Next.js renders `app/page.tsx`.
2. On mount, a `useEffect` calls `DashboardApi.summary({ range, schoolNumber })`.
3. That's a `fetch('http://localhost:4000/api/dashboard/summary?...')`.
4. Express matches `app.use('/api/dashboard', dashboardRouter)` → `router.get('/summary', getSummary)`.
5. `dashboardController.getSummary` runs three SQL queries via `getPool()`, wrapped in `withRetry` for connection resilience.
6. Results come back as JSON, `page.tsx` calls `setSummary(...)`, React re-renders the stat cards and charts.

### Architectural gap: no auth, anywhere

There is currently **no authentication in this app at all** — not client-side, not on the API. MSAL/Azure AD and the Redux `user` slice that used to gate `/users` on `isAdmin` and label the header with a signed-in user's name were removed (see git history / prior CLAUDE.md revisions if you need the old MSAL bootstrap flow). `/users` is now open to anyone who loads the page, the header shows a static "Innovation & Development" label, and `POST /api/inspections` no longer auto-fills `inspectedBy` (it's `null` unless the caller passes it explicitly). The Express backend still has no auth middleware — every endpoint is reachable by anyone who can reach port 4000 (or the Docker container's exposed port). Fine for local/dev use; if this app is ever network-reachable by anyone besides its own frontend, auth needs to be added from scratch on both sides, not just restored.

## Starting the App

### Both servers with one command (recommended)

From the **project root**:

```bash
npm run dev       # start both servers
npm run kill      # kill ports 3000 and 4000
npm run kill && npm run dev   # bounce both servers cleanly
```

Starts backend (port 4000) and frontend (port 3000) simultaneously with color-coded output via `concurrently`.

### Individual servers

```bash
# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev
# — or, from the project root —
npm run devfrontend
```

### First-time setup

```bash
# 1. Install all dependencies
npm run install:all          # installs backend + frontend node_modules
npm install                  # installs root concurrently

# 2. Create the database (run once against PostgreSQL)
#    psql -h localhost -p 5432 -U postgres -d ClassroomInspection -f backend/schema.postgres.sql

# 3. Configure environment
#    backend/.env needs DATABASE_URL pointing at that PostgreSQL instance

# 4. Start
npm run dev            # both servers
npm run devfrontend    # frontend only — e.g. when pointing at the Docker backend on :8091 instead
```

### Run the backend in Docker

Maps container port 4000 → host port 8091, and points it at Postgres running on the host (`host.docker.internal`) rather than `localhost`, since `localhost` inside the container would mean the container itself. This is the backend `resolveApiBase()` falls back to when nothing answers on `:4000/api/health` locally (see [Local vs. Docker backend fallback](#local-vs-docker-backend-fallback) above):

```bash
docker run -d -p 8091:4000 \
  -e DATABASE_URL=postgresql://postgres:5116@host.docker.internal:5432/ClassroomInspection \
  -e PORT=4000 \
  -e HOURLY_RATE=50 \
  classroom-inspection-backend
```

## State management

There is no global state store. Every page (`app/page.tsx`, `app/users/page.tsx`, `app/inspections/new/page.tsx`) manages its own data with local `useState`/`useEffect` and calls straight into `lib/api.ts`. Redux Toolkit, react-redux, and the MSAL-based auth flow that used to populate a global `user` slice (`store/`, `lib/sharedAPI.ts`, `components/Providers.tsx`) were removed — see [Architectural gap: no auth, anywhere](#architectural-gap-no-auth-anywhere) above.

---

## Environment Variables

**`backend/.env`**:
```
PORT=4000
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/ClassroomInspection
HOURLY_RATE=50
```

**`frontend/.env.local`** (optional — both vars have sane localhost defaults in `lib/api.ts` if unset):
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_API_URL_FALLBACK=http://localhost:8091/api
```
