-- =============================================================================
-- Online Complaint Management System (OCMS)
-- Database Seed Data
-- =============================================================================

USE `ocms_db`;

-- Temporarily disable foreign key checks for clean truncation and insertion
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `complaint_comments`;
TRUNCATE TABLE `complaint_status_history`;
TRUNCATE TABLE `complaints`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- Seed: categories
-- -----------------------------------------------------------------------------
INSERT INTO `categories` (`category_id`, `category_name`, `description`) VALUES
(1, 'Infrastructure and Maintenance', 'Civil structures, furniture, doors, windows, and physical classroom facilities'),
(2, 'Electricity and Water', 'Power supply, lighting, switchboards, water supply, and plumbing fixtures'),
(3, 'Hostel', 'Hostel room amenities, mess, common room, and residential maintenance'),
(4, 'Library', 'Book availability, digital library terminals, quiet study zones, and seating'),
(5, 'IT and Internet', 'Campus Wi-Fi, LAN ports, laboratory computers, and campus software services'),
(6, 'Academics', 'Lecture scheduling, lab equipment, course materials, and grade issues'),
(7, 'Administration', 'ID cards, certificate issuance, fee counter, and administrative documentation'),
(8, 'Cleanliness', 'Campus sanitation, washroom cleanliness, trash clearance, and pest control'),
(9, 'Other', 'General miscellaneous issues not covered in standard categories');

-- -----------------------------------------------------------------------------
-- Seed: users
-- Passwords:
-- Admin: admin@ocms.edu / Admin@12345
-- Users: student1@ocms.edu, student2@ocms.edu, employee1@ocms.edu / User@12345
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `role`, `student_employee_id`, `is_active`, `created_at`) VALUES
(1, 'System Administrator', 'admin@ocms.edu', '$2a$10$DvkLhRqPrPrRTadpjMr8QOSS6ODzABKaNvyvLUq6Vkn8d52OS33Vu', 'ADMIN', 'ADM-001', 1, '2026-01-01 09:00:00'),
(2, 'Alice Smith', 'student1@ocms.edu', '$2a$10$vmy91ZpHCaS1x.qieyI4eOync4q.izPOPBaQcofArGwDKrfzKFO0e', 'USER', 'STU-2024-001', 1, '2026-01-05 10:30:00'),
(3, 'Bob Jones', 'student2@ocms.edu', '$2a$10$vmy91ZpHCaS1x.qieyI4eOync4q.izPOPBaQcofArGwDKrfzKFO0e', 'USER', 'STU-2024-002', 1, '2026-01-08 14:15:00'),
(4, 'Prof. Charlie Brown', 'employee1@ocms.edu', '$2a$10$vmy91ZpHCaS1x.qieyI4eOync4q.izPOPBaQcofArGwDKrfzKFO0e', 'USER', 'EMP-1092', 1, '2026-01-10 11:00:00');

-- -----------------------------------------------------------------------------
-- Seed: complaints (12 realistic complaints)
-- -----------------------------------------------------------------------------
INSERT INTO `complaints` (
  `complaint_id`, `reference_number`, `user_id`, `category_id`, `title`, 
  `description`, `location_department`, `priority`, `status`, `attachment_path`, 
  `assigned_admin_id`, `resolution_remarks`, `created_at`, `updated_at`, `resolved_at`
) VALUES
(1, 'OCMS-2026-00001', 2, 1, 'Broken desk and chairs in Seminar Hall B', 
 'Three armrest desks in row 4 of Seminar Hall B are broken and unsafe for students to sit during upcoming midterm presentations.', 
 'Block C - Room 302', 'Medium', 'Submitted', NULL, NULL, NULL, 
 '2026-09-28 09:30:00', '2026-09-28 09:30:00', NULL),

