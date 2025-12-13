# ABFI Platform Hardening TODO
## Bank-Grade, Regulator-Credible Market Infrastructure

**Objective**: Transform ABFI into institutional-grade platform suitable for lenders, government agencies, and legal/audit review.

**Quality Bar**: Every feature must answer:
- What is this score based on?
- Is it current?
- What happens if something breaks?
- Can this be defended in court?

---

## PHASE 1: Evidence Chain & Data Provenance

### Backend Schema
- [x] Create `evidence` table (separate from documents)
  - id, type (lab_test, audit_report, registry_cert, contract, etc.)
  - file_hash (SHA-256), file_url, file_size, mime_type
  - issuer_id, issuer_type (lab, auditor, registry, counterparty)
  - issued_date, expiry_date, status (valid, expired, revoked, superseded)
  - superseded_by_id, version_number
  - metadata (JSON for type-specific fields)
  - created_at, updated_at

- [x] Create `evidence_linkages` table
  - evidence_id, linked_entity_type (feedstock, supplier, certificate, score)
  - linked_entity_id, linkage_type (supports, validates, contradicts)
  - weight_in_calculation (for score contributions)

- [x] Create `certificate_snapshots` table
  - certificate_id, snapshot_date, snapshot_hash
  - frozen_score_data (JSON), frozen_evidence_set (JSON array of evidence IDs)
  - immutable flag, created_by

- [x] Add evidence versioning fields
  - Add `evidence_version` to track supersession chains
  - Add `evidence_lineage` JSON to track version history

### Backend APIs
- [x] POST /api/evidence/upload - Upload evidence with automatic hashing
- [x] GET /api/evidence/:id - Retrieve evidence with linkages
- [x] POST /api/evidence/:id/supersede - Mark evidence as superseded
- [x] GET /api/evidence/by-entity/:type/:id - Get all evidence for entity
- [x] POST /api/certificates/:id/snapshot - Create immutable snapshot
- [x] GET /api/certificates/:id/snapshot/:date - Retrieve historical snapshot

### Admin UI
- [x] Evidence Management page
  - Upload interface with issuer selection
  - Evidence browser with filters (type, issuer, status, expiry)
  - Evidence detail view showing hash, linkages, version history
  - Supersession workflow

- [ ] Certificate Snapshot Viewer
  - Show frozen evidence set at issuance
  - Display score inputs locked at snapshot time
  - Immutability indicator

### Score Linkage Logic
- [ ] Update ABFI scoring to record evidence dependencies
- [ ] Update Bankability scoring to record evidence dependencies
- [ ] Implement evidence validation checks before score calculation
- [ ] Add evidence expiry warnings in score displays

---

## PHASE 2: Temporal Versioning & Validity

### Backend Schema
- [x] Add versioning fields to `feedstocks` table
  - version_number, valid_from, valid_to, superseded_by_id
  - is_current (boolean), version_reason (text)

- [x] Add versioning fields to `abfi_scores` table (via feedstocks)
  - version_number, valid_from, valid_to, superseded_by_id
  - calculation_date, is_current

- [x] Add versioning fields to `certificates` table
  - version_number, valid_from, valid_to, superseded_by_id
  - renewal_date, is_current

- [x] Add versioning fields to `supply_agreements` table
  - version_number, valid_from, valid_to, superseded_by_id
  - amendment_reason, is_current

- [x] Add versioning fields to `bankability_assessments` table
  - version_number, valid_from, valid_to, superseded_by_id
  - reassessment_reason, is_current

### Backend APIs
- [x] Add `as_of_date` parameter to all GET endpoints (via temporal.getAsOfDate)
- [x] GET /api/feedstocks/:id/history - Get version history (via temporal.getHistory)
- [x] GET /api/feedstocks/:id/as-of/:date - Get state at specific date (via temporal.getAsOfDate)
- [x] POST /api/feedstocks/:id/new-version - Create new version (via temporal.createNewVersion)
- [x] GET /api/scores/:id/timeline - Get score changes over time (via temporal.getTimeline)

### Query Patterns
- [x] Implement time-aware query helpers in temporal.ts
  - getEntityAsOfDate(entityType, id, date)
  - getEntityHistory(entityType, id)
  - getCurrentVersion(entityType, id)

### UI Components
- [ ] VersionTimeline component - Show entity version history
- [ ] AsOfDatePicker component - Select historical date for views
- [ ] VersionComparison component - Compare two versions side-by-side

