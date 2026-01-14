-- ============================================================================
-- TROVIO CORTENX CARBON REGISTRY INTEGRATION
-- ============================================================================
-- Enables ABFI to custody ACCUs, SMCs, and GOs for growers via the Clean Energy
-- Regulator's Unit & Certificate Registry (powered by Trovio CorTenX).
-- 
-- ABFI acts as a Registry Account Holder (Level 2) with custodian-style operation.
-- Growers retain legal title via Client Sub-wallets (Level 3).
-- ============================================================================

-- Custody tokens for OAuth delegation from CER
-- Stores encrypted access/refresh tokens for each user's CorTenX sub-wallet
CREATE TABLE custody_tokens (
  user_id        BIGINT PRIMARY KEY,
  enc_access     TEXT NOT NULL,                    -- AES-256-GCM encrypted access token
  enc_refresh    TEXT NOT NULL,                    -- AES-256-GCM encrypted refresh token
  sub_wallet_id  VARCHAR(40) NOT NULL,             -- CorTenX wallet UUID
  delegation_scopes TEXT,                          -- Comma-separated scopes: transfer,receive,retire,read
  wallet_status  ENUM('active', 'suspended', 'revoked') DEFAULT 'active',
  last_balance_sync TIMESTAMP,                     -- Last time balance was synced
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_custody_sub_wallet (sub_wallet_id),
  INDEX idx_custody_status (wallet_status)
);

-- Carbon transaction ledger
-- Mirrors all transactions from CorTenX for audit trail and dashboard display
CREATE TABLE carbon_txn (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id        BIGINT NOT NULL,
  txn_type       ENUM('IN', 'OUT', 'RETIRE', 'BUNDLE_LOCK', 'BUNDLE_RELEASE') NOT NULL,
  instrument     ENUM('ACCU', 'SMC', 'GO', 'LGC', 'BUNDLE') NOT NULL,
  qty            INT NOT NULL,                     -- Number of units
  unit_serial_start VARCHAR(50),                   -- First serial number in range
  unit_serial_end VARCHAR(50),                     -- Last serial number in range
  registry_hash  CHAR(64) NOT NULL,                -- CorTenX transaction hash
  registry_url   VARCHAR(255),                     -- Public lookup URL
  counterparty_wallet VARCHAR(40),                 -- Other party's wallet ID (for transfers)
  retirement_note TEXT,                            -- Narrative for retirements
  retirement_beneficiary VARCHAR(255),             -- Who the retirement is on behalf of
  project_id     BIGINT,                           -- Link to ABFI project if applicable
  delivery_id    BIGINT,                           -- Link to feedstock delivery if auto-retired
  bundle_id      BIGINT,                           -- Link to bundle if part of a bundle
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_carbon_user (user_id),
  INDEX idx_carbon_type (txn_type),
  INDEX idx_carbon_instrument (instrument),
  INDEX idx_carbon_hash (registry_hash),
  INDEX idx_carbon_created (created_at)
);

-- Carbon wallet balance cache
-- Real-time balance cache updated via webhooks from CorTenX
CREATE TABLE carbon_balance (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id        BIGINT NOT NULL UNIQUE,
  sub_wallet_id  VARCHAR(40) NOT NULL,
  
  -- Unit balances
  accu_balance   INT DEFAULT 0,                    -- Australian Carbon Credit Units
  smc_balance    INT DEFAULT 0,                    -- Safeguard Mechanism Credits
  go_balance     INT DEFAULT 0,                    -- Guarantee of Origin certificates
  lgc_balance    INT DEFAULT 0,                    -- Large-scale Generation Certificates
  
  -- Locked in bundles
  accu_locked    INT DEFAULT 0,
  smc_locked     INT DEFAULT 0,
  go_locked      INT DEFAULT 0,
  lgc_locked     INT DEFAULT 0,
  
  -- Lifetime stats
  total_retired  INT DEFAULT 0,                    -- Total units retired
  total_received INT DEFAULT 0,                    -- Total units received
  total_transferred INT DEFAULT 0,                 -- Total units transferred out
  
  -- Value tracking (AUD, updated via price feeds)
  portfolio_value_aud DECIMAL(12, 2),
  last_price_update TIMESTAMP,
  
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_balance_wallet (sub_wallet_id)
);

