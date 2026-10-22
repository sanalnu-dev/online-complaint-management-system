-- =============================================================================
-- Online Complaint Management System (OCMS)
-- Database Migration v2: Distinct Faculty & Student Roles, Routing & Assignment
-- Non-destructive incremental migration preserving all existing records
-- =============================================================================

USE `ocms_db`;

-- 1. Extend user roles to include STUDENT and FACULTY
ALTER TABLE `users` 
  MODIFY COLUMN `role` ENUM('USER', 'STUDENT', 'FACULTY', 'ADMIN') NOT NULL DEFAULT 'STUDENT';

-- Update Prof. Charlie Brown to role 'FACULTY'
UPDATE `users` 
SET `role` = 'FACULTY' 
WHERE `email` = 'employee1@ocms.edu' OR `user_id` = 4;

-- Add a second faculty member for assignment testing if not already present
INSERT INTO `users` (`full_name`, `email`, `password_hash`, `role`, `student_employee_id`, `is_active`, `created_at`)
VALUES 
  ('Dr. Sarah Jenkins', 'faculty2@ocms.edu', '$2a$10$vmy91ZpHCaS1x.qieyI4eOync4q.izPOPBaQcofArGwDKrfzKFO0e', 'FACULTY', 'EMP-1093', 1, NOW())
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`), `role` = 'FACULTY';

-- 2. Extend complaints table with assigned_faculty_id and expanded statuses
-- Check and add assigned_faculty_id column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'ocms_db' 
  AND table_name = 'complaints' 
  AND column_name = 'assigned_faculty_id';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `complaints` ADD COLUMN `assigned_faculty_id` INT NULL AFTER `assigned_admin_id`, ADD CONSTRAINT `fk_complaints_assigned_faculty` FOREIGN KEY (`assigned_faculty_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE, ADD KEY `idx_complaints_assigned_faculty_id` (`assigned_faculty_id`)', 
  'SELECT "Column assigned_faculty_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Expand status enum to support 'Pending', 'Assigned', and 'Closed'
