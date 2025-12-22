// services/ordersAPI.js
import api from './axiosConfig';

export const ordersAPI = {
  // Create a new order
  createOrder: (orderData) => api.post('/orders', orderData),
  
  // Get all orders (Admin only)
  getOrders: (params = {}) => api.get('/orders', { params }),
  
  // Get current user's orders
  getUserOrders: () => api.get('/orders/my-orders'),
  
  // Get order by ID
  getOrderById: (id) => api.get(`/orders/${id}`),
  
  // Update order status (Admin only)
  updateOrderStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),
  
  // Get order summary (Admin only)
  getOrderSummary: () => api.get('/orders/summary'),
  
  // Get order receipt (JSON or PDF based on Accept header)
  printOrderReceipt: (id) => api.get(`/orders/${id}/receipt`),
  
      // Force PDF download of receipt (this will also save to uploads folder)
  printOrderReceiptPDF: (orderId, config = {}) => 
    api.get(`/orders/${orderId}/receipt/pdf`, config),


    // Cancel order (User can cancel their own order, Admin can cancel any)
  cancelOrder: (id, cancelData = {}) => api.put(`/orders/${id}/cancel`, cancelData),
};