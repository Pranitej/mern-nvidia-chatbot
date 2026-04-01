import api from './axios.js';

export const conversationsApi = {
  list:   (page = 1)       => api.get(`/api/conversations?page=${page}`),
  create: (data)           => api.post('/api/conversations', data),
  rename: (id, title)      => api.patch(`/api/conversations/${id}`, { title }),
  remove: (id)             => api.delete(`/api/conversations/${id}`),
  messages: (id, page = 1) => api.get(`/api/conversations/${id}/messages?page=${page}`),
};
