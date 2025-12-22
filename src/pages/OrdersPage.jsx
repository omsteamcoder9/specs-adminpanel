import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../api/orders';
import { paymentsAPI } from '../api/payments';
import Sidebar from '../components/Sidebar';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ordersAPI.getOrders();
      
      // Handle different possible response structures
      let ordersData = [];
      
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      } else if (response.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      } else if (Array.isArray(response)) {
        ordersData = response;
      } else if (response.data && response.data.success && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      }
      
      console.log('Orders API Response:', response);
      console.log('Extracted Orders Data:', ordersData);
      
      setOrders(ordersData || []);
      
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', err);
      console.error('Error details:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add this function to check refund eligibility
  const isEligibleForRefund = (order) => {
    return order.paymentStatus === 'completed' && 
           order.orderStatus === 'cancelled' &&
           order.paymentStatus !== 'refunded' &&
           order.paymentStatus !== 'partially_refunded' &&
           order.paymentId;
  };

  // Add this function to process refunds
  const processRefund = async (order) => {
    if (!order.paymentId) {
      alert('Cannot process refund: Payment ID not found');
      return;
    }

    if (!confirm(`Are you sure you want to refund ${formatCurrency(order.finalAmount)} for order ${order.orderId}?`)) {
      return;
    }

    try {
      setRefundLoading(true);
      
      const refundData = {
        refund_amount: order.finalAmount,
        notes: {
          reason: 'Order cancelled',
          processedBy: 'admin',
          orderId: order.orderId
        }
      };

      console.log('Processing refund for payment:', order.paymentId);
      const response = await paymentsAPI.refundPayment(order.paymentId, refundData);
      
      if (response.data.success) {
        alert(`✅ Refund processed successfully!\nRefund ID: ${response.data.refund.id}\nAmount: ${formatCurrency(response.data.refund.amount)}`);
        fetchOrders();
      }
    } catch (error) {
      console.error('Refund error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Refund failed';
      alert(`❌ Refund failed: ${errorMessage}`);
    } finally {
      setRefundLoading(false);
    }
  };

  const fetchOrderReceipt = async (orderId) => {
    try {
      console.log('🔍 Fetching receipt for order ID:', orderId);
      
      if (!orderId) {
        alert('❌ Order ID is missing. Please check the order data.');
        return;
      }
      
      setReceiptLoading(true);
      
      console.log('🚀 Making API call to printOrderReceipt...');
      
      const response = await ordersAPI.printOrderReceipt(orderId);
      console.log('📄 Order receipt API response:', response);
      
      if (!response) {
        throw new Error('No response received from API');
      }
      
      const orderData = response.data || response;
      console.log('🎯 Extracted order data:', orderData);
      
      if (!orderData) {
        throw new Error('No order data received from API');
      }
      
      setSelectedOrder(orderData);
      setShowReceiptModal(true);
      console.log('✅ Receipt modal opened successfully');
      
    } catch (err) {
      console.error('❌ Error fetching order receipt:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to load receipt details';
      
      alert(`❌ Error: ${errorMessage}\n\nCheck console for more details.`);
    } finally {
      setReceiptLoading(false);
    }
  };

  const downloadPDFReceipt = async (orderId) => {
    try {
      console.log('📥 Downloading PDF for order ID:', orderId);
      
      if (!orderId) {
        console.error('❌ Order ID is missing in downloadPDFReceipt');
        setDownloadStatus('❌ Order ID missing');
        alert('Order ID is missing. Please try viewing the receipt first.');
        return;
      }

      setReceiptLoading(true);
      setDownloadStatus('⏳ Starting download...');
      
      console.log('🚀 Making PDF API call for order:', orderId);
      const response = await ordersAPI.printOrderReceiptPDF(orderId, {
        responseType: 'blob'
      });
      
      console.log('✅ PDF API response received');
      setDownloadStatus('📦 Creating PDF file...');
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF download completed');
      setDownloadStatus('✅ PDF downloaded successfully!');
      alert('✅ PDF downloaded successfully!');
      
    } catch (err) {
      console.error('❌ Error downloading PDF receipt:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to download PDF receipt';
      setDownloadStatus(`❌ Download failed: ${errorMessage}`);
      alert(`❌ Download failed: ${errorMessage}`);
    } finally {
      setReceiptLoading(false);
      setTimeout(() => setDownloadStatus(''), 3000);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border border-purple-200',
      delivered: 'bg-green-100 text-green-800 border border-green-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      completed: 'bg-green-100 text-green-800 border border-green-200',
      processing: 'bg-blue-100 text-blue-800 border border-blue-200',
      refunded: 'bg-purple-100 text-purple-800 border border-purple-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    if (!paymentStatus) return null;
    
    const paymentStatusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      completed: 'bg-green-100 text-green-800 border border-green-200',
      failed: 'bg-red-100 text-red-800 border border-red-200',
      refunded: 'bg-purple-100 text-purple-800 border border-purple-200',
      partially_refunded: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      processing: 'bg-blue-100 text-blue-800 border border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[paymentStatus] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1).replace('_', ' ')}
      </span>
    );
  };

  // Helper function to get customer info
  const getCustomerInfo = (order) => {
    const name = order.customer?.name || order.user?.name || order.customerName || order.guestUser?.name;
    const email = order.customer?.email || order.user?.email || order.customerEmail || order.guestUser?.email || order.email;
    const phone = order.customer?.phone || order.user?.phone || order.phoneNumber || order.guestUser?.phone;
    const isGuest = !order.customer?.name && !order.user?.name;
    
    return { name, email, phone, isGuest };
  };

  // Get the correct order ID for API calls
  const getOrderId = (order) => {
    if (!order) {
      console.error('❌ getOrderId: order is null or undefined');
      return null;
    }
    
    if (order.receipt) {
      return order.receipt.receiptNumber || order.receipt._id || order.receipt.orderId || order.receipt.id;
    }
    
    return order._id || order.id || order.orderId;
  };

  // Calculate statistics - INCLUDING CANCELLED ORDERS
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.orderStatus === 'pending').length;
  const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered' || order.orderStatus === 'completed').length;
  const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled').length;
  const refundedOrders = orders.filter(order => order.paymentStatus === 'refunded' || order.paymentStatus === 'partially_refunded').length;

  // Mobile Card View Component
  const OrderCard = ({ order, index }) => {
    const customer = getCustomerInfo(order);
    const orderId = getOrderId(order);
    const isRefundEligible = isEligibleForRefund(order);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                ID: {order.orderId?.substring(0, 8) || 'N/A'}
              </span>
              {customer.isGuest && (
                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">Guest</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
            <p className="text-xs text-gray-500 truncate">{customer.email}</p>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-900">{formatCurrency(order.totalAmount || order.amount || 0)}</div>
            <div className="text-xs text-gray-500">{formatDate(order.createdAt || order.orderDate || order.date)}</div>
          </div>
        </div>
        
        {/* Status Row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Order Status</p>
            {getStatusBadge(order.orderStatus)}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Payment Status</p>
            {getPaymentStatusBadge(
              order.paymentStatus || 
              order.payment?.status || 
              (order.paymentId ? 'completed' : 'pending')
            )}
          </div>
        </div>
        
        {/* Items and Details */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{order.items ? order.items.length : order.products?.length || 0}</span> items
          </div>
          <div className="text-xs text-gray-500">
            {order.paymentMethod ? `Paid via ${order.paymentMethod}` : ''}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => {
              console.log('View Receipt clicked for order:', order);
              console.log('Using order ID:', orderId);
              fetchOrderReceipt(orderId);
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 text-center"
          >
            View Receipt
          </button>
          
          {isRefundEligible && (
            <button
              onClick={() => processRefund(order)}
              disabled={refundLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 disabled:bg-red-300 text-center"
            >
              {refundLoading ? 'Processing...' : 'Refund'}
            </button>
          )}
          
          {(order.paymentStatus === 'refunded' || order.paymentStatus === 'partially_refunded') && (
            <div className="flex-1 bg-purple-100 text-purple-800 px-3 py-2 rounded text-sm text-center border border-purple-200">
              {order.paymentStatus === 'refunded' ? 'Refunded' : 'Partial'}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Updated ReceiptModal Component with Size Display
  const ReceiptModal = ({ order, onClose, onPrint, onDownloadPDF }) => {
    if (!order) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6">
            <p className="text-red-500">No order data available</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-300 rounded">Close</button>
          </div>
        </div>
      );
    }

    console.log('ReceiptModal order data:', order);

    // Extract data from nested receipt structure
    const receiptData = order.receipt || order;
    
    // Extract data from your actual API response structure
    const orderId = receiptData.receiptNumber || receiptData.orderNumber || receiptData.orderId || receiptData._id;
    const razorpayOrderId = receiptData.razorpayOrderId;
    const paymentId = receiptData.paymentId;
    
    // Customer information
    const customerName = receiptData.customer?.name || 
                        receiptData.user?.name || 
                        receiptData.guestUser?.name || 
                        receiptData.shippingAddress?.fullName ||
                        'N/A';
    
    const customerEmail = receiptData.customer?.email || 
                         receiptData.user?.email || 
                         receiptData.guestUser?.email || 
                         receiptData.email ||
                         'N/A';
    
    const customerPhone = receiptData.customer?.phone || 
                         receiptData.user?.phone || 
                         receiptData.guestUser?.phone || 
                         receiptData.shippingAddress?.phone ||
                         'N/A';
    
    // Order items
    const items = receiptData.products || receiptData.items || [];
    
    // Financial details
    const subtotal = receiptData.pricing?.subtotal || receiptData.totalAmount || receiptData.subtotal || 0;
    const shipping = receiptData.pricing?.shipping || receiptData.shippingFee || receiptData.shippingCharges || 0;
    const tax = receiptData.pricing?.tax || receiptData.taxAmount || receiptData.tax || 0;
    const total = receiptData.pricing?.total || receiptData.finalAmount || receiptData.total || subtotal + shipping + tax;
    
    // Dates
    const orderDate = receiptData.createdAt || receiptData.orderDate || receiptData.date;
    const paidAt = receiptData.payment?.paidAt || receiptData.paidAt || receiptData.paymentDate || orderDate;
    
    // Status information
    const orderStatus = receiptData.orderStatus;
    const paymentStatus = receiptData.payment?.status || receiptData.paymentStatus;
    const paymentMethod = receiptData.payment?.method || receiptData.paymentMethod;
    const isGuestOrder = receiptData.isGuestOrder;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl print:shadow-none print:max-h-none">
          {/* Header with Company Info */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 sm:p-6 print:bg-gray-800">
            <div className="text-center">
              <div className="flex justify-center items-center mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                  <span className="text-lg sm:text-xl">🛒</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">ORDER RECEIPT</h1>
              </div>
              <p className="text-blue-100 font-medium text-sm sm:text-base">Thank you for your business</p>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Order and Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6 border-b border-gray-200">
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-800 flex items-center text-sm sm:text-base">
                    <span className="mr-2">📋</span>
                    Order Details
                  </h3>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-semibold">{orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-medium">{formatDate(orderDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Date:</span>
                      <span className="font-medium">{formatDate(paidAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-800 flex items-center text-sm sm:text-base">
                    <span className="mr-2">📊</span>
                    Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs sm:text-sm">Order:</span>
                      {getStatusBadge(orderStatus)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs sm:text-sm">Payment:</span>
                      {getPaymentStatusBadge(paymentStatus)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs sm:text-sm">Method:</span>
                      <span className="font-medium capitalize text-xs sm:text-sm">{paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-gray-800 flex items-center text-sm sm:text-base">
                    <span className="mr-2">👤</span>
                    Customer Type
                  </h3>
                  <div className="text-center">
                    <div className={`inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${
                      isGuestOrder 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-green-500 text-white'
                    }`}>
                      <span className="mr-1">
                        {isGuestOrder ? '🎯' : '⭐'}
                      </span>
                      {isGuestOrder ? 'Guest Customer' : 'Registered Customer'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer and Shipping Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6 border-b border-gray-200">
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-800 flex items-center text-sm sm:text-base">
                    <span className="mr-2">🧾</span>
                    Bill To
                  </h3>
                  <div className="bg-gray-50 rounded p-2 sm:p-3 border border-gray-200">
                    <p className="font-bold text-gray-900 text-sm sm:text-base">{customerName}</p>
                    <p className="text-gray-600 text-xs sm:text-sm flex items-center">
                      <span className="mr-1">📧</span>
                      {customerEmail}
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm flex items-center">
                      <span className="mr-1">📞</span>
                      {customerPhone}
                    </p>
                  </div>
                </div>

                {receiptData.shippingAddress && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-800 flex items-center text-sm sm:text-base">
                      <span className="mr-2">🚚</span>
                      Ship To
                    </h3>
                    <div className="bg-gray-50 rounded p-2 sm:p-3 border border-blue-200">
                      <p className="font-bold text-gray-900 text-sm sm:text-base">{receiptData.shippingAddress.fullName}</p>
                      <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                        <p>{receiptData.shippingAddress.address}</p>
                        <p>{receiptData.shippingAddress.city}, {receiptData.shippingAddress.state} {receiptData.shippingAddress.postalCode}</p>
                        <p>{receiptData.shippingAddress.country}</p>
                        <p className="font-medium flex items-center">
                          <span className="mr-1">📞</span>
                          {receiptData.shippingAddress.phone}
                        </p>
                    </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Table with Size Column */}
              <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                  <span className="mr-2">📦</span>
                  Order Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-1 sm:px-4 sm:py-2 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                        <th className="px-2 py-1 sm:px-4 sm:py-2 text-center text-xs font-semibold text-gray-700 uppercase">Size</th>
                        <th className="px-2 py-1 sm:px-4 sm:py-2 text-center text-xs font-semibold text-gray-700 uppercase">Qty</th>
                        <th className="px-2 py-1 sm:px-4 sm:py-2 text-right text-xs font-semibold text-gray-700 uppercase">Price</th>
                        <th className="px-2 py-1 sm:px-4 sm:py-2 text-right text-xs font-semibold text-gray-700 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={item._id || index}>
                          <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-900">
                            <div>
                              <div className="font-semibold">
                                {item.product?.name || item.name || 'Product'}
                              </div>
                              {item.product?.description && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.product.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-900 text-center">
                            <span className="bg-blue-100 text-blue-800 px-1 sm:px-2 py-1 rounded text-xs font-medium">
                              {item.selectedSize || item.size || 'N/A'}
                            </span>
                          </td>
                          <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-900 text-center">
                            <span className="bg-gray-100 text-gray-800 px-1 sm:px-2 py-1 rounded">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-gray-900 text-right">
                            <span className="bg-green-100 text-green-800 px-1 sm:px-2 py-1 rounded">
                              {formatCurrency((item.price || 0) * (item.quantity || 1))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="flex justify-end">
                  <div className="w-full sm:w-80 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl p-3 sm:p-4 lg:p-6 shadow-lg">
                    <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center border-b border-blue-300 pb-2">
                      💰 Order Summary
                    </h4>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium text-sm sm:text-base">Subtotal:</span>
                        <span className="text-gray-900 font-semibold text-sm sm:text-base">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium text-sm sm:text-base">Shipping:</span>
                        <span className="text-gray-900 font-semibold text-sm sm:text-base">{formatCurrency(shipping)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium text-sm sm:text-base">Tax:</span>
                        <span className="text-gray-900 font-semibold text-sm sm:text-base">{formatCurrency(tax)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 sm:pt-3 border-t-2 border-blue-300 mt-2">
                        <span className="text-base sm:text-lg font-bold text-gray-800">Final Amount:</span>
                        <span className="text-lg sm:text-xl font-bold text-green-600 bg-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg border-2 border-green-300">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <div className="text-center text-gray-600">
                  <p className="font-semibold mb-2 flex items-center justify-center text-sm sm:text-base">
                    <span className="mr-1">🎉</span>
                    Thank you for your business!
                  </p>
                  <div className="text-xs bg-white rounded p-2 sm:p-3 border border-gray-200">
                    <p>Order ID: <strong className="text-blue-600">{orderId}</strong></p>
                    {paymentId && <p>Payment ID: <strong className="text-blue-600">{paymentId}</strong></p>}
                    {razorpayOrderId && <p>Razorpay Order ID: <strong className="text-blue-600">{razorpayOrderId}</strong></p>}
                    <p className="text-gray-500 mt-2">This is a computer-generated receipt. No signature required.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-3 sm:p-4 border-t border-gray-200 bg-white print:hidden">
            {/* Download Status Display */}
            {downloadStatus && (
              <div className="flex-1 mr-0 sm:mr-4 mb-2 sm:mb-0">
                <div className={`px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium ${
                  downloadStatus.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' :
                  downloadStatus.includes('❌') ? 'bg-red-100 text-red-800 border border-red-200' :
                  'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {downloadStatus}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={onDownloadPDF}
                disabled={receiptLoading}
                className="flex-1 sm:flex-none px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 transition-all flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <span>📥</span>
                {receiptLoading ? 'Downloading...' : 'Download PDF'}
              </button>
              <button
                onClick={onPrint}
                className="flex-1 sm:flex-none px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <span>🖨️</span>
                Print
              </button>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <span>✕</span>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="bg-white shadow-lg">
            <div className="px-4 py-4">
              <h1 className="text-xl font-bold text-gray-800">Orders Management</h1>
            </div>
          </header>
          
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="bg-white shadow-lg">
            <div className="px-4 py-4">
              <h1 className="text-xl font-bold text-gray-800">Orders Management</h1>
            </div>
          </header>
          
          <main className="flex-1 p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
              <button 
                onClick={fetchOrders}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-lg sticky top-0 z-20">
          <div className="flex justify-between items-center px-4 py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Orders Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Total Orders: {totalOrders}
              </p>
            </div>
            <button 
              onClick={fetchOrders}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Refresh Orders
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* Statistics Cards - INCLUDING CANCELLED ORDERS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-xs font-medium">Total Orders</p>
                  <p className="text-xl font-bold text-gray-800 mt-2">{totalOrders}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">T</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-xs font-medium">Pending</p>
                  <p className="text-xl font-bold text-yellow-600 mt-2">{pendingOrders}</p>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">P</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-xs font-medium">Delivered</p>
                  <p className="text-xl font-bold text-green-600 mt-2">{deliveredOrders}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">D</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-xs font-medium">Cancelled</p>
                  <p className="text-xl font-bold text-red-600 mt-2">{cancelledOrders}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">C</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-xs font-medium">Refunded</p>
                  <p className="text-xl font-bold text-purple-600 mt-2">{refundedOrders}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">R</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Container */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            {!Array.isArray(orders) ? (
              <div className="text-center py-8">
                <p className="text-red-500 text-lg">Data format error</p>
                <p className="text-gray-400 mt-2">Orders data is not in expected format</p>
                <button 
                  onClick={fetchOrders}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No orders found</p>
                <p className="text-gray-400 mt-2">Orders will appear here when customers place them</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="p-4 md:hidden">
                  {orders.map((order, index) => (
                    <OrderCard key={order._id || order.id} order={order} index={index} />
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order, index) => {
                          const customer = getCustomerInfo(order);
                          const orderId = getOrderId(order);
                          
                          return (
                            <tr key={order._id || order.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 text-center">
                                  {index + 1}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 font-mono">
                                  {order.orderId || order.orderNumber || order._id?.substring(-6)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 flex items-center">
                                  <span>{customer.name}</span>
                                  {customer.isGuest && (
                                    <span className="ml-2 px-2 bg-gray-200 text-gray-600 text-xs rounded">Guest</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {customer.email}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(order.createdAt || order.orderDate || order.date)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(order.totalAmount || order.amount || 0)}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {getStatusBadge(order.orderStatus)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {getPaymentStatusBadge(
                                  order.paymentStatus || 
                                  order.payment?.status || 
                                  (order.paymentId ? 'completed' : 'pending')
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {order.items ? order.items.length : order.products?.length || 0} items
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      console.log('View Receipt clicked for order:', order);
                                      console.log('Using order ID:', orderId);
                                      fetchOrderReceipt(orderId);
                                    }}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                  >
                                    View Receipt
                                  </button>
                                  
                                  {isEligibleForRefund(order) && (
                                    <button
                                      onClick={() => processRefund(order)}
                                      disabled={refundLoading}
                                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-red-300 transition-colors"
                                    >
                                      {refundLoading ? 'Processing...' : 'Refund'}
                                    </button>
                                  )}
                                  
                                  {(order.paymentStatus === 'refunded' || order.paymentStatus === 'partially_refunded') && (
                                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded border border-purple-200">
                                      {order.paymentStatus === 'refunded' ? 'Refunded' : 'Partial'}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <ReceiptModal
          order={selectedOrder}
          onClose={() => setShowReceiptModal(false)}
          onPrint={printReceipt}
          onDownloadPDF={() => {
            const orderId = selectedOrder?.receipt?.receiptNumber || 
                           selectedOrder?.receipt?._id || 
                           selectedOrder?.receipt?.orderId || 
                           selectedOrder?.receipt?.id ||
                           selectedOrder?._id || 
                           selectedOrder?.id || 
                           selectedOrder?.orderId;
            
            console.log('📋 Download PDF clicked with order ID:', orderId);
            console.log('Selected order receipt:', selectedOrder?.receipt);
            
            if (!orderId) {
              alert('❌ Cannot download PDF: Order ID not found. Please try viewing the receipt first.');
              return;
            }
            
            downloadPDFReceipt(orderId);
          }}
        />
      )}
    </div>
  );
};

export default OrdersPage;