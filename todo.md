# ABFI Platform - Implementation Roadmap

> Aligned with the ABFI Platform Rebuild Implementation Guide

---

## Current Status

**Version**: 3.4.0
**Last Updated**: 2025-12-28
**Focus**: Government API Integrations & Foundation

---

## Phase 1: Foundation (Weeks 1-2)

### Core Infrastructure
- [x] Clone and audit existing codebase
- [x] Database schema with Drizzle ORM (11 tables, 50+ APIs)
- [x] Express.js backend with tRPC
- [x] React frontend with Vite
- [x] Tailwind CSS styling

### Design System
- [ ] Implement design tokens (colors, typography, spacing)
- [ ] Replace all icons with Lucide React
- [ ] Add Inter + Plus Jakarta Sans fonts
- [x] shadcn/ui component library

### Security (Essential Eight)
- [x] Content Security Policy headers
- [x] HSTS enforcement
- [x] XSS protection headers
- [x] Session management with JWT
- [x] Audit logging infrastructure
- [ ] Auth0/Okta integration (IRAP-assessed)
- [ ] MFA implementation

### Authentication
- [x] Development auth system (local JWT)
- [x] OAuth 2.0 framework
- [ ] Production Auth0/Okta setup
- [ ] Role-based access control (grower, developer, lender, government, admin)

---

## Phase 2: Core Components (Weeks 3-4)

### Layout Components
- [x] Dashboard shell layout
- [x] Navigation sidebar
- [x] Top navigation bar
- [x] Page containers

### Data Display
- [x] KPI card components
- [x] Data tables with sorting/pagination
- [x] Charts (Recharts integration)
- [x] Score cards and badges

### Forms
- [x] Multi-step wizard (onboarding flows)
- [x] Form validation with Zod
- [x] File upload components
- [ ] Location picker with map

### Notifications
- [x] Toast notification system (Sonner)
- [x] SSE real-time updates
- [ ] Announcement banner component
- [ ] What's New changelog modal

---

## Phase 3: Role Dashboards (Weeks 5-6)

### Grower Portal
- [x] Producer registration wizard (10 steps)
- [x] Property mapping with boundaries
- [x] Production profile tracking
- [x] Carbon intensity calculator
- [x] Contract management
- [x] Marketplace listing
- [ ] Settings interface

### Developer Portal
- [x] Project registration flow
- [x] Bankability assessment wizard
- [x] Supply agreement management
- [x] Concentration analysis (HHI)
- [ ] Stress testing scenarios

### Lender Portal
- [x] Read-only monitoring dashboard
- [x] Covenant status indicators
- [x] Contract renewal alerts
- [ ] Portfolio overview
- [ ] Risk analytics

### Government Portal
- [x] Compliance monitoring
- [x] Quarterly report generation
- [ ] Grant verification
- [ ] ARENA/CEFC integration

### Admin Portal
- [x] User verification queue
- [x] Assessor workflow
- [x] Monitoring jobs scheduler
- [x] System analytics
- [ ] User management interface
- [ ] Audit log viewer

---

## Phase 4: Government API Integrations (Weeks 7-8)

### Climate & Environment
- [x] **SILO Climate API** - Queensland Government Long Paddock
  - [x] DataDrillDataset endpoint integration
  - [x] Rainfall, temperature, radiation data
  - [x] 30-day historical data with summary stats

- [x] **SLGA Soil API** - TERN Landscapes
  - [x] extractSLGAdata endpoint integration
  - [x] Organic carbon, clay, sand, pH, bulk density
  - [x] Multi-depth layer data (0-200cm)

### Carbon & Energy
- [x] **CER Carbon Credits** - Clean Energy Regulator
  - [x] Historical ACCU auction data
  - [x] Price trends and volume tracking
  - [ ] Real-time ACCU register access

### Business Verification
- [x] **ABN Lookup** - Australian Business Register
  - [x] Checksum validation
  - [ ] ABR API integration (needs GUID)
  - [ ] Entity name lookup

