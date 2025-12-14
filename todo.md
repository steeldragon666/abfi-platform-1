# ABFI Platform TODO

## Phase 1: Database Schema & Core Infrastructure
- [x] Design complete database schema with all tables
- [x] Add PostGIS support for geospatial data
- [x] Create suppliers table
- [x] Create buyers table
- [x] Create feedstocks table with geospatial columns
- [x] Create certificates table
- [x] Create quality_tests table
- [x] Create inquiries table
- [x] Create transactions table
- [x] Create notifications table
- [x] Add proper indexes and relationships
- [ ] Create seed data script

## Phase 2: Authentication & User Management
- [x] Extend user schema with role-based access (supplier, buyer, admin)
- [x] Create supplier profile fields
- [x] Create buyer profile fields
- [x] Implement role-based middleware
- [x] Add user onboarding flows

## Phase 3: Supplier Portal
- [x] Create supplier registration wizard
- [x] Implement ABN validation
- [x] Build supplier dashboard homepage
- [x] Add suppliers.get API method
- [x] Create company profile management page
- [ ] Build settings interface

## Phase 4: Feedstock Management
- [x] Create feedstock listing form
- [x] Implement feedstock type selection (including bamboo)
- [ ] Add location picker with map integration
- [x] Build document upload system with S3
- [x] Create certificate management interface
- [x] Add quality test report upload
- [ ] Build availability calendar
- [x] Implement feedstock list/grid view for suppliers
- [x] Add feedstock detail/edit page
- [x] Create status workflow (draft, pending, active, suspended)

## Phase 5: ABFI Rating System
- [x] Implement sustainability score calculator
- [x] Build carbon intensity score mapping
- [x] Create quality score calculator (type-specific including bamboo)
- [x] Implement reliability score calculator
- [x] Build composite ABFI score aggregator
- [ ] Create ScoreCard component
- [ ] Build ScoreBreakdown visualization
- [ ] Add ScoreTrend chart
- [ ] Create ScoreBadge component
- [ ] Implement rating history tracking
- [x] Add rating improvement suggestions

## Phase 6: Buyer Portal
- [x] Create buyer registration flow
- [x] Build buyer dashboard homepage
- [x] Implement buyer profile management page
- [ ] Add facility location management

## Phase 7: Search & Discovery
- [x] Build advanced search interface with filters
- [x] Implement filter panel (category, type, location, score, carbon)
- [x] Create map view with Google Maps integration
- [x] Add feedstock markers with color-coded ABFI scores
- [x] Build list view with sorting
- [x] Implement pagination
- [x] Create saved searches functionality
- [ ] Add shortlist/favorites system
- [x] Build feedstock detail page

## Phase 8: Inquiry & Communication
- [x] Create inquiry form (buyer to supplier)
- [x] Build inquiry list for suppliers
- [x] Build inquiry list for buyers
- [x] Add inquiry response interface
- [x] Implement status tracking
- [x] Create notification system integration
- [x] Build notification center UI center
- [ ] Create communication history view
- [ ] Add inquiry status tracking
- [ ] Implement notification preferences

## Phase 9: Admin Dashboard
- [x] Build admin authentication
- [x] Create supplier verification queue
- [x] Build feedstock review queue
- [x] Implement approval/reject workflow
- [ ] Create user management interface
- [x] Build system analytics dashboard
- [ ] Add audit log viewer
- [ ] Create content management for announcements

## Phase 10: Polish & Integration
- [x] Design system implementation (colors, typography)
- [ ] Responsive design testing
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization
- [ ] Error handling and validation improvements
- [ ] Loading states and skeletons
- [ ] Empty states with helpful guidance
- [x] Write comprehensive tests for rating system
- [ ] API documentation
- [ ] User guides

## Bugs & Issues
(Track bugs here as they are discovered)

