-- Market Intelligence Map Tables (Phase 9)

CREATE TABLE `growingIntentions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`growerId` int NOT NULL,
	`feedstockTypeId` varchar(50) NOT NULL,
	`areaHa` decimal(10,2) NOT NULL,
	`latitude` varchar(20) NOT NULL,
	`longitude` varchar(20) NOT NULL,
	`plantDate` date NOT NULL,
	`expectedHarvestDate` date NOT NULL,
	`expectedYield` decimal(12,2),
	`commitmentLevel` enum('planning','confirmed','under_contract') NOT NULL,
	`visibility` enum('private','market_wide','role_restricted','counterparty','public') DEFAULT 'market_wide',
	`intentionStatus` enum('active','cancelled','harvested') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `growingIntentions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `powerStations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`latitude` varchar(20) NOT NULL,
	`longitude` varchar(20) NOT NULL,
	`stationType` enum('cofiring','dedicated','cogen','biogas','processor') NOT NULL,
	`capacityMw` decimal(10,2),
	`feedstockRequirements` json,
	`stationContractStatus` enum('open','partial','contracted'),
	`ownerName` varchar(255),
	`stationStatus` enum('operational','development','planned'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `powerStations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `logisticsHubs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`latitude` varchar(20) NOT NULL,
	`longitude` varchar(20) NOT NULL,
	`hubType` enum('port','rail_terminal','road_hub','storage') NOT NULL,
	`handlingCapacity` decimal(12,2),
	`feedstockTypes` json,
	`transportCostPerKm` decimal(6,2),
	`hubStatus` enum('active','planned') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logisticsHubs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractMatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`demandSignalId` int NOT NULL,
	`projectId` int,
	`intentionId` int,
	`matchScore` decimal(5,2) NOT NULL,
	`distanceKm` decimal(8,2),
	`estimatedTransportCost` decimal(10,2),
	`volumeMatchPercent` decimal(5,2),
	`matchStatus` enum('suggested','viewed','negotiating','accepted','rejected','expired') DEFAULT 'suggested',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `contractMatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`buyerId` int NOT NULL,
	`growerId` int NOT NULL,
	`feedstockTypeId` varchar(50) NOT NULL,
	`volumeTonnes` decimal(12,2) NOT NULL,
	`pricePerTonne` decimal(10,2) NOT NULL,
	`totalValue` decimal(14,2) NOT NULL,
	`deliveryTerms` json,
	`qualitySpecs` json,
	`paymentTerms` enum('upfront','on_delivery','net_30','milestone'),
	`paymentSchedule` json,
	`contractStatus` enum('draft','pending_grower','pending_buyer','active','delivering','completed','disputed','cancelled') DEFAULT 'draft',
	`signedByBuyer` timestamp,
	`signedByGrower` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`scheduledDate` timestamp NOT NULL,
	`actualDate` timestamp,
	`volumeTonnes` decimal(12,2) NOT NULL,
	`qualityResults` json,
	`pickupLocation` json,
	`deliveryLocation` json,
	`transportProvider` varchar(255),
	`transportCost` decimal(10,2),
	`deliveryStatus` enum('scheduled','in_transit','delivered','quality_verified','disputed','settled') DEFAULT 'scheduled',
	`proofOfDelivery` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priceSignals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedstockTypeId` varchar(50) NOT NULL,
	`regionId` varchar(10) NOT NULL,
	`spotPrice` decimal(10,2),
	`forward1M` decimal(10,2),
	`forward3M` decimal(10,2),
	`forward6M` decimal(10,2),
	`forward12M` decimal(10,2),
	`supplyIndex` decimal(5,2),
	`demandIndex` decimal(5,2),
	`priceSource` enum('contract_average','demand_signal','grower_ask','external_index','calculated'),
	`priceConfidence` enum('high','medium','low','indicative'),
	`validFrom` timestamp NOT NULL,
	`validTo` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `priceSignals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priceAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`feedstockTypeId` varchar(50) NOT NULL,
	`regionId` varchar(10),
	`alertType` enum('above_threshold','below_threshold','percent_change_up','percent_change_down') NOT NULL,
	`thresholdValue` decimal(10,2) NOT NULL,
	`isActive` boolean DEFAULT true,
	`lastTriggered` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `priceAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transportRoutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originType` enum('project','intention','power_station','logistics_hub','custom') NOT NULL,
	`originId` int,
	`originLat` varchar(20) NOT NULL,
	`originLng` varchar(20) NOT NULL,
	`destinationType` enum('project','intention','power_station','logistics_hub','custom') NOT NULL,
	`destinationId` int,
	`destinationLat` varchar(20) NOT NULL,
	`destinationLng` varchar(20) NOT NULL,
	`distanceKm` decimal(8,2) NOT NULL,
	`estimatedHours` decimal(6,2),
	`routeGeometry` json,
	`baseCostPerKm` decimal(6,2),
	`fuelSurcharge` decimal(6,2),
	`tollsCost` decimal(8,2),
	`handlingCost` decimal(8,2),
	`totalCostPerTonne` decimal(8,2),
	`routeTransportMode` enum('road','rail','road_rail','ship') NOT NULL,
	`validFrom` timestamp NOT NULL DEFAULT (now()),
	`validTo` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transportRoutes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forwardAvailability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedstockTypeId` varchar(50) NOT NULL,
	`regionCode` varchar(10),
	`month` int NOT NULL,
	`year` int NOT NULL,
	`confirmedSupply` decimal(14,2),
	`projectedSupply` decimal(14,2),
	`demandCommitted` decimal(14,2),
	`availabilityConfidence` enum('high','medium','low'),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forwardAvailability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `growingIntentions` ADD CONSTRAINT `growingIntentions_growerId_suppliers_id_fk` FOREIGN KEY (`growerId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contractMatches` ADD CONSTRAINT `contractMatches_demandSignalId_demandSignals_id_fk` FOREIGN KEY (`demandSignalId`) REFERENCES `demandSignals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contractMatches` ADD CONSTRAINT `contractMatches_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contractMatches` ADD CONSTRAINT `contractMatches_intentionId_growingIntentions_id_fk` FOREIGN KEY (`intentionId`) REFERENCES `growingIntentions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_matchId_contractMatches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `contractMatches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_buyerId_users_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_growerId_users_id_fk` FOREIGN KEY (`growerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `priceAlerts` ADD CONSTRAINT `priceAlerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `growingIntentions_growerId_idx` ON `growingIntentions` (`growerId`);--> statement-breakpoint
CREATE INDEX `growingIntentions_status_idx` ON `growingIntentions` (`intentionStatus`);--> statement-breakpoint
CREATE INDEX `growingIntentions_harvestDate_idx` ON `growingIntentions` (`expectedHarvestDate`);--> statement-breakpoint
CREATE INDEX `powerStations_type_idx` ON `powerStations` (`stationType`);--> statement-breakpoint
CREATE INDEX `powerStations_status_idx` ON `powerStations` (`stationStatus`);--> statement-breakpoint
CREATE INDEX `logisticsHubs_type_idx` ON `logisticsHubs` (`hubType`);--> statement-breakpoint
CREATE INDEX `contractMatches_demandSignalId_idx` ON `contractMatches` (`demandSignalId`);--> statement-breakpoint
CREATE INDEX `contractMatches_status_idx` ON `contractMatches` (`matchStatus`);--> statement-breakpoint
CREATE INDEX `contractMatches_intentionId_idx` ON `contractMatches` (`intentionId`);--> statement-breakpoint
CREATE INDEX `contracts_buyerId_idx` ON `contracts` (`buyerId`);--> statement-breakpoint
CREATE INDEX `contracts_growerId_idx` ON `contracts` (`growerId`);--> statement-breakpoint
CREATE INDEX `contracts_status_idx` ON `contracts` (`contractStatus`);--> statement-breakpoint
CREATE INDEX `contracts_matchId_idx` ON `contracts` (`matchId`);--> statement-breakpoint
CREATE INDEX `deliveries_contractId_idx` ON `deliveries` (`contractId`);--> statement-breakpoint
CREATE INDEX `deliveries_status_idx` ON `deliveries` (`deliveryStatus`);--> statement-breakpoint
CREATE INDEX `deliveries_scheduledDate_idx` ON `deliveries` (`scheduledDate`);--> statement-breakpoint
CREATE INDEX `priceSignals_feedstock_region_idx` ON `priceSignals` (`feedstockTypeId`,`regionId`);--> statement-breakpoint
CREATE INDEX `priceSignals_validFrom_idx` ON `priceSignals` (`validFrom`);--> statement-breakpoint
CREATE INDEX `priceAlerts_userId_idx` ON `priceAlerts` (`userId`);--> statement-breakpoint
CREATE INDEX `priceAlerts_active_idx` ON `priceAlerts` (`isActive`);--> statement-breakpoint
CREATE INDEX `transportRoutes_origin_idx` ON `transportRoutes` (`originType`,`originId`);--> statement-breakpoint
CREATE INDEX `transportRoutes_destination_idx` ON `transportRoutes` (`destinationType`,`destinationId`);--> statement-breakpoint
CREATE INDEX `forwardAvailability_frm_idx` ON `forwardAvailability` (`feedstockTypeId`,`regionCode`,`year`,`month`);