### UI Features
- [ ] Add "View Historical" toggle to all entity detail pages
- [ ] Add version history sidebar to feedstock pages
- [ ] Add "as-of date" selector to lender portal
- [ ] Show validity period prominently on certificates

---

## PHASE 3: Physical Reality & Supply Risk

### Backend Schema
- [ ] Create `yield_estimates` table
  - feedstock_id, year, season
  - p50_yield, p75_yield, p90_yield (tonnes/hectare)
  - confidence_level, methodology, estimated_by
  - weather_dependency_score (1-10)
  - created_at, updated_at

- [ ] Create `delivery_events` table
  - agreement_id, scheduled_date, actual_date
  - committed_volume, actual_volume
  - variance_percentage, variance_reason
  - on_time (boolean), quality_met (boolean)

- [ ] Create `seasonality_profiles` table
  - feedstock_id, month, availability_percentage
  - peak_season (boolean), harvest_window_start, harvest_window_end

- [ ] Create `climate_exposure` table
  - supplier_id, site_id, exposure_type (drought, flood, fire, frost)
  - risk_level (low, medium, high, extreme)
  - mitigation_measures (text)

- [ ] Create `supplier_sites` table
  - supplier_id, site_name, address, latitude, longitude
  - hectares, primary_feedstock_type
  - operational_status, certification_level

- [ ] Update `suppliers` table
  - Add multi_site (boolean)
  - Add total_hectares, site_count

### Backend APIs
- [ ] POST /api/yield-estimates - Add yield estimate
- [ ] GET /api/feedstocks/:id/yield-confidence - Get P50/P75/P90 data
- [ ] POST /api/delivery-events - Record delivery event
- [ ] GET /api/agreements/:id/delivery-performance - Get fill rate, variance
- [ ] GET /api/suppliers/:id/sites - List supplier sites
- [ ] POST /api/suppliers/:id/sites - Add supplier site
- [ ] GET /api/feedstocks/:id/seasonality - Get availability by month

### Scoring Adjustments
- [ ] Update Volume Security score to factor in P50/P75/P90
- [ ] Add delivery performance penalty to Reliability score
- [ ] Add seasonality risk adjustment to Bankability
- [ ] Add climate exposure factor to Risk score

### Visualizations
- [ ] YieldConfidenceBand component - Show P50/P75/P90 ranges
- [ ] SeasonalityChart component - Monthly availability heatmap
- [ ] DeliveryPerformanceChart component - Actual vs committed over time
- [ ] SiteMap component - Geographic distribution of supplier sites

---

## PHASE 4: ABFI Score Explainability

### Backend Schema
- [ ] Create `score_calculations` table
  - score_id, score_type (abfi, bankability, grower_qual)
  - calculation_timestamp, calculated_by_user_id
  - inputs_snapshot (JSON), weights_used (JSON)
  - contributions (JSON - input → weight → contribution)
  - final_score, rating

- [ ] Create `score_sensitivity_analysis` table
  - calculation_id, input_field, current_value
  - delta_plus_10, delta_minus_10
  - sensitivity_coefficient

- [ ] Create `score_improvement_simulations` table
  - score_id, simulation_date, target_rating
  - required_changes (JSON array of field → target value)
  - feasibility_score, estimated_timeline

### Backend APIs
- [ ] GET /api/scores/:id/decomposition - Get full breakdown
- [ ] GET /api/scores/:id/sensitivity - Get sensitivity analysis
- [ ] POST /api/scores/:id/simulate-improvement - Run "what-if" scenario
- [ ] GET /api/scores/:id/consistency-check - Check for contradictions

### Calculation Metadata Layer
- [ ] Store calculation metadata with every score
- [ ] Record which evidence influenced which score components
- [ ] Track admin overrides with justification
- [ ] Log calculation engine version used

### UI Components
- [ ] ScoreDecomposition component - Input → Weight → Contribution table
- [ ] TornadoChart component - Sensitivity visualization
- [ ] ImprovementSimulator component - "What improves this score" tool
- [ ] ScoreConsistencyAlerts component - Show contradictions

### Admin Features
- [ ] Admin score override interface with mandatory justification
- [ ] Score recalculation trigger with reason logging
- [ ] Calculation audit trail viewer

---

## PHASE 5: Buyer Procurement & Scenario Tools

### Backend Schema
- [ ] Create `rfq_bundles` table
  - buyer_id, bundle_name, status (draft, sent, closed)
  - required_feedstock_types (JSON array)
  - required_total_volume, delivery_timeline
  - created_at, closed_at