ALTER TABLE `complaints` 
  MODIFY COLUMN `status` ENUM('Submitted', 'Pending', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected', 'Reopened', 'Closed') NOT NULL DEFAULT 'Submitted';

-- 3. Extend categories table with department and default_faculty_id
SET @cat_dept_exists = 0;
SELECT COUNT(*) INTO @cat_dept_exists 
FROM information_schema.columns 
WHERE table_schema = 'ocms_db' 
  AND table_name = 'categories' 
  AND column_name = 'department';

SET @sql_dept = IF(@cat_dept_exists = 0, 
  'ALTER TABLE `categories` ADD COLUMN `department` VARCHAR(100) NULL AFTER `description`, ADD COLUMN `default_faculty_id` INT NULL AFTER `department`, ADD CONSTRAINT `fk_categories_default_faculty` FOREIGN KEY (`default_faculty_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE', 
  'SELECT "Category department columns already exist"');
PREPARE stmt_dept FROM @sql_dept;
EXECUTE stmt_dept;
DEALLOCATE PREPARE stmt_dept;

-- 4. Update existing categories with department metadata
UPDATE `categories` SET `department` = 'Estate & Maintenance' WHERE `category_id` = 1;
UPDATE `categories` SET `department` = 'Electrical & Water Works' WHERE `category_id` = 2;
UPDATE `categories` SET `department` = 'Hostel Administration' WHERE `category_id` = 3;
UPDATE `categories` SET `department` = 'Library Services' WHERE `category_id` = 4;
UPDATE `categories` SET `category_name` = 'IT & Technical Issues', `department` = 'IT Services' WHERE `category_id` = 5;
UPDATE `categories` SET `category_name` = 'Teaching & Academics', `department` = 'Academic Affairs', `default_faculty_id` = 4 WHERE `category_id` = 6;
UPDATE `categories` SET `department` = 'Administrative Office' WHERE `category_id` = 7;
UPDATE `categories` SET `department` = 'Sanitation & Housekeeping' WHERE `category_id` = 8;
UPDATE `categories` SET `department` = 'General Administration' WHERE `category_id` = 9;

-- Add new categories requested in the prompt if not already present
INSERT INTO `categories` (`category_name`, `description`, `department`, `default_faculty_id`)
VALUES 
  ('Faculty-Related Issues', 'Concerns regarding faculty consultations, teaching methodology, or communication', 'Academic Affairs', 4),
  ('Assignments & Examinations', 'Internal assessments, midterm schedules, practical submissions, and grade entries', 'Academic Affairs', 4),
  ('Transport', 'Campus bus services, route timings, driver assistance, and vehicle conditions', 'Campus Transport', NULL),
  ('Fees & Finance', 'Tuition fees, scholarship disbursements, challan verification, and account statements', 'Accounts & Finance', NULL)
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `department` = VALUES(`department`);

-- 5. Seed realistic complaint assignments to Prof. Charlie Brown (user_id = 4)
-- Assign Complaint 7 (Exam schedule collision) to Prof. Charlie Brown
UPDATE `complaints` 
SET `assigned_faculty_id` = 4, `status` = 'In Progress' 
WHERE `complaint_id` = 7;

-- If complaint 6 was submitted by user 4, assign it to Dr. Sarah Jenkins or Admin
UPDATE `complaints` 
SET `assigned_admin_id` = 1 
WHERE `complaint_id` = 6;

-- Insert or assign a dedicated complaint for Alice Smith to Prof. Charlie Brown
INSERT INTO `complaints` (
  `reference_number`, `user_id`, `category_id`, `title`, 
  `description`, `location_department`, `priority`, `status`, 
  `assigned_faculty_id`, `created_at`, `updated_at`
)
SELECT 
  'OCMS-2026-00020', 2, 6, 'Clarification needed on Artificial Intelligence assignment rubric',
  'The evaluation criteria for question 3 in Assignment 2 does not specify whether pseudo-code or executable Python is required.',
  'CS Department - Academic Block', 'Medium', 'Assigned',
  4, NOW() - INTERVAL 2 DAY, NOW()
WHERE NOT EXISTS (SELECT 1 FROM `complaints` WHERE `reference_number` = 'OCMS-2026-00020');

-- Insert a resolved complaint for Prof. Charlie Brown
INSERT INTO `complaints` (
  `reference_number`, `user_id`, `category_id`, `title`, 
  `description`, `location_department`, `priority`, `status`, 
  `assigned_faculty_id`, `resolution_remarks`, `created_at`, `updated_at`, `resolved_at`
)
SELECT 
  'OCMS-2026-00021', 3, 6, 'Request for makeup practical lab session in Data Structures',
  'Student missed lab session 4 due to official inter-college sports tournament.',
  'Technology Wing - Lab 201', 'High', 'Resolved',
  4, 'Makeup lab session conducted on Saturday 10:00 AM. Lab assignment verified and graded.',
  NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY
WHERE NOT EXISTS (SELECT 1 FROM `complaints` WHERE `reference_number` = 'OCMS-2026-00021');

-- Add history entries for new complaints
INSERT INTO `complaint_status_history` (`complaint_id`, `changed_by`, `old_status`, `new_status`, `remarks`, `created_at`)
SELECT `complaint_id`, 2, NULL, 'Submitted', 'Initial complaint logged by student.', `created_at`
FROM `complaints` WHERE `reference_number` = 'OCMS-2026-00020'
AND NOT EXISTS (SELECT 1 FROM `complaint_status_history` WHERE `complaint_id` = complaints.complaint_id);

INSERT INTO `complaint_status_history` (`complaint_id`, `changed_by`, `old_status`, `new_status`, `remarks`, `created_at`)
SELECT `complaint_id`, 1, 'Submitted', 'Assigned', 'Routed to course instructor Prof. Charlie Brown.', `created_at` + INTERVAL 1 HOUR
FROM `complaints` WHERE `reference_number` = 'OCMS-2026-00020'
AND (SELECT COUNT(*) FROM `complaint_status_history` WHERE `complaint_id` = complaints.complaint_id) < 2;
