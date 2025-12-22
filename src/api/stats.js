import api from './axiosConfig';

export const statsAPI = {
  // Get comprehensive statistics
  getComprehensiveStats: () => api.get('/stats'),
  
  // Get dashboard statistics (simplified)
  getDashboardStats: () => api.get('/stats/dashboard'),
  
  // Get sales analytics with optional date range
  getSalesAnalytics: (startDate = null, endDate = null) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return api.get('/stats/sales-analytics', { params });
  },
  
  // Get user analytics
  getUserAnalytics: () => api.get('/stats/user-analytics'),
};

export default statsAPI;