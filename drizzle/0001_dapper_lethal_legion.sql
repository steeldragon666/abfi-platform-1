CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`changes` json,
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `buyers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`abn` varchar(11) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(20),
	`facilityName` varchar(255),
	`facilityAddress` varchar(500),
	`facilityLatitude` varchar(20),
	`facilityLongitude` varchar(20),
	`facilityState` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`subscriptionTier` enum('explorer','professional','enterprise') NOT NULL DEFAULT 'explorer',
	`description` text,
	`website` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buyers_id` PRIMARY KEY(`id`),
	CONSTRAINT `buyers_abn_unique` UNIQUE(`abn`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedstockId` int NOT NULL,
	`type` enum('ISCC_EU','ISCC_PLUS','RSB','RED_II','GO','ABFI','OTHER') NOT NULL,
	`certificateNumber` varchar(100),
	`issuedDate` timestamp,
	`expiryDate` timestamp,
	`status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
	`documentUrl` varchar(500),
	`documentKey` varchar(500),
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedstocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`abfiId` varchar(50) NOT NULL,
	`supplierId` int NOT NULL,
	`category` enum('oilseed','UCO','tallow','lignocellulosic','waste','algae','other') NOT NULL,
	`type` varchar(100) NOT NULL,
	`sourceName` varchar(255),
	`sourceAddress` varchar(500),
	`latitude` varchar(20) NOT NULL,
	`longitude` varchar(20) NOT NULL,
	`state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT') NOT NULL,
	`region` varchar(100),
	`productionMethod` enum('crop','waste','residue','processing_byproduct') NOT NULL,
	`annualCapacityTonnes` int NOT NULL,
	`availableVolumeCurrent` int NOT NULL,
	`availableVolumeForward` json,
	`abfiScore` int,
	`sustainabilityScore` int,
	`carbonIntensityScore` int,
	`qualityScore` int,
	`reliabilityScore` int,
	`carbonIntensityValue` int,
	`carbonIntensityMethod` varchar(255),
	`qualityParameters` json,
	`pricePerTonne` int,
	`priceVisibility` enum('public','private','on_request') DEFAULT 'on_request',
	`status` enum('draft','pending_review','active','suspended') NOT NULL DEFAULT 'draft',
	`verificationLevel` enum('self_declared','document_verified','third_party_audited','abfi_certified') NOT NULL DEFAULT 'self_declared',
	`description` text,
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedstocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `feedstocks_abfiId_unique` UNIQUE(`abfiId`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerId` int NOT NULL,
	`supplierId` int NOT NULL,
	`feedstockId` int,
	`subject` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`volumeRequired` int,
	`deliveryLocation` varchar(500),
	`deliveryTimeframeStart` timestamp,
	`deliveryTimeframeEnd` timestamp,
	`qualityRequirements` json,
	`status` enum('open','responded','closed','cancelled') NOT NULL DEFAULT 'open',
	`responseMessage` text,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('inquiry_received','inquiry_response','certificate_expiring','transaction_update','rating_change','verification_update','system_announcement') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`read` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`emailSent` boolean DEFAULT false,
	`emailSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qualityTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedstockId` int NOT NULL,
	`testDate` timestamp NOT NULL,
	`laboratory` varchar(255),
	`parameters` json,
	`overallPass` boolean DEFAULT true,
	`reportUrl` varchar(500),
	`reportKey` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qualityTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`criteria` json NOT NULL,
	`notifyOnNewMatches` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`abn` varchar(11) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(20),
	`addressLine1` varchar(255),
	`addressLine2` varchar(255),
	`city` varchar(100),
	`state` enum('NSW','VIC','QLD','SA','WA','TAS','NT','ACT'),
	`postcode` varchar(4),
	`country` varchar(2) DEFAULT 'AU',
	`latitude` varchar(20),
	`longitude` varchar(20),
	`verificationStatus` enum('pending','verified','suspended') NOT NULL DEFAULT 'pending',
	`subscriptionTier` enum('starter','professional','enterprise') NOT NULL DEFAULT 'starter',
	`description` text,
	`website` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_abn_unique` UNIQUE(`abn`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedstockId` int NOT NULL,
	`supplierId` int NOT NULL,
	`buyerId` int NOT NULL,
	`inquiryId` int,
	`volumeTonnes` int NOT NULL,
	`pricePerTonne` int,
	`totalValue` int,
	`deliveryDate` timestamp,
	`deliveryLocation` varchar(500),
	`status` enum('pending','confirmed','in_transit','delivered','completed','disputed','cancelled') NOT NULL DEFAULT 'pending',
	`qualityReceiptId` int,
	`supplierRating` int,
	`buyerRating` int,
	`supplierFeedback` text,
	`buyerFeedback` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','supplier','buyer','auditor') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buyers` ADD CONSTRAINT `buyers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_feedstockId_feedstocks_id_fk` FOREIGN KEY (`feedstockId`) REFERENCES `feedstocks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_verifiedBy_users_id_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedstocks` ADD CONSTRAINT `feedstocks_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedstocks` ADD CONSTRAINT `feedstocks_verifiedBy_users_id_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_buyerId_buyers_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `buyers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_feedstockId_feedstocks_id_fk` FOREIGN KEY (`feedstockId`) REFERENCES `feedstocks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qualityTests` ADD CONSTRAINT `qualityTests_feedstockId_feedstocks_id_fk` FOREIGN KEY (`feedstockId`) REFERENCES `feedstocks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedSearches` ADD CONSTRAINT `savedSearches_buyerId_buyers_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `buyers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_feedstockId_feedstocks_id_fk` FOREIGN KEY (`feedstockId`) REFERENCES `feedstocks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_buyerId_buyers_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `buyers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_inquiryId_inquiries_id_fk` FOREIGN KEY (`inquiryId`) REFERENCES `inquiries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_qualityReceiptId_qualityTests_id_fk` FOREIGN KEY (`qualityReceiptId`) REFERENCES `qualityTests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `auditLogs_userId_idx` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `auditLogs_entity_idx` ON `auditLogs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `auditLogs_createdAt_idx` ON `auditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `buyers_userId_idx` ON `buyers` (`userId`);--> statement-breakpoint
CREATE INDEX `certificates_feedstockId_idx` ON `certificates` (`feedstockId`);--> statement-breakpoint
CREATE INDEX `certificates_expiryDate_idx` ON `certificates` (`expiryDate`);--> statement-breakpoint
CREATE INDEX `feedstocks_supplierId_idx` ON `feedstocks` (`supplierId`);--> statement-breakpoint
CREATE INDEX `feedstocks_category_idx` ON `feedstocks` (`category`);--> statement-breakpoint
CREATE INDEX `feedstocks_state_idx` ON `feedstocks` (`state`);--> statement-breakpoint
CREATE INDEX `feedstocks_status_idx` ON `feedstocks` (`status`);--> statement-breakpoint
CREATE INDEX `feedstocks_abfiScore_idx` ON `feedstocks` (`abfiScore`);--> statement-breakpoint
CREATE INDEX `inquiries_buyerId_idx` ON `inquiries` (`buyerId`);--> statement-breakpoint
CREATE INDEX `inquiries_supplierId_idx` ON `inquiries` (`supplierId`);--> statement-breakpoint
CREATE INDEX `inquiries_feedstockId_idx` ON `inquiries` (`feedstockId`);--> statement-breakpoint
CREATE INDEX `inquiries_status_idx` ON `inquiries` (`status`);--> statement-breakpoint
CREATE INDEX `notifications_userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notifications_read_idx` ON `notifications` (`read`);--> statement-breakpoint
CREATE INDEX `notifications_createdAt_idx` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `qualityTests_feedstockId_idx` ON `qualityTests` (`feedstockId`);--> statement-breakpoint
CREATE INDEX `qualityTests_testDate_idx` ON `qualityTests` (`testDate`);--> statement-breakpoint
CREATE INDEX `savedSearches_buyerId_idx` ON `savedSearches` (`buyerId`);--> statement-breakpoint
CREATE INDEX `suppliers_userId_idx` ON `suppliers` (`userId`);--> statement-breakpoint
CREATE INDEX `transactions_feedstockId_idx` ON `transactions` (`feedstockId`);--> statement-breakpoint
CREATE INDEX `transactions_supplierId_idx` ON `transactions` (`supplierId`);--> statement-breakpoint
CREATE INDEX `transactions_buyerId_idx` ON `transactions` (`buyerId`);--> statement-breakpoint
CREATE INDEX `transactions_status_idx` ON `transactions` (`status`);