const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

function validateRegister(data) {
  const errors = [];
  const { full_name, email, password, confirm_password, student_employee_id } = data;

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long.');
  } else if (full_name.trim().length > 150) {
    errors.push('Full name cannot exceed 150 characters.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  } else if (email.trim().length > 150) {
    errors.push('Email cannot exceed 150 characters.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else if (!PASSWORD_REGEX.test(password)) {
    errors.push(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    );
  }

  if (password !== confirm_password) {
    errors.push('Passwords do not match.');
  }

  if (student_employee_id && typeof student_employee_id === 'string' && student_employee_id.trim().length > 50) {
    errors.push('Student/Employee ID cannot exceed 50 characters.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      full_name: full_name ? full_name.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      student_employee_id: student_employee_id ? student_employee_id.trim() : null
    }
  };
}

function validateLogin(data) {
  const errors = [];
  const { email, password } = data;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      email: email ? email.trim().toLowerCase() : '',
      password
    }
  };
}

function validateChangePassword(data) {
  const errors = [];
  const { old_password, new_password, confirm_new_password } = data;

  if (!old_password || typeof old_password !== 'string') {
    errors.push('Current password is required.');
  }

  if (!new_password || typeof new_password !== 'string') {
    errors.push('New password is required.');
  } else if (!PASSWORD_REGEX.test(new_password)) {
    errors.push(
      'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    );
  }

  if (new_password !== confirm_new_password) {
    errors.push('New passwords do not match.');
  }

  if (old_password === new_password) {
    errors.push('New password cannot be the same as your old password.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
  EMAIL_REGEX,
  PASSWORD_REGEX
};
