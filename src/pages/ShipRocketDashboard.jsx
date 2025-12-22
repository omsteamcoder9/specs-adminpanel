import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  Search, 
  Download, 
  Eye, 
  Truck, 
  Package, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  Calendar,
  User,
  Phone,
  Home
} from 'lucide-react';
import { shippingAPI } from '../api/shipping';

const ShipRocketDashboard = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    in_transit: 0,
    delivered: 0,
    cancelled: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await shippingAPI.getAllShipments({ limit: 100 });
      
      console.log('🔍 Full API response:', response);
      
      let shipmentsData = [];
      
      if (response.data && response.data.data && Array.isArray(response.data.data.shipments)) {
        shipmentsData = response.data.data.shipments;
        console.log('✅ Found shipments in: response.data.data.shipments');
      } else {
        console.warn('❌ Unexpected response structure:', response.data);
        shipmentsData = [];
      }
      
      console.log('📦 Processed shipments:', shipmentsData.length);
      setShipments(shipmentsData);
      calculateStatistics(shipmentsData);
      
    } catch (error) {
      console.error('❌ Error fetching shipments:', error);
      setError('Failed to load shipments. Please try again.');
      setShipments([]);
      setStats({
        total: 0,
        pending: 0,
        confirmed: 0,
        in_transit: 0,
        delivered: 0,
        cancelled: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (shipmentsData) => {
    if (!Array.isArray(shipmentsData)) return;
    
    const totalShipments = shipmentsData.length;
    const pendingShipments = shipmentsData.filter(shipment => 
      shipment?.shippingStatus === 'pending'
    ).length;
    
    const confirmedShipments = shipmentsData.filter(shipment => 
      shipment?.shippingStatus === 'confirmed'
    ).length;
    
    const inTransitShipments = shipmentsData.filter(shipment => 
      shipment?.shippingStatus === 'in_transit'
    ).length;
    
    const deliveredShipments = shipmentsData.filter(shipment => 
      shipment?.shippingStatus === 'delivered'
    ).length;
    
    const cancelledShipments = shipmentsData.filter(shipment => 
      shipment?.shippingStatus === 'cancelled'
    ).length;
    
    console.log('📊 Calculated stats:', {
      total: totalShipments,
      pending: pendingShipments,
      confirmed: confirmedShipments,
      in_transit: inTransitShipments,
      delivered: deliveredShipments,
      cancelled: cancelledShipments
    });
    
    setStats({
      total: totalShipments,
      pending: pendingShipments,
      confirmed: confirmedShipments,
      in_transit: inTransitShipments,
      delivered: deliveredShipments,
      cancelled: cancelledShipments
    });
  };

  const handleTrackShipment = async (shipmentId) => {
    try {
      setTrackingLoading(true);
      setTrackingData(null);
      
      console.log('🚚 Tracking shipment:', shipmentId);
      
      const response = await shippingAPI.trackShipmentById(shipmentId);
      
      console.log('📦 Tracking response:', response);
      
      let trackingData = response.data;
      
      if (response.data && response.data.data) {
        trackingData = response.data.data;
      }
      
      setTrackingData(trackingData);
      setSelectedShipment(shipments.find(s => s.shipmentId === shipmentId || s.id === shipmentId));
      
    } catch (error) {
      console.error('❌ Error tracking shipment:', error);
      alert('Failed to track shipment. Please check if the shipment ID is correct and try again.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const closeTrackingModal = () => {
    setTrackingData(null);
    setSelectedShipment(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'cancelled':
        return <XCircle className="text-red-500" size={16} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={16} />;
      case 'confirmed':
        return <CheckCircle className="text-indigo-500" size={16} />;
      case 'in_transit':
        return <Truck className="text-blue-500" size={16} />;
      default:
        return <Package className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-indigo-100 text-indigo-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrackingStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500';
      case 'shipped':
      case 'in transit':
      case 'out for delivery':
        return 'bg-blue-500';
      case 'pending':
      case 'label generated':
        return 'bg-yellow-500';
      case 'cancelled':
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredShipments = Array.isArray(shipments) ? shipments.filter(shipment => {
    if (!shipment) return false;
    
    const matchesSearch = 
      (shipment.orderId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (shipment.shipmentId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (shipment.awbNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (shipment.courierName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (shipment.customer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || shipment.shippingStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  const getShipmentValue = (shipment, key) => {
    return shipment?.[key] || 'N/A';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-x-hidden">
        <div className="p-3 sm:p-4 md:p-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">ShipRocket Dashboard</h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base">Manage and track all your shipments</p>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="text-red-500" size={18} />
              <p className="text-red-700 text-sm">{error}</p>
              <button 
                onClick={fetchShipments}
                className="ml-auto text-red-700 hover:text-red-900 underline text-xs sm:text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Statistics Cards - Responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
            {[
              { label: 'Total Shipments', value: stats.total, color: 'text-gray-800', icon: Package, bg: 'bg-blue-50', iconColor: 'text-blue-500' },
              { label: 'Pending', value: stats.pending, color: 'text-yellow-600', icon: Clock, bg: 'bg-yellow-50', iconColor: 'text-yellow-500' },
              { label: 'In Transit', value: stats.in_transit, color: 'text-blue-600', icon: Truck, bg: 'bg-blue-50', iconColor: 'text-blue-500' },
              { label: 'Delivered', value: stats.delivered, color: 'text-green-600', icon: CheckCircle, bg: 'bg-green-50', iconColor: 'text-green-500' },
              { label: 'Cancelled', value: stats.cancelled, color: 'text-red-600', icon: XCircle, bg: 'bg-red-50', iconColor: 'text-red-500' },
              { label: 'Confirmed', value: stats.confirmed, color: 'text-indigo-600', icon: CheckCircle, bg: 'bg-indigo-50', iconColor: 'text-indigo-500' }
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-lg sm:rounded-xl p-3 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-xs sm:text-sm truncate">{stat.label}</p>
                    <p className={`text-base sm:text-lg lg:text-xl font-bold truncate ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className="p-1 sm:p-2 ml-2 rounded-lg" style={{ backgroundColor: stat.bg.replace('bg-', 'bg-').split(' ')[0] }}>
                    <stat.icon className={stat.iconColor} size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search shipments..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[120px]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <button 
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                  onClick={fetchShipments}
                  disabled={loading}
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {/* Shipments Table */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <RefreshCw className="animate-spin text-blue-500 mb-3" size={24} />
                <span className="text-gray-600 text-sm">Loading shipments...</span>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipment ID</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AWB Number</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courier</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Charges</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredShipments.length > 0 ? (
                        filteredShipments.map((shipment, index) => (
                          <tr key={shipment?.id || shipment?.shipmentId || index} className="hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">{getShipmentValue(shipment, 'orderId')}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{getShipmentValue(shipment, 'shipmentId')}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{getShipmentValue(shipment, 'awbNumber') || 'Not assigned'}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{getShipmentValue(shipment, 'courierName') || 'Not assigned'}</td>
                            <td className="py-3 px-4">
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getShipmentValue(shipment, 'shippingStatus'))}`}>
                                {getStatusIcon(getShipmentValue(shipment, 'shippingStatus'))}
                                {getShipmentValue(shipment, 'shippingStatus')?.replace('_', ' ') || 'Unknown'}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">₹{getShipmentValue(shipment, 'shippingCharges') || 0}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{shipment.customer?.name || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleTrackShipment(shipment.shipmentId || shipment.id)}
                                className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-xs"
                                disabled={trackingLoading}
                              >
                                <Eye size={12} />
                                Track
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-gray-500">
                            <Package className="mx-auto mb-2 text-gray-400" size={24} />
                            <p className="text-sm">{shipments.length === 0 ? 'No shipments available' : 'No shipments match your filters'}</p>
                            {shipments.length === 0 && (
                              <button 
                                onClick={fetchShipments}
                                className="mt-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                Retry Loading
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile & Tablet Cards */}
                <div className="lg:hidden">
                  {filteredShipments.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredShipments.map((shipment, index) => (
                        <div key={shipment?.id || shipment?.shipmentId || index} className="p-4 hover:bg-gray-50">
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-gray-900">Order: {getShipmentValue(shipment, 'orderId')}</h3>
                                <p className="text-xs text-gray-500">Shipment: {getShipmentValue(shipment, 'shipmentId')}</p>
                              </div>
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getShipmentValue(shipment, 'shippingStatus'))}`}>
                                {getStatusIcon(getShipmentValue(shipment, 'shippingStatus'))}
                                <span className="hidden sm:inline">
                                  {getShipmentValue(shipment, 'shippingStatus')?.replace('_', ' ') || 'Unknown'}
                                </span>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">AWB Number</p>
                                <p className="font-medium">{getShipmentValue(shipment, 'awbNumber') || 'Not assigned'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Courier</p>
                                <p className="font-medium">{getShipmentValue(shipment, 'courierName') || 'Not assigned'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Charges</p>
                                <p className="font-medium">₹{getShipmentValue(shipment, 'shippingCharges') || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Customer</p>
                                <p className="font-medium truncate">{shipment.customer?.name || 'N/A'}</p>
                              </div>
                            </div>

                            {/* Action */}
                            <div className="pt-2">
                              <button
                                onClick={() => handleTrackShipment(shipment.shipmentId || shipment.id)}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                disabled={trackingLoading}
                              >
                                <Eye size={14} />
                                Track Shipment
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Package className="mx-auto mb-3 text-gray-400" size={24} />
                      <p className="text-sm mb-2">{shipments.length === 0 ? 'No shipments available' : 'No shipments match your filters'}</p>
                      {shipments.length === 0 && (
                        <button 
                          onClick={fetchShipments}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Retry Loading
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Modal */}
      {trackingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg sm:rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Shipment Tracking</h2>
                <button
                  onClick={closeTrackingModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Shipment Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">Shipment Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">{selectedShipment?.orderId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipment ID:</span>
                      <span className="font-medium">{selectedShipment?.shipmentId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">AWB Number:</span>
                      <span className="font-medium">{selectedShipment?.awbNumber || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Courier:</span>
                      <span className="font-medium">{selectedShipment?.courierName || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">Current Status</h3>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getTrackingStatusColor(trackingData?.status)}`}></div>
                    <div>
                      <p className="font-semibold text-gray-800 capitalize">
                        {trackingData?.status || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Last updated: {trackingData?.lastUpdated ? new Date(trackingData.lastUpdated).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              {trackingData?.trackingHistory && Array.isArray(trackingData.trackingHistory) && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-4 text-sm">Tracking History</h3>
                  <div className="space-y-4">
                    {trackingData.trackingHistory.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${getTrackingStatusColor(event.status)}`}></div>
                          {index < trackingData.trackingHistory.length - 1 && (
                            <div className="w-0.5 h-12 bg-gray-300 mt-1"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-gray-800 capitalize text-sm">{event.status}</p>
                          <p className="text-xs text-gray-600">{event.description || 'No description'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'}
                          </p>
                          {event.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin size={12} />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Information */}
              {selectedShipment?.customer && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">Customer Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{selectedShipment.customer.name}</p>
                        <p className="text-xs text-gray-600">Customer</p>
                      </div>
                    </div>
                    {selectedShipment.customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{selectedShipment.customer.phone}</p>
                          <p className="text-xs text-gray-600">Phone</p>
                        </div>
                      </div>
                    )}
                    {selectedShipment.customer.address && (
                      <div className="col-span-full flex items-start gap-2">
                        <Home size={14} className="text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{selectedShipment.customer.address}</p>
                          <p className="text-xs text-gray-600">Delivery Address</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipRocketDashboard;