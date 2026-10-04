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
      'Under Review': 0,
      'In Progress': 0,
      Resolved: 0,
      Rejected: 0,
      Reopened: 0
    };
    statusRows.forEach(row => {
      statusCounts[row.status] = row.count;
    });

    // 3. Resolution rate
    const resolvedCount = statusCounts.Resolved || 0;
    const resolutionRate = totalComplaints > 0 
      ? Number(((resolvedCount / totalComplaints) * 100).toFixed(1)) 
      : 0;

    // 4. Complaints by category
    const categoryRows = await query(`
      SELECT cat.category_name, COUNT(c.complaint_id) as count
      FROM categories cat
      LEFT JOIN complaints c ON cat.category_id = c.category_id
      GROUP BY cat.category_id, cat.category_name
      ORDER BY count DESC
    `);

    // 5. Complaints by priority
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
      priorityCounts[row.priority] = row.count;
    });

    // 6. Recent 5 complaints
    const recentComplaints = await query(`
      SELECT 
        c.complaint_id,
        c.reference_number,
        c.title,
        c.priority,
        c.status,
        c.created_at,
        cat.category_name,
        u.full_name as user_name
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.category_id
      JOIN users u ON c.user_id = u.user_id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    // 7. Users count
    const [userRow] = await query("SELECT COUNT(*) as total_users FROM users WHERE role = 'USER'");
    const totalUsers = userRow ? userRow.total_users : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalComplaints,
        totalUsers,
        resolutionRate,
        statusCounts,
        categoryBreakdown: categoryRows,
        priorityCounts,
        recentComplaints
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

    const { search, category_id, status, priority, assigned_admin_id, sortBy, sortOrder } = req.query;

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
      whereConditions.push('c.status = ?');
      params.push(status);
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
        cat.category_id,
        cat.category_name,
        u.user_id,
        u.full_name as author_name,
        u.email as author_email,
        u.student_employee_id as author_id_code,
        admin.full_name as assigned_admin_name
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.category_id
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN users admin ON c.assigned_admin_id = admin.user_id
      ${whereClause}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const complaints = await query(selectSql, params);

    return res.status(200).json({
      success: true,
      complaints,
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

    const { admin_id } = req.body;

    let adminName = 'Unassigned';
    let assignedAdminId = null;

    if (admin_id) {
      assignedAdminId = parseInt(admin_id, 10);
      const adminUsers = await query(
        "SELECT user_id, full_name FROM users WHERE user_id = ? AND role = 'ADMIN' AND is_active = 1",
        [assignedAdminId]
      );

      if (adminUsers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Selected administrator does not exist or is inactive'
        });
      }
      adminName = adminUsers[0].full_name;
    }

    await query(
      'UPDATE complaints SET assigned_admin_id = ?, updated_at = NOW() WHERE complaint_id = ?',
      [assignedAdminId, complaintId]
    );

    // Log in history
    await query(
      `INSERT INTO complaint_status_history (complaint_id, changed_by, old_status, new_status, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        complaintId,
        req.user.userId,
        null,
        'Assigned',
        `Assigned to administrator: ${adminName}`
      ]
    );

    return res.status(200).json({
      success: true,
      message: `Complaint assigned to ${adminName}`,
      assignedAdminId,
      assignedAdminName: adminName
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

module.exports = {
  getDashboardStats,
  getAllComplaints,
  updateComplaintStatus,
  updateComplaintPriority,
  assignComplaint,
  getUsers,
  getAdminList,
  toggleUserActive,
  exportComplaintsCsv
};