## Completed Features
- [x] Bamboo feedstock category with P-Grade quality scoring
- [x] Complete backend infrastructure (11 tables, 50+ APIs)
- [x] ABFI 4-pillar rating engine
- [x] Supplier and buyer registration
- [x] Admin verification dashboard
- [x] Browse feedstocks with advanced filters
- [x] Feedstock creation form
- [x] Inquiry/RFQ syst## Phase 11: Bankability Accreditation Module
- [x] Create projects table for bioenergy project tracking
- [x] Create supply_agreements table (Tier 1, Tier 2, Options, ROFR)
- [x] Create grower_qualifications table (GQ1-GQ4 levels)
- [x] Create bankability_assessments table
- [x] Create bankability_certificates table
- [x] Create lender_access table for lender portal permissions
- [x] Create covenant_monitoring table
- [x] Implement Volume Security scoring (30% weight)
- [x] Implement Counterparty Quality scoring (25% weight)
- [x] Implement Contract Structure scoring (20% weight)
- [x] Implement Concentration Risk scoring (15% weight - HHI calculation)
- [x] Implement Operational Readiness scoring (10% weight)
- [x] Build composite bankability score calculator (AAA-CCC rating)
- [x] Build database helpers for projects, agreements, qualifications
- [x] Create tRPC routers for bankability module
- [x] Build project developer dashboard UI
    - [x] Create agreement CRUD interface
- [ ] Build concentration analysis view with HHI and geographic distribution
- [x] Implement grower qualification assessment workflow
- [x] Create bankability assessment wizard
- [ ] Build certificate generator (PDF with QR code)
- [ ] Create lender portal (read-only monitoring view)
- [ ] Implement alert system for contract renewals and covenant breaches
- [ ] Add monitoring jobs (daily covenant check, weekly supply recalc)
- [ ] Build admin interface for assessor workflow
- [ ] Write comprehensive tests for all scoring algorithms

## Recently Completed (Session 2)
- [x] Create agreement CRUD interface (list view with supply position visualization)

## Interactive Feedstock Mapping (Session 3)
- [x] Create GeoJSON data files (sugar mills, grain regions)
- [x] Build Mapbox GL JS interactive map component
- [x] Implement layer controls with visibility toggles
- [x] Add opacity sliders for each layer
- [x] Implement 50km radius analysis tool
- [x] Add clustering for point layers
- [x] Create interactive popups with facility details
- [x] Enhance popups with layer-specific templates (sugar mills, grain regions, forestry, biogas, biofuel, transport)
- [x] Add detailed capacity metrics and operational information to popups
- [x] Fix Mapbox access token configuration
- [x] Add search functionality placeholder
- [x] Complete remaining GeoJSON layers (forestry, biogas, biofuel, transport)
- [ ] Implement advanced filtering by state and capacity
- [x] Add data export (GeoJSON/CSV)
- [ ] Integrate with existing feedstock database

## Compliance Reporting (New Request - Session 3)
- [x] Create compliance metrics aggregation functions
- [x] Build quarterly report generation engine
- [ ] Add report scheduling infrastructure (cron job)
- [ ] Implement report export (PDF/CSV)
- [x] Create compliance dashboard UI
- [ ] Add automated report distribution (email)

## Map Filtering Enhancement (Session 3)
- [x] Add state dropdown filter with multi-select (QLD/NSW/VIC/SA/WA/TAS)
- [x] Implement capacity range sliders for sugar mills (crushing capacity)
- [x] Implement capacity range sliders for biogas facilities (MW capacity)
- [x] Implement capacity range sliders for biofuel plants (ML/yr capacity)
- [x] Implement capacity range sliders for ports (annual throughput)
- [x] Build filter logic to update map layer visibility
- [x] Add "Reset Filters" button
- [x] Show active filter count badge

## Save Analysis Feature (Session 3 - TODO 3)
- [x] Create saved_analyses database table (user_id, name, radius_km, center_coords, results_json, created_at)
- [x] Add tRPC endpoints for save/list/delete analyses
- [x] Build "Save Analysis" dialog with name input
- [x] Create "Saved Analyses" panel in sidebar
- [x] Add "Load Analysis" functionality to restore saved state
- [ ] Implement analysis comparison view

