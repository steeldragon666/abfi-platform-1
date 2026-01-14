-- ============================================================================
-- ABFI Bankability Assessment Framework
-- Migration: 0025_abfi_bankability_assessment.sql
-- ============================================================================

-- ============================================================================
-- ABFI Assessment Framework Metadata
-- ============================================================================
CREATE TABLE abfi_assessment_frameworks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  version VARCHAR(20) NOT NULL UNIQUE, -- e.g., "ABFI-5P-v1.0"
  framework_name VARCHAR(100) NOT NULL,
  description TEXT,
  assessment_date DATE NOT NULL,
  analyst VARCHAR(255),
  pillar_weights JSON NOT NULL, -- Store 5-pillar weights as JSON
  rating_scale JSON NOT NULL, -- Store rating scale definitions as JSON
  tier_definitions JSON NOT NULL, -- Store tier definitions as JSON
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  INDEX (version),
  INDEX (is_active)
);

-- ============================================================================
-- ABFI Bankability Assessments
-- ============================================================================
CREATE TABLE abfi_bankability_assessments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assessment_id VARCHAR(50) NOT NULL UNIQUE, -- e.g., "ABFI-2025-001"
  project_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  status ENUM('OPERATIONAL', 'UNDER_CONSTRUCTION', 'FEED', 'PRE_FEED', 'DEMONSTRATION', 'PROPOSED', 'ON_HOLD', 'FAILED') NOT NULL,

  -- Location data
  site_location VARCHAR(255),
  state ENUM('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Technology & capacity
  technology VARCHAR(255),
  feedstock VARCHAR(255),
  capacity_value DECIMAL(10, 2),
  capacity_unit VARCHAR(50), -- "TJ/year", "ML/year", etc.

  -- 5-Pillar Scores (0-10 scale)
  volume_security_score DECIMAL(3, 1),
  volume_security_justification TEXT,

  counterparty_quality_score DECIMAL(3, 1),
  counterparty_quality_justification TEXT,

  contract_structure_score DECIMAL(3, 1),
  contract_structure_justification TEXT,

  concentration_risk_score DECIMAL(3, 1),
  concentration_risk_justification TEXT,

  operational_readiness_score DECIMAL(3, 1),
  operational_readiness_justification TEXT,

  -- Overall assessment
  overall_score DECIMAL(3, 1) NOT NULL,
  rating VARCHAR(5) NOT NULL, -- AA, A, BBB, BB, B, CCC, CC, C, D
  tier INT NOT NULL, -- 1-4
  tier_label VARCHAR(20) NOT NULL, -- Bankable, Development Stage, High Risk, Non-Investable
  rank INT, -- Overall ranking

  -- Key findings
  key_strengths JSON, -- Array of strength descriptions
  key_risks JSON, -- Array of risk descriptions
  critical_issues JSON, -- Array of critical issue descriptions

  -- Funding data
  total_cost DECIMAL(12, 2),
  arena_funding DECIMAL(12, 2),
  arena_percentage DECIMAL(5, 2),

  -- Framework reference
  framework_version VARCHAR(20) NOT NULL,

  -- Claim status for project developers
  claimed_by_user_id BIGINT,
  claim_status ENUM('unclaimed', 'pending', 'verified', 'rejected') DEFAULT 'unclaimed',
  claimed_at TIMESTAMP NULL,
  claim_verified_at TIMESTAMP NULL,

  -- Evidence uploads for improvement
  evidence_documents JSON, -- Array of uploaded document references

  -- Metadata
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  last_updated_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  -- Foreign keys
  FOREIGN KEY (claimed_by_user_id) REFERENCES users(id),
  FOREIGN KEY (last_updated_by) REFERENCES users(id),

  -- Indexes
  INDEX (assessment_id),
  INDEX (status),
  INDEX (state),
  INDEX (rating),
  INDEX (tier),
  INDEX (overall_score),
  INDEX (claim_status),
  INDEX (latitude, longitude)
);

-- ============================================================================
-- ABFI Assessment Proponents
-- ============================================================================
CREATE TABLE abfi_assessment_proponents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assessment_id BIGINT NOT NULL,
  proponent_name VARCHAR(255) NOT NULL,
  proponent_role VARCHAR(100),
  proponent_type VARCHAR(100), -- "ASX-listed", "Private", "Government-owned", etc.
  asx_code VARCHAR(10),

  -- Foreign keys
  FOREIGN KEY (assessment_id) REFERENCES abfi_bankability_assessments(id) ON DELETE CASCADE,

  -- Indexes
  INDEX (assessment_id),
  INDEX (proponent_name)
);

