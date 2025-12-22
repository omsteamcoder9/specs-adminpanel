import api from './axiosConfig';

export const paymentsAPI = {
  // Guest routes
  createGuestOrder: (orderData) => api.post('/payments/guest-order', orderData),
  getGuestOrder: (orderId) => api.get(`/payments/guest-order?orderId=${orderId}`),
  
  // Payment routes
  createRazorpayOrder: (orderData) => api.post('/payments/create-order', orderData),
  verifyPayment: (paymentData) => api.post('/payments/verify', paymentData),
  paymentFailed: (paymentData) => api.post('/payments/failed', paymentData),
  
  // Protected routes
  getPaymentDetails: (paymentId) => api.get(`/payments/${paymentId}`),
  refundPayment: (paymentId, refundData) => api.post(`/payments/${paymentId}/refund`, refundData),
  getRazorpayOrderDetails: (orderId) => api.post(`/payments/${orderId}/getpaydetails`),
};