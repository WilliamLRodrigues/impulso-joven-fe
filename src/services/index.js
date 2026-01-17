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
  update: (id, data) => api.put(`/ongs/${id}`, data),
  addJovem: (id, jovemId) => api.post(`/ongs/${id}/jovens`, { jovemId })
};

export const jovemService = {
  create: (data) => api.post('/jovens', data),
  getAll: (ongId) => api.get('/jovens', { params: { ongId } }),
  getById: (id) => api.get(`/jovens/${id}`),
  update: (id, data) => api.put(`/jovens/${id}`, data)
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
  getPendingForOng: (ongId) => api.get(`/bookings/pending/ong/${ongId}`),
  getPendingForJovem: (jovemId) => api.get(`/bookings/pending/jovem/${jovemId}`)
};

export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getAll: (filters) => api.get('/reviews', { params: filters })
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: () => api.get('/admin/users')
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
