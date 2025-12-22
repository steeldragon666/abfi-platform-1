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
| RSIE tRPC Routers | Claude Code | Pending | Next priority |
| Unified Sidebar Navigation | Claude Code | Complete | AppLayout wraps all pages |
| Bankability Rating Framework v3.0 | Claude Code | Complete | 16 projects, AAA-CCC taxonomy |
| Map Integration (Leaflet) | Claude Code | Complete | 16 biofuel projects, 50km catchments |
| Stealth Discovery Backend | Claude Code | Complete | tRPC router + 5 data connectors |
| Explainer Graphics | Manus | In Progress | 7 sets of 6-panel graphics |
| Landing Page Mockups | Manus | Complete | 3 design alternatives |
| Data Source Research | Manus | Running | FIRMS, Tomorrow.io, Open-Meteo |

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

### From Claude Code (Latest Session - 2025-12-22)

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

*Last updated: 2025-12-22 by Claude Code*
