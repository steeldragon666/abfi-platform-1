CREATE TABLE `savedAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`radiusKm` int NOT NULL,
	`centerLat` varchar(20) NOT NULL,
	`centerLng` varchar(20) NOT NULL,
	`results` json NOT NULL,
	`filterState` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedAnalyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `savedAnalyses` ADD CONSTRAINT `savedAnalyses_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `savedAnalyses_userId_idx` ON `savedAnalyses` (`userId`);--> statement-breakpoint
CREATE INDEX `savedAnalyses_createdAt_idx` ON `savedAnalyses` (`createdAt`);