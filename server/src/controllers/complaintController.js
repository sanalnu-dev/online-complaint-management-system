const path = require('path');
const { query, getConnection } = require('../config/db');
const {
  validateCreateComplaint,
  validateUserReopen
} = require('../validators/complaintValidator');
const {
  generateReferenceNumber,
  updateComplaintStatusWithHistory
} = require('../services/complaintService');

async function getCategories(req, res, next) {
  try {
    const categories = await query(
      'SELECT category_id, category_name, description FROM categories ORDER BY category_name ASC'
    );
    return res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
}

async function createComplaint(req, res, next) {
  const conn = await getConnection();
  try {
    const validation = validateCreateComplaint(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors
      });
    }

    const { title, description, category_id, location_department, priority } = validation.sanitized;

    // Verify category exists
    const categoryExists = await query('SELECT category_id FROM categories WHERE category_id = ?', [category_id]);
    if (categoryExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected'
      });
    }

    // Handle optional file attachment
    let attachmentPath = null;
    if (req.file) {
      attachmentPath = `/uploads/${req.file.filename}`;
    }

    await conn.beginTransaction();

    const referenceNumber = await generateReferenceNumber(conn);

    const insertSql = `
      INSERT INTO complaints (
        reference_number, user_id, category_id, title, description, 
        location_department, priority, status, attachment_path, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, NOW(), NOW())
    `;

    const [result] = await conn.execute(insertSql, [
      referenceNumber,
      req.user.userId,
      category_id,
      title,
      description,
      location_department,
      priority,
      attachmentPath
    ]);

    const complaintId = result.insertId;

    // Log initial status in complaint_status_history
    const historySql = `
      INSERT INTO complaint_status_history 
        (complaint_id, changed_by, old_status, new_status, remarks, created_at)
      VALUES (?, ?, NULL, 'Submitted', 'Complaint successfully logged by user', NOW())
    `;
    await conn.execute(historySql, [complaintId, req.user.userId]);

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: {
        complaintId,
        referenceNumber,
        title,
        priority,
        status: 'Submitted',
        locationDepartment: location_department,
        attachmentPath
      }
    });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
}

async function getMyComplaints(req, res, next) {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { search, category_id, status, priority, sortBy, sortOrder } = req.query;

    let whereClause = 'WHERE c.user_id = ?';
    const params = [userId];

    if (search && search.trim()) {
      whereClause += ' AND (c.reference_number LIKE ? OR c.title LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category_id) {
      whereClause += ' AND c.category_id = ?';
      params.push(parseInt(category_id, 10));
    }

    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    if (priority) {
      whereClause += ' AND c.priority = ?';
      params.push(priority);
    }

    // Determine sort column
    const validSortCols = {
      created_at: 'c.created_at',
      updated_at: 'c.updated_at',
      priority: 'FIELD(c.priority, "Urgent", "High", "Medium", "Low")',
      status: 'c.status',
      title: 'c.title'
    };
    const orderCol = validSortCols[sortBy] || 'c.created_at';
    const orderDir = (sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count total matching records
    const countSql = `SELECT COUNT(*) as total FROM complaints c ${whereClause}`;
    const [countResult] = await query(countSql, params);
    const total = countResult ? countResult.total : 0;

    // Fetch paginated results
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
        cat.category_name,
        admin.full_name as assigned_admin_name
      FROM complaints c
      JOIN categories cat ON c.category_id = cat.category_id
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

async function getComplaintById(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

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
        c.resolution_remarks,
        c.created_at,
        c.updated_at,
        c.resolved_at,
        cat.category_name,
        u.full_name as author_name,
        u.email as author_email,
        u.student_employee_id as author_id_code,
        admin.full_name as assigned_admin_name,
        admin.email as assigned_admin_email
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

    // Enforce ownership: Regular users can only access their own complaints
    if (req.user.role !== 'ADMIN' && complaint.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own complaints'
      });
    }

    // Fetch status history timeline
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

    // Fetch comments (Regular users cannot view internal admin comments)
    let commentSql = `
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
    `;
    const commentParams = [complaintId];

    if (req.user.role !== 'ADMIN') {
      commentSql += ' AND cm.is_internal = FALSE';
    }

    commentSql += ' ORDER BY cm.created_at ASC';
    const comments = await query(commentSql, commentParams);

    return res.status(200).json({
      success: true,
      complaint,
      history,
      comments
    });
  } catch (error) {
    next(error);
  }
}

async function reopenComplaint(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

    const complaints = await query(
      'SELECT complaint_id, user_id, status FROM complaints WHERE complaint_id = ?',
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaint = complaints[0];

    // Enforce ownership: Only the complaint owner can reopen
    if (complaint.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the complaint owner can reopen this complaint'
      });
    }

    const validation = validateUserReopen(complaint.status, req.body.remarks);
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
      oldStatus: complaint.status,
      newStatus: 'Reopened',
      remarks: validation.sanitizedRemarks
    });

    return res.status(200).json({
      success: true,
      message: 'Complaint has been reopened for administrator review'
    });
  } catch (error) {
    next(error);
  }
}

async function getComplaintHistory(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

    // Check ownership
    const complaints = await query(
      'SELECT user_id FROM complaints WHERE complaint_id = ?',
      [complaintId]
    );
    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.user.role !== 'ADMIN' && complaints[0].user_id !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const history = await query(
      `SELECT 
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
      ORDER BY h.created_at ASC`,
      [complaintId]
    );

    return res.status(200).json({ success: true, history });
  } catch (error) {
    next(error);
  }
}

async function addComment(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

    const { message, is_internal } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment message cannot be empty' });
    }

    const complaints = await query(
      'SELECT user_id FROM complaints WHERE complaint_id = ?',
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Enforce ownership / access
    if (req.user.role !== 'ADMIN' && complaints[0].user_id !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Only administrators can mark comments as internal notes
    const internalFlag = req.user.role === 'ADMIN' && Boolean(is_internal);

    const insertSql = `
      INSERT INTO complaint_comments (complaint_id, author_id, message, is_internal, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    const result = await query(insertSql, [
      complaintId,
      req.user.userId,
      message.trim(),
      internalFlag ? 1 : 0
    ]);

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        commentId: result.insertId,
        complaintId,
        authorId: req.user.userId,
        authorName: req.user.fullName,
        authorRole: req.user.role,
        message: message.trim(),
        isInternal: internalFlag,
        createdAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  createComplaint,
  getMyComplaints,
  getComplaintById,
  reopenComplaint,
  getComplaintHistory,
  addComment
};
