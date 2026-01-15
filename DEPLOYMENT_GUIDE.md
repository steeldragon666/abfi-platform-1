# ABFI Platform - Deployment Guide

## Quick Deployment to Vercel

### Option 1: Automatic GitHub Integration (Recommended)

The repository is already connected to Vercel and will automatically deploy when changes are pushed to the main branch.

**Repository**: https://github.com/steeldragon666/abfi-platform-1
**Vercel Project**: abfi-platform

### Option 2: Manual Deployment via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option 3: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import from GitHub: `steeldragon666/abfi-platform-1`
4. Configure build settings:
   - **Framework Preset**: Other
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `pnpm install`
5. Add environment variables (see below)
6. Click "Deploy"

## Environment Variables

### Required Variables

```bash
# Node Environment
NODE_ENV=production

# App URL (will be your Vercel domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# OAuth Server
OAUTH_SERVER_URL=https://your-app.vercel.app

# Database (MySQL)
DATABASE_URL=mysql://user:password@host:3306/database
```

### Optional Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Blockchain (optional)
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-project-id
EVIDENCE_ANCHOR_CONTRACT=0x...
BLOCKCHAIN_CHAIN=ethereum

# Gate Payment Rail (optional)
GATE_PAYMENT_RAIL_RPC_URL=https://polygon-rpc.com
GATE_PAYMENT_RAIL_CONTRACT=0x...
GATE_PAYMENT_RAIL_CHAIN=polygon
GATE_PAYMENT_RAIL_PRIVATE_KEY=your-private-key
GATE_PAYMENT_RAIL_ESCROW_ADDRESS=0x...
GATE_MIN_TONNES=25
GATE0_RELEASE_PERCENT=30

# IPFS (optional)
IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_GATEWAY_URL=https://ipfs.io
```

Gate telemetry signatures are validated against per-device keys stored in the
`gate_devices` table. Seed a device with a `sharedSecret` (HMAC) or `publicKey`
(Ed25519) and set `keyAlgorithm` to `hmac-sha256` or `ed25519` accordingly.

## Database Setup

### Option 1: PlanetScale (Recommended for Vercel)

1. Create account at https://planetscale.com
2. Create new database
3. Get connection string
4. Add to Vercel environment variables as `DATABASE_URL`

### Option 2: Supabase

1. Create project at https://supabase.com
2. Get database connection string
3. Add to Vercel environment variables

### Option 3: Railway

1. Create project at https://railway.app
2. Add MySQL service
3. Get connection string
4. Add to Vercel environment variables

### Run Migrations

After database is set up:

```bash
# Install dependencies
pnpm install

# Run migrations
pnpm run db:push
```

### Seed Gate Devices (optional)

```bash
pnpm exec tsx scripts/seed-gate-devices.ts
```

## Build Configuration

The project uses the following build configuration in `vercel.json`:

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist/public",
  "installCommand": "pnpm install",
  "framework": null
}
```

## Post-Deployment Steps

### 1. Verify Deployment

Visit your Vercel URL and check:
- [ ] Homepage loads correctly
- [ ] Design assets (icons, illustrations) are visible
- [ ] Authentication works
- [ ] API endpoints respond
- [ ] Database connections work

### 2. Configure Custom Domain (Optional)

1. Go to Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### 3. Set Up Monitoring

1. Enable Vercel Analytics
2. Set up error tracking (Sentry, LogRocket, etc.)
3. Configure uptime monitoring

### 4. Security Checklist

- [ ] All environment variables are set correctly
- [ ] Database credentials are secure
- [ ] API keys are not exposed in frontend
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] SSL/TLS is active

## Deployment Status

### Latest Deployment
- **Commit**: fbb6b32 - Complete platform redesign
- **Date**: December 27, 2025
- **Status**: Ready for deployment
- **Build**: Successful

### What's Included
✅ Design system with black/white/gold color scheme
✅ 4 role-specific dashboards (Grower, Developer, Financier, Admin)
✅ 48 custom design assets (18 illustrations + 30 icons)
✅ Explainable AI features
✅ Interactive mapping
✅ 6-stage deal room workflow
✅ Futures marketplace
✅ Bankability assessment engine
✅ Authentication and RBAC
✅ Comprehensive test suite

## Troubleshooting

### Build Fails

**Issue**: Build command fails
**Solution**: Check that all dependencies are installed and TypeScript compiles without errors

```bash
pnpm install
pnpm run check
pnpm run build
```

### Database Connection Fails

**Issue**: Cannot connect to database
**Solution**: Verify DATABASE_URL is correct and database is accessible from Vercel

### Assets Not Loading

**Issue**: Icons or illustrations not displaying
**Solution**: Verify assets are in `/client/public/assets/` and committed to git

### API Endpoints Return 404

**Issue**: tRPC endpoints not found
**Solution**: Check that API routes are properly configured in server setup

## Performance Optimization

### Recommended Vercel Settings

- **Node.js Version**: 18.x or higher
- **Region**: Auto (or closest to your users)
- **Function Memory**: 1024 MB
- **Function Timeout**: 10s

### Caching Strategy

- Static assets: Cache for 1 year
- API responses: Cache based on data freshness
- HTML pages: Cache with revalidation

## Continuous Deployment

The platform is configured for continuous deployment:

1. Push changes to `main` branch
2. Vercel automatically detects changes
3. Builds and deploys new version
4. Previous version remains accessible via deployment URL

## Rollback Procedure

If deployment has issues:

1. Go to Vercel dashboard
2. Navigate to "Deployments"
3. Find previous working deployment
4. Click "Promote to Production"

## Support

For deployment issues:
- Check Vercel deployment logs
- Review build output
- Verify environment variables
- Test locally first with `pnpm run build && pnpm run start`

## Next Steps

After successful deployment:

1. Set up production database with real data
2. Configure external API integrations (Google Maps, IPFS, etc.)
3. Enable monitoring and analytics
4. Perform security audit
5. Load test the platform
6. Set up backup and disaster recovery
7. Document API endpoints
8. Create user onboarding materials

---

**Deployment Status**: Ready for Production
**Last Updated**: December 27, 2025
