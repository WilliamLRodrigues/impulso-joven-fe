import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    return api.post(`/auth/user/${userId}/change-password`, { currentPassword, newPassword });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const ongService = {
  getAll: () => api.get('/ongs'),
  getById: (id) => api.get(`/ongs/${id}`),
  create: (data) => api.post('/ongs', data),
  update: (id, data) => api.put(`/ongs/${id}`, data),
  delete: (id) => api.delete(`/ongs/${id}`),
  addJovem: (id, jovemId) => api.post(`/ongs/${id}/jovens`, { jovemId })
};

export const jovemService = {
  create: (data) => api.post('/jovens', data),
  getAll: (ongId) => ongId ? api.get('/jovens', { params: { ongId } }) : api.get('/jovens'),
  getById: (id) => api.get(`/jovens/${id}`),
  update: (id, data) => api.put(`/jovens/${id}`, data),
  delete: (id) => api.delete(`/jovens/${id}`),
  resetPassword: (id) => api.post(`/jovens/${id}/reset-password`),
  uploadPhoto: (formData) => api.post('/upload/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addSkill: (id, category) => api.post(`/jovens/${id}/add-skill`, { category })
};

export const serviceService = {
  create: (data) => api.post('/services', data),
  getAll: (filters) => api.get('/services', { params: filters }),
  getById: (id) => api.get(`/services/${id}`),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  accept: (id, jovemId) => api.post(`/services/${id}/accept`, { jovemId })
};

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getAll: (filters) => api.get('/bookings', { params: filters }),
  getById: (id) => api.get(`/bookings/${id}`),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  accept: (id, jovemId, acceptedBy) => api.post(`/bookings/${id}/accept`, { jovemId, acceptedBy }),
  acceptByJovem: (id, jovemId) => api.post(`/bookings/${id}/accept-jovem`, { jovemId }),
  rejectByJovem: (id, jovemId, reason) => api.post(`/bookings/${id}/reject-jovem`, { jovemId, reason }),
  getPendingForOng: (ongId) => api.get(`/bookings/pending/ong/${ongId}`),
  getPendingForJovem: (jovemId) => api.get(`/bookings/pending/jovem/${jovemId}`),
  getAvailableServices: (clientId) => api.get('/bookings/available-services', { params: { clientId } }),
  getAvailableSlots: (jovemId, serviceId, date) => api.get('/bookings/available-slots', { 
    params: { jovemId, serviceId, date } 
  }),
  generateCheckInPin: (id, jovemId) => api.post(`/bookings/${id}/generate-pin`, { jovemId }),
  validateCheckInPin: (id, clientId, pin) => api.post(`/bookings/${id}/validate-pin`, { clientId, pin }),
  completeService: (id, clientId, rating, review, photos, price) => 
    api.post(`/bookings/${id}/complete`, { clientId, rating, review, photos, price }),
  reviewClientByJovem: (id, jovemId, rating, review) =>
    api.post(`/bookings/${id}/review-client`, { jovemId, rating, review }),
  cancelByClient: (id, clientId, reason) => api.post(`/bookings/${id}/cancel-client`, { clientId, reason }),
  rescheduleByClient: (id, clientId, newDate, newTime) => 
    api.post(`/bookings/${id}/reschedule-client`, { clientId, newDate, newTime })
};

export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getAll: (filters) => api.get('/reviews', { params: filters })
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  exportReport: () => api.get('/admin/export')
};

export const uploadService = {
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  uploadDocuments: async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    return api.post('/upload/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};