- [ ] Create `rfq_bundle_items` table
  - bundle_id, feedstock_type, required_volume
  - min_abfi_score, max_price_per_tonne

- [ ] Create `procurement_scenarios` table
  - buyer_id, scenario_name, created_date
  - supplier_mix (JSON - supplier_id → percentage)
  - blending_strategy, total_cost, risk_score
  - saved (boolean)

- [ ] Create `buyer_favorites` table
  - buyer_id, entity_type (supplier, feedstock)
  - entity_id, notes, added_date

### Backend APIs
- [ ] POST /api/rfq-bundles - Create RFQ bundle
- [ ] POST /api/rfq-bundles/:id/send - Send to suppliers
- [ ] GET /api/rfq-bundles/:id/responses - Get responses
- [ ] POST /api/scenarios - Save procurement scenario
- [ ] GET /api/scenarios/:id/compare - Compare scenarios
- [ ] POST /api/favorites - Add to favorites
- [ ] GET /api/pricing/normalized - Get normalized pricing (AUD/GJ, AUD/t dry)

### Buyer UI Flows
- [ ] RFQ Bundle Builder page
  - Multi-feedstock selector
  - Multi-supplier targeting
  - Requirements specification (volume, quality, timeline)

- [ ] Scenario Comparison Dashboard
  - Side-by-side supplier comparison
  - Blending scenario builder
  - Cost vs risk visualization

- [ ] Favorites/Shortlist page
  - Saved suppliers and feedstocks
  - Quick comparison tools
  - Notes and tags

### Pricing Normalization
- [ ] Implement conversion logic (AUD/t → AUD/GJ based on energy content)
- [ ] Add moisture content adjustment for dry weight pricing
- [ ] Display normalized prices where data available

---

## PHASE 6: Bankability Stress-Testing

### Backend Schema
- [ ] Create `stress_scenarios` table
  - scenario_name, scenario_type (supplier_loss, region_shock, shortfall)
  - parameters (JSON - which supplier, what percentage loss, etc.)
  - created_by, created_date

- [ ] Create `stress_test_results` table
  - project_id, scenario_id, test_date
  - base_rating, stress_rating, rating_delta
  - base_hhi, stress_hhi
  - supply_shortfall_percentage
  - covenant_breaches (JSON array)
  - narrative_summary (text)

- [ ] Create `contract_enforceability_scores` table
  - agreement_id, governing_law, jurisdiction
  - termination_clause_score, step_in_rights_score
  - security_package_score, remedies_score
  - overall_enforceability_score

### Backend APIs
- [ ] POST /api/stress-tests - Run stress test
- [ ] GET /api/stress-tests/:projectId/scenarios - List available scenarios
- [ ] GET /api/stress-tests/:id/results - Get detailed results
- [ ] POST /api/agreements/:id/enforceability-assessment - Score contract enforceability

### Scenario Engine
- [ ] Implement "loss of top supplier" scenario
- [ ] Implement "regional event" scenario (all suppliers in region)
- [ ] Implement "supply shortfall" scenario (X% reduction)
- [ ] Implement HHI recalculation under stress
- [ ] Calculate covenant breach impact

### Expanded Scoring Logic
- [ ] Add contract enforceability to Bankability score (new component)
  - Governing law jurisdiction (10 points)
  - Termination protections (10 points)
  - Step-in rights (10 points)
  - Security package (10 points)
  - Remedies (10 points)

### Visual Risk Outputs
- [ ] StressTestResults component - Base vs stress comparison
- [ ] CovenantBreachImpact component - Show which covenants fail
- [ ] SupplierLossImpact component - Visualize concentration risk
- [ ] EnforceabilityScoreCard component - Contract strength breakdown

---

## PHASE 7: Lender Portal (Institutional-Grade)

### Backend Schema
- [ ] Create `lender_access_grants` table
  - lender_user_id, project_id, access_level (read, monitor, alert)
  - granted_by, granted_date, expiry_date

- [ ] Create `covenant_breach_events` table
  - project_id, covenant_type, breach_date
  - severity (info, warning, breach, critical)
  - actual_value, threshold_value, variance_percentage
  - narrative_explanation (text), resolved (boolean)

- [ ] Create `lender_reports` table
  - project_id, report_month, generated_date
  - report_pdf_url, evidence_pack_url
  - score_changes_narrative (text)
  - status (draft, finalized, sent)