### Planned Integrations
- [ ] **ABARES** - Land use mapping (CLUM WMS)
- [ ] **BOM** - Bureau of Meteorology weather forecasts
- [ ] **myGovID** - OAuth authentication
- [ ] **Tomorrow.io** - Fire Weather Index (premium)

---

## Phase 5: Real-time & Polish (Weeks 9-10)

### Real-time Features
- [x] SSE notification system
- [x] Activity feed infrastructure
- [ ] Live price updates
- [ ] Contract status webhooks

### Accessibility (WCAG 2.2 AA)
- [ ] Color contrast audit
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] Focus indicators
- [ ] Touch targets (44x44px minimum)

### Performance
- [ ] Lighthouse audit (target: 90+)
- [ ] Bundle optimization
- [ ] Image optimization
- [ ] API response caching

### Documentation
- [x] README documentation
- [ ] API documentation
- [ ] User guides
- [ ] Developer onboarding

---

## Completed Features (Historical)

### Database & Schema
- [x] Suppliers, buyers, feedstocks tables
- [x] Certificates, quality tests tables
- [x] Projects, supply agreements tables
- [x] Bankability assessments schema
- [x] Covenant monitoring tables
- [x] PostGIS geospatial support

### Rating System
- [x] ABFI 4-pillar rating engine
- [x] Sustainability score calculator
- [x] Carbon intensity scoring
- [x] Quality score (type-specific)
- [x] Reliability scoring
- [x] Bankability scoring (AAA-CCC)

### Mapping
- [x] Interactive feedstock map
- [x] GeoJSON data layers
- [x] Radius analysis tool
- [x] Layer controls and filtering
- [x] Export functionality

### Certificates
- [x] PDF certificate generator
- [x] QR code with blockchain hash
- [x] Certificate verification API

### Scheduling
- [x] Daily covenant checks (6:00 AM AEST)
- [x] Weekly supply recalculation (Mondays 2:00 AM)
- [x] Contract renewal alerts (7:00 AM daily)

---

## Revenue-Enabling Features (Priority)

### Tier 1 - Immediate
- [ ] Subscription tiers for market intelligence ($50k-$150k p.a.)
- [ ] API gateway with usage metering ($25k-$100k p.a.)
- [x] ABFI Rating Certificates ($3k-$15k per certificate)
- [x] Biological Asset Data Pack export ($75k-$300k per pack)

### Tier 2 - Near-term
- [x] Demand Signal Registry (RFQ matching)
- [ ] Certificate Verification API (paid access)
- [ ] Carbon Intensity Reporting Module

### Tier 3 - Future
- [ ] Market indices (regional, quality-adjusted, carbon-adjusted)
- [ ] Forward indicators (availability curves, price bands)
- [ ] Policy dashboards (SAF mandate, Cleaner Fuels)

---

## Known Issues

| Issue | Priority | Status |
|-------|----------|--------|
| Urban areas return null soil data | Low | Expected (SLGA focuses on rural) |
| SILO data has ~1 week lag | Low | Expected (data processing delay) |
| ABN API needs GUID registration | Medium | Pending registration |

---

## Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:push          # Push schema changes
npm run db:studio        # Open Drizzle Studio

# Testing
npm test                 # Unit tests
npm run test:e2e         # E2E tests (Playwright)
```

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 3s | TBD |
| Lighthouse Mobile | > 90 | TBD |
| WCAG 2.2 AA Compliance | 100% | Partial |
| Essential Eight Maturity | Level 2 | Level 1 |
| API Uptime | 99.9% | TBD |

---

## References

- [Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md)
- [NSW Design System](https://designsystem.nsw.gov.au/)
- [ACSC Essential Eight](https://www.cyber.gov.au/resources-business-and-government/essential-cyber-security/essential-eight)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [SILO Climate Database](https://www.longpaddock.qld.gov.au/silo/)
- [SLGA Soil Data](https://esoil.io/TERNLandscapes/Public/Pages/SLGA/)
- [CER Data Portal](https://data.cer.gov.au/)
