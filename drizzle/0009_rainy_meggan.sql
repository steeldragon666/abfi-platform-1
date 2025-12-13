CREATE TABLE `covenantBreachEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`covenantType` varchar(100) NOT NULL,
	`breachDate` timestamp NOT NULL,
	`detectedDate` timestamp NOT NULL,
	`severity` enum('info','warning','breach','critical') NOT NULL,
	`actualValue` int NOT NULL,
	`thresholdValue` int NOT NULL,
	`variancePercent` int NOT NULL,
	`narrativeExplanation` text,
	`impactAssessment` text,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedDate` timestamp,
	`resolutionNotes` text,
	`resolvedBy` int,
	`lenderNotified` boolean DEFAULT false,
	`notifiedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `covenantBreachEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lenderReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`reportMonth` varchar(7) NOT NULL,
	`reportYear` int NOT NULL,
	`reportQuarter` int,
	`generatedDate` timestamp NOT NULL,
	`generatedBy` int,
	`reportPdfUrl` varchar(500),
	`evidencePackUrl` varchar(500),
	`manifestUrl` varchar(500),
	`executiveSummary` text,
	`scoreChangesNarrative` text,
	`covenantComplianceStatus` json,
	`supplyPositionSummary` json,
	`evidenceCount` int DEFAULT 0,
	`evidenceTypes` json,
	`status` enum('draft','finalized','sent','acknowledged') NOT NULL DEFAULT 'draft',
	`finalizedDate` timestamp,
	`sentDate` timestamp,
	`acknowledgedDate` timestamp,
	`acknowledgedBy` int,
	`recipientEmails` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lenderReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `covenantBreachEvents` ADD CONSTRAINT `covenantBreachEvents_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `covenantBreachEvents` ADD CONSTRAINT `covenantBreachEvents_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lenderReports` ADD CONSTRAINT `lenderReports_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lenderReports` ADD CONSTRAINT `lenderReports_generatedBy_users_id_fk` FOREIGN KEY (`generatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lenderReports` ADD CONSTRAINT `lenderReports_acknowledgedBy_users_id_fk` FOREIGN KEY (`acknowledgedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `covenantBreachEvents_projectId_idx` ON `covenantBreachEvents` (`projectId`);--> statement-breakpoint
CREATE INDEX `covenantBreachEvents_breachDate_idx` ON `covenantBreachEvents` (`breachDate`);--> statement-breakpoint
CREATE INDEX `covenantBreachEvents_severity_idx` ON `covenantBreachEvents` (`severity`);--> statement-breakpoint
CREATE INDEX `covenantBreachEvents_resolved_idx` ON `covenantBreachEvents` (`resolved`);--> statement-breakpoint
CREATE INDEX `lenderReports_projectId_idx` ON `lenderReports` (`projectId`);--> statement-breakpoint
CREATE INDEX `lenderReports_reportMonth_idx` ON `lenderReports` (`reportMonth`);--> statement-breakpoint
CREATE INDEX `lenderReports_status_idx` ON `lenderReports` (`status`);