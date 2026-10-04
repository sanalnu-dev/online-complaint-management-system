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

  async assignComplaint(id, adminId) {
    const response = await api.patch(`/admin/complaints/${id}/assign`, {
      admin_id: adminId
    });
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
