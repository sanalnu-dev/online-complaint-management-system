import api from './api';

export const complaintService = {
  async getCategories() {
    const response = await api.get('/complaints/categories');
    return response.data;
  },

  async getFacultyList() {
    const response = await api.get('/complaints/faculty');
    return response.data;
  },

  async submitComplaint(formData) {
    const response = await api.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async getMyComplaints(params = {}) {
    const response = await api.get('/complaints', { params });
    return response.data;
  },

  async getComplaintById(id) {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  async reopenComplaint(id, remarks) {
    const response = await api.patch(`/complaints/${id}/reopen`, { remarks });
    return response.data;
  },

  async getComplaintHistory(id) {
    const response = await api.get(`/complaints/${id}/history`);
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
