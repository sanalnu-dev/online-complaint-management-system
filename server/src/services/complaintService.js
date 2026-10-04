const { getConnection, query } = require('../config/db');

/**
 * Generates the next sequential complaint reference number.
 * Format: OCMS-YYYY-XXXXX (e.g., OCMS-2026-00013)
 * @param {object} [connection] Optional active transaction connection
 */
async function generateReferenceNumber(connection = null) {
  const runner = connection || { execute: (sql, params) => query(sql, params) };
  const currentYear = new Date().getFullYear();
  const yearPrefix = `OCMS-${currentYear}-%`;

  // Use FOR UPDATE if running inside transaction to prevent race conditions
  const sql = connection
    ? 'SELECT reference_number FROM complaints WHERE reference_number LIKE ? ORDER BY complaint_id DESC LIMIT 1 FOR UPDATE'
    : 'SELECT reference_number FROM complaints WHERE reference_number LIKE ? ORDER BY complaint_id DESC LIMIT 1';

  const rows = await runner.execute(sql, [yearPrefix]);
  const results = connection ? rows[0] : rows;

  let nextSequence = 1;
  if (results && results.length > 0) {
    const lastRef = results[0].reference_number;
    const parts = lastRef.split('-');
    if (parts.length === 3) {
      const parsedNum = parseInt(parts[2], 10);
      if (!isNaN(parsedNum)) {
        nextSequence = parsedNum + 1;
      }
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `OCMS-${currentYear}-${paddedSequence}`;
}

/**
 * Updates a complaint's status and logs the transition into status history inside a single transaction.
 */
async function updateComplaintStatusWithHistory({
  complaintId,
  changedBy,
  oldStatus,
  newStatus,
  remarks
}) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const isResolved = newStatus === 'Resolved';
    const isRejected = newStatus === 'Rejected';

    // Prepare update parameters
    let updateSql = `
      UPDATE complaints 
      SET status = ?, 
          updated_at = NOW()
    `;
    const updateParams = [newStatus];

    if (isResolved) {
      updateSql += `, resolution_remarks = ?, resolved_at = NOW() `;
      updateParams.push(remarks || null);
    } else if (isRejected) {
      updateSql += `, resolution_remarks = ? `;
      updateParams.push(remarks || null);
    }

    updateSql += ` WHERE complaint_id = ?`;
    updateParams.push(complaintId);

    await conn.execute(updateSql, updateParams);

    // Insert history record
    const historySql = `
      INSERT INTO complaint_status_history 
        (complaint_id, changed_by, old_status, new_status, remarks, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    await conn.execute(historySql, [
      complaintId,
      changedBy,
      oldStatus,
      newStatus,
      remarks || null
    ]);

    await conn.commit();
    return { success: true };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = {
  generateReferenceNumber,
  updateComplaintStatusWithHistory
};
