// api/auth.js (or wherever your API client is)
import api from './axiosConfig';

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  // setGuestPassword: (passwordData) => api.post('/auth/set-guest-password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { 
    token, 
    newPassword 
  }),
};