import api from './axios.js';

export const authApi = {
  register:       (data)          => api.post('/api/auth/register', data),
  login:          (data)          => api.post('/api/auth/login', data),
  logout:         ()              => api.post('/api/auth/logout'),
  me:             ()              => api.get('/api/auth/me'),
  checkEmail:     (email)         => api.get('/api/auth/check-email', { params: { email } }),
  updateProfile:  (data)          => api.put('/api/auth/profile', data),
  updatePassword: (data)          => api.put('/api/auth/password', data),
};