(2, 'OCMS-2026-00002', 2, 3, 'Water geyser not functioning in Block A 2nd Floor', 
 'The primary water geyser on the second floor washroom has stopped heating water since yesterday morning. Affects over 20 students.', 
 'Hostel Block A - Floor 2 Washroom', 'High', 'Under Review', NULL, 1, NULL, 
 '2026-09-29 08:15:00', '2026-09-29 11:00:00', NULL),

(3, 'OCMS-2026-00003', 3, 2, 'Power fluctuations in Computer Lab 3', 
 'Severe voltage drops cause workstations to shut down unexpectedly during programming practical sessions, leading to lost work.', 
 'Technology Wing - Lab 304', 'Urgent', 'In Progress', NULL, 1, NULL, 
 '2026-09-30 11:20:00', '2026-10-01 10:00:00', NULL),

(4, 'OCMS-2026-00004', 3, 5, 'Hostel Wi-Fi access point offline in North Wing', 
 'The Wi-Fi access point AP-NW-02 has had no internet connection for 48 hours. Signal connects but DHCP assigns no IP address.', 
 'North Wing Corridor 3', 'High', 'Resolved', NULL, 1, 
 'Technician replaced faulty switch port in floor IDF closet and verified wireless signal throughput (120 Mbps).', 
 '2026-09-25 14:00:00', '2026-09-27 16:30:00', '2026-09-27 16:30:00'),

(5, 'OCMS-2026-00005', 2, 4, 'Request to keep digital library open 24/7 on weekends', 
 'Requesting that the 2nd floor computer section in Central Library remain accessible around the clock every weekend during exam weeks.', 
 'Central Library 1st Floor', 'Low', 'Rejected', NULL, 1, 
 'Campus security protocol restricts library hours beyond 10:00 PM on weekends. Extended hours are officially provided in the 24/7 Reading Hall in Academic Block A.', 
 '2026-09-26 16:45:00', '2026-09-27 10:15:00', NULL),

(6, 'OCMS-2026-00006', 4, 5, 'Classroom smart projector audio-video sync failure', 
 'The ceiling-mounted HDMI switcher in Lecture Hall 101 introduces a 3-second audio latency and frequent blackouts during lectures.', 
 'Academic Complex - Lecture Hall 101', 'Urgent', 'Reopened', NULL, 1, 
 'Vendor replaced the HDMI repeater cable, but faculty noticed issue recurs when switching inputs between PC and laptop.', 
 '2026-09-20 10:00:00', '2026-10-02 15:00:00', NULL),

(7, 'OCMS-2026-00007', 4, 6, 'Exam schedule collision for CS elective course', 
 'Artificial Intelligence and Distributed Systems midterms have both been scheduled for October 15th at 02:00 PM.', 
 'Dean Academic Office', 'Medium', 'In Progress', NULL, 1, NULL, 
 '2026-10-01 13:10:00', '2026-10-02 09:30:00', NULL),

(8, 'OCMS-2026-00008', 2, 8, 'Overflowing recycling bins near Cafeteria exit', 
 'Recycling bins at the outdoor patio exit are overflowing onto the walkway, attracting pests.', 
 'Student Center - Cafeteria Plaza', 'Low', 'Submitted', NULL, NULL, NULL, 
 '2026-10-03 12:00:00', '2026-10-03 12:00:00', NULL),

(9, 'OCMS-2026-00009', 3, 7, 'Delay in issuing semester grade cards', 
 'Submitted request form 3 weeks ago for consolidated semester 4 grade sheet, still pending approval at administrative counter.', 
 'Registrar Counter 4', 'Medium', 'Resolved', NULL, 1, 
 'Records verified and official stamped grade card dispatched to student registered postal address. Tracking ID provided in comments.', 
 '2026-09-22 15:30:00', '2026-09-26 11:20:00', '2026-09-26 11:20:00'),

(10, 'OCMS-2026-00010', 4, 2, 'Air conditioning malfunction in Faculty Lounge', 
 'The dual-split AC unit in the 3rd floor faculty lounge is making a grinding sound and blowing room-temperature air.', 
 'Staff Quarters & Faculty Lounge', 'High', 'Under Review', NULL, 1, NULL, 
 '2026-10-02 16:00:00', '2026-10-03 10:00:00', NULL),

