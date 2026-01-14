-- Beema Bamboo tables for perennial biofuel feedstock management

-- Beema plots registered by growers
CREATE TABLE `beema_plots` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `grower_id` BIGINT NOT NULL,
  `geometry` TEXT NOT NULL COMMENT 'WKT polygon of planting boundary',
  `centroid_lat` DECIMAL(10, 7),
  `centroid_lng` DECIMAL(10, 7),
  `area_ha` DECIMAL(8, 2) NOT NULL,
  `planting_date` DATE NOT NULL,
  `first_harvest_date` DATE,
  `yield_class` ENUM('A', 'B', 'C') NOT NULL DEFAULT 'B' COMMENT 'A: >90%, B: 70-90%, C: <70% expected yield',
  `contract_id` BIGINT,
  `status` ENUM('planned', 'planted', 'establishment', 'harvest', 'terminated') NOT NULL DEFAULT 'planned',
  `verified_at` TIMESTAMP NULL,
  `verified_by` BIGINT NULL,
  `ndvi_score` DECIMAL(4, 3) COMMENT 'Latest NDVI reading (0-1)',
  `ndvi_updated_at` TIMESTAMP NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`grower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`contract_id`) REFERENCES `contracts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_beema_grower` (`grower_id`),
  INDEX `idx_beema_status` (`status`),
  INDEX `idx_beema_yield_class` (`yield_class`)
);

-- Beema suitability grid (pre-computed from CSIRO data)
CREATE TABLE `beema_suitability_grid` (
  `cell_id` VARCHAR(20) PRIMARY KEY COMMENT 'Quadkey format: {zoom}_{x}_{y}',
  `centroid_lat` DECIMAL(10, 7) NOT NULL,
  `centroid_lng` DECIMAL(10, 7) NOT NULL,
  `suitability` TINYINT NOT NULL COMMENT '0-100 suitability score',
  `yield_t_dm_ha_yr` DECIMAL(4, 1) NOT NULL COMMENT 'Expected yield in tonnes dry matter per ha per year',
  `rainfall_mm` SMALLINT COMMENT 'Average annual rainfall',
  `frost_days` TINYINT COMMENT 'Average annual frost days',
  `slope_pct` TINYINT COMMENT 'Average slope percentage',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_suitability` (`suitability`),
  INDEX `idx_location` (`centroid_lat`, `centroid_lng`)
);

-- Beema verification documents (linked to document vault)
CREATE TABLE `beema_verifications` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `plot_id` BIGINT NOT NULL,
  `document_type` ENUM('planting_invoice', 'nursery_certificate', 'geo_photo', 'ndvi_report', 'other') NOT NULL,
  `document_url` VARCHAR(512) NOT NULL,
  `photo_lat` DECIMAL(10, 7) COMMENT 'EXIF latitude from geo-tagged photo',
  `photo_lng` DECIMAL(10, 7) COMMENT 'EXIF longitude from geo-tagged photo',
  `photo_timestamp` TIMESTAMP NULL COMMENT 'EXIF timestamp',
  `verified` BOOLEAN DEFAULT FALSE,
  `verified_at` TIMESTAMP NULL,
  `verified_by` BIGINT NULL,
  `rejection_reason` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`plot_id`) REFERENCES `beema_plots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_verification_plot` (`plot_id`),
  INDEX `idx_verification_status` (`verified`)
);

-- Beema yield records (annual harvest tracking)
CREATE TABLE `beema_yields` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `plot_id` BIGINT NOT NULL,
  `harvest_year` YEAR NOT NULL,
  `harvest_date` DATE,
  `yield_t_dm` DECIMAL(10, 2) NOT NULL COMMENT 'Total tonnes dry matter harvested',
  `yield_per_ha` DECIMAL(6, 2) NOT NULL COMMENT 'Tonnes dry matter per hectare',
  `moisture_pct` DECIMAL(4, 1) COMMENT 'Moisture content at harvest',
  `verified` BOOLEAN DEFAULT FALSE,
  `buyer_id` BIGINT COMMENT 'Buyer who received the harvest',
  `contract_id` BIGINT,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`plot_id`) REFERENCES `beema_plots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`contract_id`) REFERENCES `contracts`(`id`) ON DELETE SET NULL,
  UNIQUE INDEX `idx_yield_plot_year` (`plot_id`, `harvest_year`),
  INDEX `idx_yield_year` (`harvest_year`)
);

-- Beema contracts (specialized offtake agreements)
CREATE TABLE `beema_contracts` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `plot_id` BIGINT NOT NULL,
  `buyer_id` BIGINT NOT NULL,
  `contract_type` ENUM('fixed', 'indexed', 'hybrid') NOT NULL DEFAULT 'indexed',
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `base_price_per_tonne` DECIMAL(10, 2) NOT NULL,
  `price_escalation_pct` DECIMAL(4, 2) DEFAULT 3.00 COMMENT 'Annual price escalation percentage',
  `min_volume_t` DECIMAL(10, 2) COMMENT 'Minimum annual volume commitment',
  `max_volume_t` DECIMAL(10, 2) COMMENT 'Maximum annual volume cap',
  `extension_option_years` TINYINT DEFAULT 5,
  `status` ENUM('draft', 'pending_grower', 'pending_buyer', 'active', 'completed', 'terminated') NOT NULL DEFAULT 'draft',
  `signed_by_grower_at` TIMESTAMP NULL,
  `signed_by_buyer_at` TIMESTAMP NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`plot_id`) REFERENCES `beema_plots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_beema_contract_buyer` (`buyer_id`),
  INDEX `idx_beema_contract_status` (`status`),
  INDEX `idx_beema_contract_dates` (`start_date`, `end_date`)
);
