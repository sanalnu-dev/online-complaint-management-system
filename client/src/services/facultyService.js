import api from './api';

export const facultyService = {
  async getDashboardStats() {
    const response = await api.get('/faculty/dashboard');
    return response.data;
  },

  async getAssignedComplaints(params = {}) {
    const response = await api.get('/faculty/complaints', { params });
    return response.data;
  },

  async getComplaintById(id) {
    const response = await api.get(`/faculty/complaints/${id}`);
    return response.data;
  },

  async updateStatus(id, status, remarks) {
    const response = await api.patch(`/faculty/complaints/${id}/status`, {
      status,
      remarks
    });
    return response.data;
  },

  async addComment(id, message, isInternal = false) {
    const response = await api.post(`/complaints/${id}/comments`, {
      message,
      is_internal: isInternal
    });
    return response.data;
  }
};