-- Carbon bundles
-- Bundled certificates that can be traded on Australian Carbon Exchange
CREATE TABLE carbon_bundles (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id        BIGINT NOT NULL,
  bundle_serial  VARCHAR(50) NOT NULL UNIQUE,      -- Global serial number for ACX
  bundle_type    ENUM('FEEDSTOCK_CARBON', 'FEEDSTOCK_CARBON_GO', 'CARBON_ONLY') NOT NULL,
  status         ENUM('draft', 'locked', 'listed', 'sold', 'cancelled') DEFAULT 'draft',
  
  -- Bundle contents
  accu_qty       INT DEFAULT 0,
  smc_qty        INT DEFAULT 0,
  go_qty         INT DEFAULT 0,
  lgc_qty        INT DEFAULT 0,
  feedstock_tonnes DECIMAL(10, 2),                 -- Tonnes of DM if bundled with feedstock
  feedstock_type VARCHAR(50),                      -- e.g., "beema_bamboo", "wheat_straw"
  
  -- Registry references
  lock_tx_hash   CHAR(64),                         -- CorTenX lock transaction
  release_tx_hash CHAR(64),                        -- CorTenX release transaction (if cancelled)
  
  -- ACX listing details
  acx_listing_id VARCHAR(50),                      -- Australian Carbon Exchange listing ID
  list_price_aud DECIMAL(12, 2),
  sold_price_aud DECIMAL(12, 2),
  buyer_wallet   VARCHAR(40),
  
  -- Metadata
  description    TEXT,
  vintage_year   INT,                              -- Carbon credit vintage
  project_methodology VARCHAR(100),                -- e.g., "ERF Method - Plantation Forestry"
  
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bundle_user (user_id),
  INDEX idx_bundle_serial (bundle_serial),
  INDEX idx_bundle_status (status)
);

-- Carbon price feed cache
-- Caches carbon credit prices from various sources
CREATE TABLE carbon_prices (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  instrument     ENUM('ACCU', 'SMC', 'GO', 'LGC', 'EU_ETS', 'NZU') NOT NULL,
  price_type     ENUM('spot', 'forward_1m', 'forward_3m', 'forward_6m', 'forward_12m') NOT NULL,
  price_aud      DECIMAL(10, 2) NOT NULL,
  price_source   VARCHAR(50) NOT NULL,             -- e.g., "CBL", "ACX", "AEMO"
  bid_price      DECIMAL(10, 2),
  ask_price      DECIMAL(10, 2),
  volume_24h     INT,
  fetched_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_carbon_price (instrument, price_type, price_source),
  INDEX idx_price_instrument (instrument),
  INDEX idx_price_fetched (fetched_at)
);

-- Auto-retirement rules
-- Configurable rules for automatic retirement on feedstock delivery
CREATE TABLE carbon_auto_retire_rules (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id        BIGINT NOT NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  
  -- Rule configuration
  trigger_event  ENUM('delivery_verified', 'quality_verified', 'payment_settled') DEFAULT 'delivery_verified',
  feedstock_type VARCHAR(50),                      -- NULL = all feedstocks
  project_id     BIGINT,                           -- NULL = all projects
  
  -- Retirement calculation
  accu_per_tonne DECIMAL(6, 3) DEFAULT 1.800,      -- ACCUs to retire per tonne DM
  retirement_narrative_template TEXT,              -- Template with {grower_abn}, {delivery_id}, etc.
  
  -- Limits
  max_retire_per_delivery INT,                     -- Max units to retire per delivery
  monthly_retire_limit INT,                        -- Monthly cap
  monthly_retired_count INT DEFAULT 0,             -- Current month's count
  monthly_reset_at TIMESTAMP,                      -- When to reset monthly count
  
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_auto_retire_user (user_id),
  INDEX idx_auto_retire_active (is_active)
);

-- Webhook events from CorTenX
-- Stores incoming webhook events for processing and audit
CREATE TABLE carbon_webhooks (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_id       VARCHAR(50) NOT NULL UNIQUE,      -- CorTenX event ID
  event_type     VARCHAR(50) NOT NULL,             -- e.g., "unit.transferred", "unit.retired"
  payload        JSON NOT NULL,                    -- Full webhook payload
  signature      VARCHAR(128) NOT NULL,            -- SHA-256 signature for verification
  signature_verified BOOLEAN DEFAULT FALSE,
  processed      BOOLEAN DEFAULT FALSE,
  processed_at   TIMESTAMP,
  error_message  TEXT,
  received_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_webhook_event_id (event_id),
  INDEX idx_webhook_processed (processed),
  INDEX idx_webhook_received (received_at)
);
