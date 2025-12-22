// src/pages/CustomerPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Trash2,
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { adminAPI } from '../api/admin';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Sidebar from '../components/Sidebar';

const CustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isGuestToggleModalOpen, setIsGuestToggleModalOpen] = useState(false);
  const [customerToAction, setCustomerToAction] = useState(null);
  const [actionType, setActionType] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Search and filter logic
  useEffect(() => {
    let results = customers;

    if (searchTerm) {
      results = results.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedType !== 'all') {
      if (selectedType === 'guest') {
        results = results.filter(customer => customer.isGuest);
      } else if (selectedType === 'registered') {
        results = results.filter(customer => !customer.isGuest);
      } else if (selectedType === 'admin') {
        results = results.filter(customer => customer.role === 'admin');
      } else if (selectedType === 'user') {
        results = results.filter(customer => customer.role === 'user');
      }
    }

    setFilteredCustomers(results);
  }, [searchTerm, selectedType, customers]);

  // Handle customer deletion
  const handleDelete = async () => {
    if (!customerToAction) return;

    try {
      await adminAPI.deleteUser(customerToAction._id);
      setCustomers(prev => prev.filter(c => c._id !== customerToAction._id));
      setIsDeleteModalOpen(false);
      setCustomerToAction(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  // Handle guest status toggle
  const handleGuestToggle = async () => {
    if (!customerToAction) return;

    try {
      await adminAPI.editUser(customerToAction._id, { 
        isGuest: !customerToAction.isGuest 
      });
      
      setCustomers(prev => prev.map(c => 
        c._id === customerToAction._id 
          ? { ...c, isGuest: !c.isGuest }
          : c
      ));
      setIsGuestToggleModalOpen(false);
      setCustomerToAction(null);
    } catch (error) {
      console.error('Error updating guest status:', error);
    }
  };

  // Open modals
  const openDeleteModal = (customer) => {
    setCustomerToAction(customer);
    setIsDeleteModalOpen(true);
  };

  const openGuestToggleModal = (customer) => {
    setCustomerToAction(customer);
    setActionType(customer.isGuest ? 'makeRegistered' : 'makeGuest');
    setIsGuestToggleModalOpen(true);
  };

  const openDetailsModal = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  // Get user type badge
  const getUserTypeBadge = (isGuest) => {
    if (isGuest) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <User className="w-3 h-3 mr-1" />
          Guest
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Users className="w-3 h-3 mr-1" />
        Registered
      </span>
    );
  };

  // Get role badge
  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { bg: 'bg-red-100', text: 'text-red-800', label: 'Admin' },
      user: { bg: 'bg-green-100', text: 'text-green-800', label: 'User' },
      guest: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Guest' }
    };
    
    const config = roleConfig[role] || roleConfig.user;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Shield className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Mobile Card View Component
  const CustomerCard = ({ customer, index }) => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {customer.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {customer.name || 'Unnamed User'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {getUserTypeBadge(customer.isGuest)}
              {getRoleBadge(customer.role)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500">Email</p>
          <p className="text-sm text-gray-900 truncate">{customer.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Phone</p>
          <p className="text-sm text-gray-900">{customer.phone || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Joined</p>
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <Calendar className="w-3 h-3" />
            {formatDate(customer.createdAt)}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500">User ID</p>
          <p className="text-xs text-gray-500 font-mono">{customer._id?.substring(0, 8)}...</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex space-x-2 pt-3 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            openGuestToggleModal(customer);
          }}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center gap-2"
        >
          {customer.isGuest ? (
            <>
              <Users size={16} />
              <span>Make Registered</span>
            </>
          ) : (
            <>
              <User size={16} />
              <span>Make Guest</span>
            </>
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDeleteModal(customer);
          }}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 md:p-6 overflow-x-auto">
        {/* Header */}
        <header className="bg-white shadow sticky top-0 z-10 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-6 py-4 space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Users className="w-6 h-6 md:w-8 md:h-8" />
                Customers Management
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Manage and monitor all customer accounts
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
              All Customers ({customers.length})
            </h2>
            <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={fetchCustomers}
                className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px] gap-2"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              {/* Add Customer Button (if you have that feature) */}
              {/*
              <button
                onClick={() => {/* Open add customer modal *\/}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px] gap-2"
              >
                <UserPlus size={16} />
                <span>Add Customer</span>
              </button>
              */}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
                  <input
                    type="text"
                    placeholder="Search customers by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 md:py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="text-slate-400 w-4 h-4 md:w-5 md:h-5" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-2 md:px-3 md:py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base w-full md:w-auto"
                >
                  <option value="all">All Users</option>
                  <option value="registered">Registered</option>
                  <option value="guest">Guest</option>
                  <option value="admin">Admins</option>
                  <option value="user">Regular Users</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Table/Cards Display */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                {!isMobile ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User Type
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map((customer) => (
                          <tr 
                            key={customer._id} 
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => openDetailsModal(customer)}
                          >
                            <td className="py-4 px-4 md:px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base">
                                  {customer.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800 text-sm md:text-base">{customer.name || 'Unnamed User'}</p>
                                  <p className="text-xs md:text-sm text-slate-500">ID: {customer._id?.substring(0, 8)}...</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 md:px-6">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                                  <span className="text-xs md:text-sm truncate max-w-[150px]">{customer.email}</span>
                                </div>
                                {customer.phone ? (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                                    <span className="text-xs md:text-sm">{customer.phone}</span>
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-400">No phone</div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 md:px-6">
                              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                                {formatDate(customer.createdAt)}
                              </div>
                            </td>
                            <td className="py-4 px-4 md:px-6">
                              {getUserTypeBadge(customer.isGuest)}
                            </td>
                            <td className="py-4 px-4 md:px-6">
                              {getRoleBadge(customer.role)}
                            </td>
                            <td className="py-4 px-4 md:px-6">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openGuestToggleModal(customer);
                                  }}
                                  className={`p-1.5 md:p-2 rounded-lg ${customer.isGuest ? 'text-blue-600 hover:bg-blue-50' : 'text-purple-600 hover:bg-purple-50'} border border-transparent hover:border-current`}
                                  title={customer.isGuest ? 'Make Registered User' : 'Make Guest User'}
                                >
                                  {customer.isGuest ? <Users size={16} /> : <User size={16} />}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteModal(customer);
                                  }}
                                  className="p-1.5 md:p-2 text-red-600 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Mobile Card View */
                  <div className="p-4">
                    {filteredCustomers.map((customer, index) => (
                      <div 
                        key={customer._id}
                        onClick={() => openDetailsModal(customer)}
                      >
                        <CustomerCard customer={customer} index={index} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Customer Details Modal */}
        {isDetailsModalOpen && selectedCustomer && (
          <CustomerDetailsModal
            customer={selectedCustomer}
            onClose={() => setIsDetailsModalOpen(false)}
            onGuestToggle={openGuestToggleModal}
            onDelete={openDeleteModal}
          />
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && customerToAction && (
          <ConfirmationModal
            title="Delete Customer"
            message={`Are you sure you want to delete ${customerToAction.name}? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={handleDelete}
            onCancel={() => setIsDeleteModalOpen(false)}
            type="danger"
            icon={<Trash2 className="w-6 h-6" />}
          />
        )}

        {/* Guest/Registered Toggle Modal */}
        {isGuestToggleModalOpen && customerToAction && (
          <ConfirmationModal
            title={actionType === 'makeGuest' ? 'Convert to Guest User' : 'Convert to Registered User'}
            message={`Are you sure you want to convert ${customerToAction.name} to ${actionType === 'makeGuest' ? 'a guest user' : 'a registered user'}?`}
            confirmText={actionType === 'makeGuest' ? 'Make Guest' : 'Make Registered'}
            cancelText="Cancel"
            onConfirm={handleGuestToggle}
            onCancel={() => setIsGuestToggleModalOpen(false)}
            type={actionType === 'makeGuest' ? 'warning' : 'info'}
            icon={actionType === 'makeGuest' ? <User className="w-6 h-6" /> : <Users className="w-6 h-6" />}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerPage;