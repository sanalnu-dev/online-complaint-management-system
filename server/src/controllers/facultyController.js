const { query } = require('../config/db');
const { validateFacultyStatusUpdate } = require('../validators/complaintValidator');
const { updateComplaintStatusWithHistory } = require('../services/complaintService');

/**
 * Returns dashboard metrics & workload statistics for the authenticated faculty member.
 */
async function getDashboardStats(req, res, next) {
  try {
    const facultyId = req.user.userId;

    // 1. Total complaints assigned to this faculty member
    const [totalRow] = await query(
      'SELECT COUNT(*) as total FROM complaints WHERE assigned_faculty_id = ?',
      [facultyId]
    );
    const totalAssigned = totalRow ? totalRow.total : 0;

    // 2. Count by status
    const statusRows = await query(
      `SELECT status, COUNT(*) as count 
       FROM complaints 
       WHERE assigned_faculty_id = ? 
       GROUP BY status`,
      [facultyId]
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

    // 3. Overdue count (Created > 7 days ago and not Resolved/Rejected/Closed)
    const [overdueRow] = await query(
      `SELECT COUNT(*) as overdue 
       FROM complaints 
       WHERE assigned_faculty_id = ? 
         AND status NOT IN ('Resolved', 'Rejected', 'Closed')
         AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [facultyId]
    );
    const overdueCount = overdueRow ? overdueRow.overdue : 0;

    // 4. Resolution rate
    const resolvedCount = statusCounts.Resolved || 0;
    const resolutionRate = totalAssigned > 0
      ? Number(((resolvedCount / totalAssigned) * 100).toFixed(1))
      : 0;

    // 5. Category breakdown
    const categoryRows = await query(
      `SELECT cat.category_id, cat.category_name, COUNT(c.complaint_id) as count
       FROM categories cat
       JOIN complaints c ON cat.category_id = c.category_id
       WHERE c.assigned_faculty_id = ?
       GROUP BY cat.category_id, cat.category_name
       ORDER BY count DESC`,
      [facultyId]
    );

    // 6. Priority breakdown
    const priorityRows = await query(
      `SELECT priority, COUNT(*) as count 
       FROM complaints 
       WHERE assigned_faculty_id = ? 
       GROUP BY priority 
       ORDER BY FIELD(priority, 'Urgent', 'High', 'Medium', 'Low')`,
      [facultyId]
    );

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

    // 7. Recent 5 complaints assigned
    const recentComplaints = await query(
      `SELECT 
        c.complaint_id,
        c.reference_number,
        c.title,
        c.priority,
        c.status,
        c.created_at,
        c.updated_at,
        cat.category_name,
        u.full_name as author_name,
        u.email as author_email,
        (c.status NOT IN ('Resolved', 'Rejected', 'Closed') AND c.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)) as is_overdue
       FROM complaints c
       JOIN categories cat ON c.category_id = cat.category_id
       JOIN users u ON c.user_id = u.user_id
       WHERE c.assigned_faculty_id = ?
       ORDER BY c.created_at DESC
       LIMIT 5`,
      [facultyId]
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalAssigned,
        activeWorkload: (statusCounts.Assigned || 0) + (statusCounts['Under Review'] || 0) + (statusCounts['In Progress'] || 0) + (statusCounts.Reopened || 0) + (statusCounts.Submitted || 0),
        pendingCount: (statusCounts.Assigned || 0) + (statusCounts.Submitted || 0) + (statusCounts.Pending || 0),
        inProgressCount: (statusCounts['Under Review'] || 0) + (statusCounts['In Progress'] || 0),
        resolvedCount,
        overdueCount,
        resolutionRate,
        statusCounts,
        categoryBreakdown: categoryRows,
        priorityCounts,
        recentComplaints: recentComplaints.map(rc => ({ ...rc, is_overdue: Boolean(rc.is_overdue) }))
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns paginated, filterable complaints assigned to the logged-in faculty member.
 */
async function getAssignedComplaints(req, res, next) {
  try {
    const facultyId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { search, category_id, status, priority, overdue, sortBy, sortOrder } = req.query;

    let whereConditions = ['c.assigned_faculty_id = ?'];
    const params = [facultyId];

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

    if (overdue === 'true' || overdue === '1') {
      whereConditions.push("c.status NOT IN ('Resolved', 'Rejected', 'Closed') AND c.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

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
        cat.category_id,
        cat.category_name,
        u.user_id as author_id,
        u.full_name as author_name,
        u.email as author_email,
        u.student_employee_id as author_id_code,
        (c.status NOT IN ('Resolved', 'Rejected', 'Closed') AND c.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)) as is_overdue
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.category_id
      JOIN users u ON c.user_id = u.user_id
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

/**
 * Returns full details of an assigned complaint for the faculty member.
 */
async function getAssignedComplaintById(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

    const facultyId = req.user.userId;

    const sql = `
      SELECT 
        c.complaint_id,
        c.reference_number,
        c.user_id,
        c.category_id,
        c.title,
        c.description,
        c.location_department,
        c.priority,
        c.status,
        c.attachment_path,
        c.assigned_admin_id,
        c.assigned_faculty_id,
        c.resolution_remarks,
        c.created_at,
        c.updated_at,
        c.resolved_at,
        cat.category_name,
        cat.department as category_department,
        u.full_name as author_name,
        u.email as author_email,
        u.student_employee_id as author_id_code,
        admin.full_name as assigned_admin_name,
        (c.status NOT IN ('Resolved', 'Rejected', 'Closed') AND c.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)) as is_overdue
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.category_id
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN users admin ON c.assigned_admin_id = admin.user_id
      WHERE c.complaint_id = ?
    `;

    const complaints = await query(sql, [complaintId]);
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaint = complaints[0];

    // Enforce isolation: faculty can only view complaints assigned to them
    if (complaint.assigned_faculty_id !== facultyId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: This complaint is not assigned to you'
      });
    }

    // Fetch timeline
    const historySql = `
      SELECT 
        h.history_id,
        h.old_status,
        h.new_status,
        h.remarks,
        h.created_at,
        u.full_name as changed_by_name,
        u.role as changed_by_role
      FROM complaint_status_history h
      JOIN users u ON h.changed_by = u.user_id
      WHERE h.complaint_id = ?
      ORDER BY h.created_at ASC
    `;
    const history = await query(historySql, [complaintId]);

    // Fetch comments (faculty can see both public and internal comments on assigned complaints)
    const commentSql = `
      SELECT 
        cm.comment_id,
        cm.message,
        cm.is_internal,
        cm.created_at,
        u.user_id as author_id,
        u.full_name as author_name,
        u.role as author_role
      FROM complaint_comments cm
      JOIN users u ON cm.author_id = u.user_id
      WHERE cm.complaint_id = ?
      ORDER BY cm.created_at ASC
    `;
    const comments = await query(commentSql, [complaintId]);

    return res.status(200).json({
      success: true,
      complaint: {
        ...complaint,
        is_overdue: Boolean(complaint.is_overdue)
      },
      history,
      comments: comments.map(c => ({ ...c, is_internal: Boolean(c.is_internal) }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates status of an assigned complaint through the faculty workflow.
 */
async function updateAssignedComplaintStatus(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

    const facultyId = req.user.userId;
    const { status: targetStatus, remarks } = req.body;

    const complaints = await query(
      'SELECT complaint_id, status, assigned_faculty_id FROM complaints WHERE complaint_id = ?',
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaint = complaints[0];

    // Verify assignment
    if (complaint.assigned_faculty_id !== facultyId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only update complaints assigned to you'
      });
    }

    const currentStatus = complaint.status;

    const validation = validateFacultyStatusUpdate(currentStatus, targetStatus, remarks);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors
      });
    }

    await updateComplaintStatusWithHistory({
      complaintId,
      changedBy: facultyId,
      oldStatus: currentStatus,
      newStatus: targetStatus,
      remarks: validation.sanitizedRemarks || `Status updated to ${targetStatus} by faculty member`
    });

    return res.status(200).json({
      success: true,
      message: `Complaint status updated to "${targetStatus}" successfully`,
      newStatus: targetStatus
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  getAssignedComplaints,
  getAssignedComplaintById,
  updateAssignedComplaintStatus
};
