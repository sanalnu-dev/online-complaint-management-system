const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const VALID_STATUSES = [
  'Submitted',
  'Under Review',
  'In Progress',
  'Resolved',
  'Rejected',
  'Reopened'
];

// Valid state machine transitions
const ALLOWED_ADMIN_TRANSITIONS = {
  Submitted: ['Under Review', 'Rejected'],
  'Under Review': ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Rejected'],
  Resolved: [], // Admins don't reopen; users reopen
  Rejected: [],
  Reopened: ['Under Review', 'In Progress']
};

function validateCreateComplaint(data) {
  const errors = [];
  const { title, description, category_id, location_department, priority } = data;

  if (!title || typeof title !== 'string' || title.trim().length < 5) {
    errors.push('Title must be at least 5 characters long.');
  } else if (title.trim().length > 200) {
    errors.push('Title cannot exceed 200 characters.');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long.');
  } else if (description.trim().length > 2000) {
    errors.push('Description cannot exceed 2000 characters.');
  }

  const catId = parseInt(category_id, 10);
  if (isNaN(catId) || catId <= 0) {
    errors.push('A valid complaint category must be selected.');
  }

  if (!location_department || typeof location_department !== 'string' || location_department.trim().length < 2) {
    errors.push('Location or department is required (at least 2 characters).');
  } else if (location_department.trim().length > 150) {
    errors.push('Location/department cannot exceed 150 characters.');
  }

  const sanitizedPriority = priority && VALID_PRIORITIES.includes(priority) ? priority : 'Medium';

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      title: title ? title.trim() : '',
      description: description ? description.trim() : '',
      category_id: catId,
      location_department: location_department ? location_department.trim() : '',
      priority: sanitizedPriority
    }
  };
}

function validateAdminStatusUpdate(currentStatus, targetStatus, remarks) {
  const errors = [];

  if (!VALID_STATUSES.includes(targetStatus)) {
    errors.push(`Invalid status value: ${targetStatus}`);
    return { isValid: false, errors };
  }

  if (targetStatus === 'Reopened') {
    errors.push('Complaints can only be reopened by the complaint owner.');
    return { isValid: false, errors };
  }

  const allowedNext = ALLOWED_ADMIN_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    errors.push(
      `Cannot transition status from "${currentStatus}" to "${targetStatus}". Allowed next statuses: ${allowedNext.join(', ') || 'None'}.`
    );
  }

  if ((targetStatus === 'Resolved' || targetStatus === 'Rejected') && (!remarks || remarks.trim().length < 5)) {
    errors.push(`Remarks are mandatory when marking a complaint as ${targetStatus} (minimum 5 characters).`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedRemarks: remarks ? remarks.trim() : null
  };
}

function validateUserReopen(currentStatus, remarks) {
  const errors = [];

  if (currentStatus !== 'Resolved' && currentStatus !== 'Rejected') {
    errors.push(`Only resolved or rejected complaints can be reopened. Current status: ${currentStatus}.`);
  }

  if (!remarks || typeof remarks !== 'string' || remarks.trim().length < 5) {
    errors.push('Please provide a reason/remarks for reopening the complaint (minimum 5 characters).');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedRemarks: remarks ? remarks.trim() : ''
  };
}

module.exports = {
  VALID_PRIORITIES,
  VALID_STATUSES,
  validateCreateComplaint,
  validateAdminStatusUpdate,
  validateUserReopen
};
