import api from './axiosConfig';

export const emailAPI = {
  sendTestEmail: (emailData) => api.post('/email/test', emailData),
  resendOrderConfirmation: (orderId) => api.post(`/email/order-confirmation/${orderId}`),
  sendOrderStatusUpdate: (orderId, statusData) => 
    api.put(`/email/order-status/${orderId}`, statusData),
};