import api from './axiosConfig';

export const shippingAPI = {
  // Shipment management
  createShipment: (orderId, shipmentData) => 
    api.post(`/shipping/orders/${orderId}/shipment`, shipmentData),
  getOrderShipment: (orderId) => api.get(`/shipping/orders/${orderId}/shipment`),
  getAllShipments: (params = {}) => api.get('/shipping/shipments', { params }),
  getShipmentStatistics: () => api.get('/shipping/statistics'),
  trackShipmentById: (shipmentId) => api.get(`/shipping/track/${shipmentId}`),
  
  // ✅ CANCELLATION API
  cancelShipment: (orderId, cancellationData = {}) => 
    api.post(`/shipping/orders/${orderId}/cancel`, cancellationData),
  
  // ShipRocket integration
  shipRocketLogin: () => api.get('/shipping/login'),
  getPickupLocations: () => api.get('/shipping/pickup-locations'),
  getCourierServiceability: (params) => api.get('/shipping/serviceability', { params }),
  getServiceabilityByOrder: (orderId) => api.get(`/shipping/orders/${orderId}/serviceability`),
};