# ABFI Platform

**Australian Bioenergy Feedstock Infrastructure** - A digital marketplace connecting agricultural growers to bioenergy projects, financiers, and government bodies for feedstock verification and trading.

[![Live Demo](https://img.shields.io/badge/demo-abfi--platform.vercel.app-blue)](https://abfi-platform.vercel.app)
[![GitHub](https://img.shields.io/badge/repo-steeldragon666%2Fabfi--platform--1-green)](https://github.com/steeldragon666/abfi-platform-1)

---

## Overview

ABFI Platform provides:
- **Grower Portal**: Register feedstock, track carbon intensity, manage contracts
- **Developer Portal**: Project bankability assessments, supply chain management
- **Lender Portal**: Investment monitoring, covenant tracking, risk analysis
- **Government Portal**: Compliance monitoring, grant verification
- **Marketplace**: Demand signal matching, certificate verification

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Components** | shadcn/ui, Lucide React icons |
| **Backend** | Express.js, tRPC |
| **Database** | MySQL (Railway), Drizzle ORM |
| **Auth** | OAuth 2.0 (development: local JWT auth) |
| **Maps** | Mapbox GL, Leaflet |
| **Real-time** | Server-Sent Events (SSE) |
| **Hosting** | Vercel |

---

## Project Structure

```
abfi-platform/
├── client/                      # Frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/              # shadcn/ui base components
│   │   │   ├── layout/          # Layout components
│   │   │   ├── maps/            # Mapping components
│   │   │   └── ...
│   │   ├── pages/               # Page components
│   │   ├── lib/                 # Utilities & API clients
│   │   │   ├── integrations/    # Government API integrations
│   │   │   └── ...
│   │   ├── hooks/               # Custom React hooks
│   │   └── contexts/            # React contexts
│   └── public/                  # Static assets
├── server/                      # Backend application
│   ├── _core/                   # Core server infrastructure
│   │   ├── index.ts             # Server entry point
│   │   ├── env.ts               # Environment configuration
│   │   ├── security.ts          # Security middleware
│   │   ├── sse.ts               # Server-Sent Events
│   │   ├── devAuth.ts           # Development authentication
│   │   └── ...
│   ├── apis/                    # API routers
│   │   └── australianDataRouter.ts  # Australian data APIs
│   ├── connectors/              # External service connectors
│   ├── services/                # Business logic services
│   └── ...
├── shared/                      # Shared types & utilities
├── drizzle/                     # Database migrations
├── docs/                        # Documentation
└── tests/                       # Test suites
```

---

## Government API Integrations

| API | Status | Description |
|-----|--------|-------------|
| **SILO Climate** | ✅ Implemented | Queensland Government climate data (rainfall, temperature, radiation) |
| **SLGA Soil** | ✅ Implemented | Soil & Landscape Grid of Australia (organic carbon, clay, pH) |
| **CER Carbon** | ✅ Implemented | Clean Energy Regulator ACCU auction data |
| **ABN Lookup** | 🔧 Partial | Australian Business Register validation |
| **ABARES** | 📋 Planned | Land use mapping |
| **BOM Weather** | 📋 Planned | Bureau of Meteorology forecasts |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- MySQL database (or Railway account)

### Installation

```bash
# Clone repository
git clone https://github.com/steeldragon666/abfi-platform-1.git
cd abfi-platform-1

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables (see below)
```

### Environment Variables

All client-side `VITE_*` variables are validated at startup. See `client/src/config/env.ts` for validation rules and defaults.

```env
# =====================
# Server Configuration
# =====================

# Database (required)
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET=your-secret-key
OAUTH_SERVER_URL=http://localhost:3000

# External APIs (server-side)
HEYGEN_API_KEY=your-heygen-key
OPENAI_API_KEY=your-openai-key
TOMORROW_IO_API_KEY=your-weather-key

# =====================
# Client Configuration (VITE_*)
# =====================

# Authentication (optional - dev fallbacks provided)
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
VITE_APP_ID=abfi-platform

# API Endpoints (optional - dev fallbacks provided)
VITE_INTELLIGENCE_API_URL=https://abfi-ai.vercel.app
VITE_STEALTH_API_URL=https://stealth-discovery.vercel.app

# Maps - choose one:
# Option 1: Frontend Forge proxy (recommended)
VITE_FRONTEND_FORGE_API_KEY=your-forge-key
VITE_FRONTEND_FORGE_API_URL=https://api.frontendforge.dev

# Option 2: Direct Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Monitoring (optional - disabled if not set)
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_APP_VERSION=1.0.0

# Blockchain (optional)
VITE_EVIDENCE_CONTRACT=0x...
```

#### Environment Variable Validation

The client validates all `VITE_*` variables using Zod at startup:
- **Development**: Warnings logged, defaults applied
- **Production**: Throws error if validation fails

See `client/src/config/env.ts` for the full schema.

### Development

```bash
# Start development server
npm run dev

# Server runs on http://localhost:3000
# Dev login available at /login (no OAuth required)
```

### Production Build

```bash
npm run build
npm start
```

---

## Key Features

### Australian Data Explorer
Access real Australian environmental data at `/australian-data`:
- **Climate Tab**: 30-day weather data from SILO API
- **Soil Tab**: Soil composition data from SLGA
- **Carbon Tab**: Historical ACCU auction results from CER

### Bankability Assessment
Project developers can assess feedstock supply security:
- Volume Security scoring (30% weight)
- Counterparty Quality scoring (25% weight)
- Contract Structure scoring (20% weight)
- Concentration Risk (HHI calculation, 15% weight)
- Operational Readiness (10% weight)

### Real-time Notifications
Server-Sent Events for live updates:
- Contract renewal alerts
- Covenant breach warnings
- Market price movements

### Supply-Chain Command Centre (Market Intelligence)
Stage-gated, trust-backed payment rail where Gate-0 starts at the harvester:
- Gate 0 - Tonnage harvested (harvester yield meter + IoT gateway): GPS polygon, t/h, cumulative t, timestamp, fuel used; 30% release from funds-in-trust
- Gate 1 - Load-out moisture (inline NIR probe): %H2O, DM %, ash %, calorific value; 20% release from funds-in-trust
- Gate 2 - Transport departure (load cells + RFID seal): gross/tare/net DM, seal ID, departure geo-stamp; 30% release from funds-in-trust
- Gate 3 - Arrival and geo-confirm (site scan + phone GPS + weigh bridge): arrival timestamp, net delivered DM t, route variance < 2%; 15% release from funds-in-trust
- Gate 4 - Lab validation (NATA lab HL7): final DM %, contamination ppm, CV (GJ/t); 5% + bonus/penalty and job closeout
- Hardware/connectivity: CAN-bus yield sensor -> 4G/5G edge gateway (MQTT JSON every 5 s), inline NIR probe via Bluetooth, certified load cells + e-seal with tamper flag
- Smart-contract hook: oracle calls `gate0Release`, transfers 30% AUDC, and mints a delivery NFT keyed by `deliveryId` for all downstream gates
- Payment guarantees: bank SBLC, trust account API, or escrowed AUDC via Gnosis Safe with "funds guaranteed" badge
- JIT AI scheduling: live t/h + transport ETA + stockyard capacity -> recommended start time, auto re-book if weather corridor risk
- Dispute resolution: parametric top-up for sensor variance, AI arbiter with human-in-loop, legal holdback on final 5%
- UX loop: operator toast for gate release, finance webhook for ETA/risk, grower wallet paid within ~15 s
- KPIs: harvest-to-cash <= 90 min median, payment accuracy >= 99%, dispute rate <= 0.3%, stock-yard buffer -40%
- Tag line: "Tonnage counted at the header -> money in your pocket before the truck hits the gate - guaranteed."

---

## Security

Implements ACSC Essential Eight Maturity Level 2:
- [x] Content Security Policy headers
- [x] HTTPS enforcement (HSTS)
- [x] XSS protection
- [x] CSRF protection
- [x] Session management
- [x] Audit logging
- [ ] MFA (planned with Auth0/Okta)

---

## Testing

```bash
# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y
```

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy

### Manual

```bash
npm run build
npm start
```

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## Documentation

- [Design System](./docs/DESIGN_SYSTEM.md)
- [Platform Features](./docs/PLATFORM_FEATURES.md)
- [Strategic Vision](./docs/STRATEGIC_VISION.md)
- [Value Propositions](./docs/VALUE_PROPOSITIONS.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [OAuth Configuration](./OAUTH_CONFIGURATION_GUIDE.md)

---

## License

Proprietary - All rights reserved.

---

## Contact

- **Repository**: [github.com/steeldragon666/abfi-platform-1](https://github.com/steeldragon666/abfi-platform-1)
- **Live Demo**: [abfi-platform.vercel.app](https://abfi-platform.vercel.app)