## Enhanced 50km Radius Analysis (Session 3)
- [x] Build calculation engine for feedstock tonnes within radius
- [x] Count facilities by category (sugar mills, biogas, biofuel, ports)
- [x] Calculate grain stubble availability within intersecting regions
- [x] Calculate forestry residue availability within intersecting regions
- [x] Identify transport infrastructure within radius
- [x] Create results display panel with metrics breakdown
- [x] Add supply chain feasibility scoring (0-100 with recommendations)
- [x] Implement PDF export for analysis reports
- [x] Add "Clear Radius" button

## Adjustable Radius Slider (Session 3)
- [x] Add radius slider UI component (10-200km range)
- [x] Update draw radius function to use slider value
- [x] Update analysis engine to use dynamic radius
- [x] Display current radius value in UI (badge shows {radiusKm} km)
- [x] Update circle visualization with dynamic radius
- [x] Update button text to show current radius value

## Adjustable Radius Slider (Session 3)
- [x] Add radius slider UI component (10-200km range)
- [x] Update draw radius function to use slider value
- [x] Update analysis engine to use dynamic radius
- [x] Display current radius value in UI (badge shows {radiusKm} km)
- [x] Update circle visualization with dynamic radius
- [x] Update button text to show current radius value

## Bugs & Issues (Session 3)
- [x] Fix Browse Feedstocks page - not working at all (CRITICAL)

## BioFeed AU Alignment (Session 4 - Document Review)

### High Priority - Revenue Enabling
- [ ] Implement subscription tier system for market intelligence access ($50k-$150k p.a.)
- [ ] Build API gateway with usage metering for external API licensing ($25k-$100k p.a.)
- [x] Create ABFI Rating Certificate PDF generation ($3k-$15k per certificate)
- [x] Build Biological Asset Data Pack (BADP) export for capital markets ($75k-$300k per pack)

### Medium Priority - Market Positioning
- [ ] Create lender portal (read-only monitoring view for financiers)
- [ ] Build market indices (regional availability, quality-adjusted, carbon-adjusted)
- [ ] Add policy instrumentation dashboards (SAF mandate, Cleaner Fuels Program)

### Low Priority - Enhancement
- [ ] Add forward indicators (availability curves, price bands)
- [ ] Create governance documentation (methodology disclosure, independence framework)
- [ ] Implement data anonymization layer for aggregated market intelligence

## Seed Data Script (Session 5)
- [ ] Create comprehensive seed data script with realistic Australian data
- [ ] Generate suppliers (10-15 diverse companies across states)
- [ ] Generate buyers (8-12 bioenergy facilities)
- [ ] Generate feedstocks (30-50 listings with ABFI ratings)
- [ ] Generate certificates, quality tests, and inquiries
- [ ] Run seed script and verify data population

## Design Reimagination (Session 5 - Nano Banana Pro)
- [x] Generate AI mockups for homepage layout
- [x] Generate AI mockups for browse/search page
- [x] Generate AI mockups for dashboard interface
- [x] Define new color palette and design tokens
- [x] Update typography and spacing system
- [x] Implement new homepage design
- [ ] Update browse feedstocks page design
- [ ] Refresh dashboard aesthetics

## Navigation Bugs (Session 5)
- [x] Fix Browse/Marketplace button - shows 404link to /map not /browse)
- [ ] Fix Data button in header (should link to /feedstock-map)
- [ ] Verify all navigation links work correctly

## Comprehensive Functionality Audit (Session 6)
- [ ] Test all navigation buttons and links
- [ ] Test Browse/Marketplace page functionality
- [ ] Test Feedstock Map page functionality
- [ ] Test Dashboard page and all sub-pages
- [ ] Test data input forms (feedstock creation, registration, inquiries)
- [ ] Test data output (listings, search, filters)
- [ ] Test charts and visualizations
- [ ] Create comprehensive seed data
- [ ] Verify supplier workflows (create feedstock, respond to inquiries)
- [ ] Verify buyer workflows (browse, send inquiries)
- [ ] Verify admin workflows (verification, compliance)

## Design System from Google Slides (Session 7)
- [x] Access and analyze Google Slides presentation
- [x] Extract color palette from slides
- [x] Extract typography system from slides
- [x] Extract layout patterns and component styles
- [x] Update index.css with new design tokens
- [x] Apply new colors to homepage
- [ ] Apply new colors to browse page
- [ ] Apply new colors to dashboard
- [ ] Apply new colors to map interface

