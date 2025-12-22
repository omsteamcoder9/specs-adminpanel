import api from './axiosConfig';

export const contactAPI = {
  // Create new contact message
  createContact: (contactData) => api.post('/contacts', contactData),
  
  // Get all contacts (for admin)
  getContacts: (page = 1, limit = 10) => api.get(`/contacts?page=${page}&limit=${limit}`),
  
  // Get single contact
  getContact: (contactId) => api.get(`/contacts/${contactId}`),
  
  // Update contact status
  updateContact: (contactId, statusData) => api.put(`/contacts/${contactId}`, statusData),
  
  // Delete contact
  deleteContact: (contactId) => api.delete(`/contacts/${contactId}`),
};