### Backend APIs
- [ ] GET /api/lender/projects - List accessible projects
- [ ] GET /api/lender/projects/:id/dashboard - Get monitoring dashboard data
- [ ] GET /api/lender/projects/:id/alerts - Get active alerts
- [ ] GET /api/lender/projects/:id/covenant-history - Get breach history
- [ ] GET /api/lender/reports/:projectId/latest - Get latest monthly report
- [ ] POST /api/lender/reports/:projectId/generate - Trigger report generation
- [ ] GET /api/lender/evidence-pack/:projectId - Download evidence pack

### Portal UI Enhancements
- [ ] Enhanced project dashboard with:
  - Covenant status traffic lights
  - Score trend charts (last 12 months)
  - Recent alerts feed
  - Key metrics summary

- [ ] Alerts Management page
  - Filterable alerts list (severity, type, date)
  - Alert detail drill-down
  - Acknowledgment workflow

- [ ] Reports Download Center
  - Monthly report archive
  - Evidence pack downloads
  - Custom date range exports

### Reporting Engine
- [ ] PDF report generator for monthly lender reports
  - Executive summary
  - Score changes narrative
  - Covenant compliance status
  - Supply position update
  - Evidence summary

- [ ] Evidence pack assembler
  - Manifest file (JSON/CSV)
  - All linked evidence files
  - Verification hashes

### Scheduled Jobs
- [ ] Daily covenant check job
  - Check all active projects
  - Identify breaches
  - Generate alerts
  - Notify lenders

- [ ] Monthly report generation job
  - Generate reports for all projects with lender access
  - Calculate score changes
  - Write narrative explanations
  - Send notifications

---

## PHASE 8: Audit, Legal & Compliance

### Backend Schema
- [ ] Create `audit_logs` table (append-only)
  - event_id (UUID), timestamp, user_id, user_role
  - action_type (create, update, delete, override, calculate, certify)
  - entity_type, entity_id
  - before_state (JSON), after_state (JSON)
  - justification (text), ip_address, user_agent

- [ ] Create `admin_overrides` table
  - override_id, override_type (score, status, expiry)
  - entity_type, entity_id
  - original_value, override_value
  - justification (required), approved_by, override_date
  - expiry_date, revoked (boolean)

- [ ] Create `certificate_legal_metadata` table
  - certificate_id, version, validity_period
  - snapshot_id, issuer_name, issuer_role
  - governing_law, limitation_statements (text)
  - disclaimers (text), reliance_terms (text)

### Backend APIs
- [ ] GET /api/audit-logs - Query audit logs (admin only)
- [ ] POST /api/audit-logs/export - Export audit trail (CSV/JSON)
- [ ] POST /api/admin/override - Record admin override with justification
- [ ] GET /api/certificates/:id/legal-metadata - Get legal metadata
- [ ] POST /api/certificates/:id/legal-metadata - Update legal metadata

### Audit Log Requirements
- [ ] Log all score calculations
- [ ] Log all evidence uploads and changes
- [ ] Log all certificate issuances
- [ ] Log all admin overrides
- [ ] Log all user access to sensitive data
- [ ] Implement tamper-evident checksums for log batches

### Legal Text Templates
- [ ] Certificate disclaimer (short form - on certificate)
- [ ] Certificate disclaimer (long form - in documentation)
- [ ] Lender report disclaimer
- [ ] Platform terms of service sections:
  - Certification scope
  - Reliance limitations
  - Liability caps
  - User representations
  - Dispute resolution

### Certificate Schema Updates
- [ ] Add mandatory legal fields to certificate generation
- [ ] Add QR code with certificate verification URL
- [ ] Add version number and snapshot ID
- [ ] Add issuer information and credentials
- [ ] Add governing law and jurisdiction

### Admin UI
- [ ] Audit Log Viewer
  - Searchable and filterable
  - Export functionality
  - Event detail drill-down

- [ ] Override Management Interface
  - Override request form with mandatory justification
  - Approval workflow (if multi-level approval required)
  - Active overrides list with expiry tracking

- [ ] Legal Content Management
  - Edit disclaimer templates
  - Manage terms of service versions
  - Preview certificate legal text

---

## PHASE 9: Platform Operations & Trust Signals

### Backend Schema
- [ ] Create `system_health_metrics` table
  - metric_name, metric_value, timestamp
  - status (healthy, degraded, critical)

- [ ] Create `data_freshness_tracking` table
  - entity_type, entity_id, last_updated
  - expected_update_frequency, staleness_threshold
  - is_stale (boolean)

- [ ] Create `scheduled_jobs_status` table
  - job_name, last_run, next_run, status
  - duration_ms, success (boolean), error_message

