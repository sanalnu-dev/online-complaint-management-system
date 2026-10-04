-- =============================================================================
-- Online Complaint Management System (OCMS)
-- Database Schema Definition
-- Target DBMS: MySQL 8.0+
-- Database Name: ocms_db
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `ocms_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `ocms_db`;

-- Drop tables in reverse dependency order for clean recreation if required
DROP TABLE IF EXISTS `complaint_comments`;
DROP TABLE IF EXISTS `complaint_status_history`;
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

-- -----------------------------------------------------------------------------
-- Table: users
-- Purpose: Stores student, employee, and administrator account details
-- -----------------------------------------------------------------------------
CREATE TABLE `users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  `student_employee_id` VARCHAR(50) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: categories
-- Purpose: Stores predefined categories of complaints in the college
-- -----------------------------------------------------------------------------
CREATE TABLE `categories` (
  `category_id` INT NOT NULL AUTO_INCREMENT,
  `category_name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uq_category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: complaints
-- Purpose: Central table storing complaint records, metadata, status, priority
-- -----------------------------------------------------------------------------
CREATE TABLE `complaints` (
  `complaint_id` INT NOT NULL AUTO_INCREMENT,
  `reference_number` VARCHAR(30) NOT NULL,
  `user_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `location_department` VARCHAR(150) NOT NULL,
  `priority` ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
  `status` ENUM('Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected', 'Reopened') NOT NULL DEFAULT 'Submitted',
  `attachment_path` VARCHAR(255) NULL,
  `assigned_admin_id` INT NULL,
  `resolution_remarks` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`complaint_id`),
  UNIQUE KEY `uq_complaints_reference_number` (`reference_number`),
  KEY `idx_complaints_user_id` (`user_id`),
  KEY `idx_complaints_category_id` (`category_id`),
  KEY `idx_complaints_assigned_admin_id` (`assigned_admin_id`),
  KEY `idx_complaints_status` (`status`),
  KEY `idx_complaints_priority` (`priority`),
  KEY `idx_complaints_created_at` (`created_at`),
  CONSTRAINT `fk_complaints_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_complaints_category` FOREIGN KEY (`category_id`) 
    REFERENCES `categories` (`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_complaints_assigned_admin` FOREIGN KEY (`assigned_admin_id`) 
    REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: complaint_status_history
-- Purpose: Audit trail of every lifecycle status transition and admin remarks
-- -----------------------------------------------------------------------------
CREATE TABLE `complaint_status_history` (
  `history_id` INT NOT NULL AUTO_INCREMENT,
  `complaint_id` INT NOT NULL,
  `changed_by` INT NOT NULL,
  `old_status` VARCHAR(50) NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `remarks` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `idx_status_history_complaint_id` (`complaint_id`),
  KEY `idx_status_history_changed_by` (`changed_by`),
  KEY `idx_status_history_created_at` (`created_at`),
  CONSTRAINT `fk_history_complaint` FOREIGN KEY (`complaint_id`) 
    REFERENCES `complaints` (`complaint_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_history_user` FOREIGN KEY (`changed_by`) 
    REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: complaint_comments
-- Purpose: Communication thread for complaints (supports public and internal admin notes)
-- -----------------------------------------------------------------------------
CREATE TABLE `complaint_comments` (
  `comment_id` INT NOT NULL AUTO_INCREMENT,
  `complaint_id` INT NOT NULL,
  `author_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `is_internal` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`),
  KEY `idx_comments_complaint_id` (`complaint_id`),
  KEY `idx_comments_author_id` (`author_id`),
  KEY `idx_comments_created_at` (`created_at`),
  CONSTRAINT `fk_comments_complaint` FOREIGN KEY (`complaint_id`) 
    REFERENCES `complaints` (`complaint_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_author` FOREIGN KEY (`author_id`) 
    REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
