-- Carbon Intensity Reporting Module Migration
-- Adds CI reports table, audit logs, and auditor role support

-- ============================================
-- SEQUENCE FOR REPORT ID GENERATION
-- ============================================
CREATE SEQUENCE IF NOT EXISTS ci_report_seq START 1;

-- ============================================
-- CARBON INTENSITY REPORTS TABLE
-- ============================================
CREATE TABLE carbon_intensity_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id TEXT NOT NULL UNIQUE,
  feedstock_id UUID NOT NULL REFERENCES feedstocks(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),

  -- Reporting Period
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  reference_year INTEGER NOT NULL,

  -- Methodology
  methodology TEXT NOT NULL CHECK (methodology IN ('RED_II', 'RTFO', 'ISO_14064', 'ISCC', 'RSB')),
  methodology_version TEXT,
  data_quality_level TEXT NOT NULL DEFAULT 'default' CHECK (data_quality_level IN ('default', 'industry_average', 'primary_measured')),

  -- Scope 1 Emissions (Direct) - gCO2e/MJ
  scope1_cultivation NUMERIC NOT NULL DEFAULT 0,
  scope1_processing NUMERIC NOT NULL DEFAULT 0,
  scope1_transport NUMERIC NOT NULL DEFAULT 0,
  scope1_total NUMERIC GENERATED ALWAYS AS (scope1_cultivation + scope1_processing + scope1_transport) STORED,

  -- Scope 2 Emissions (Indirect - Energy) - gCO2e/MJ
  scope2_electricity NUMERIC NOT NULL DEFAULT 0,
  scope2_steam_heat NUMERIC NOT NULL DEFAULT 0,
  scope2_total NUMERIC GENERATED ALWAYS AS (scope2_electricity + scope2_steam_heat) STORED,

  -- Scope 3 Emissions (Value Chain) - gCO2e/MJ
  scope3_upstream_inputs NUMERIC NOT NULL DEFAULT 0,
  scope3_land_use_change NUMERIC NOT NULL DEFAULT 0,
  scope3_distribution NUMERIC NOT NULL DEFAULT 0,
  scope3_end_of_life NUMERIC NOT NULL DEFAULT 0,
  scope3_total NUMERIC GENERATED ALWAYS AS (scope3_upstream_inputs + scope3_land_use_change + scope3_distribution + scope3_end_of_life) STORED,

  -- Totals & Ratings
  total_ci_value NUMERIC GENERATED ALWAYS AS (
    scope1_cultivation + scope1_processing + scope1_transport +
    scope2_electricity + scope2_steam_heat +
    scope3_upstream_inputs + scope3_land_use_change + scope3_distribution + scope3_end_of_life
  ) STORED,
  ci_rating TEXT,
  ci_score NUMERIC,

  -- Compliance Flags
  ghg_savings_percentage NUMERIC,
  red_ii_compliant BOOLEAN NOT NULL DEFAULT false,
  rtfo_compliant BOOLEAN NOT NULL DEFAULT false,
  cfp_compliant BOOLEAN NOT NULL DEFAULT false,
  iscc_compliant BOOLEAN NOT NULL DEFAULT false,
  rsb_compliant BOOLEAN NOT NULL DEFAULT false,

  -- Uncertainty & Documentation
  uncertainty_range_low NUMERIC,
  uncertainty_range_high NUMERIC,
  calculation_notes TEXT,
  supporting_documents JSONB NOT NULL DEFAULT '[]',

  -- Status & Verification
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'verified', 'rejected', 'expired')),
  verification_level TEXT NOT NULL DEFAULT 'self_declared' CHECK (verification_level IN ('self_declared', 'document_verified', 'third_party_audited', 'abfi_certified')),
  assigned_auditor_id UUID REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  auditor_notes TEXT,
  rejection_reason TEXT,
  expiry_date DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CI AUDIT LOGS TABLE
-- ============================================
CREATE TABLE ci_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES carbon_intensity_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'submitted', 'review_started', 'approved', 'rejected', 'revision_requested', 'expired')),
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_ci_reports_feedstock ON carbon_intensity_reports(feedstock_id);
CREATE INDEX idx_ci_reports_supplier ON carbon_intensity_reports(supplier_id);
CREATE INDEX idx_ci_reports_status ON carbon_intensity_reports(status);
CREATE INDEX idx_ci_reports_methodology ON carbon_intensity_reports(methodology);
CREATE INDEX idx_ci_reports_period ON carbon_intensity_reports(reporting_period_start, reporting_period_end);
CREATE INDEX idx_ci_reports_assigned_auditor ON carbon_intensity_reports(assigned_auditor_id) WHERE assigned_auditor_id IS NOT NULL;
CREATE INDEX idx_ci_reports_verified_by ON carbon_intensity_reports(verified_by) WHERE verified_by IS NOT NULL;
CREATE INDEX idx_ci_audit_logs_report ON ci_audit_logs(report_id);
CREATE INDEX idx_ci_audit_logs_user ON ci_audit_logs(user_id);

