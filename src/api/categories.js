// src/api/categories.js
import api from './axiosConfig';


export const categoriesAPI = {
  // Get all categories
  getAllCategories: () => api.get('/categories'),
  
  // Get active categories only (for dropdowns)
  getActiveCategories: () => api.get('/categories/active'),
  
  // Get single category
  getCategory: (id) => api.get(`/categories/${id}`),
  
  // Create category
  createCategory: (categoryData) => api.post('/categories', categoryData),
  
  // Update category
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  
  // Delete category
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};