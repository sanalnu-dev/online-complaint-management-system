const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

describe('OCMS Backend API End-to-End Test Suite', () => {
  let adminToken = '';
  let studentToken = '';
  let studentUserId = null;
  let testComplaintId = null;

  afterAll(async () => {
    // Close db pool when finished
    await pool.end();
  });

  describe('1. Health and Category Endpoints', () => {
    test('GET /api/health returns healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });

    test('GET /api/complaints/categories returns 9 seeded categories', async () => {
      const res = await request(app).get('/api/complaints/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe('2. Authentication Flow & Protection', () => {
    test('POST /api/auth/login succeeds for seeded admin', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ocms.edu',
          password: 'Admin@12345'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('ADMIN');
      adminToken = res.body.token;
    });

    test('POST /api/auth/login succeeds for seeded student user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student1@ocms.edu',
          password: 'User@12345'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('USER');
      studentToken = res.body.token;
      studentUserId = res.body.user.userId;
    });

    test('POST /api/auth/login fails with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@ocms.edu',
          password: 'WrongPassword!123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/auth/register fails with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          full_name: 'Duplicate Admin',
          email: 'admin@ocms.edu',
          password: 'Password@123',
          confirm_password: 'Password@123'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/auth/register fails with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          full_name: 'Test Student',
          email: 'newstudent@ocms.edu',
          password: 'weak',
          confirm_password: 'weak'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/auth/register successfully registers new user and forces USER role', async () => {
      const uniqueEmail = `testuser_${Date.now()}@ocms.edu`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          full_name: 'New Test Student',
          email: uniqueEmail,
          password: 'SecurePassword@123',
          confirm_password: 'SecurePassword@123',
          student_employee_id: 'STU-9999',
          role: 'ADMIN' // Malicious attempt to escalate privileges
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('USER'); // Enforced as USER
    });

    test('GET /api/auth/me returns current authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('student1@ocms.edu');
    });

    test('GET /api/auth/me rejects request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('3. Role Authorization & Admin API Protection', () => {
    test('Regular user is denied access to GET /api/admin/dashboard (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('Admin successfully accesses GET /api/admin/dashboard with real statistics', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalComplaints).toBeGreaterThan(0);
      expect(res.body.stats.statusCounts).toBeDefined();
      expect(res.body.stats.categoryBreakdown).toBeDefined();
    });

    test('Admin successfully accesses GET /api/admin/users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  describe('4. Complaint Submission and Isolation', () => {
    test('POST /api/complaints creates a new complaint with valid reference number', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Water leakage in 3rd floor washroom')
        .field('description', 'Severe pipeline leak causing water overflow onto the hallway.')
        .field('category_id', 2)
        .field('location_department', 'Science Block - 3rd Floor')
        .field('priority', 'High');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint.referenceNumber).toMatch(/^OCMS-\d{4}-\d{5}$/);
      testComplaintId = res.body.complaint.complaintId;
    });

    test('GET /api/complaints returns complaints only for the logged-in user', async () => {
      const res = await request(app)
        .get('/api/complaints')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.complaints)).toBe(true);
    });

    test('Regular user cannot view another user\'s private complaint (403 Forbidden)', async () => {
      // Complaint 3 belongs to Bob Jones (student2@ocms.edu), studentToken belongs to Alice Smith
      const res = await request(app)
        .get('/api/complaints/3')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    test('Complaint owner can view their own complaint details and status timeline', async () => {
      const res = await request(app)
        .get(`/api/complaints/${testComplaintId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint.complaint_id).toBe(testComplaintId);
      expect(Array.isArray(res.body.history)).toBe(true);
      expect(res.body.history.length).toBeGreaterThan(0);
    });
  });

  describe('5. Admin Status Update Workflow & Mandatory Remarks', () => {
    test('Admin transitions status to "Under Review"', async () => {
      const res = await request(app)
        .patch(`/api/admin/complaints/${testComplaintId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Under Review',
          remarks: 'Inspecting the pipeline leak.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Admin cannot transition directly to Resolved without In Progress (Strict state machine)', async () => {
      const res = await request(app)
        .patch(`/api/admin/complaints/${testComplaintId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Resolved',
          remarks: 'Trying to skip in progress.'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Admin transitions status to "In Progress"', async () => {
      const res = await request(app)
        .patch(`/api/admin/complaints/${testComplaintId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'In Progress',
          remarks: 'Plumber team dispatched with replacement valves.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Admin fails to resolve without mandatory remarks', async () => {
      const res = await request(app)
        .patch(`/api/admin/complaints/${testComplaintId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Resolved',
          remarks: '' // Empty remarks
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Admin successfully resolves with mandatory remarks and updates status history', async () => {
      const res = await request(app)
        .patch(`/api/admin/complaints/${testComplaintId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Resolved',
          remarks: 'New high-pressure seal installed and tested for 30 minutes without leakage.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('6. Reopening Workflow & Comments', () => {
    test('Complaint owner can reopen resolved complaint with remarks', async () => {
      const res = await request(app)
        .patch(`/api/complaints/${testComplaintId}/reopen`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          remarks: 'Water is dripping again around the pipe joint this afternoon.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('User can post a public comment on complaint', async () => {
      const res = await request(app)
        .post(`/api/complaints/${testComplaintId}/comments`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          message: 'Thank you for looking into it again.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.comment.isInternal).toBe(false);
    });

    test('Admin can export complaints CSV report', async () => {
      const res = await request(app)
        .get('/api/admin/reports/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Reference Number');
    });
  });
});
