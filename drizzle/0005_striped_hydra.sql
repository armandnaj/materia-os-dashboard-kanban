ALTER TABLE `cards` ADD `outcome` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cards` ADD `links` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cards` ADD `case_id` integer;--> statement-breakpoint
ALTER TABLE `cards` ADD `is_focus` integer DEFAULT false NOT NULL;