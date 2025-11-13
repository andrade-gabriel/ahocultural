# drop database aho;
# create database aho;
use aho;

CREATE TABLE IF NOT EXISTS `user` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `country` (
  `id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `iso2` CHAR(2) NOT NULL,           -- Ex.: BR
  `slug` VARCHAR(150) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_country_iso2` (`iso2`),
  UNIQUE KEY `uq_country_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `state` (
  `id` INT UNSIGNED NOT NULL,
  `country_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,      -- Ex.: São Paulo
  `uf` CHAR(2) NOT NULL,             -- Ex.: SP
  `slug` VARCHAR(150) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_state_country` FOREIGN KEY (`country_id`) REFERENCES `country`(`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY `uq_state_country_uf` (`country_id`, `uf`),
  UNIQUE KEY `uq_state_country_name` (`country_id`, `name`),
  UNIQUE KEY `uq_state_slug` (`slug`),
  KEY `ix_state_country` (`country_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `city` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `state_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(200) NOT NULL,      -- Ex.: Santos
  `slug` VARCHAR(200) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_city_state` FOREIGN KEY (`state_id`) REFERENCES `state`(`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  KEY `ix_city_state` (`state_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `location` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `city_id` INT UNSIGNED NOT NULL,
  `description` TEXT NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_location_city` FOREIGN KEY (`city_id`) REFERENCES `city`(`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  KEY `ix_location_city` (`city_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `location_district` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `location_id` INT UNSIGNED NOT NULL,
  `district` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`location_id`) REFERENCES `location`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `address` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `street` VARCHAR(255) NOT NULL,
  `number` VARCHAR(50) NOT NULL,
  `complement` VARCHAR(100) NULL,
  `district` VARCHAR(100) NOT NULL,
  `postal_code` VARCHAR(20) NOT NULL,
  `location_id` INT UNSIGNED NOT NULL,
  `location_district_id` INT UNSIGNED NULL,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_address_location` FOREIGN KEY (`location_id`) REFERENCES `location`(`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_address_location_district` FOREIGN KEY (`location_district_id`) REFERENCES `location_district`(`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  KEY `ix_address_location_id` (`location_id`),
  KEY `ix_address_postal_code` (`postal_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `company` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `address_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active` BOOLEAN NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_company_slug` (`slug`),
  FOREIGN KEY (`address_id`) REFERENCES `address`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `category` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  
  `name_pt` VARCHAR(255) NOT NULL,
  `name_en` VARCHAR(255) NOT NULL,
  `name_es` VARCHAR(255) NOT NULL,
  
  `slug_pt` VARCHAR(255) NOT NULL,
  `slug_en` VARCHAR(255) NOT NULL,
  `slug_es` VARCHAR(255) NOT NULL,
  
  `description_pt` TEXT,
  `description_en` TEXT,
  `description_es` TEXT,
  
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_category_slug_pt` (`slug_pt`),
  UNIQUE KEY `uk_category_slug_en` (`slug_en`),
  UNIQUE KEY `uk_category_slug_es` (`slug_es`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `article` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,

  `title_pt` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `title_es` VARCHAR(255) NOT NULL,

  `slug_pt` VARCHAR(255) NOT NULL,
  `slug_en` VARCHAR(255) NOT NULL,
  `slug_es` VARCHAR(255) NOT NULL,

  `body_pt` TEXT NOT NULL,
  `body_en` TEXT NOT NULL,
  `body_es` TEXT NOT NULL,

  `hero_image` VARCHAR(255) NOT NULL,
  `thumbnail` VARCHAR(255) NOT NULL,
  `publication_date` DATETIME NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_article_slug_pt` (`slug_pt`),
  UNIQUE KEY `uk_article_slug_en` (`slug_en`),
  UNIQUE KEY `uk_article_slug_es` (`slug_es`),
  KEY `idx_article_publication_date` (`publication_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `advertisement` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `body_pt` MEDIUMTEXT NOT NULL,
  `body_en` MEDIUMTEXT NOT NULL,
  `body_es` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `about` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `body_pt` MEDIUMTEXT NOT NULL,
  `body_en` MEDIUMTEXT NOT NULL,
  `body_es` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `body_pt` MEDIUMTEXT NOT NULL,
  `body_en` MEDIUMTEXT NOT NULL,
  `body_es` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `facility` (
  `id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `facility` (`id`, `name`) VALUES
(1, 'Acessibilidade'),
(2, 'Estacionamento'),
(3, 'Bicicletário');

CREATE TABLE IF NOT EXISTS `event` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  
  `title_pt` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `title_es` VARCHAR(255) NOT NULL,

  `slug_pt` VARCHAR(255) NOT NULL,
  `slug_en` VARCHAR(255) NOT NULL,
  `slug_es` VARCHAR(255) NOT NULL,

  `body_pt` TEXT NOT NULL,
  `body_en` TEXT NOT NULL,
  `body_es` TEXT NOT NULL,
  
  `category_id` INT UNSIGNED NOT NULL,
  `company_id` INT UNSIGNED NOT NULL,
  `hero_image` VARCHAR(255) NOT NULL,
  `thumbnail` VARCHAR(255) NOT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `pricing` DECIMAL(10,2) NOT NULL,
  `external_ticket_link` VARCHAR(255),
  `active` BOOLEAN NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_event_slug_pt` (`slug_pt`),
  UNIQUE KEY `uk_event_slug_en` (`slug_en`),
  UNIQUE KEY `uk_event_slug_es` (`slug_es`),
  FOREIGN KEY (`category_id`) REFERENCES `category`(`id`),
  FOREIGN KEY (`company_id`) REFERENCES `company`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_facility` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_id` INT UNSIGNED NOT NULL,
  `facility_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`event_id`) REFERENCES `event`(`id`),
  FOREIGN KEY (`facility_id`) REFERENCES `facility`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_sponsored` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_id` INT UNSIGNED NOT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `active` BOOL NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`event_id`) REFERENCES `event`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_recurrence` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_id` INT UNSIGNED NOT NULL,
  `rrule` VARCHAR(255) NOT NULL,       -- Ex: "FREQ=WEEKLY;BYDAY=WE"
  `until` DATETIME NOT NULL,
  `exdates` JSON NULL,                 -- Exceções
  `rdates` JSON NULL,                  -- Datas extras
  PRIMARY KEY (`id`),
  FOREIGN KEY (`event_id`) REFERENCES `event`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_occurrence` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_id` INT UNSIGNED NOT NULL,
  `occurrence_date` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`event_id`) REFERENCES `event`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



