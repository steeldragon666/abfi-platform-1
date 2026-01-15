-- ============================================================================
-- GATE PAYMENT RAIL - STAGE-GATED TELEMETRY & RELEASES
-- ============================================================================

CREATE TABLE gate_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  deviceId VARCHAR(64) NOT NULL UNIQUE,
  deviceType ENUM('gateway', 'probe', 'simulator') NOT NULL,
  status ENUM('active', 'inactive', 'revoked') NOT NULL DEFAULT 'active',
  keyAlgorithm VARCHAR(32) DEFAULT 'hmac-sha256',
  publicKey TEXT,
  sharedSecret TEXT,
  lastSeen TIMESTAMP NULL,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX gate_devices_status_idx (status),
  INDEX gate_devices_lastSeen_idx (lastSeen)
);

CREATE TABLE gate_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  deviceId INT NOT NULL,
  gateIndex INT NOT NULL,
  consignmentId VARCHAR(32),
  deliveryId INT,
  payload JSON NOT NULL,
  eventTime TIMESTAMP NULL,
  receivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  cumulativeTonnes DECIMAL(12, 3),
  cumulativeDryMatterTonnes DECIMAL(12, 3),
  signatureStatus ENUM('verified', 'invalid', 'missing') NOT NULL DEFAULT 'missing',
  releasedPercent DECIMAL(5, 2),
  status ENUM('accepted', 'rejected') NOT NULL DEFAULT 'accepted',
  INDEX gate_events_consignment_idx (consignmentId),
  INDEX gate_events_delivery_idx (deliveryId),
  INDEX gate_events_gateIndex_idx (gateIndex),
  INDEX gate_events_status_idx (status),
  CONSTRAINT gate_events_device_fk FOREIGN KEY (deviceId) REFERENCES gate_devices(id),
  CONSTRAINT gate_events_delivery_fk FOREIGN KEY (deliveryId) REFERENCES deliveries(id)
);

CREATE TABLE payment_guarantees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contractId INT,
  deliveryId INT,
  sourceType ENUM('sblc', 'trust', 'escrow', 'other') NOT NULL,
  instrumentRef VARCHAR(128),
  amountLocked DECIMAL(14, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AUD',
  status ENUM('pending', 'secured', 'released', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  fundsSecuredAt TIMESTAMP NULL,
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX payment_guarantees_contract_idx (contractId),
  INDEX payment_guarantees_delivery_idx (deliveryId),
  INDEX payment_guarantees_status_idx (status),
  CONSTRAINT payment_guarantees_contract_fk FOREIGN KEY (contractId) REFERENCES contracts(id),
  CONSTRAINT payment_guarantees_delivery_fk FOREIGN KEY (deliveryId) REFERENCES deliveries(id)
);

CREATE TABLE gate_releases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gateEventId INT NOT NULL,
  consignmentId VARCHAR(32),
  deliveryId INT,
  paymentGuaranteeId INT,
  gateIndex INT NOT NULL,
  releasePercent DECIMAL(5, 2) NOT NULL,
  releaseAmount DECIMAL(14, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AUD',
  chainId INT,
  txHash VARCHAR(100),
  paymentSource ENUM('escrow', 'trust', 'sblc', 'manual') NOT NULL DEFAULT 'escrow',
  status ENUM('pending', 'submitted', 'confirmed', 'failed') NOT NULL DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX gate_releases_consignment_idx (consignmentId),
  INDEX gate_releases_delivery_idx (deliveryId),
  INDEX gate_releases_gateIndex_idx (gateIndex),
  INDEX gate_releases_status_idx (status),
  CONSTRAINT gate_releases_event_fk FOREIGN KEY (gateEventId) REFERENCES gate_events(id),
  CONSTRAINT gate_releases_delivery_fk FOREIGN KEY (deliveryId) REFERENCES deliveries(id),
  CONSTRAINT gate_releases_payment_fk FOREIGN KEY (paymentGuaranteeId) REFERENCES payment_guarantees(id)
);
