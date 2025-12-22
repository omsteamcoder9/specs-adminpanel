import api from './axiosConfig';

export const userAPI = {
  getProfile: () => api.get('/users/me'),
};