## Seed Data Creation (Session 8)
- [x] Create seed data script with Australian suppliers
- [ ] Add realistic feedstock data with ABFI ratings (schema mismatch - needs manual entry via UI)
- [ ] Add buyer accounts
- [ ] Execute seed script
- [ ] Test map performance with seed data
- [ ] Verify Browse page shows feedstocks
- [ ] Test certificate generation with seed data

Note: Seed script encounters schema mismatches. Recommend using UI workflows to add data:
- Supplier registration flow
- Feedstock creation form
- Buyer registration

## SEO Improvements (Session 9)
- [x] Add meta description (50-160 characters)
- [x] Add meta keywords
- [x] Add Open Graph tags for social sharing
- [x] Add Twitter Card tags
- [x] Test SEO improvements

## Producer Registration Portal (Session 10)
### Phase 1: Database Schema
- [x] Design properties table (location, land area, water access, boundaries)
- [x] Design production_history table (yearly yields, weather impacts)
- [x] Design carbon_practices table (tillage, fertilizer, machinery, energy)
- [x] Design contracts table (existing commitments, volumes, dates)
- [x] Design marketplace_listings table (available volumes, pricing, delivery terms)
- [x] Extend suppliers table with ABN, verification status, profile completeness

### Phase 2: Welcome & Account Creation (Screens 1.1-1.2)
- [x] Create producer landing page with value propositions
- [x] Build ABN validation with ABR API integration (checksum validation + ABR API ready, needs ABR_GUID)
- [ ] Implement SMS/email verification flow
- [x] Add myGovID OAuth integration placeholder (informational button, full OAuth pending)
- [x] Add trust indicators (CANEGROWERS logo, certifications)

### Phase 3: Property Registration (Screens 2.1-2.3)
- [x] Build interactive Australia map with agricultural zones
- [x] Implement property details form with validation
- [ ] Add multi-property handler for producers with multiple sites
- [x] Support KML/Shapefile upload for property boundaries

### Phase 4: Production Profile (Screens 3.1-3.3)
- [x] Create visual feedstock type selector (cards with icons)
- [x] Build historical yield data table (1-10 years)
- [x] Add current season status form
- [x] Calculate rolling average yields with trends

### Phase 5: Carbon Intensity Calculator (Screens 4.1-4.4)
- [x] Build agricultural practices questionnaire
- [x] Create machinery & energy use form
- [x] Add land use & sequestration tracking
- [x] Implement real-time ABFI score calculation
- [x] Show score improvement suggestions

### Phase 6: Commitments & Availability (Screens 5.1-6.4)
- [x] Build existing contracts tracker
- [x] Auto-calculate available volumes
- [x] Create contract timeline preferences form
- [x] Build pricing requirements (sensitive data)
- [x] Add logistics & delivery terms

### Phase 7: Review & Publish (Screens 7.1-7.3)
- [x] Create profile summary dashboard
- [x] Build visibility settings controls
- [x] Add terms acceptance and publish flow
- [x] Implement draft saving functionality

### Technical Requirements
- [x] Add progressive form saving (localStorage + API sync)
- [x] Ensure mobile-responsive design
- [ ] Add auto-save on field changes
- [x] Implement progress bar for journey completion
- [x] Add contextual help tooltips
- [ ] Ensure WCAG 2.1 AA accessibility compliance

### Implementation Status
- [x] All 10 registration pages created (landing, account setup, property map/details, production profile, carbon calculator, contracts, marketplace listing, review, success)
- [x] Routes added to App.tsx
- [x] Database schema complete with 5 new tables
- [ ] tRPC API endpoints (ready for implementation)
- [ ] Integration testing

## Producer Registration API Integration (Session 11)
- [x] Create tRPC producer.register mutation endpoint
- [x] Implement database insertion for properties table
- [x] Implement database insertion for production_history table
- [x] Implement database insertion for carbon_practices table
- [x] Implement database insertion for existing_contracts table
- [x] Implement database insertion for marketplace_listings table
- [x] Add producer CTA button to homepage hero section
- [ ] Test complete registration flow end-to-end
- [ ] Verify data persistence in database