### Backend APIs
- [ ] GET /api/system/health - System health check
- [ ] GET /api/system/uptime - Uptime metrics
- [ ] GET /api/system/data-freshness - Data freshness indicators
- [ ] GET /api/system/jobs - Scheduled jobs status

### Monitoring Jobs
- [ ] Uptime monitoring job (every 5 minutes)
- [ ] Data freshness check job (daily)
- [ ] Stale evidence detection job (daily)
- [ ] Missing data alert job (daily)

### Ops Dashboards
- [ ] System Health Dashboard (admin only)
  - Uptime percentage
  - API response times
  - Database query performance
  - Job execution status

- [ ] Data Quality Dashboard (admin only)
  - Stale data alerts
  - Missing evidence warnings
  - Incomplete profiles count
  - Score recalculation queue

### Trust Signals (Public UI)
- [ ] Add "Last Updated" timestamps to all data displays
- [ ] Add "Data as of [date]" notices
- [ ] Add "Next recalculation: [date]" notices
- [ ] Add system status indicator in footer
- [ ] Add data freshness badges on entity cards

### Seed/Demo Data
- [ ] Create seed script with representative scenarios:
  - Good case: High ABFI score, compliant covenants, fresh evidence
  - Average case: Medium scores, some warnings
  - Bad case: Low scores, covenant breaches, stale evidence
  - Broken case: Missing data, expired evidence, calculation failures

---

## PHASE 10: Integration Testing & Quality Assurance

### Backend Tests
- [ ] Unit tests for all new scoring logic
- [ ] Integration tests for evidence chain
- [ ] Integration tests for temporal versioning
- [ ] Integration tests for stress-testing engine
- [ ] Golden test cases for ABFI scoring
- [ ] Golden test cases for Bankability scoring
- [ ] Regression test suite

### Frontend Tests
- [ ] Component tests for new UI components
- [ ] E2E tests for critical user flows:
  - Supplier onboarding with evidence upload
  - Buyer procurement scenario creation
  - Admin bankability assessment
  - Lender portal monitoring

### Data Integrity Tests
- [ ] Test evidence hash verification
- [ ] Test snapshot immutability
- [ ] Test temporal query correctness
- [ ] Test audit log completeness

### Performance Tests
- [ ] Load test for concurrent users
- [ ] Stress test for large datasets
- [ ] Query performance optimization

### Security Tests
- [ ] Role-based access control verification
- [ ] Evidence file upload security
- [ ] SQL injection prevention
- [ ] XSS prevention

---

## PHASE 11: Documentation & Delivery

### Technical Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Database schema documentation (ERD)
- [ ] Scoring methodology documentation
- [ ] Evidence requirements guide
- [ ] Temporal versioning guide

### User Documentation
- [ ] Supplier onboarding guide
- [ ] Buyer procurement guide
- [ ] Admin assessment guide
- [ ] Lender monitoring guide

### Compliance Documentation
- [ ] Audit trail specification
- [ ] Evidence retention policy
- [ ] Data privacy policy (GDPR/Privacy Act compliance)
- [ ] Security controls documentation

### Operational Runbooks
- [ ] Certificate issuance procedure
- [ ] Evidence verification procedure
- [ ] Covenant breach response procedure
- [ ] System incident response procedure
- [ ] Data backup and recovery procedure

---

## Risk & Dependency Notes

### High-Risk Items
1. **Evidence Chain Integrity**: Cryptographic hashing must be bulletproof
2. **Temporal Versioning**: Query correctness is critical for legal defensibility
3. **Audit Logs**: Append-only enforcement must be database-level
4. **Certificate Snapshots**: Immutability must be cryptographically guaranteed

### External Dependencies
1. PDF generation library for reports and certificates
2. Cryptographic library for SHA-256 hashing
3. Job scheduler for background tasks
4. Email service for lender alerts

### Compliance Checkpoints
- [ ] Legal review of all disclaimer text
- [ ] Security audit of evidence upload flow
- [ ] Penetration testing of lender portal
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## Success Criteria

The platform is ready for institutional use when:

1. ✅ A lender can answer: "What is this score based on?" with full evidence chain
2. ✅ An auditor can answer: "Is it current?" with temporal versioning and freshness indicators
3. ✅ An operator can answer: "What happens if something breaks?" with monitoring and alerts
4. ✅ A lawyer can answer: "Can this be defended in court?" with audit logs and legal metadata

**Assume scrutiny. Assume adversarial review. Build accordingly.**