(11, 'OCMS-2026-00011', 2, 3, 'Door lock jammed in Hostel Room 214', 
 'The key cylinder is jammed and the door cannot be locked from outside when students leave for classes.', 
 'Hostel Block B - Room 214', 'Urgent', 'In Progress', NULL, 1, NULL, 
 '2026-10-03 08:30:00', '2026-10-03 09:15:00', NULL),

(12, 'OCMS-2026-00012', 3, 9, 'Bicycle parking stand shade damaged by winds', 
 'A metal sheet on the roof of the West Gate student bicycle parking rack has come loose and poses a hazard during high winds.', 
 'West Gate Parking Zone', 'Medium', 'Submitted', NULL, NULL, NULL, 
 '2026-10-04 09:00:00', '2026-10-04 09:00:00', NULL);

-- -----------------------------------------------------------------------------
-- Seed: complaint_status_history
-- -----------------------------------------------------------------------------
INSERT INTO `complaint_status_history` (`complaint_id`, `changed_by`, `old_status`, `new_status`, `remarks`, `created_at`) VALUES
-- Complaint 1
(1, 2, NULL, 'Submitted', 'Initial complaint logged by student.', '2026-09-28 09:30:00'),

-- Complaint 2
(2, 2, NULL, 'Submitted', 'Initial complaint logged by student.', '2026-09-29 08:15:00'),
(2, 1, 'Submitted', 'Under Review', 'Assigned to Estate Officer for electrical inspection.', '2026-09-29 11:00:00'),

-- Complaint 3
(3, 3, NULL, 'Submitted', 'Initial complaint logged by student.', '2026-09-30 11:20:00'),
(3, 1, 'Submitted', 'Under Review', 'Noted frequency of issues reported in Computer Lab 3.', '2026-09-30 14:00:00'),
(3, 1, 'Under Review', 'In Progress', 'Electrician dispatched with multi-meter and UPS diagnostic tool.', '2026-10-01 10:00:00'),

-- Complaint 4
(4, 3, NULL, 'Submitted', 'Initial complaint logged by student.', '2026-09-25 14:00:00'),
(4, 1, 'Submitted', 'Under Review', 'Network operations team assigned.', '2026-09-26 09:00:00'),
(4, 1, 'Under Review', 'In Progress', 'Network engineer inspecting switch closet.', '2026-09-26 14:30:00'),
(4, 1, 'In Progress', 'Resolved', 'Technician replaced faulty switch port in floor IDF closet and verified wireless signal throughput (120 Mbps).', '2026-09-27 16:30:00'),

-- Complaint 5
(5, 2, NULL, 'Submitted', 'Initial complaint logged by student.', '2026-09-26 16:45:00'),
(5, 1, 'Submitted', 'Under Review', 'Consulted with Chief Librarian regarding weekend timings.', '2026-09-27 09:00:00'),
(5, 1, 'Under Review', 'Rejected', 'Campus security protocol restricts library hours beyond 10:00 PM on weekends. Extended hours are officially provided in the 24/7 Reading Hall in Academic Block A.', '2026-09-27 10:15:00'),

-- Complaint 6
(6, 4, NULL, 'Submitted', 'Initial complaint logged by faculty member.', '2026-09-20 10:00:00'),
(6, 1, 'Submitted', 'In Progress', 'Audiovisual technician called.', '2026-09-21 11:00:00'),
(6, 1, 'In Progress', 'Resolved', 'HDMI repeater replaced and tested with test video.', '2026-09-23 16:00:00'),
(6, 4, 'Resolved', 'Reopened', 'Issue recurred today during lecture 3. Audio and video went out of sync after 15 minutes of streaming.', '2026-10-02 15:00:00'),

