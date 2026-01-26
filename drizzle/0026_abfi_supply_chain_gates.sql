-- ============================================================================
-- ABFI Supply Chain Gate Payments
-- Migration: 0026_abfi_supply_chain_gates.sql
-- ============================================================================

-- ============================================================================
-- ABFI Payment Guarantees (SBLC / Trust / Gnosis Safe)
-- ============================================================================
CREATE TABLE abfi_payment_guarantees (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guarantee_id VARCHAR(50) NOT NULL UNIQUE,
  guarantee_type ENUM('sblc', 'trust_account', 'gnosis_safe') NOT NULL,
  status ENUM('pending', 'secured', 'rejected', 'expired', 'released') DEFAULT 'pending' NOT NULL,

  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AUD' NOT NULL,
  provider_name VARCHAR(255),

  -- SBLC-specific fields
  sblc_swift_ref VARCHAR(50),
  sblc_document_url VARCHAR(500),
  sblc_issuer_bank VARCHAR(255),
  sblc_issued_at TIMESTAMP NULL,
  sblc_expires_at TIMESTAMP NULL,

  -- Trust account fields
  trust_account_ref VARCHAR(100),
  trust_account_balance DECIMAL(12, 2),

  -- Gnosis Safe fields
  gnosis_safe_address VARCHAR(100),
  gnosis_chain VARCHAR(50),
  gnosis_deposit_tx_hash VARCHAR(100),

  verified_at TIMESTAMP NULL,
  verified_by BIGINT,
  metadata JSON,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  FOREIGN KEY (verified_by) REFERENCES users(id),
  INDEX (guarantee_id),
  INDEX (status),
  INDEX (guarantee_type)
);

-- ============================================================================
-- ABFI Supply Chain Deliveries (Stage-Gated JIT Payment)
-- ============================================================================
CREATE TABLE abfi_supply_chain_deliveries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  delivery_id VARCHAR(50) NOT NULL UNIQUE,

  assessment_id BIGINT,
  project_id BIGINT,
  buyer_id BIGINT,
  grower_supplier_id BIGINT,
  guarantee_id BIGINT,

  contract_value DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AUD' NOT NULL,
  expected_tonnes DECIMAL(10, 2),
  min_gate0_tonnes DECIMAL(10, 2),

  status ENUM('created', 'in_progress', 'completed', 'disputed', 'cancelled') DEFAULT 'created' NOT NULL,
  funds_secured BOOLEAN DEFAULT FALSE NOT NULL,
  funds_secured_at TIMESTAMP NULL,
  last_gate_index INT,

  harvest_start_at TIMESTAMP NULL,
  harvest_end_at TIMESTAMP NULL,

  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  FOREIGN KEY (assessment_id) REFERENCES abfi_bankability_assessments(id),
  FOREIGN KEY (project_id) REFERENCES bioenergyProjects(id),
  FOREIGN KEY (buyer_id) REFERENCES buyers(id),
  FOREIGN KEY (grower_supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (guarantee_id) REFERENCES abfi_payment_guarantees(id),

  INDEX (delivery_id),
  INDEX (status),
  INDEX (assessment_id),
  INDEX (project_id),
  INDEX (buyer_id),
  INDEX (grower_supplier_id),
  INDEX (guarantee_id)
);

-- ============================================================================
-- ABFI Gate Events (0-4)
-- ============================================================================
CREATE TABLE abfi_gate_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  delivery_id BIGINT NOT NULL,

  gate_index INT NOT NULL,
  device_type ENUM('harvester_yield_meter', 'nir_probe', 'load_cell', 'arrival_scan', 'lab_result') NOT NULL,

  payload JSON,
  sensor_timestamp TIMESTAMP NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),

  cumulative_tonnes DECIMAL(10, 2),
  instantaneous_tph DECIMAL(10, 2),
  moisture_pct DECIMAL(5, 2),
  dry_matter_pct DECIMAL(5, 2),
  ash_pct DECIMAL(5, 2),
  calorific_value_gj_t DECIMAL(6, 2),
  fuel_liters DECIMAL(10, 2),

  gross_tonnes DECIMAL(10, 2),
  tare_tonnes DECIMAL(10, 2),
  net_dry_tonnes DECIMAL(10, 2),
  seal_id VARCHAR(100),
  route_variance_pct DECIMAL(5, 2),

  contamination_ppm DECIMAL(10, 2),
  tamper_flag BOOLEAN DEFAULT FALSE,

  gateway_id VARCHAR(100),
  gateway_signature VARCHAR(255),

  validation_status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending' NOT NULL,
  validation_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

  FOREIGN KEY (delivery_id) REFERENCES abfi_supply_chain_deliveries(id) ON DELETE CASCADE,
  INDEX (delivery_id),
  INDEX (gate_index),
  INDEX (recorded_at),
  INDEX (validation_status)
);

-- ============================================================================
-- ABFI Payment Releases
-- ============================================================================
CREATE TABLE abfi_payment_releases (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  delivery_id BIGINT NOT NULL,
  gate_index INT NOT NULL,

  percent INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AUD' NOT NULL,
  source ENUM('funds_in_trust') DEFAULT 'funds_in_trust' NOT NULL,
  status ENUM('pending', 'released', 'failed', 'reversed') DEFAULT 'pending' NOT NULL,

  released_at TIMESTAMP NULL,
  release_ref VARCHAR(100),
  metadata JSON,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

  FOREIGN KEY (delivery_id) REFERENCES abfi_supply_chain_deliveries(id) ON DELETE CASCADE,
  INDEX (delivery_id),
  INDEX (gate_index),
  INDEX (status)
);
