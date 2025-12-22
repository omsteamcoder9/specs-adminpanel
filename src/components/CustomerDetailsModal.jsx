// src/components/CustomerDetailsModal.jsx
import React from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield, 
  ShoppingBag,
  CreditCard,
  Package,
  Edit,
  Trash2,
  UserX,
  UserCheck
} from 'lucide-react';

const CustomerDetailsModal = ({ customer, onClose, onDeactivate, onDelete }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Customer Details</h2>
            <p className="text-slate-600">View and manage customer information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Profile */}
        <div className="p-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {customer.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800">{customer.name}</h3>
              <p className="text-slate-600">{customer.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                  {customer.role || 'customer'}
                </span>
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contact Information */}
            <div className="bg-slate-50 rounded-xl p-5">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-slate-50 rounded-xl p-5">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Joined</p>
                    <p className="font-medium">{formatDate(customer.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Last Updated</p>
                    <p className="font-medium">{formatDate(customer.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {customer.address && (
            <div className="bg-slate-50 rounded-xl p-5 mb-6">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address
              </h4>
              <div className="text-slate-700">
                {customer.address.street && <p>{customer.address.street}</p>}
                {customer.address.city && customer.address.state && (
                  <p>{customer.address.city}, {customer.address.state}</p>
                )}
                {customer.address.country && <p>{customer.address.country}</p>}
                {customer.address.zipCode && <p>ZIP: {customer.address.zipCode}</p>}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-800">12</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Spent</p>
                  <p className="text-2xl font-bold text-slate-800">$1,240</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending Orders</p>
                  <p className="text-2xl font-bold text-slate-800">2</p>
                </div>
                <Package className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={() => onDeactivate(customer)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${customer.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
          >
            {customer.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
            {customer.isActive ? 'Deactivate' : 'Reactivate'}
          </button>
          <button
            onClick={() => onDelete(customer)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete Customer
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;