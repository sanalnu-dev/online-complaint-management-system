import api from './api';

export const adminService = {
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  async getAllComplaints(params = {}) {
    const response = await api.get('/admin/complaints', { params });
    return response.data;
  },

  async updateStatus(id, status, remarks) {
    const response = await api.patch(`/admin/complaints/${id}/status`, {
      status,
      remarks
    });
    return response.data;
  },

  async updatePriority(id, priority) {
    const response = await api.patch(`/admin/complaints/${id}/priority`, { priority });
    return response.data;
  },

  async assignComplaint(id, data) {
    const payload = typeof data === 'object' && data !== null ? data : { admin_id: data };
    const response = await api.patch(`/admin/complaints/${id}/assign`, payload);
    return response.data;
  },

  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async getAdmins() {
    const response = await api.get('/admin/admins');
    return response.data;
  },

  async getFaculty() {
    const response = await api.get('/admin/faculty');
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/admin/categories');
    return response.data;
  },

  async createCategory(categoryData) {
    const response = await api.post('/admin/categories', categoryData);
    return response.data;
  },

  async updateCategory(id, categoryData) {
    const response = await api.put(`/admin/categories/${id}`, categoryData);
    return response.data;
  },

  async deleteCategory(id) {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
  },

  async toggleUserActive(userId) {
    const response = await api.patch(`/admin/users/${userId}/active`);
    return response.data;
  },

  async exportComplaintsCsv(params = {}) {
    const response = await api.get('/admin/reports/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};
