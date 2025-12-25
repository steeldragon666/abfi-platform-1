# ABFI Agent Collaboration Context

> Shared context between Claude Code and Manus for coordinated development

## Current Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Routing | Wouter |
| UI | shadcn/ui + Tailwind CSS |
| State/Data | TanStack Query via tRPC |
| Backend | Node.js + Express + tRPC |
| Database | MySQL + Drizzle ORM |
| Auth | Custom session-based (migrating from Supabase) |
| Maps | Leaflet + OpenStreetMap (open-source) |

## Key File Locations

```
drizzle/schema.ts      # Database schema (Drizzle ORM)
server/db.ts           # Database functions (CRUD operations)
server/routers.ts      # Main tRPC router registry
server/futuresRouter.ts # Futures feature router
client/src/App.tsx     # Route definitions
client/src/pages/      # Page components
client/src/components/ # Shared UI components
client/src/lib/trpc.ts # tRPC client setup
```

## Implementation Patterns

### Adding a New Feature

1. **Schema** - Add tables to `drizzle/schema.ts`
2. **DB Functions** - Add CRUD to `server/db.ts`
3. **Router** - Create `server/[feature]Router.ts` and register in `routers.ts`
4. **Pages** - Create pages in `client/src/pages/`
5. **Routes** - Register in `client/src/App.tsx`

### tRPC Procedure Pattern

```typescript
// server/exampleRouter.ts
export const exampleRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getItemsByUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await db.createItem({ ...input, userId: ctx.user.id });
    }),
});
```

### Drizzle Schema Pattern

```typescript
export const items = mysqlTable("items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: int("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

---

## Active Tasks

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| RSIE v2.1 Database Schema | Claude Code | Complete | 15 new tables added |
| RSIE tRPC Routers | Claude Code | Complete | 780+ lines, 8 sub-routers |
| Figma Design Tokens | Claude Code | Complete | Colors, Typography, Spacing, Radius |
| Figma BF Components | Claude Code | Complete | 11 domain components in Figma |
| Unified Sidebar Navigation | Claude Code | Complete | AppLayout wraps all pages |
| Bankability Rating Framework v3.0 | Claude Code | Complete | 16 projects, AAA-CCC taxonomy |
| Map Integration (Leaflet) | Claude Code | Complete | 16 biofuel projects, 50km catchments |
| Stealth Discovery Backend | Claude Code | Complete | tRPC router + 5 data connectors |
| Explainer Graphics | Manus | In Progress | 7 sets of 6-panel graphics |
| Landing Page Mockups | Manus | Complete | 3 design alternatives |
| Data Source Research | Manus | Running | FIRMS, Tomorrow.io, Open-Meteo |
| Figma UI Kit Components | Manus | **NEW** | Design 55 shadcn/ui components |
| Figma Screen Documentation | Manus | **NEW** | Document key app screens |

## Manus AI Coordination

### Project: ABFI Platform v2.1 Upgrade
**Project ID:** `TRVnNPfjGBpknA5nSGuo4C`

### Completed Tasks (with deliverables)
1. **SHA-256 Explainer** - 6 panels ready
2. **Weather Intelligence Explainer** - 6 panels ready
3. **Supply Shock Explainer** - 6 panels ready
4. **Landing Page Mockups** - 3 options (Corporate, Modern, Government)

### Running Tasks
- **RSIE Data Source Research** - API docs for FIRMS, Tomorrow.io, Open-Meteo
- **RSIE Data Architecture Explainer** - 6 panels (just created)
- **Futures Marketplace Explainer** - 6 panels (just created)

### NEW Tasks for Manus (Figma Component Design) - CREATED 2025-12-25
**Figma File:** `Z3htI9lFecgDFrEb4S6Qn2`

1. **UI Kit Component Design** - Task ID: `ch595HvsdLUkkKx8Sz85hq`
   - URL: https://manus.im/app/ch595HvsdLUkkKx8Sz85hq
   - Page: `03_Components — UI Kit`
   - Design all 55 shadcn/ui components with variants

2. **Screen Documentation** - Task ID: `B9nNqzQR2XPS5jDTqvnzgo`
   - URL: https://manus.im/app/B9nNqzQR2XPS5jDTqvnzgo
   - Page: `07_Screens — Core App`
   - Dashboard, Ratings, Futures, RSIE, Stealth Discovery screens

3. **Component States** - Task ID: `bJbeMGhE9TvDXvD4oYpaFm`
   - URL: https://manus.im/app/bJbeMGhE9TvDXvD4oYpaFm
   - Page: `09_States & Empty`
   - Loading, error, empty, success states

### Webhook
URL: `https://abfi.io/api/webhooks/manus`
Webhook ID: `DNwWhJF2F7SMJ6Ka3Zr2hJ`

## Pending Decisions

- ✅ **Landing page design**: Hybrid approach selected
  - Corporate's Navy (#1E3A5A) + Gold (#D4AF37) palette for trust
  - Modern's clean layout with generous whitespace
  - Geometric sans-serif typography (Space Grotesk / Inter)
  - Manus task created: `AeTtya5FzTy9RraUhCo4Hn`
- DATABASE_URL configuration for migration push

## Handoff Notes

### From Claude Code (Latest Session - 2025-12-25)

#### Session Summary: Full Figma Component Library + Manus Delegation