-- Complaint 7
(7, 4, NULL, 'Submitted', 'Exam clash reported.', '2026-10-01 13:10:00'),
(7, 1, 'Submitted', 'In Progress', 'Forwarded to Controller of Examinations for slot reallocation.', '2026-10-02 09:30:00'),

-- Complaint 8
(8, 2, NULL, 'Submitted', 'Initial complaint logged by student.', '2026-10-03 12:00:00'),

-- Complaint 9
(9, 3, NULL, 'Submitted', 'Initial complaint logged by student.', '2026-09-22 15:30:00'),
(9, 1, 'Submitted', 'Under Review', 'Verification of transcript clearance in progress.', '2026-09-24 10:00:00'),
(9, 1, 'Under Review', 'In Progress', 'Printing and affixing university seal.', '2026-09-25 11:00:00'),
(9, 1, 'In Progress', 'Resolved', 'Records verified and official stamped grade card dispatched to student registered postal address. Tracking ID provided in comments.', '2026-09-26 11:20:00'),

-- Complaint 10
(10, 4, NULL, 'Submitted', 'Initial complaint logged by faculty member.', '2026-10-02 16:00:00'),
(10, 1, 'Submitted', 'Under Review', 'HVAC maintenance vendor ticket raised.', '2026-10-03 10:00:00'),

-- Complaint 11
(11, 2, NULL, 'Submitted', 'Emergency maintenance request.', '2026-10-03 08:30:00'),
(11, 1, 'Submitted', 'In Progress', 'Carpenter and locksmith dispatched immediately.', '2026-10-03 09:15:00'),

-- Complaint 12
(12, 3, NULL, 'Submitted', 'Safety issue reported.', '2026-10-04 09:00:00');

-- -----------------------------------------------------------------------------
-- Seed: complaint_comments
-- -----------------------------------------------------------------------------
INSERT INTO `complaint_comments` (`comment_id`, `complaint_id`, `author_id`, `message`, `is_internal`, `created_at`) VALUES
-- Complaint 2 comments
(1, 2, 1, 'Internal note: Contacting hostel warden Mr. Sharma to arrange temporary access to 1st floor geyser for affected residents.', 1, '2026-09-29 11:05:00'),
(2, 2, 1, 'Maintenance team has been notified. The heating element has been ordered and will be replaced today.', 0, '2026-09-29 11:10:00'),
(3, 2, 2, 'Thank you for the prompt update. Please ensure it is fixed before evening.', 0, '2026-09-29 12:30:00'),

-- Complaint 3 comments
(4, 3, 1, 'Internal note: Substation technician suspects capacitor bank failure in Distribution Board 2.', 1, '2026-10-01 10:05:00'),
(5, 3, 1, 'Electrician is on site right now checking the lab power supply. Please keep lab computers safely powered off for the next 45 minutes.', 0, '2026-10-01 10:15:00'),

-- Complaint 4 comments
(6, 4, 1, 'Speed test after port replacement shows stable 120 Mbps down / 95 Mbps up. Closing ticket.', 0, '2026-09-27 16:32:00'),
(7, 4, 3, 'Can confirm Wi-Fi is back up and streaming smoothly in room 312. Thanks!', 0, '2026-09-27 18:00:00'),

-- Complaint 6 comments
(8, 6, 4, 'Tested again during my CS301 class and the sound completely cuts out when using HDMI 2.', 0, '2026-10-02 15:05:00'),
(9, 6, 1, 'Internal note: Escalate to vendor warranty engineer - may require replacing the main motherboard of the ceiling projector unit.', 1, '2026-10-02 16:00:00'),
(10, 6, 1, 'We have arranged a portable high-lumen backup projector in Room 101 while the ceiling unit is serviced.', 0, '2026-10-02 16:15:00'),

-- Complaint 9 comments
(11, 9, 1, 'Your physical grade card has been dispatched via Speed Post. Consignment tracking number: SP884920194IN.', 0, '2026-09-26 11:25:00');
