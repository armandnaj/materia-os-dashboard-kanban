CREATE TABLE `cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`category` text DEFAULT 'Кейс' NOT NULL,
	`hypothesis` text DEFAULT '' NOT NULL,
	`action` text DEFAULT '' NOT NULL,
	`result` text DEFAULT '' NOT NULL,
	`takeaway` text DEFAULT '' NOT NULL,
	`stage` text DEFAULT 'Проверено' NOT NULL,
	`period` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
