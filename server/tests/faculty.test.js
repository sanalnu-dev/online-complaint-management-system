const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

describe('OCMS Faculty Workflow and Routing Integration Test Suite', () => {
  let adminToken = '';
  let facultyToken = '';
  let faculty2Token = '';
  let studentToken = '';
  let facultyUserId = null;
  let testComplaintId = null;
  let testCategoryId = null;

  beforeAll(async () => {
    // 1. Admin login
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@ocms.edu',
      password: 'Admin@12345'
    });
    adminToken = adminRes.body.token;

    // 2. Faculty 1 login (Prof. Charlie Brown)
    const facultyRes = await request(app).post('/api/auth/login').send({
      email: 'employee1@ocms.edu',
      password: 'User@12345'
    });
    facultyToken = facultyRes.body.token;
    facultyUserId = facultyRes.body.user.userId;

    // 3. Faculty 2 login (Dr. Sarah Jenkins)
    const faculty2Res = await request(app).post('/api/auth/login').send({
      email: 'faculty2@ocms.edu',
      password: 'User@12345'
    });
    faculty2Token = faculty2Res.body.token;

    // 4. Student login
    const studentRes = await request(app).post('/api/auth/login').send({
      email: 'student1@ocms.edu',
      password: 'User@12345'
    });
    studentToken = studentRes.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('1. Faculty Authentication and Role Distinction', () => {
    test('Faculty user has role FACULTY upon login', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('FACULTY');
    });

    test('Faculty can access GET /api/faculty/dashboard', async () => {
      const res = await request(app)
        .get('/api/faculty/dashboard')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(typeof res.body.stats.totalAssigned).toBe('number');
      expect(res.body.stats.statusCounts).toBeDefined();
    });

    test('Student is blocked from GET /api/faculty/dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/faculty/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('Faculty is blocked from admin dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Student Faculty Routing and Direct Selection', () => {
    test('Student can fetch list of active faculty members', async () => {
      const res = await request(app)
        .get('/api/complaints/faculty')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.faculty)).toBe(true);
      expect(res.body.faculty.length).toBeGreaterThanOrEqual(2);
      expect(res.body.faculty.some(f => f.email === 'employee1@ocms.edu')).toBe(true);
    });

    test('Student submits academic complaint with explicitly selected faculty member', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Grading discrepancy on mid-term test')
        .field('description', 'The questions 3 and 4 were marked incorrectly based on the answer key provided.')
        .field('category_id', 1)
        .field('location_department', 'Computer Science Dept')
        .field('priority', 'High')
        .field('assigned_faculty_id', facultyUserId);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.complaint.status).toBe('Assigned');
      expect(res.body.complaint.assignedFacultyId).toBe(facultyUserId);
      testComplaintId = res.body.complaint.complaintId;
    });

    test('Assigned complaint appears in faculty workspace queue', async () => {
      const res = await request(app)
        .get('/api/faculty/complaints')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.complaints.find(c => c.complaint_id === testComplaintId);
      expect(found).toBeDefined();
      expect(found.title).toBe('Grading discrepancy on mid-term test');
    });

    test('Other faculty cannot view complaints not assigned to them (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/faculty/complaints/${testComplaintId}`)
        .set('Authorization', `Bearer ${faculty2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Faculty Workflow Status Transitions & Mandatory Remarks', () => {
    test('Faculty accepts complaint and moves status to "Under Review"', async () => {
      const res = await request(app)
        .patch(`/api/faculty/complaints/${testComplaintId}/status`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          status: 'Under Review',
          remarks: 'Reviewed student submission. Contacting teaching assistant for answer keys.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.newStatus).toBe('Under Review');
    });

    test('Faculty transitions complaint to "In Progress"', async () => {
      const res = await request(app)
        .patch(`/api/faculty/complaints/${testComplaintId}/status`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          status: 'In Progress',
          remarks: 'Re-evaluating examination paper with department head.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.newStatus).toBe('In Progress');
    });

    test('Faculty fails to resolve complaint without remarks (minimum 5 chars)', async () => {
      const res = await request(app)
        .patch(`/api/faculty/complaints/${testComplaintId}/status`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          status: 'Resolved',
          remarks: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Faculty successfully resolves complaint with remarks', async () => {
      const res = await request(app)
        .patch(`/api/faculty/complaints/${testComplaintId}/status`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          status: 'Resolved',
          remarks: 'Score adjusted by +5 points on official grade portal after reviewing Question 4.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.newStatus).toBe('Resolved');
    });

    test('Student sees faculty resolution details on complaint details', async () => {
      const res = await request(app)
        .get(`/api/complaints/${testComplaintId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.complaint.status).toBe('Resolved');
      expect(res.body.complaint.assigned_faculty_name).toBe('Prof. Charlie Brown');
      expect(res.body.complaint.resolution_remarks).toContain('Score adjusted by +5 points');
    });
  });

  describe('4. Admin Category and Routing Management', () => {
    test('Admin can fetch categories with complaint counts and default faculty metadata', async () => {
      const res = await request(app)
        .get('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBeGreaterThanOrEqual(9);
    });

    test('Admin can create a new category with department and default faculty routing', async () => {
      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category_name: 'Robotics Lab Equipment',
          description: 'Complaints regarding lab robotics kits and hardware issues',
          department: 'Mechatronics Dept',
          default_faculty_id: facultyUserId
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.category.categoryName).toBe('Robotics Lab Equipment');
      testCategoryId = res.body.category.categoryId;
    });

    test('Admin can update category metadata', async () => {
      const res = await request(app)
        .put(`/api/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category_name: 'Advanced Robotics Lab',
          description: 'Updated description for robotics lab hardware and software kits',
          department: 'Mechatronics & Robotics Dept',
          default_faculty_id: facultyUserId
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Admin can delete unused category', async () => {
      const res = await request(app)
        .delete(`/api/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Admin can assign and reassign complaints to faculty', async () => {
      // Reassign complaint to Faculty 2 (Dr. Sarah Jenkins)
      const res = await request(app)
        .patch(`/api/admin/complaints/${testComplaintId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          faculty_id: 9
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.assignedFacultyName).toBe('Dr. Sarah Jenkins');
    });
  });
});