-- ============================================================================
-- ABFI Assessment Evidence
-- ============================================================================
CREATE TABLE abfi_assessment_evidence (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assessment_id BIGINT NOT NULL,
  evidence_type ENUM('document', 'certificate', 'contract', 'permit', 'assessment', 'other') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  document_url VARCHAR(500),
  document_key VARCHAR(500), -- S3 key
  uploaded_by BIGINT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

  -- Pillar relevance
  relevant_pillars JSON, -- Array of pillar names this evidence supports

  -- Verification status
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  verified_by BIGINT,
  verified_at TIMESTAMP NULL,
  verification_notes TEXT,

  -- Foreign keys
  FOREIGN KEY (assessment_id) REFERENCES abfi_bankability_assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id),

  -- Indexes
  INDEX (assessment_id),
  INDEX (evidence_type),
  INDEX (verification_status)
);

-- ============================================================================
-- ABFI Assessment Improvement Suggestions
-- ============================================================================
CREATE TABLE abfi_assessment_improvements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assessment_id BIGINT NOT NULL,
  pillar_name VARCHAR(50) NOT NULL, -- volume_security, counterparty_quality, etc.
  improvement_type ENUM('contract', 'partnership', 'evidence', 'process', 'other') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_impact DECIMAL(3, 1), -- Expected score improvement
  implementation_complexity ENUM('low', 'medium', 'high') NOT NULL,
  timeline_months INT,
  cost_estimate DECIMAL(10, 2),
  cost_currency VARCHAR(3) DEFAULT 'AUD',

  -- Service offerings
  abfi_service_recommended BOOLEAN DEFAULT FALSE,
  service_description TEXT,

  -- Status
  status ENUM('suggested', 'in_progress', 'completed', 'dismissed') DEFAULT 'suggested',
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  -- Foreign keys
  FOREIGN KEY (assessment_id) REFERENCES abfi_bankability_assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),

  -- Indexes
  INDEX (assessment_id),
  INDEX (pillar_name),
  INDEX (status)
);

-- ============================================================================
-- Seed initial framework data
-- ============================================================================

INSERT INTO abfi_assessment_frameworks (
  version,
  framework_name,
  description,
  assessment_date,
  analyst,
  pillar_weights,
  rating_scale,
  tier_definitions,
  is_active
) VALUES (
  'ABFI-5P-v1.0',
  'ABFI Five-Pillar Bankability Assessment Framework',
  'Comprehensive assessment framework evaluating bioenergy projects across five critical pillars: Volume Security, Counterparty Quality, Contract Structure, Concentration Risk, and Operational Readiness.',
  '2025-01-01',
  'ABFI Platform',
  '{
    "volume_security": 0.2,
    "counterparty_quality": 0.2,
    "contract_structure": 0.2,
    "concentration_risk": 0.2,
    "operational_readiness": 0.2
  }',
  '{
    "AA": {"min": 8.5, "max": 10.0, "tier": 1, "tier_label": "Investment Grade"},
    "A": {"min": 7.5, "max": 8.49, "tier": 1, "tier_label": "Investment Grade"},
    "BBB": {"min": 6.5, "max": 7.49, "tier": 1, "tier_label": "Bankable"},
    "BB": {"min": 5.5, "max": 6.49, "tier": 2, "tier_label": "Development Stage"},
    "B": {"min": 4.5, "max": 5.49, "tier": 2, "tier_label": "Development Stage"},
    "B-": {"min": 4.0, "max": 4.49, "tier": 3, "tier_label": "High Risk"},
    "CCC": {"min": 3.5, "max": 3.99, "tier": 3, "tier_label": "High Risk"},
    "CC": {"min": 2.5, "max": 3.49, "tier": 4, "tier_label": "Non-Investable"},
    "C": {"min": 1.5, "max": 2.49, "tier": 4, "tier_label": "Non-Investable"},
    "D": {"min": 0.0, "max": 1.49, "tier": 4, "tier_label": "Non-Investable"}
  }',
  '[
    {"tier": 1, "label": "Bankable", "min_score": 6.5, "description": "Suitable for conventional project finance"},
    {"tier": 2, "label": "Development Stage", "min_score": 5.0, "description": "Requires further development before bankability"},
    {"tier": 3, "label": "High Risk", "min_score": 3.5, "description": "Speculative; suitable only for venture/impact capital"},
    {"tier": 4, "label": "Non-Investable", "min_score": 0.0, "description": "Failed or fundamentally flawed projects"}
  ]',
  TRUE
);