import api from './axiosConfig';

export const adminAPI = {
  getAllUsers: () => {
    console.log('Getting all users...');
    console.log('Token exists:', !!localStorage.getItem('token'));
    return api.get('/admin/users');
  },
  editUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  deactivateUser: (id) => api.patch(`/admin/users/${id}/deactivate`),
};