// api/products.ts
import api from './axiosConfig';

export const productsAPI = {
  // Public routes
  getAllProducts: (params = {}) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductBySlug: (slug) => api.get(`/products/slug/${slug}`),
  
  // ✅ Featured Products with Price Filtering
  getFeaturedProducts: (params = {}) => api.get('/products/featured', { params }),
  getFeaturedPriceRanges: () => api.get('/products/featured/price-ranges'),
  getFilteredFeaturedProducts: (params = {}) => api.get('/products/featured/filter', { params }),
  
  // Admin routes
  createProduct: (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProduct: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  // ✅ Search Products
  searchProducts: (params = {}) => api.get('/products/search', { params }),
  quickSearchProducts: (query, limit = 5) => api.get('/products/quick-search', { 
    params: { q: query, limit } 
  }),
};