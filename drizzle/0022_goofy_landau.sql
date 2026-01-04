CREATE TABLE `abaresCommodityPrices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`priceDate` timestamp NOT NULL,
	`commodity` varchar(100) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`priceType` enum('farm_gate','export','wholesale') DEFAULT 'farm_gate',
	`commodityState` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT','NAT'),
	`region` varchar(100),
	`avg5Year` decimal(10,2),
	`avg10Year` decimal(10,2),
	`sourceReport` varchar(255),
	`isProjected` boolean DEFAULT false,
	`ingestedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `abaresCommodityPrices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `abaresCropForecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportDate` timestamp NOT NULL,
	`season` varchar(10) NOT NULL,
	`sourceReport` varchar(255),
	`crop` varchar(50) NOT NULL,
	`cropState` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT') NOT NULL,
	`regionCode` varchar(20),
	`plantedAreaHa` decimal(12,2),
	`harvestedAreaHa` decimal(12,2),
	`expectedProductionTonnes` decimal(14,2),
	`expectedYieldTonnesPerHa` decimal(6,2),
	`confidenceLower` decimal(6,2),
	`confidenceUpper` decimal(6,2),
	`forecastType` enum('preliminary','revised','final') DEFAULT 'revised',
	`comparedToPreviousYear` decimal(5,2),
	`comparedTo5YearAvg` decimal(5,2),
	`seasonalConditions` enum('favorable','average','below_average','drought') DEFAULT 'average',
	`notes` text,
	`ingestedAt` timestamp NOT NULL DEFAULT (now()),
	`sourceUrl` varchar(500),
	CONSTRAINT `abaresCropForecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `abaresFarmBenchmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`financialYear` varchar(10) NOT NULL,
	`farmSizeCategory` enum('small','medium','large','very_large'),
	`farmType` varchar(100) NOT NULL,
	`benchmarkState` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT') NOT NULL,
	`benchmarkRegion` varchar(100),
	`avgGrossMarginPerHa` decimal(10,2),
	`avgOperatingCostsPerHa` decimal(10,2),
	`avgNetFarmIncome` decimal(14,2),
	`medianNetFarmIncome` decimal(14,2),
	`debtToAssetRatio` decimal(5,4),
	`returnOnCapital` decimal(5,4),
	`equityRatio` decimal(5,4),
	`avgFarmAreaHa` decimal(10,2),
	`avgCroppedAreaHa` decimal(10,2),
	`sampleSize` int,
	`confidenceLevel` decimal(4,2),
	`ingestedAt` timestamp NOT NULL DEFAULT (now()),
	`sourceReport` varchar(255),
	CONSTRAINT `abaresFarmBenchmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `abaresIngestionRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runType` enum('crop_report','commodity_prices','farm_benchmarks','land_use') NOT NULL,
	`ingestionSourceUrl` varchar(500),
	`startedAt` timestamp NOT NULL,
	`finishedAt` timestamp,
	`ingestionStatus` enum('started','succeeded','partial','failed') NOT NULL,
	`recordsIn` int,
	`recordsOut` int,
	`recordsSkipped` int,
	`errorMessage` text,
	`errorDetails` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `abaresIngestionRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `abaresSupplyForecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`forecastDate` timestamp NOT NULL,
	`forecastRegionCode` varchar(20) NOT NULL,
	`feedstockType` varchar(100) NOT NULL,
	`horizonDays` int NOT NULL,
	`availabilityProbability` decimal(5,4) NOT NULL,
	`confidenceIntervalLower` decimal(5,4),
	`confidenceIntervalUpper` decimal(5,4),
	`contributingFactors` json,
	`modelVersion` varchar(50),
	`modelAccuracy` decimal(5,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `abaresSupplyForecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `abaresYieldPredictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`predictionDate` timestamp NOT NULL,
	`propertyId` int,
	`supplierId` int,
	`predictionCrop` varchar(50) NOT NULL,
	`predictionSeason` varchar(10) NOT NULL,
	`predictionState` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`predictionRegionCode` varchar(20),
	`predictedYieldTonnesPerHa` decimal(8,2) NOT NULL,
	`yieldConfidenceLower` decimal(8,2),
	`yieldConfidenceUpper` decimal(8,2),
	`methodology` varchar(255),
	`dataInputs` json,
	`actualYieldTonnesPerHa` decimal(8,2),
	`predictionError` decimal(6,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`validatedAt` timestamp,
	CONSTRAINT `abaresYieldPredictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agriculturalClimateMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int,
	`supplierId` int,
	`latitude` decimal(10,6) NOT NULL,
	`longitude` decimal(10,6) NOT NULL,
	`region` varchar(100),
	`periodStart` date NOT NULL,
	`periodEnd` date NOT NULL,
	`season` varchar(20),
	`cropType` varchar(50),
	`growingDegreeDays` int,
	`chillHours` int,
	`effectiveRainfallMm` decimal(8,2),
	`frostDays` int,
	`heatStressDays` int,
	`droughtIndex` decimal(5,4),
	`frostRisk` enum('low','moderate','high'),
	`heatStressRisk` enum('low','moderate','high'),
	`droughtRisk` enum('low','moderate','high'),
	`soilMoistureIndex` decimal(5,4),
	`dataSource` varchar(50) DEFAULT 'SILO',
	`calculatedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agriculturalClimateMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bioenergyProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`company` varchar(255) NOT NULL,
	`parentCompany` varchar(255),
	`projectCode` varchar(100),
	`location` varchar(255) NOT NULL,
	`state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`latitude` decimal(10,6),
	`longitude` decimal(10,6),
	`capacity` varchar(100),
	`capacityValue` int,
	`capacityUnit` varchar(20),
	`products` json,
	`technology` varchar(100),
	`technologyProvider` varchar(255),
	`feedstock` varchar(255),
	`secondaryFeedstocks` json,
	`biomass50km` int,
	`biomass100km` int,
	`projectStatus` enum('announced','feasibility','development','construction','operational','halted','cancelled') NOT NULL DEFAULT 'announced',
	`announcementDate` date,
	`targetCOD` date,
	`actualCOD` date,
	`bankabilityRating` varchar(10),
	`growerContractRating` varchar(10),
	`techReadinessRating` varchar(10),
	`carbonIntensityRating` varchar(10),
	`carbonIntensityValue` decimal(5,1),
	`offtakeRating` varchar(10),
	`govSupportRating` varchar(10),
	`signal` enum('BULLISH','NEUTRAL-BULLISH','NEUTRAL','NEUTRAL-BEARISH','BEARISH','ON HOLD','MOTHBALLED','CANCELLED') DEFAULT 'NEUTRAL',
	`assessmentNotes` text,
	`totalCapex` decimal(12,2),
	`fundingSecured` decimal(12,2),
	`grantFunding` decimal(12,2),
	`grantSource` varchar(255),
	`primaryOfftaker` varchar(255),
	`offtakeType` varchar(100),
	`offtakeVolume` varchar(100),
	`dataSource` varchar(255),
	`sourceUrl` varchar(500),
	`lastVerifiedAt` timestamp,
	`verifiedBy` int,
	`claimedByUserId` int,
	`claimedBySupplierId` int,
	`claimStatus` enum('unclaimed','pending','verified','rejected') DEFAULT 'unclaimed',
	`claimedAt` timestamp,
	`claimVerifiedAt` timestamp,
	`linkedProjectId` int,
	`publicDescription` text,
	`publicContactEmail` varchar(320),
	`publicWebsite` varchar(255),
	`logoUrl` varchar(500),
	`isPublic` boolean NOT NULL DEFAULT true,
	`viewCount` int DEFAULT 0,
	`lastUpdatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bioenergyProjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `bioenergyProjects_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `bomForecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationName` varchar(100) NOT NULL,
	`state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT') NOT NULL,
	`latitude` decimal(10,6) NOT NULL,
	`longitude` decimal(10,6) NOT NULL,
	`issueTime` timestamp NOT NULL,
	`forecastDate` date NOT NULL,
	`minTempC` decimal(5,2),
	`maxTempC` decimal(5,2),
	`precis` varchar(255),
	`precipitationProbability` int,
	`precipitationRangeMin` decimal(6,2),
	`precipitationRangeMax` decimal(6,2),
	`uvIndex` int,
	`uvCategory` varchar(20),
	`fireWeatherRating` varchar(50),
	`fireWeatherIndex` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bomForecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bomIngestionRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runType` enum('silo_historical','observations','forecasts','seasonal_outlook','warnings','climate_metrics') NOT NULL,
	`sourceUrl` varchar(500),
	`region` varchar(100),
	`state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`dateRangeStart` date,
	`dateRangeEnd` date,
	`startedAt` timestamp NOT NULL,
	`finishedAt` timestamp,
	`status` enum('started','succeeded','partial','failed') NOT NULL,
	`recordsIn` int,
	`recordsOut` int,
	`recordsSkipped` int,
	`errorMessage` text,
	`errorDetails` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bomIngestionRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bomObservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stationId` varchar(20) NOT NULL,
	`stationName` varchar(100) NOT NULL,
	`state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT') NOT NULL,
	`latitude` decimal(10,6) NOT NULL,
	`longitude` decimal(10,6) NOT NULL,
	`observationTime` timestamp NOT NULL,
	`temperatureC` decimal(5,2),
	`apparentTempC` decimal(5,2),
	`dewPointC` decimal(5,2),
	`humidityPercent` int,
	`windSpeedKmh` decimal(6,2),
	`windGustKmh` decimal(6,2),
	`windDirection` varchar(10),
	`pressureHPa` decimal(7,2),
	`rainfallSince9amMm` decimal(8,2),
	`rainfall24hrMm` decimal(8,2),
	`cloudCover` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bomObservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bomWarnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`warningId` varchar(50) NOT NULL,
	`warningType` enum('severe_thunderstorm','flood','fire_weather','heat','frost','wind','other') NOT NULL,
	`severity` enum('minor','moderate','severe','extreme') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`issueTime` timestamp NOT NULL,
	`expiryTime` timestamp,
	`affectedAreas` json NOT NULL,
	`state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`coordinates` json,
	`active` boolean NOT NULL DEFAULT true,
	`supersededBy` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bomWarnings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bomWarnings_warningId_unique` UNIQUE(`warningId`)
);
--> statement-breakpoint
CREATE TABLE `climateLocationData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`latitude` decimal(10,6) NOT NULL,
	`longitude` decimal(10,6) NOT NULL,
	`locationHash` varchar(64) NOT NULL,
	`nearestRegion` varchar(100),
	`climateState` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`ndviMean` decimal(5,4),
	`ndviMin` decimal(5,4),
	`ndviMax` decimal(5,4),
	`ndviCategory` enum('excellent','good','moderate','poor','bare'),
	`vegetationHealthScore` int,
	`vegetationEVI` decimal(5,4),
	`vegetationLAI` decimal(5,2),
	`vegetationTrend` enum('improving','stable','declining'),
	`soilMoistureSurface` decimal(4,3),
	`soilMoistureRootZone` decimal(4,3),
	`droughtRisk` enum('low','moderate','high','severe'),
	`landCoverCrops` decimal(5,2),
	`landCoverTrees` decimal(5,2),
	`landCoverGrass` decimal(5,2),
	`landCoverBare` decimal(5,2),
	`rainfallLast30Days` decimal(6,1),
	`rainfallLast90Days` decimal(6,1),
	`rainfallYTD` decimal(7,1),
	`tempMaxAvg30Days` decimal(4,1),
	`tempMinAvg30Days` decimal(4,1),
	`growingDegreeDays` int,
	`frostDaysLast30` int,
	`heatStressDaysLast30` int,
	`frostRisk` enum('low','moderate','high'),
	`heatStressRisk` enum('low','moderate','high'),
	`satelliteDataUpdatedAt` timestamp,
	`bomDataUpdatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `climateLocationData_id` PRIMARY KEY(`id`),
	CONSTRAINT `climateLocationData_locationHash_unique` UNIQUE(`locationHash`)
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
CREATE TABLE `projectClaims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`supplierId` int,
	`claimType` enum('owner','operator','developer','representative') NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`abn` varchar(11),
	`contactName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(20),
	`position` varchar(100),
	`verificationDocuments` json,
	`verificationNotes` text,
	`claimRequestStatus` enum('pending','under_review','verified','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectClaims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seasonalOutlooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueDate` date NOT NULL,
	`validPeriodStart` date NOT NULL,
	`validPeriodEnd` date NOT NULL,
	`validPeriodMonths` varchar(50),
	`region` varchar(100) NOT NULL,
	`state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`latitude` decimal(10,6),
	`longitude` decimal(10,6),
	`rainBelowMedianPercent` int,
	`rainNearMedianPercent` int,
	`rainAboveMedianPercent` int,
	`medianRainfallMm` decimal(8,2),
	`maxTempBelowMedianPercent` int,
	`maxTempNearMedianPercent` int,
	`maxTempAboveMedianPercent` int,
	`minTempBelowMedianPercent` int,
	`minTempNearMedianPercent` int,
	`minTempAboveMedianPercent` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seasonalOutlooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siloClimateData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`latitude` decimal(10,6) NOT NULL,
	`longitude` decimal(10,6) NOT NULL,
	`stationId` varchar(20),
	`stationName` varchar(100),
	`date` date NOT NULL,
	`dailyRainMm` decimal(8,2),
	`maxTempC` decimal(5,2),
	`minTempC` decimal(5,2),
	`solarRadiationMJ` decimal(6,2),
	`evapPanMm` decimal(6,2),
	`evapSynMm` decimal(6,2),
	`etShortCropMm` decimal(6,2),
	`etTallCropMm` decimal(6,2),
	`vapourPressureHPa` decimal(6,2),
	`vpDeficitHPa` decimal(6,2),
	`relHumidityMaxTemp` int,
	`relHumidityMinTemp` int,
	`mslPressureHPa` decimal(7,2),
	`qualityCodes` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `siloClimateData_id` PRIMARY KEY(`id`)
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
ALTER TABLE `bankabilityAssessments` ADD `reassessmentRequired` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `abaresYieldPredictions` ADD CONSTRAINT `abaresYieldPredictions_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `abaresYieldPredictions` ADD CONSTRAINT `abaresYieldPredictions_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agriculturalClimateMetrics` ADD CONSTRAINT `agriculturalClimateMetrics_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agriculturalClimateMetrics` ADD CONSTRAINT `agriculturalClimateMetrics_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bioenergyProjects` ADD CONSTRAINT `bioenergyProjects_verifiedBy_users_id_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bioenergyProjects` ADD CONSTRAINT `bioenergyProjects_claimedByUserId_users_id_fk` FOREIGN KEY (`claimedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bioenergyProjects` ADD CONSTRAINT `bioenergyProjects_claimedBySupplierId_suppliers_id_fk` FOREIGN KEY (`claimedBySupplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bioenergyProjects` ADD CONSTRAINT `bioenergyProjects_linkedProjectId_projects_id_fk` FOREIGN KEY (`linkedProjectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bioenergyProjects` ADD CONSTRAINT `bioenergyProjects_lastUpdatedBy_users_id_fk` FOREIGN KEY (`lastUpdatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contractMatches` ADD CONSTRAINT `contractMatches_demandSignalId_demandSignals_id_fk` FOREIGN KEY (`demandSignalId`) REFERENCES `demandSignals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contractMatches` ADD CONSTRAINT `contractMatches_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contractMatches` ADD CONSTRAINT `contractMatches_intentionId_growingIntentions_id_fk` FOREIGN KEY (`intentionId`) REFERENCES `growingIntentions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_matchId_contractMatches_id_fk` FOREIGN KEY (`matchId`) REFERENCES `contractMatches`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_buyerId_users_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_growerId_users_id_fk` FOREIGN KEY (`growerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deliveries` ADD CONSTRAINT `deliveries_contractId_contracts_id_fk` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `growingIntentions` ADD CONSTRAINT `growingIntentions_growerId_suppliers_id_fk` FOREIGN KEY (`growerId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `priceAlerts` ADD CONSTRAINT `priceAlerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectClaims` ADD CONSTRAINT `projectClaims_projectId_bioenergyProjects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `bioenergyProjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectClaims` ADD CONSTRAINT `projectClaims_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectClaims` ADD CONSTRAINT `projectClaims_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectClaims` ADD CONSTRAINT `projectClaims_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `abaresCommodityPrices_commodityDate_idx` ON `abaresCommodityPrices` (`commodity`,`priceDate`);--> statement-breakpoint
CREATE INDEX `abaresCommodityPrices_priceDate_idx` ON `abaresCommodityPrices` (`priceDate`);--> statement-breakpoint
CREATE INDEX `abaresCropForecasts_season_idx` ON `abaresCropForecasts` (`season`);--> statement-breakpoint
CREATE INDEX `abaresCropForecasts_cropState_idx` ON `abaresCropForecasts` (`crop`,`cropState`);--> statement-breakpoint
CREATE INDEX `abaresCropForecasts_reportDate_idx` ON `abaresCropForecasts` (`reportDate`);--> statement-breakpoint
CREATE INDEX `abaresFarmBenchmarks_fyState_idx` ON `abaresFarmBenchmarks` (`financialYear`,`benchmarkState`);--> statement-breakpoint
CREATE INDEX `abaresFarmBenchmarks_farmType_idx` ON `abaresFarmBenchmarks` (`farmType`);--> statement-breakpoint
CREATE INDEX `abaresIngestionRuns_runType_idx` ON `abaresIngestionRuns` (`runType`);--> statement-breakpoint
CREATE INDEX `abaresIngestionRuns_startedAt_idx` ON `abaresIngestionRuns` (`startedAt`);--> statement-breakpoint
CREATE INDEX `abaresSupplyForecasts_regionFeedstock_idx` ON `abaresSupplyForecasts` (`forecastRegionCode`,`feedstockType`);--> statement-breakpoint
CREATE INDEX `abaresSupplyForecasts_forecastDate_idx` ON `abaresSupplyForecasts` (`forecastDate`);--> statement-breakpoint
CREATE INDEX `abaresYieldPredictions_property_idx` ON `abaresYieldPredictions` (`propertyId`);--> statement-breakpoint
CREATE INDEX `abaresYieldPredictions_cropSeason_idx` ON `abaresYieldPredictions` (`predictionCrop`,`predictionSeason`);--> statement-breakpoint
CREATE INDEX `agClimateMetrics_property_idx` ON `agriculturalClimateMetrics` (`propertyId`);--> statement-breakpoint
CREATE INDEX `agClimateMetrics_supplier_idx` ON `agriculturalClimateMetrics` (`supplierId`);--> statement-breakpoint
CREATE INDEX `agClimateMetrics_period_idx` ON `agriculturalClimateMetrics` (`periodStart`,`periodEnd`);--> statement-breakpoint
CREATE INDEX `agClimateMetrics_region_idx` ON `agriculturalClimateMetrics` (`region`);--> statement-breakpoint
CREATE INDEX `bioenergyProjects_slug_idx` ON `bioenergyProjects` (`slug`);--> statement-breakpoint
CREATE INDEX `bioenergyProjects_state_idx` ON `bioenergyProjects` (`state`);--> statement-breakpoint
CREATE INDEX `bioenergyProjects_status_idx` ON `bioenergyProjects` (`projectStatus`);--> statement-breakpoint
CREATE INDEX `bioenergyProjects_claimStatus_idx` ON `bioenergyProjects` (`claimStatus`);--> statement-breakpoint
CREATE INDEX `bioenergyProjects_bankability_idx` ON `bioenergyProjects` (`bankabilityRating`);--> statement-breakpoint
CREATE INDEX `bomForecasts_location_date_idx` ON `bomForecasts` (`locationName`,`forecastDate`);--> statement-breakpoint
CREATE INDEX `bomForecasts_issueTime_idx` ON `bomForecasts` (`issueTime`);--> statement-breakpoint
CREATE INDEX `bomForecasts_forecastDate_idx` ON `bomForecasts` (`forecastDate`);--> statement-breakpoint
CREATE INDEX `bomIngestionRuns_runType_idx` ON `bomIngestionRuns` (`runType`);--> statement-breakpoint
CREATE INDEX `bomIngestionRuns_startedAt_idx` ON `bomIngestionRuns` (`startedAt`);--> statement-breakpoint
CREATE INDEX `bomIngestionRuns_state_idx` ON `bomIngestionRuns` (`state`);--> statement-breakpoint
CREATE INDEX `bomObservations_station_time_idx` ON `bomObservations` (`stationId`,`observationTime`);--> statement-breakpoint
CREATE INDEX `bomObservations_time_idx` ON `bomObservations` (`observationTime`);--> statement-breakpoint
CREATE INDEX `bomObservations_state_idx` ON `bomObservations` (`state`);--> statement-breakpoint
CREATE INDEX `bomWarnings_warningId_idx` ON `bomWarnings` (`warningId`);--> statement-breakpoint
CREATE INDEX `bomWarnings_type_idx` ON `bomWarnings` (`warningType`);--> statement-breakpoint
CREATE INDEX `bomWarnings_severity_idx` ON `bomWarnings` (`severity`);--> statement-breakpoint
CREATE INDEX `bomWarnings_active_idx` ON `bomWarnings` (`active`);--> statement-breakpoint
CREATE INDEX `bomWarnings_issueTime_idx` ON `bomWarnings` (`issueTime`);--> statement-breakpoint
CREATE INDEX `bomWarnings_state_idx` ON `bomWarnings` (`state`);--> statement-breakpoint
CREATE INDEX `climateLocationData_hash_idx` ON `climateLocationData` (`locationHash`);--> statement-breakpoint
CREATE INDEX `climateLocationData_state_idx` ON `climateLocationData` (`climateState`);--> statement-breakpoint
CREATE INDEX `climateLocationData_coords_idx` ON `climateLocationData` (`latitude`,`longitude`);--> statement-breakpoint
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
CREATE INDEX `forwardAvailability_frm_idx` ON `forwardAvailability` (`feedstockTypeId`,`regionCode`,`year`,`month`);--> statement-breakpoint
CREATE INDEX `growingIntentions_growerId_idx` ON `growingIntentions` (`growerId`);--> statement-breakpoint
CREATE INDEX `growingIntentions_status_idx` ON `growingIntentions` (`intentionStatus`);--> statement-breakpoint
CREATE INDEX `growingIntentions_harvestDate_idx` ON `growingIntentions` (`expectedHarvestDate`);--> statement-breakpoint
CREATE INDEX `logisticsHubs_type_idx` ON `logisticsHubs` (`hubType`);--> statement-breakpoint
CREATE INDEX `powerStations_type_idx` ON `powerStations` (`stationType`);--> statement-breakpoint
CREATE INDEX `powerStations_status_idx` ON `powerStations` (`stationStatus`);--> statement-breakpoint
CREATE INDEX `priceAlerts_userId_idx` ON `priceAlerts` (`userId`);--> statement-breakpoint
CREATE INDEX `priceAlerts_active_idx` ON `priceAlerts` (`isActive`);--> statement-breakpoint
CREATE INDEX `priceSignals_feedstock_region_idx` ON `priceSignals` (`feedstockTypeId`,`regionId`);--> statement-breakpoint
CREATE INDEX `priceSignals_validFrom_idx` ON `priceSignals` (`validFrom`);--> statement-breakpoint
CREATE INDEX `projectClaims_projectId_idx` ON `projectClaims` (`projectId`);--> statement-breakpoint
CREATE INDEX `projectClaims_userId_idx` ON `projectClaims` (`userId`);--> statement-breakpoint
CREATE INDEX `projectClaims_status_idx` ON `projectClaims` (`claimRequestStatus`);--> statement-breakpoint
CREATE INDEX `seasonalOutlooks_region_date_idx` ON `seasonalOutlooks` (`region`,`issueDate`);--> statement-breakpoint
CREATE INDEX `seasonalOutlooks_issueDate_idx` ON `seasonalOutlooks` (`issueDate`);--> statement-breakpoint
CREATE INDEX `seasonalOutlooks_validPeriod_idx` ON `seasonalOutlooks` (`validPeriodStart`,`validPeriodEnd`);--> statement-breakpoint
CREATE INDEX `siloClimateData_location_date_idx` ON `siloClimateData` (`latitude`,`longitude`,`date`);--> statement-breakpoint
CREATE INDEX `siloClimateData_date_idx` ON `siloClimateData` (`date`);--> statement-breakpoint
CREATE INDEX `siloClimateData_station_idx` ON `siloClimateData` (`stationId`);--> statement-breakpoint
CREATE INDEX `transportRoutes_origin_idx` ON `transportRoutes` (`originType`,`originId`);--> statement-breakpoint
CREATE INDEX `transportRoutes_destination_idx` ON `transportRoutes` (`destinationType`,`destinationId`);