-- ============================================
-- TRIGGER FOR REPORT_ID GENERATION
-- ============================================
CREATE OR REPLACE FUNCTION generate_ci_report_id()
RETURNS TRIGGER AS $$
DECLARE
  feedstock_code TEXT;
BEGIN
  -- Get feedstock_id from feedstocks table
  SELECT feedstock_id INTO feedstock_code FROM feedstocks WHERE id = NEW.feedstock_id;

  -- Generate report_id: CI-[FEEDSTOCK_CODE]-[YYYYMM]-[SEQ]
  NEW.report_id := 'CI-' ||
    COALESCE(feedstock_code, 'UNKNOWN') || '-' ||
    TO_CHAR(NEW.reporting_period_start, 'YYYYMM') || '-' ||
    LPAD(NEXTVAL('ci_report_seq')::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ci_report_id
  BEFORE INSERT ON carbon_intensity_reports
  FOR EACH ROW
  EXECUTE FUNCTION generate_ci_report_id();

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_ci_reports_updated_at
  BEFORE UPDATE ON carbon_intensity_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE carbon_intensity_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_audit_logs ENABLE ROW LEVEL SECURITY;

-- Suppliers can manage their own reports
CREATE POLICY "Suppliers can view own reports" ON carbon_intensity_reports
  FOR SELECT USING (
    supplier_id IN (SELECT id FROM suppliers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Suppliers can create reports" ON carbon_intensity_reports
  FOR INSERT WITH CHECK (
    supplier_id IN (SELECT id FROM suppliers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Suppliers can update own draft reports" ON carbon_intensity_reports
  FOR UPDATE USING (
    supplier_id IN (SELECT id FROM suppliers WHERE profile_id = auth.uid())
    AND status = 'draft'
  );

CREATE POLICY "Suppliers can delete own draft reports" ON carbon_intensity_reports
  FOR DELETE USING (
    supplier_id IN (SELECT id FROM suppliers WHERE profile_id = auth.uid())
    AND status = 'draft'
  );

-- Auditors can view and verify all reports
CREATE POLICY "Auditors can view all reports" ON carbon_intensity_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('auditor', 'admin'))
  );

CREATE POLICY "Auditors can update reports for verification" ON carbon_intensity_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('auditor', 'admin'))
  );

-- Buyers can view verified reports
CREATE POLICY "Buyers can view verified reports" ON carbon_intensity_reports
  FOR SELECT USING (
    status = 'verified'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'buyer')
  );

-- Audit logs policies
CREATE POLICY "Users can view audit logs for accessible reports" ON ci_audit_logs
  FOR SELECT USING (
    report_id IN (
      SELECT id FROM carbon_intensity_reports
      WHERE supplier_id IN (SELECT id FROM suppliers WHERE profile_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('auditor', 'admin'))
  );

CREATE POLICY "Authenticated users can create audit logs" ON ci_audit_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Calculate GHG savings percentage against fossil fuel comparator (94 gCO2e/MJ)
CREATE OR REPLACE FUNCTION calculate_ghg_savings(ci_value NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  IF ci_value IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN ROUND(((94 - ci_value) / 94) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get CI rating based on value
CREATE OR REPLACE FUNCTION get_ci_rating(ci_value NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF ci_value IS NULL THEN
    RETURN NULL;
  ELSIF ci_value < 10 THEN
    RETURN 'A+';
  ELSIF ci_value < 20 THEN
    RETURN 'A';
  ELSIF ci_value < 30 THEN
    RETURN 'B+';
  ELSIF ci_value < 40 THEN
    RETURN 'B';
  ELSIF ci_value < 50 THEN
    RETURN 'C+';
  ELSIF ci_value < 60 THEN
    RETURN 'C';
  ELSIF ci_value < 70 THEN
    RETURN 'D';
  ELSE
    RETURN 'F';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update CI rating and GHG savings when report is updated
CREATE OR REPLACE FUNCTION update_ci_calculations()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ghg_savings_percentage := calculate_ghg_savings(NEW.total_ci_value);
  NEW.ci_rating := get_ci_rating(NEW.total_ci_value);

  -- Check RED II compliance (minimum 50% savings for biofuels, 65% for new installations)
  NEW.red_ii_compliant := COALESCE(NEW.ghg_savings_percentage, 0) >= 50;

  -- Check RTFO compliance (similar thresholds)
  NEW.rtfo_compliant := COALESCE(NEW.ghg_savings_percentage, 0) >= 50;

  -- Check CFP compliance
  NEW.cfp_compliant := COALESCE(NEW.ghg_savings_percentage, 0) >= 50;

  -- ISCC and RSB have similar requirements
  NEW.iscc_compliant := COALESCE(NEW.ghg_savings_percentage, 0) >= 50;
  NEW.rsb_compliant := COALESCE(NEW.ghg_savings_percentage, 0) >= 50;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_ci_on_change
  BEFORE INSERT OR UPDATE ON carbon_intensity_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_ci_calculations();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON carbon_intensity_reports TO authenticated;
GRANT SELECT, INSERT ON ci_audit_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ci_report_seq TO authenticated;