## British Spelling Conversion (Session 12)
- [x] Update producer registration API to use fertiliser (not fertilizer)
- [x] Fix schema field name mismatches in producer API
- [x] Update all enum values to match database schema
- [ ] Update carbon calculator UI text to British spelling
- [ ] Update all UI labels and descriptions to British spelling (optimise, colour, organisation, etc.)
- [ ] Update documentation and help text to British spelling

## Financial Sector Onboarding Redesign (Session 12)
- [x] Extract design system from reference (dark theme, gold accents, serif typography)
- [x] Update global CSS with financial sector color palette and typography
- [x] Redesign producer registration as "Lender/Financier Onboarding"
- [x] Update form styling to match reference design
- [x] Add progress indicator with step visualization
- [x] Implement dark theme with gold gradient accents
- [x] Test complete onboarding flow with new design

## Bankability Assessment Explainer (Session 13)
- [x] Review reference content for bankability assessment
- [x] Create BankabilityExplainer page with financial theme styling
- [x] Add content explaining assessment methodology and metrics
- [x] Include visual elements (icons, diagrams, data points)
- [x] Add route and navigation to explainer page
- [x] Test page with dark theme styling

## Grower Benefits Infographic (Session 14)
- [x] Review reference infographic content for grower benefits
- [x] Create GrowerBenefits page with producer-focused design
- [x] Adapt color scheme for grower experience (warmer, earth tones vs financial dark theme)
- [x] Add benefit categories relevant to producers
- [x] Include visual flow showing producer journey
- [x] Add route and navigation to grower benefits page
- [x] Test page with grower-appropriate styling

## Interactive Earnings Calculator (Session 15)
- [x] Design earnings calculator component with input fields
- [x] Add calculation logic for profit comparison
- [x] Create visual results display with charts/metrics
- [x] Integrate calculator into grower benefits page
- [x] Add responsive design for mobile use
- [x] Test calculator with various input values

## Hero CTA Section for Feedstock Registration (Session 16)
- [x] Review reference design for hero CTA layout
- [x] Update home page with prominent hero section
- [x] Add large CTA button for "Register Your Planned or Projected Feedstocks Today"
- [x] Style hero section to match platform design
- [x] Link CTA button to producer registration flow
- [x] Test hero section on home page

## Fix Nested Anchor Tags (Session 17)
- [x] Identify nested anchor tags in producer registration page
- [x] Remove nested <a> tags inside Link components
- [x] Test producer registration page for errors

## Configure ABR API Key and myGovID Integration (Session 18)
- [x] Register for ABR Web Services GUID at abr.business.gov.au
- [ ] Add ABR_GUID environment variable to project
- [x] Research myGovID API integration requirements
- [x] Document myGovID OAuth setup process
- [ ] Test ABN validation with real company name lookup
- [x] Review refinery/processor registration page design
- [x] Create separate onboarding section for refinery/processor projects
- [x] Design database schema for project registration
- [x] Create project registration landing page
- [x] Build 7-step project registration flow components
- [x] Add backend tRPC procedures for project data
- [x] Test complete project registration flow

## Certificate Hashing Tool (Session 19)
- [x] Review reference design for certificate verification
- [x] Create CertificateVerification page with hash input
- [x] Implement SHA-256 hashing for certificate verification
- [x] Add backend endpoint to verify certificate hashes
- [x] Display certificate details when hash matches
- [x] Test certificate verification flow

## Form Submission Integration (Session 20)
- [x] Wire producer registration form to trpc.suppliers.registerProducer mutation
- [x] Wire project registration form to trpc.bankability.registerProject mutation
- [x] Wire financial onboarding form to database
- [x] Create ProducerRegistrationSuccess page with application tracking
- [x] Create ProjectRegistrationSuccess page with application tracking
- [x] Create FinancialOnboardingSuccess page with application tracking
- [x] Add form validation and error handling for project registration
- [x] Test complete registration flows end-to-end
