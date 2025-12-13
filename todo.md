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
- [ ] Add inquiry response interface
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
- [ ] Create agreement CRUD interface
- [ ] Build concentration analysis view with HHI and geographic distribution
- [ ] Implement grower qualification assessment workflow
- [ ] Create bankability assessment wizard
- [ ] Build certificate generator (PDF with QR code)
- [ ] Create lender portal (read-only monitoring view)
- [ ] Implement alert system for contract renewals and covenant breaches
- [ ] Add monitoring jobs (daily covenant check, weekly supply recalc)
- [ ] Build admin interface for assessor workflow
- [ ] Write comprehensive tests for all scoring algorithms
