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
- [ ] Add user onboarding flows

## Phase 3: Supplier Portal
- [ ] Create supplier registration wizard
- [ ] Implement ABN validation
- [ ] Build supplier dashboard homepage
- [ ] Create company profile management
- [ ] Add subscription tier display
- [ ] Build settings interface

## Phase 4: Feedstock Management
- [ ] Create feedstock listing wizard (multi-step)
- [ ] Implement feedstock type selection
- [ ] Add location picker with map
- [ ] Build document upload system with S3
- [ ] Create certificate management interface
- [ ] Add quality test report upload
- [ ] Build availability calendar
- [ ] Implement feedstock list/grid view
- [ ] Add feedstock detail/edit page
- [ ] Create status workflow (draft, pending, active, suspended)

## Phase 5: ABFI Rating System
- [x] Implement sustainability score calculator
- [x] Build carbon intensity score mapping
- [x] Create quality score calculator (type-specific)
- [x] Implement reliability score calculator
- [x] Build composite ABFI score aggregator
- [ ] Create ScoreCard component
- [ ] Build ScoreBreakdown visualization
- [ ] Add ScoreTrend chart
- [ ] Create ScoreBadge component
- [ ] Implement rating history tracking
- [x] Add rating improvement suggestions

## Phase 6: Buyer Portal
- [ ] Create buyer registration flow
- [ ] Build buyer dashboard homepage
- [ ] Implement buyer profile management
- [ ] Add facility location management

## Phase 7: Search & Discovery
- [ ] Build advanced search interface
- [ ] Implement filter panel (category, type, location, score, carbon)
- [ ] Create map view with Mapbox integration
- [ ] Add feedstock markers with clustering
- [ ] Build list view with sorting
- [ ] Implement pagination
- [ ] Create saved searches functionality
- [ ] Add shortlist/favorites system
- [ ] Build supplier profile detail page

## Phase 8: Inquiry & Communication
- [ ] Create inquiry form (buyer to supplier)
- [ ] Build inquiry list for suppliers
- [ ] Implement inquiry response interface
- [ ] Set up email notification system
- [ ] Build in-app notification center
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
- [ ] Design system implementation (colors, typography)
- [ ] Responsive design testing
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization
- [ ] Error handling and validation
- [ ] Loading states and skeletons
- [ ] Empty states with helpful guidance
- [ ] Write comprehensive tests
- [ ] API documentation
- [ ] User guides

## Bugs & Issues
(Track bugs here as they are discovered)

## New Feature Request
- [x] Add bamboo as feedstock category to database schema
- [x] Update frontend constants with bamboo category
- [x] Add bamboo-specific quality scoring logic
- [x] Update landing page to include bamboo in categories
