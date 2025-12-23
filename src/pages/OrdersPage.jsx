
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
  const [refundStatus, setRefundStatus] = useState({});
  const [activeRefundOrderId, setActiveRefundOrderId] = useState(null);

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

  // Check if order is eligible for refund - FIXED VERSION
  const isRefundable = (order) => {
    if (!order) return false;
    
    // 1. ORDER MUST BE CANCELLED
    const isCancelled = order.orderStatus === 'cancelled';
    
    // 2. PAYMENT MUST BE COMPLETED (not pending or failed)
    const hasPaid = order.paymentStatus === 'completed' || 
                   order.paymentStatus === 'partially_refunded';
    
    // 3. MUST HAVE PAYMENT ID (for Razorpay)
    const hasPaymentId = order.paymentId && order.paymentId.trim() !== '';
    
    // 4. MUST NOT BE ALREADY FULLY REFUNDED
    const notFullyRefunded = order.paymentStatus !== 'refunded';
    
    // ALL CONDITIONS MUST BE TRUE
    const canRefund = isCancelled && hasPaid && hasPaymentId && notFullyRefunded;
    
    return canRefund;
  };

  // Process refund for an order - FIXED VERSION
// Process refund for an order - FIXED VERSION
// Process refund for an order - CORRECTED VERSION
const processRefund = async (order) => {
  console.log('🔍 Starting refund process for order:', {
    orderId: order.orderId,
    _id: order._id,
    paymentId: order.paymentId,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus
  });

  if (!order) {
    alert(' Cannot process refund: Order data is missing');
    return;
  }

  if (!order.paymentId) {
    console.error(' Missing paymentId in order:', {
      orderId: order.orderId,
      availableFields: Object.keys(order)
    });
    alert(' Cannot process refund: Payment ID not found');
    return;
  }

  if (!isRefundable(order)) {
    alert(` This order cannot be refunded because:
    • Order Status: ${order.orderStatus} ${order.orderStatus !== 'cancelled' ? ' (Must be cancelled)' : ''}
    • Payment Status: ${order.paymentStatus} ${order.paymentStatus !== 'completed' && order.paymentStatus !== 'partially_refunded' ? '❌ (Must be completed or partially refunded)' : '✅'}
    • Payment ID: ${order.paymentId ? ' Exists' : ' Missing'}
    • Already Fully Refunded: ${order.paymentStatus === 'refunded' ? ' Yes' : ' No'}`);
    return;
  }

  const refundAmount = order.finalAmount || order.totalAmount || 0;
  
  if (!confirm(`Are you sure you want to refund ${formatCurrency(refundAmount)} for order ${order.orderId}?`)) {
    return;
  }

  try {
    setRefundLoading(true);
    setActiveRefundOrderId(order._id);
    setRefundStatus(prev => ({
      ...prev,
      [order._id]: { status: 'processing', message: 'Processing refund...' }
    }));
    
    const refundData = {
      refund_amount: refundAmount,
      notes: {
        reason: 'Order cancelled',
        processedBy: 'admin',
        orderId: order.orderId
      }
    };

    console.log(' Making refund API call with data:', {
      paymentId: order.paymentId,
      amount: refundAmount,
      orderId: order.orderId,
      url: `/payments/${order.paymentId}/refund`,
      method: 'POST'
    });

    // CORRECTED: Use paymentsAPI.refundPayment instead of ordersAPI.refundOrder
    const response = await paymentsAPI.refundPayment(order.paymentId, refundData);
    
    console.log('✅ Refund API Response:', response.data);
    
    if (response.data.success) {
      setRefundStatus(prev => ({
        ...prev,
        [order._id]: { 
          status: 'success', 
          message: `Refunded ${formatCurrency(response.data.refund.amount)}`,
          refundId: response.data.refund.id
        }
      }));
      
      alert(`✅ Refund processed successfully!\nRefund ID: ${response.data.refund.id}\nAmount: ${formatCurrency(response.data.refund.amount)}`);
      
      // Refresh orders to show updated status
      setTimeout(() => fetchOrders(), 1500);
    } else {
      setRefundStatus(prev => ({
        ...prev,
        [order._id]: { 
          status: 'error', 
          message: response.data.message || 'Refund failed'
        }
      }));
      alert(`⚠️ Refund failed: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(' FULL Refund error:', error);
    console.error(' Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    
    // Check if it's a network error
    if (!error.response) {
      console.error(' Network error - No response from server');
      alert(' Network error: Could not connect to server');
    }
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Refund failed due to server error';
    
    setRefundStatus(prev => ({
      ...prev,
      [order._id]: { 
        status: 'error', 
        message: errorMessage
      }
    }));
    
    alert(` Refund failed: ${errorMessage}`);
    
    // Show specific guidance based on error
    if (errorMessage.includes('already been fully refunded')) {
      alert('This payment has already been refunded. Check the payment status.');
    } else if (errorMessage.includes('Payment not found')) {
      alert(' Payment ID not found in Razorpay. Verify the payment was successful.');
    } else if (errorMessage.includes('Internal server error')) {
      alert('Server error. Check backend logs for details.');
    }
  } finally {
    setRefundLoading(false);
    setTimeout(() => {
      setActiveRefundOrderId(null);
    }, 3000);
  }
};

  const fetchOrderReceipt = async (orderId) => {
    try {
      console.log('🔍 Fetching receipt for order ID:', orderId);
      
      if (!orderId) {
        alert(' Order ID is missing. Please check the order data.');
        return;
      }
      
      setReceiptLoading(true);
    
      console.log(' Making API call to printOrderReceipt...');
      
      const response = await ordersAPI.printOrderReceipt(orderId);
      console.log(' Order receipt API response:', response);
      
      if (!response) {
        throw new Error('No response received from API');
      }
      
      const orderData = response.data || response;
      console.log(' Extracted order data:', orderData);
      
      if (!orderData) {
        throw new Error('No order data received from API');
      }
      
      setSelectedOrder(orderData);
      setShowReceiptModal(true);
      console.log(' Receipt modal opened successfully');
      
    } catch (err) {
      console.error(' Error fetching order receipt:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to load receipt details';
      
      alert(` Error: ${errorMessage}\n\nCheck console for more details.`);
    } finally {
      setReceiptLoading(false);
    }
  };

  const downloadPDFReceipt = async (orderId) => {
    try {
      console.log(' Downloading PDF for order ID:', orderId);
      
      if (!orderId) {
        console.error(' Order ID is missing in downloadPDFReceipt');
        setDownloadStatus(' Order ID missing');
        alert('Order ID is missing. Please try viewing the receipt first.');
        return;
      }

      setReceiptLoading(true);
      setDownloadStatus(' Starting download...');
      
      console.log(' Making PDF API call for order:', orderId);
      const response = await ordersAPI.printOrderReceiptPDF(orderId, {
        responseType: 'blob'
      });
      
      console.log(' PDF API response received');
      setDownloadStatus(' Creating PDF file...');
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(' PDF download completed');
      setDownloadStatus(' PDF downloaded successfully!');
      alert(' PDF downloaded successfully!');
      
    } catch (err) {
      console.error(' Error downloading PDF receipt:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to download PDF receipt';
      setDownloadStatus(` Download failed: ${errorMessage}`);
      alert(` Download failed: ${errorMessage}`);
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
      console.error(' getOrderId: order is null or undefined');
      return null;
    }
    
    if (order.receipt) {
      return order.receipt.receiptNumber || order.receipt._id || order.receipt.orderId || order.receipt.id;
    }
    
    return order._id || order.id || order.orderId;
  };

  // Calculate statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.orderStatus === 'pending').length;
  const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered' || order.orderStatus === 'completed').length;
  const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled').length;
  const refundedOrders = orders.filter(order => order.paymentStatus === 'refunded' || order.paymentStatus === 'partially_refunded').length;

  // ReceiptModal Component
  const ReceiptModal = ({ order, onClose, onPrint, onDownloadPDF }) => {
    if (!order) return null;

    const receiptData = order.receipt || order;
    const orderId = receiptData.receiptNumber || receiptData.orderNumber || receiptData.orderId || receiptData._id;
    const customerName = receiptData.customer?.name || receiptData.user?.name || receiptData.guestUser?.name || receiptData.shippingAddress?.fullName || 'N/A';
    const customerEmail = receiptData.customer?.email || receiptData.user?.email || receiptData.guestUser?.email || receiptData.email || 'N/A';
    const customerPhone = receiptData.customer?.phone || receiptData.user?.phone || receiptData.guestUser?.phone || receiptData.shippingAddress?.phone || 'N/A';
    const items = receiptData.products || receiptData.items || [];
    const subtotal = receiptData.pricing?.subtotal || receiptData.totalAmount || receiptData.subtotal || 0;
    const shipping = receiptData.pricing?.shipping || receiptData.shippingFee || receiptData.shippingCharges || 0;
    const tax = receiptData.pricing?.tax || receiptData.taxAmount || receiptData.tax || 0;
    const total = receiptData.pricing?.total || receiptData.finalAmount || receiptData.total || subtotal + shipping + tax;
    const orderDate = receiptData.createdAt || receiptData.orderDate || receiptData.date;
    const paymentStatus = receiptData.payment?.status || receiptData.paymentStatus;
    const paymentMethod = receiptData.payment?.method || receiptData.paymentMethod;
    const paymentId = receiptData.paymentId;
    const razorpayOrderId = receiptData.razorpayOrderId;
    const orderStatus = receiptData.orderStatus;
    const isGuestOrder = receiptData.isGuestOrder;
    const shippingAddress = receiptData.shippingAddress;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 z-50">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="bg-blue-700 text-white p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🛒</div>
              <div>
                <h1 className="font-bold text-sm">ORDER RECEIPT</h1>
                <p className="text-blue-200 text-xs">#{orderId?.substring(0, 12)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-0.5 rounded text-xs ${isGuestOrder ? 'bg-orange-500' : 'bg-green-500'}`}>
                {isGuestOrder ? 'Guest' : 'Reg'}
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* Order Info */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 min-w-[60px]">Date:</span>
                <span className="text-xs font-medium flex-1 text-right">{formatDate(orderDate)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 min-w-[60px]">Payment:</span>
                <div className="flex-1 text-right">
                  {getPaymentStatusBadge(paymentStatus)}
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 min-w-[60px]">Status:</span>
                <div className="flex-1 text-right">
                  {getStatusBadge(orderStatus)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 min-w-[60px]">Method:</span>
                <span className="text-xs font-medium capitalize flex-1 text-right">{paymentMethod}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-3 p-2 bg-gray-50 rounded border">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-sm truncate">{customerName}</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">📧</span>
                  <span className="truncate">{customerEmail}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">📞</span>
                  <span>{customerPhone}</span>
                </div>
              </div>
              {shippingAddress && (
                <div className="mt-2 pt-2 border-t text-xs">
                  <div className="font-medium text-gray-600">Shipping:</div>
                  <div className="text-gray-500 truncate">
                    {shippingAddress.address}, {shippingAddress.city}
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-sm">Items ({items.length})</h3>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={item._id || index} className="flex justify-between items-center p-1.5 hover:bg-gray-50 rounded border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">{item.product?.name || item.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs">{formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Shipping:</span>
                  <span className="font-semibold">{formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Tax:</span>
                  <span className="font-semibold">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-300 font-bold text-base">
                  <span>TOTAL:</span>
                  <span className="text-green-700">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment IDs */}
            {(paymentId || razorpayOrderId) && (
              <div className="mt-3 p-2 bg-gray-50 rounded border text-xs">
                {paymentId && <div className="mb-1"><span className="text-gray-500">Payment ID:</span> <span className="font-medium">{paymentId.substring(0, 16)}...</span></div>}
                {razorpayOrderId && <div><span className="text-gray-500">Razorpay ID:</span> <span className="font-medium">{razorpayOrderId.substring(0, 16)}...</span></div>}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-3 border-t bg-gray-50 flex justify-between items-center">
            {downloadStatus ? (
              <div className={`px-2 py-1 rounded text-xs ${
                downloadStatus.includes('✅') ? 'bg-green-100 text-green-800' :
                downloadStatus.includes('❌') ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {downloadStatus.length > 20 ? downloadStatus.substring(0, 20) + '...' : downloadStatus}
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                {formatDate(orderDate)}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={onDownloadPDF}
                disabled={receiptLoading}
                className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:bg-red-300 flex items-center gap-1 min-w-[60px] justify-center"
                title="Download PDF"
              >
                <span>📥</span>
                {receiptLoading ? '...' : 'PDF'}
              </button>
              <button
                onClick={onPrint}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center gap-1 min-w-[60px] justify-center"
                title="Print"
              >
                <span>🖨️</span>
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-4 sm:p-6 bg-gray-50">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-4 sm:p-6 bg-gray-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={fetchOrders}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-0 min-w-0 overflow-x-hidden">
        <div className="p-3 sm:p-4 lg:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Orders Management</h1>
            <button 
              onClick={fetchOrders}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
            >
              Refresh Orders
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">Total Orders</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mt-1 sm:mt-2">{totalOrders}</p>
                </div>
                <div className="p-1 sm:p-2 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">T</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">Pending Orders</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600 mt-1 sm:mt-2">{pendingOrders}</p>
                </div>
                <div className="p-1 sm:p-2 bg-yellow-50 rounded-lg">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">P</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">Delivered Orders</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mt-1 sm:mt-2">{deliveredOrders}</p>
                </div>
                <div className="p-1 sm:p-2 bg-green-50 rounded-lg">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">D</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">Refunded Orders</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 mt-1 sm:mt-2">{refundedOrders}</p>
                </div>
                <div className="p-1 sm:p-2 bg-purple-50 rounded-lg">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">R</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
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
              <div className="overflow-x-auto">
                {/* Scroll indicator for mobile */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 sm:hidden">
                  ← Scroll horizontally to see all columns →
                </div>
                
                <table className="min-w-[800px] lg:min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">S.No</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Order ID</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Order Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Payment Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Items</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order, index) => {
                      const customer = getCustomerInfo(order);
                      const orderId = getOrderId(order);
                      const isRefundableOrder = isRefundable(order);
                      const currentRefundStatus = refundStatus[order._id];
                      
                      return (
                        <tr key={order._id || order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 text-center">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 font-mono">
                              {order.orderId || order.orderNumber || order._id?.substring(-6)}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <span className="truncate max-w-[100px] sm:max-w-none">
                                {customer.name}
                              </span>
                              {customer.isGuest && (
                                <span className="ml-2 px-1 bg-gray-200 text-gray-600 text-xs rounded flex-shrink-0">Guest</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">
                              {customer.email}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm text-gray-900">
                              {formatDate(order.createdAt || order.orderDate || order.date)}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(order.totalAmount || order.amount || 0)}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            {getStatusBadge(order.orderStatus)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            {getPaymentStatusBadge(
                              order.paymentStatus || 
                              order.payment?.status || 
                              (order.paymentId ? 'completed' : 'pending')
                            )}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.items ? order.items.length : order.products?.length || 0} items
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                              <button
                                onClick={() => fetchOrderReceipt(orderId)}
                                className="px-2 py-1 sm:px-3 sm:py-1 bg-green-600 text-white text-xs sm:text-sm rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                              >
                                View Receipt
                              </button>
                              
                              {/* Refund Button with Status */}
                              {isRefundableOrder ? (
                                <div className="relative">
                                  <button
                                    onClick={() => processRefund(order)}
                                    disabled={refundLoading && activeRefundOrderId === order._id}
                                    className={`px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm rounded transition-colors whitespace-nowrap flex items-center justify-center gap-1 min-w-[70px] ${
                                      refundLoading && activeRefundOrderId === order._id
                                        ? 'bg-red-300 text-white cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                    title="Refund cancelled order"
                                  >
                                    {refundLoading && activeRefundOrderId === order._id ? (
                                      <>
                                        <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing
                                      </>
                                    ) : (
                                      'Refund'
                                    )}
                                  </button>
                                  
                                  {/* Refund Status Message */}
                                  {currentRefundStatus && (
                                    <div className={`absolute top-full left-0 mt-1 px-2 py-1 text-xs rounded whitespace-nowrap z-10 ${
                                      currentRefundStatus.status === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                                      currentRefundStatus.status === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                                      'bg-blue-100 text-blue-800 border border-blue-200'
                                    }`}>
                                      {currentRefundStatus.message}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // Show status for non-refundable orders
                                <>
                                  {order.orderStatus === 'cancelled' && order.paymentStatus === 'completed' && !order.paymentId && (
                                    <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-100 text-gray-600 text-xs sm:text-sm rounded border border-gray-200 whitespace-nowrap text-center" title="Cannot refund: Missing payment ID">
                                      No Payment ID
                                    </span>
                                  )}
                                  
                                  {order.orderStatus === 'cancelled' && order.paymentStatus !== 'completed' && order.paymentStatus !== 'partially_refunded' && (
                                    <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-100 text-gray-600 text-xs sm:text-sm rounded border border-gray-200 whitespace-nowrap text-center" title={`Cannot refund: Payment status is ${order.paymentStatus}`}>
                                      Not Paid
                                    </span>
                                  )}
                                  
                                  {order.orderStatus !== 'cancelled' && order.paymentStatus === 'completed' && (
                                    <span className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded border border-blue-200 whitespace-nowrap text-center">
                                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                    </span>
                                  )}
                                  
                                  {order.paymentStatus === 'refunded' && (
                                    <span className="px-2 py-1 sm:px-3 sm:py-1 bg-green-100 text-green-800 text-xs sm:text-sm rounded border border-green-200 whitespace-nowrap text-center flex items-center gap-1">
                                      <span>✅</span>
                                      Refunded
                                    </span>
                                  )}
                                  
                                  {order.paymentStatus === 'partially_refunded' && (
                                    <span className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded border border-blue-200 whitespace-nowrap text-center flex items-center gap-1">
                                      <span>↩️</span>
                                      Partial
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
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
