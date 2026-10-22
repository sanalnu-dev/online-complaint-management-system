const { query, getConnection } = require('../config/db');
const {
  validateAdminStatusUpdate,
  VALID_PRIORITIES
} = require('../validators/complaintValidator');
const { updateComplaintStatusWithHistory } = require('../services/complaintService');

async function getDashboardStats(req, res, next) {
  try {
    // 1. Total complaints
    const [totalRow] = await query('SELECT COUNT(*) as total FROM complaints');
    const totalComplaints = totalRow ? totalRow.total : 0;

    // 2. Count by status
    const statusRows = await query(
      'SELECT status, COUNT(*) as count FROM complaints GROUP BY status'
    );
    const statusCounts = {
      Submitted: 0,
      Pending: 0,
      Assigned: 0,
      'Under Review': 0,
      'In Progress': 0,
      Resolved: 0,
      Rejected: 0,
      Reopened: 0,
      Closed: 0
    };
    statusRows.forEach(row => {
      if (statusCounts[row.status] !== undefined) {
        statusCounts[row.status] = row.count;
      }
    });

    // 3. Unassigned complaints (no admin AND no faculty assigned, still pending/submitted)
    const [unassignedRow] = await query(
      `SELECT COUNT(*) as unassigned 
       FROM complaints 
       WHERE assigned_admin_id IS NULL 
         AND assigned_faculty_id IS NULL 
         AND status IN ('Submitted', 'Pending')`
    );
    const unassignedCount = unassignedRow ? unassignedRow.unassigned : 0;

    // 4. Overdue complaints (not resolved/rejected/closed, older than 7 days)
    const [overdueRow] = await query(
      `SELECT COUNT(*) as overdue 
       FROM complaints 
       WHERE status NOT IN ('Resolved', 'Rejected', 'Closed') 
         AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    const overdueCount = overdueRow ? overdueRow.overdue : 0;

    // 5. Resolution rate
    const resolvedCount = statusCounts.Resolved || 0;
    const resolutionRate = totalComplaints > 0 
      ? Number(((resolvedCount / totalComplaints) * 100).toFixed(1)) 
      : 0;

    // 6. Complaints by category
    const categoryRows = await query(`
      SELECT cat.category_id, cat.category_name, cat.department, COUNT(c.complaint_id) as count
      FROM categories cat
      LEFT JOIN complaints c ON cat.category_id = c.category_id
      GROUP BY cat.category_id, cat.category_name, cat.department
      ORDER BY count DESC
    `);

    // 7. Complaints by priority
    const priorityRows = await query(`
      SELECT priority, COUNT(*) as count 
      FROM complaints 
      GROUP BY priority
      ORDER BY FIELD(priority, 'Urgent', 'High', 'Medium', 'Low')
    `);
    const priorityCounts = {
      Urgent: 0,
      High: 0,
      Medium: 0,
      Low: 0
    };
    priorityRows.forEach(row => {
      if (priorityCounts[row.priority] !== undefined) {
        priorityCounts[row.priority] = row.count;
      }
    });

    // 8. Recent 5 complaints
    const recentComplaints = await query(`
      SELECT 
        c.complaint_id,
        c.reference_number,
        c.title,
        c.priority,
        c.status,
        c.created_at,
        cat.category_name,
        u.full_name as user_name,
        faculty.full_name as assigned_faculty_name,
        admin.full_name as assigned_admin_name
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.category_id
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN users faculty ON c.assigned_faculty_id = faculty.user_id
      LEFT JOIN users admin ON c.assigned_admin_id = admin.user_id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    // 9. Faculty workload distribution
    const facultyWorkload = await query(`
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.student_employee_id,
        COUNT(c.complaint_id) as total_assigned,
        SUM(CASE WHEN c.status IN ('Submitted', 'Pending', 'Assigned', 'Under Review', 'In Progress', 'Reopened') THEN 1 ELSE 0 END) as active_assigned,
        SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN c.status NOT IN ('Resolved', 'Rejected', 'Closed') AND c.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as overdue_count
      FROM users u
      LEFT JOIN complaints c ON u.user_id = c.assigned_faculty_id
      WHERE u.role = 'FACULTY' AND u.is_active = 1
      GROUP BY u.user_id, u.full_name, u.email, u.student_employee_id
      ORDER BY active_assigned DESC
    `);

    // 10. Users count
    const [userRow] = await query("SELECT COUNT(*) as total_users FROM users WHERE role IN ('USER', 'STUDENT')");
    const totalUsers = userRow ? userRow.total_users : 0;

    const [facultyRow] = await query("SELECT COUNT(*) as total_faculty FROM users WHERE role = 'FACULTY'");
    const totalFaculty = facultyRow ? facultyRow.total_faculty : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalComplaints,
        totalUsers,
        totalFaculty,
        unassignedCount,
        overdueCount,
        resolutionRate,
        statusCounts,
        categoryBreakdown: categoryRows,
        priorityCounts,
        recentComplaints,
        facultyWorkload
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getAllComplaints(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const {
      search,
      category_id,
      status,
      priority,
      assigned_admin_id,
      assigned_faculty_id,
      overdue,
      unassigned,
      sortBy,
      sortOrder
    } = req.query;

    let whereConditions = [];
    const params = [];

    if (search && search.trim()) {
      whereConditions.push(
        '(c.reference_number LIKE ? OR c.title LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)'
      );
      const searchWildcard = `%${search.trim()}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    if (category_id) {
      whereConditions.push('c.category_id = ?');
      params.push(parseInt(category_id, 10));
    }

    if (status) {
      if (status === 'Pending') {
        whereConditions.push("c.status IN ('Submitted', 'Pending', 'Assigned')");
      } else {
        whereConditions.push('c.status = ?');
        params.push(status);
      }
    }

    if (priority) {
      whereConditions.push('c.priority = ?');
      params.push(priority);
    }

    if (assigned_admin_id) {
      if (assigned_admin_id === 'unassigned') {
        whereConditions.push('c.assigned_admin_id IS NULL');
      } else {
        whereConditions.push('c.assigned_admin_id = ?');
        params.push(parseInt(assigned_admin_id, 10));
      }
    }

    if (assigned_faculty_id) {
      if (assigned_faculty_id === 'unassigned') {
        whereConditions.push('c.assigned_faculty_id IS NULL');
      } else {
        whereConditions.push('c.assigned_faculty_id = ?');
        params.push(parseInt(assigned_faculty_id, 10));
      }
    }

    if (unassigned === 'true' || unassigned === '1') {
      whereConditions.push('c.assigned_admin_id IS NULL AND c.assigned_faculty_id IS NULL');
    }

    if (overdue === 'true' || overdue === '1') {
      whereConditions.push(
        "c.status NOT IN ('Resolved', 'Rejected', 'Closed') AND c.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)"
      );
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const validSortCols = {
      created_at: 'c.created_at',
      updated_at: 'c.updated_at',
      priority: 'FIELD(c.priority, "Urgent", "High", "Medium", "Low")',
      status: 'c.status',
      reference_number: 'c.reference_number',
      title: 'c.title'
    };
    const orderCol = validSortCols[sortBy] || 'c.created_at';
    const orderDir = (sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const countSql = `
      SELECT COUNT(*) as total 
      FROM complaints c 
      JOIN users u ON c.user_id = u.user_id 
      ${whereClause}
    `;
    const [countResult] = await query(countSql, params);
    const total = countResult ? countResult.total : 0;

    // Data query
    const selectSql = `
      SELECT 
        c.complaint_id,
        c.reference_number,
        c.title,
        c.description,
        c.location_department,
        c.priority,
        c.status,
        c.attachment_path,
        c.resolution_remarks,
        c.created_at,
        c.updated_at,
        c.resolved_at,
        c.assigned_admin_id,
        c.assigned_faculty_id,
        cat.category_id,
        cat.category_name,
        u.user_id,
        u.full_name as author_name,
        u.email as author_email,
        u.student_employee_id as author_id_code,
        admin.full_name as assigned_admin_name,
        faculty.full_name as assigned_faculty_name,
        (c.status NOT IN ('Resolved', 'Rejected', 'Closed') AND c.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)) as is_overdue
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.category_id
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN users admin ON c.assigned_admin_id = admin.user_id
      LEFT JOIN users faculty ON c.assigned_faculty_id = faculty.user_id
      ${whereClause}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const complaints = await query(selectSql, params);

    return res.status(200).json({
      success: true,
      complaints: complaints.map(c => ({
        ...c,
        is_overdue: Boolean(c.is_overdue)
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updateComplaintStatus(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

    const { status: targetStatus, remarks } = req.body;

    const complaints = await query(
      'SELECT complaint_id, status FROM complaints WHERE complaint_id = ?',
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const currentStatus = complaints[0].status;

    const validation = validateAdminStatusUpdate(currentStatus, targetStatus, remarks);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors
      });
    }

    await updateComplaintStatusWithHistory({
      complaintId,
      changedBy: req.user.userId,
      oldStatus: currentStatus,
      newStatus: targetStatus,
      remarks: validation.sanitizedRemarks
    });

    return res.status(200).json({
      success: true,
      message: `Complaint status updated from "${currentStatus}" to "${targetStatus}" successfully`,
      newStatus: targetStatus
    });
  } catch (error) {
    next(error);
  }
}

async function updateComplaintPriority(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

    const { priority } = req.body;
    if (!priority || !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority value. Must be one of: ${VALID_PRIORITIES.join(', ')}`
      });
    }

    const complaints = await query(
      'SELECT complaint_id, priority FROM complaints WHERE complaint_id = ?',
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const oldPriority = complaints[0].priority;

    await query(
      'UPDATE complaints SET priority = ?, updated_at = NOW() WHERE complaint_id = ?',
      [priority, complaintId]
    );

    // Add note in status history
    await query(
      `INSERT INTO complaint_status_history (complaint_id, changed_by, old_status, new_status, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        complaintId,
        req.user.userId,
        null,
        'Priority Changed',
        `Priority modified from ${oldPriority} to ${priority} by administrator.`
      ]
    );

    return res.status(200).json({
      success: true,
      message: `Priority updated to ${priority}`,
      priority
    });
  } catch (error) {
    next(error);
  }
}

async function assignComplaint(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

    const { admin_id, faculty_id } = req.body;

    const complaints = await query(
      'SELECT complaint_id, status, assigned_admin_id, assigned_faculty_id FROM complaints WHERE complaint_id = ?',
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const currentComplaint = complaints[0];

    let assignedAdminId = currentComplaint.assigned_admin_id;
    let adminName = null;
    let assignedFacultyId = currentComplaint.assigned_faculty_id;
    let facultyName = null;
    const historyRemarks = [];

    // Process admin assignment if provided in request body
    if (admin_id !== undefined) {
      if (admin_id === null || admin_id === '' || admin_id === 0 || admin_id === 'unassigned') {
        assignedAdminId = null;
        historyRemarks.push('Admin assignment removed');
      } else {
        const parsedAdminId = parseInt(admin_id, 10);
        const adminUsers = await query(
          "SELECT user_id, full_name FROM users WHERE user_id = ? AND role = 'ADMIN' AND is_active = 1",
          [parsedAdminId]
        );
        if (adminUsers.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Selected administrator does not exist or is inactive'
          });
        }
        assignedAdminId = parsedAdminId;
        adminName = adminUsers[0].full_name;
        historyRemarks.push(`Assigned to administrator: ${adminName}`);
      }
    }

    // Process faculty assignment if provided in request body
    if (faculty_id !== undefined) {
      if (faculty_id === null || faculty_id === '' || faculty_id === 0 || faculty_id === 'unassigned') {
        assignedFacultyId = null;
        historyRemarks.push('Faculty assignment removed');
      } else {
        const parsedFacultyId = parseInt(faculty_id, 10);
        const facultyUsers = await query(
          "SELECT user_id, full_name FROM users WHERE user_id = ? AND role = 'FACULTY' AND is_active = 1",
          [parsedFacultyId]
        );
        if (facultyUsers.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Selected faculty member does not exist or is inactive'
          });
        }
        assignedFacultyId = parsedFacultyId;
        facultyName = facultyUsers[0].full_name;
        historyRemarks.push(`Assigned to faculty: ${facultyName}`);
      }
    }

    // Determine target status
    let targetStatus = currentComplaint.status;
    if (
      (currentComplaint.status === 'Submitted' || currentComplaint.status === 'Pending') &&
      (assignedFacultyId || assignedAdminId)
    ) {
      targetStatus = 'Assigned';
    }

    await query(
      'UPDATE complaints SET assigned_admin_id = ?, assigned_faculty_id = ?, status = ?, updated_at = NOW() WHERE complaint_id = ?',
      [assignedAdminId, assignedFacultyId, targetStatus, complaintId]
    );

    if (historyRemarks.length > 0) {
      await query(
        `INSERT INTO complaint_status_history (complaint_id, changed_by, old_status, new_status, remarks, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          complaintId,
          req.user.userId,
          currentComplaint.status,
          targetStatus,
          historyRemarks.join('; ')
        ]
      );
    }

    return res.status(200).json({
      success: true,
      message: historyRemarks.join(', ') || 'Assignment updated successfully',
      assignedAdminId,
      assignedAdminName: adminName,
      assignedFacultyId,
      assignedFacultyName: facultyName,
      status: targetStatus
    });
  } catch (error) {
    next(error);
  }
}

async function getCategoriesWithMeta(req, res, next) {
  try {
    const categories = await query(`
      SELECT 
        c.category_id,
        c.category_name,
        c.description,
        c.department,
        c.default_faculty_id,
        u.full_name as default_faculty_name,
        u.email as default_faculty_email,
        COUNT(comp.complaint_id) as total_complaints,
        SUM(CASE WHEN comp.status NOT IN ('Resolved', 'Rejected', 'Closed') THEN 1 ELSE 0 END) as active_complaints
      FROM categories c
      LEFT JOIN users u ON c.default_faculty_id = u.user_id
      LEFT JOIN complaints comp ON c.category_id = comp.category_id
      GROUP BY c.category_id, c.category_name, c.description, c.department, c.default_faculty_id, u.full_name, u.email
      ORDER BY c.category_name ASC
    `);

    return res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const { category_name, description, department, default_faculty_id } = req.body;

    if (!category_name || typeof category_name !== 'string' || category_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Category name must be at least 2 characters long'
      });
    }

    const existing = await query('SELECT category_id FROM categories WHERE category_name = ?', [
      category_name.trim()
    ]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }

    let facultyId = null;
    if (default_faculty_id) {
      const parsed = parseInt(default_faculty_id, 10);
      const check = await query("SELECT user_id FROM users WHERE user_id = ? AND role = 'FACULTY'", [
        parsed
      ]);
      if (check.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid default faculty selected' });
      }
      facultyId = parsed;
    }

    const result = await query(
      `INSERT INTO categories (category_name, description, department, default_faculty_id)
       VALUES (?, ?, ?, ?)`,
      [
        category_name.trim(),
        description ? description.trim() : null,
        department ? department.trim() : null,
        facultyId
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        categoryId: result.insertId,
        categoryName: category_name.trim(),
        description: description ? description.trim() : null,
        department: department ? department.trim() : null,
        defaultFacultyId: facultyId
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id, 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const { category_name, description, department, default_faculty_id } = req.body;

    if (!category_name || typeof category_name !== 'string' || category_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Category name must be at least 2 characters long'
      });
    }

    const existingCat = await query('SELECT category_id FROM categories WHERE category_id = ?', [
      categoryId
    ]);
    if (existingCat.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const nameCheck = await query(
      'SELECT category_id FROM categories WHERE category_name = ? AND category_id != ?',
      [category_name.trim(), categoryId]
    );
    if (nameCheck.length > 0) {
      return res.status(409).json({ success: false, message: 'Category name is already taken' });
    }

    let facultyId = null;
    if (default_faculty_id) {
      const parsed = parseInt(default_faculty_id, 10);
      const check = await query("SELECT user_id FROM users WHERE user_id = ? AND role = 'FACULTY'", [
        parsed
      ]);
      if (check.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid default faculty selected' });
      }
      facultyId = parsed;
    }

    await query(
      `UPDATE categories 
       SET category_name = ?, description = ?, department = ?, default_faculty_id = ?
       WHERE category_id = ?`,
      [
        category_name.trim(),
        description ? description.trim() : null,
        department ? department.trim() : null,
        facultyId,
        categoryId
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id, 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const [complaintCountRow] = await query(
      'SELECT COUNT(*) as count FROM complaints WHERE category_id = ?',
      [categoryId]
    );

    if (complaintCountRow && complaintCountRow.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: it is currently used by ${complaintCountRow.count} complaint(s)`
      });
    }

    await query('DELETE FROM categories WHERE category_id = ?', [categoryId]);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const { search, role, is_active } = req.query;

    let whereConditions = [];
    const params = [];

    if (search && search.trim()) {
      whereConditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.student_employee_id LIKE ?)');
      const wildcard = `%${search.trim()}%`;
      params.push(wildcard, wildcard, wildcard);
    }

    if (role) {
      whereConditions.push('u.role = ?');
      params.push(role);
    }

    if (is_active !== undefined && is_active !== '') {
      whereConditions.push('u.is_active = ?');
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.role,
        u.student_employee_id,
        u.is_active,
        u.created_at,
        COUNT(c.complaint_id) as complaint_count
      FROM users u
      LEFT JOIN complaints c ON u.user_id = c.user_id
      ${whereClause}
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
    `;

    const users = await query(sql, params);

    return res.status(200).json({
      success: true,
      users: users.map(u => ({
        ...u,
        is_active: Boolean(u.is_active)
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminList(req, res, next) {
  try {
    const admins = await query(
      "SELECT user_id, full_name, email FROM users WHERE role = 'ADMIN' AND is_active = 1 ORDER BY full_name ASC"
    );
    return res.status(200).json({
      success: true,
      admins
    });
  } catch (error) {
    next(error);
  }
}

async function toggleUserActive(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // Prevent self-deactivation
    if (targetUserId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account'
      });
    }

    const users = await query('SELECT user_id, full_name, is_active FROM users WHERE user_id = ?', [
      targetUserId
    ]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];
    const newStatus = user.is_active ? 0 : 1;

    await query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE user_id = ?', [
      newStatus,
      targetUserId
    ]);

    return res.status(200).json({
      success: true,
      message: `User ${user.full_name} has been ${newStatus ? 'activated' : 'deactivated'} successfully`,
      isActive: Boolean(newStatus)
    });
  } catch (error) {
    next(error);
  }
}

async function exportComplaintsCsv(req, res, next) {
  try {
    const { category_id, status, priority, search } = req.query;

    let whereConditions = [];
    const params = [];

    if (search && search.trim()) {
      whereConditions.push('(c.reference_number LIKE ? OR c.title LIKE ? OR u.full_name LIKE ?)');
      const wildcard = `%${search.trim()}%`;
      params.push(wildcard, wildcard, wildcard);
    }

    if (category_id) {
      whereConditions.push('c.category_id = ?');
      params.push(parseInt(category_id, 10));
    }

    if (status) {
      whereConditions.push('c.status = ?');
      params.push(status);
    }

    if (priority) {
      whereConditions.push('c.priority = ?');
      params.push(priority);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        c.reference_number,
        c.title,
        cat.category_name,
        c.location_department,
        c.priority,
        c.status,
        u.full_name as author_name,
        u.email as author_email,
        u.student_employee_id,
        admin.full_name as assigned_admin_name,
        c.created_at,
        c.resolved_at,
        c.resolution_remarks
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.category_id
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN users admin ON c.assigned_admin_id = admin.user_id
      ${whereClause}
      ORDER BY c.created_at DESC
    `;

    const records = await query(sql, params);

    // Format as CSV
    const headers = [
      'Reference Number',
      'Title',
      'Category',
      'Location / Department',
      'Priority',
      'Status',
      'Submitted By',
      'User Email',
      'Student/Employee ID',
      'Assigned Admin',
      'Submission Date',
      'Resolution Date',
      'Resolution Remarks'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.join(',')];

    records.forEach(row => {
      const line = [
        escapeCsv(row.reference_number),
        escapeCsv(row.title),
        escapeCsv(row.category_name),
        escapeCsv(row.location_department),
        escapeCsv(row.priority),
        escapeCsv(row.status),
        escapeCsv(row.author_name),
        escapeCsv(row.author_email),
        escapeCsv(row.student_employee_id || 'N/A'),
        escapeCsv(row.assigned_admin_name || 'Unassigned'),
        escapeCsv(row.created_at ? new Date(row.created_at).toISOString() : ''),
        escapeCsv(row.resolved_at ? new Date(row.resolved_at).toISOString() : 'N/A'),
        escapeCsv(row.resolution_remarks || '')
      ];
      csvRows.push(line.join(','));
    });

    const csvContent = csvRows.join('\r\n');
    const filename = `OCMS_Complaints_Report_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

async function getFacultyList(req, res, next) {
  try {
    const faculty = await query(
      "SELECT user_id, full_name, email, student_employee_id FROM users WHERE role = 'FACULTY' AND is_active = 1 ORDER BY full_name ASC"
    );
    return res.status(200).json({
      success: true,
      faculty
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  getAllComplaints,
  updateComplaintStatus,
  updateComplaintPriority,
  assignComplaint,
  getUsers,
  getAdminList,
  getFacultyList,
  toggleUserActive,
  exportComplaintsCsv,
  getCategoriesWithMeta,
  createCategory,
  updateCategory,
  deleteCategory
};
