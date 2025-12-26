import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';
import { productsAPI } from '../api/products';

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const Products = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Get environment variables
  const API_IMG_URL = import.meta.env.VITE_API_IMG_URL ;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching products...');
      
      const response = await productsAPI.getAllProducts();
      
      console.log('API Response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      // Handle different response formats more carefully
      let productsArray = [];
      const data = response.data;
      
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data.products && Array.isArray(data.products)) {
        productsArray = data.products;
      } else if (data.data && Array.isArray(data.data)) {
        productsArray = data.data;
      } else if (data.success && Array.isArray(data.products)) {
        productsArray = data.products;
      } else {
        console.warn('Unexpected API response format:', data);
        // Try to extract products from whatever structure exists
        productsArray = Object.values(data).find(val => Array.isArray(val)) || [];
      }

      console.log('Processed products:', productsArray);
      setProducts(productsArray);
      
    } catch (error) {
      console.error('Error fetching products:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to load products';
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

const handleAddProduct = async (productData) => {
  try {
    console.log('🔄 handleAddProduct called');
    
    // ✅ ENHANCED DEBUG: Log ALL FormData contents
    console.log('=== FORM DATA CONTENTS ===');
    const formDataEntries = [];
    for (let [key, value] of productData.entries()) {
      console.log(`${key}:`, value);
      formDataEntries.push({ key, value });
    }
    console.log('=== END FORM DATA ===');
    
    // ✅ IMPROVED: Check if required fields are present
    const requiredFields = ['name', 'price', 'description', 'seller', 'category'];
    const missingFields = [];
    
    // Check each required field
    requiredFields.forEach(field => {
      const value = productData.get(field);
      if (!value || value.trim() === '') {
        missingFields.push(field);
      }
    });
    
    // Check stock
    const mainStock = productData.get('stock');
    
    if (!mainStock || parseInt(mainStock) <= 0) {
      missingFields.push('stock');
    }
    
    if (missingFields.length > 0) {
      const errorMsg = `❌ Missing required fields: ${missingFields.join(', ')}`;
      setError(errorMsg);
      console.error('Missing fields:', missingFields);
      return;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No authentication token found');
      return;
    }

    if (!isAdmin) {
      setError('Admin privileges required');
      return;
    }

    console.log('📤 Sending to API...');
    
    // ✅ ADDED: Debug the final FormData before sending
    console.log('=== FINAL FORM DATA TO SEND ===');
    for (let [key, value] of productData.entries()) {
      console.log(`${key}:`, value);
    }
    console.log('=== END FINAL FORM DATA ===');
    
    const response = await productsAPI.createProduct(productData);
    
    // ✅ ADD DEBUG LOGGING HERE:
    console.log('🔍 FULL API RESPONSE:', response);
    console.log('🔍 response.data:', response.data);
    console.log('🔍 response.data.data:', response.data?.data);
    console.log('🔍 response.data.product:', response.data?.product);
    
    // Try to extract the product data more carefully
    let newProduct;
    
    if (response.data && response.data.product) {
      newProduct = response.data.product;
    } else if (response.data && response.data.data) {
      newProduct = response.data.data;
    } else if (response.data) {
      newProduct = response.data;
    }
    
    console.log('🔍 Extracted newProduct:', newProduct);
    
    if (newProduct && newProduct._id) {
      // ✅ IMMEDIATE UPDATE - Add to beginning of list
      setProducts(prevProducts => [newProduct, ...prevProducts]);
      setIsModalOpen(false);
      
      // Show success message
      setError('✅ Product added successfully!');
      setTimeout(() => setError(''), 3000);
    } else {
      console.error('❌ Invalid product data in response:', newProduct);
      setError('❌ Product was created but could not display it immediately');
    }
    
  } catch (error) {
    console.error('❌ Error in handleAddProduct:', error);
    
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
      console.error('Error message:', error.response.data?.message);
      console.error('Missing fields:', error.response.data?.missingFields);
      
      if (error.response.status === 400) {
        // Show specific validation errors
        const errorMsg = error.response.data?.message || 'Bad Request - Check required fields';
        const missingFields = error.response.data?.missingFields || [];
        
        if (missingFields.length > 0) {
          setError(`❌ Missing: ${missingFields.join(', ')}`);
        } else {
          setError(`❌ ${errorMsg}`);
        }
      } else if (error.response.status === 404) {
        setError('❌ API endpoint not found. Check backend routes.');
      } else if (error.response.status === 401) {
        setError('❌ Unauthorized. Please login again.');
      } else if (error.response.status === 403) {
        setError('❌ Access forbidden. Admin privileges required.');
      } else {
        setError(`❌ ${error.response.data?.message || 'Failed to add product'}`);
      }
    } else if (error.request) {
      setError('❌ Cannot connect to server. Make sure backend is running.');
    } else {
      setError(`❌ ${error.message || 'Failed to add product'}`);
    }
  }
};

 const handleEditProduct = async (productId, productData) => {
  try {
    console.log('🔄 handleEditProduct called for product:', productId);
    
    // Debug: Log FormData contents
    console.log('FormData contents:');
    for (let [key, value] of productData.entries()) {
      console.log(`${key}:`, value);
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No authentication token found');
      return;
    }

    if (!isAdmin) {
      setError('Admin privileges required');
      return;
    }

    console.log('📤 Sending update to API...');
    
    const response = await productsAPI.updateProduct(productId, productData);
    
    // ✅ ADD DEBUG LOGGING HERE:
    console.log('🔍 FULL EDIT API RESPONSE:', response);
    console.log('🔍 response.data:', response.data);
    console.log('🔍 response.data.data:', response.data?.data);
    console.log('🔍 response.data.product:', response.data?.product);
    
    // Try to extract the updated product data more carefully
    let updatedProduct;
    
    if (response.data && response.data.product) {
      updatedProduct = response.data.product;
    } else if (response.data && response.data.data) {
      updatedProduct = response.data.data;
    } else if (response.data) {
      updatedProduct = response.data;
    }
    
    console.log('🔍 Extracted updatedProduct:', updatedProduct);
    
    if (updatedProduct && updatedProduct._id) {
      // ✅ FIXED: Properly merge the updated product data
      setProducts(prevProducts => 
        prevProducts.map(product => {
          if (product._id === productId) {
            // Merge the existing product with the updated data
            return {
              ...product,
              ...updatedProduct,
              // Ensure stock is properly updated
              stock: updatedProduct.stock !== undefined ? updatedProduct.stock : product.stock
            };
          }
          return product;
        })
      );
      
      setIsEditModalOpen(false);
      setEditingProduct(null);
      
      // Show success message
      setError('✅ Product updated successfully!');
      setTimeout(() => setError(''), 3000);
    } else {
      console.error('❌ Invalid updated product data:', updatedProduct);
      setError('❌ Product was updated but could not display changes immediately');
    }
    
  } catch (error) {
    console.error('❌ Error in handleEditProduct:', error);
    
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
      
      if (error.response.status === 404) {
        setError('❌ Product not found or API endpoint not found.');
      } else if (error.response.status === 401) {
        setError('❌ Unauthorized. Please login again.');
      } else if (error.response.status === 403) {
        setError('❌ Access forbidden. Admin privileges required.');
      } else {
        setError(`❌ ${error.response.data.message || 'Failed to update product'}`);
      }
    } else if (error.request) {
      setError('❌ Cannot connect to server. Make sure backend is running.');
    } else {
      setError(`❌ ${error.message || 'Failed to update product'}`);
    }
  }
};

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      console.log('Deleting product:', id);
      
      const response = await productsAPI.deleteProduct(id);
      
      console.log('Product deleted successfully:', response.data);

      setProducts(prevProducts => prevProducts.filter(product => product._id !== id));
      
      // Show success message
      setError('✅ Product deleted successfully!');
      setTimeout(() => setError(''), 3000);
      
    } catch (error) {
      console.error('Error deleting product:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to delete product';
      
      setError(`❌ ${errorMessage}`);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setIsEditModalOpen(false);
  };

  // Calculate total stock
  const getTotalStock = (product) => {
    return product.stock || 0;
  };

  // Safe function to get category name (handles both string and object)
  const getCategoryName = (product) => {
    if (!product.category) return 'N/A';
    
    if (typeof product.category === 'string') {
      return product.category;
    }
    
    if (typeof product.category === 'object' && product.category !== null) {
      return product.category.name || product.category._id || 'N/A';
    }
    
    return 'N/A';
  };

  // Safe rendering - always ensure products is an array
  const productsToRender = Array.isArray(products) ? products : [];

  // Mobile Card View Component
  const ProductCard = ({ product, index }) => {
    const totalStock = getTotalStock(product);
    const categoryName = getCategoryName(product);
    
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                {product.description}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ 
            product.status === 'active' 
              ? 'bg-green-100 text-green-800'
              : product.status === 'inactive'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
          }`}>
            {product.status || 'active'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-sm font-semibold text-gray-900">₹{product.price}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Stock</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
              totalStock > 10 
                ? 'bg-green-100 text-green-800' 
                : totalStock > 0 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              {totalStock} in stock
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500">Seller</p>
            <p className="text-sm text-gray-900 truncate">{product.seller}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Category</p>
            <p className="text-sm text-gray-900 truncate">{categoryName}</p>
          </div>
        </div>
        
        {/* Image */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Image</p>
          <div className="flex items-center space-x-3">
            {product.images && product.images.length > 0 && product.images[0]?.image ? (
              <img 
                src={`${import.meta.env.VITE_API_IMG_URL}${ 
                  product.images[0].image.startsWith('/uploads/') 
                    ? product.images[0].image.substring('/uploads'.length)
                    : product.images[0].image.startsWith('/')
                      ? product.images[0].image
                      : `/${product.images[0].image}`
                }`}
                alt={product.name}
                className="h-16 w-16 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <span className="text-xs text-gray-400">No Image</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {isAdmin && (
          <div className="flex space-x-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => openEditModal(product)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteProduct(product._id)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen">
        <Sidebar />
        
        <div className="flex-1" style={{ backgroundColor: 'white' }}>
          {/* Header */}
          <header className="bg-white shadow sticky top-0 z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-6 py-4 space-y-2 sm:space-y-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Products Management</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
                All Products ({productsToRender.length})
              </h2>
              <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                <button
                  onClick={fetchProducts}
                  className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px]"
                >
                  <span className="hidden sm:inline">Refresh</span>
                  <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px]"
                  >
                    <span className="hidden sm:inline mr-2">+</span>
                    <span>Add Product</span>
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className={`px-4 py-3 rounded mb-4 text-sm ${ 
                error.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {error}
              </div>
            )}

            {/* Products Display */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading products...</p>
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
                              S.No
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Image
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stock
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Seller
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            {isAdmin && (
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {productsToRender.length > 0 ? (
                            productsToRender.map((product, index) => {
                              const totalStock = getTotalStock(product);
                              const categoryName = getCategoryName(product);
                              
                              return (
                                <tr key={product._id} className="hover:bg-gray-50">
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 text-center">
                                      {product.sNo || index + 1}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center">
                                      {product.images && product.images.length > 0 && product.images[0]?.image ? (
                                        <img 
                                          src={`${import.meta.env.VITE_API_IMG_URL}${ 
                                            product.images[0].image.startsWith('/uploads/') 
                                              ? product.images[0].image.substring('/uploads'.length)
                                              : product.images[0].image.startsWith('/')
                                                ? product.images[0].image
                                                : `/${product.images[0].image}`
                                          }`}
                                          alt={product.name}
                                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover border border-gray-200"
                                        />
                                      ) : (
                                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                          <span className="text-xs text-gray-400">No Image</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4">
                                    <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                      {product.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                      {product.description}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">₹{product.price}</div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{categoryName}</div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
                                      totalStock > 10 
                                        ? 'bg-green-100 text-green-800' 
                                        : totalStock > 0 
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                    }`}>
                                      {totalStock} in stock
                                    </span>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500 truncate max-w-[100px]">{product.seller}</div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
                                      product.status === 'active' 
                                        ? 'bg-green-100 text-green-800'
                                        : product.status === 'inactive'
                                          ? 'bg-gray-100 text-gray-800'
                                          : 'bg-red-100 text-red-800'
                                    }`}>
                                      {product.status || 'active'}
                                    </span>
                                  </td>
                                  {isAdmin && (
                                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => openEditModal(product)}
                                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs font-medium transition duration-200"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteProduct(product._id)}
                                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs font-medium transition duration-200"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={isAdmin ? "9" : "8"} className="px-6 py-8 text-center">
                                <div className="text-gray-500">
                                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                  </svg>
                                  <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
                                  <p className="mt-1 text-sm text-gray-500">
                                    Get started by creating a new product.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Mobile Card View */
                    <div className="p-4">
                      {productsToRender.length > 0 ? (
                        productsToRender.map((product, index) => (
                          <ProductCard 
                            key={product._id} 
                            product={product} 
                            index={index} 
                          />
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Get started by creating a new product.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          {/* Add Product Modal */}
          <AddProductModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAddProduct={handleAddProduct}
          />

          {/* Edit Product Modal */}
          <EditProductModal 
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            onEditProduct={handleEditProduct}
            product={editingProduct}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Products;