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

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET=your-secret-key
OAUTH_SERVER_URL=http://localhost:3000

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-api-key

# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# External APIs
HEYGEN_API_KEY=your-heygen-key
OPENAI_API_KEY=your-openai-key
TOMORROW_IO_API_KEY=your-weather-key
```

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

- [Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md)
- [API Documentation](./docs/API.md)
- [Design System](./design-system-biofeed.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

## License

Proprietary - All rights reserved.

---

## Contact

- **Repository**: [github.com/steeldragon666/abfi-platform-1](https://github.com/steeldragon666/abfi-platform-1)
- **Live Demo**: [abfi-platform.vercel.app](https://abfi-platform.vercel.app)
