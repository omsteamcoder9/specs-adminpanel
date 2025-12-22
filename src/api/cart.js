// src/api/cart.js
import api from './axiosConfig';

export const cartAPI = {
  // Get user's cart
  getCart: () => api.get('/cart'),
  
  // Add item to cart
  addToCart: (cartData) => api.post('/cart', cartData),
  
  // Update cart item quantity
  updateCartItem: (itemId, updateData) => api.put(`/cart/items/${itemId}`, updateData),
  
  // Remove specific item from cart
  removeFromCart: (itemId) => api.delete(`/cart/items/${itemId}`),
  
  // Clear entire cart
  clearCart: () => api.delete('/cart'),
};