**1. Figma Pages Completed**
- **05_Patterns** - 6 UI pattern sections (Form, Card, List, Navigation, Table, Modal)
- **06_Templates** - 6 page templates (Dashboard, List, Detail, Form, Settings, Empty State)
- **02_Foundations** - Verified (Grid, Breakpoints, Icons, Motion)

**2. UI Kit Started (Page 03)**
- Button (5 variants), Card, Input (4 states), Badge (4 variants), Alert (4 types)
- Remaining 47+ components delegated to Manus

**3. Manus Tasks Created**
- UI Kit Component Design (55 components)
- Screen Documentation (key app screens)
- Component States (loading, error, empty)

---

### From Claude Code (Previous Session - 2025-12-24)

#### Session Summary: Figma Population & RSIE Verification

**1. Figma File Population (Z3htI9lFecgDFrEb4S6Qn2)**
- **01_Tokens Page** - Design tokens: Colors, Typography, Spacing, Radius
- **04_Components — ABFI Domain** - 11 BF components as native Figma elements
- **08_Screens — Marketing** - 3 PNG placeholder frames
- Navigation verified on PAGE 12 and PAGE 13

**2. RSIE tRPC Routers - Verified Complete**
- Router: `server/rsieRouter.ts` (780+ lines, 8 sub-routers)
- All database functions in `server/db.ts`

---

### From Claude Code (Previous Session - 2025-12-23)

#### Session Summary: Platform Redesign Sync

**1. Manus Sync Status**
- Webhook configured: `DNwWhJF2F7SMJ6Ka3Zr2hJ`
- Manus API requires `MANUS_API_KEY` in `.env` for direct calls
- Completed Manus deliverables:
  - SHA-256 Explainer (6 panels)
  - Weather Intelligence Explainer (6 panels)
  - Supply Shock Explainer (6 panels)
  - Landing Page Mockups (3 options)
- Running Manus tasks:
  - RSIE Data Source Research
  - RSIE Data Architecture Explainer
  - Futures Marketplace Explainer

**2. Figma Design Status**
- Target file: `Z3htI9lFecgDFrEb4S6Qn2` (currently empty/untitled)
- SVG components ready in `design/figma-import/` (10 BF components)
- Full spec documentation in `FIGMA_BUILD_INSTRUCTIONS.md`
- Component audit files in `design/references/elements/`

**3. Platform Implementation Audit**
- **UI Components:** 55+ shadcn/ui components ✅
- **Layout Components:** 7 layout primitives ✅
- **Domain Components:** 13 ABFI-specific components ✅
- **Pages:** 90+ pages implemented ✅
- **Design System:** Complete but needs Figma file population

**4. Test Fixes Applied (figma-mcp-write-server)**
- Fixed 3 cross-platform path handling tests
- All 335 tests now passing
- Files modified:
  - `tests/unit/handlers/exports-handler.test.ts`
  - `tests/unit/handlers/images-handler.test.ts`

#### Next Priority Tasks
1. RSIE tRPC routers implementation
2. Populate Figma file with BF components
3. Run `npm run db:push` when DATABASE_URL configured

---

### From Claude Code (Previous Session - 2025-12-22)

#### Major Implementations Completed:

**1. Unified Sidebar Navigation**
- Created `AppLayout.tsx` component with persistent sidebar
- Wrapped entire app in `App.tsx` with AppLayout
- Works for both authenticated and anonymous users
- Shows "Sign In" for guests, user dropdown for authenticated

**2. Bankability Rating Framework v3.0**
- Created 4 comprehensive pages:
  - `/ratings` - BankabilityRatings.tsx (AAA-CCC taxonomy, GC1-GC4, TR1-TR4, CI-A to CI-D)
  - `/ratings/projects` - ProjectRatingsMatrix.tsx (16 projects)
  - `/ratings/project/:id` - ProjectRatingDetail.tsx (individual assessment)
  - `/ratings/carbon-intensity` - CarbonIntensityAnalysis.tsx
- All 16 Australian biofuel projects with lending signals

**3. Leaflet Map Integration (replaced Google Maps)**
- Installed: leaflet, react-leaflet, @types/leaflet
- Created `BiomassMap.tsx` component with:
  - 16 biofuel project markers
  - 50km biomass catchment circles
  - Status-based color coding
  - Layer controls for WMS overlays
- Created `MAPPING_INTEGRATION.md` documentation
- Data sources: Digital Atlas of Australia, ABBA Project

**4. Stealth Discovery Backend**
- Schema: `stealthEntities`, `stealthSignals`, `stealthIngestionJobs` tables
- Router: `stealthRouter.ts` with full tRPC API
- 5 Data Connectors:
  - nswPlanningConnector.ts
  - arenaConnector.ts
  - cefcConnector.ts
  - qldEpaConnector.ts
  - ipAustraliaConnector.ts
- Services: entityResolution.ts, signalScoring.ts
- Frontend uses real tRPC queries (no mock data)

### For Next Agent
- Run `npm run db:push` when DATABASE_URL is configured
- RSIE tRPC routers still pending
- Check Manus task outputs for completed graphics
- Server runs on http://localhost:3004/ (port 3000 often busy)

---

## Quick Commands

```bash
# Dev server
npm run dev

# Run tests
npm test

# Type check
npx tsc --noEmit

# Build
npm run build

# Generate DB migration
npx drizzle-kit generate:mysql
```

---

*Last updated: 2025-12-25 by Claude Code (Opus 4.5)*
