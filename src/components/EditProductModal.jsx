// src/components/EditProductModal.jsx
import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../api/categories';

const EditProductModal = ({ isOpen, onClose, onEditProduct, product }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    description: '',
    category: '',
    stock: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  
  // ✅ Specifications state
  const [specifications, setSpecifications] = useState([]);

  // FIXED: Get environment variables at the top
  const API_IMG_URL = import.meta.env.VITE_API_IMG_URL;

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (product) {
        populateFormData();
      }
    }
  }, [isOpen, product]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('📋 Fetching categories for edit...');
      
      const response = await categoriesAPI.getActiveCategories();
      
      let categoriesArray = [];
      
      if (Array.isArray(response.data)) {
        categoriesArray = response.data;
      } else if (response.data.categories && Array.isArray(response.data.categories)) {
        categoriesArray = response.data.categories;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        categoriesArray = response.data.data;
      } else {
        console.warn('Unexpected categories response format:', response.data);
        categoriesArray = [];
      }
      
      setCategories(categoriesArray);
      
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError('Failed to fetch categories');
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const populateFormData = () => {
    if (!product) return;

    console.log('📝 Populating form with product data:', product);
    
    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      price: product.price || '',
      description: product.description || '',
      category: product.category?._id || product.category || '',
      stock: product.stock || '',
    });

    if (product.images && Array.isArray(product.images)) {
      setExistingImages(product.images.filter(img => img.image));
    } else {
      setExistingImages([]);
    }

    // ✅ Populate specifications from product data
    if (product.specifications && 
        Array.isArray(product.specifications) && 
        product.specifications.length > 0) {
      setSpecifications(product.specifications.map(spec => ({
        key: spec.key || '',
        value: spec.value || ''
      })));
    } else {
      setSpecifications([]);
    }

    setImageFiles([]);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const updatedFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    if (name === 'name' && autoGenerateSlug) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      
      updatedFormData.slug = generatedSlug;
    }

    setFormData(updatedFormData);
  };

  // ✅ Specifications change handlers
  const handleSpecificationChange = (index, field, value) => {
    const updatedsoap = [...specifications];
    updatedsoap[index] = {
      ...updatedsoap[index],
      [field]: value
    };
    setSpecifications(updatedsoap);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const removeSpecification = (index) => {
    const updatedsoap = [...specifications];
    updatedsoap.splice(index, 1);
    setSpecifications(updatedsoap);
  };

  const handleSlugToggle = (e) => {
    setAutoGenerateSlug(e.target.checked);
    if (e.target.checked && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug || !formData.price || !formData.description || !formData.category) {
      setError('Please fill in all required fields including category');
      console.error('❌ Missing fields:', {
        name: !formData.name,
        slug: !formData.slug,
        price: !formData.price,
        description: !formData.description,
        category: !formData.category
      });
      return;
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    // ✅ Stock validation
    const finalStock = parseInt(formData.stock) || 0;
    if (finalStock <= 0) {
      setError('Stock must be greater than 0');
      return;
    }

    // ✅ Validate specifications
    if (specifications.length > 0) {
      const hasEmptysoap = specifications.some(spec => 
        !spec.key.trim() || !spec.value.trim()
      );
      if (hasEmptysoap) {
        setError('Please fill both key and value for all specifications');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      // ✅ Include specifications data
      if (specifications.length > 0) {
        const validsoap = specifications.filter(spec => 
          spec.key.trim() !== '' && spec.value.trim() !== ''
        );
        if (validsoap.length > 0) {
          submitData.append('specifications', JSON.stringify(validsoap));
        }
      }

      imageFiles.forEach(file => {
        submitData.append('images', file);
      });

      console.log('📤 Sending updated product data:', {
        id: product._id,
        name: formData.name,
        slug: formData.slug,
        price: formData.price,
        description: formData.description,
        category: formData.category,
        stock: formData.stock,
        specificationsCount: specifications.length,
        existingImagesCount: existingImages.length,
        newImagesCount: imageFiles.length
      });

      await onEditProduct(product._id, submitData);
      
      handleClose();
    } catch (err) {
      console.error('❌ Error updating product:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      slug: '',
      price: '',
      description: '',
      category: '',
      stock: '',
    });
    setImageFiles([]);
    setExistingImages([]);
    setError('');
    setAutoGenerateSlug(true);
    // ✅ Reset specifications
    setSpecifications([]);
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] my-4 overflow-hidden">
        {/* Header - Sticky on mobile */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-white sticky top-0 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Product</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded text-sm sm:text-base">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Basic Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={autoGenerateSlug}
                      onChange={handleSlugToggle}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <label className="text-sm text-gray-600">Auto-generate from name</label>
                  </div>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    disabled={autoGenerateSlug}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
                    placeholder="product-slug"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  URL-friendly version of the name. Use lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                {categoriesLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-500">Loading categories...</span>
                  </div>
                ) : (
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="">Select a category</option>
                    {Array.isArray(categories) && categories.length > 0 ? (
                      categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No categories available</option>
                    )}
                  </select>
                )}
                {formData.category && (
                  <p className="text-xs text-green-600 mt-1">
                    Selected category ID: {formData.category}
                  </p>
                )}
              </div>
            </div>

            {/* Stock Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Stock Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required stock quantity
                </p>
              </div>
            </div>

            {/* ✅ Specifications Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
                  Specifications (Optional)
                </h3>
                <button
                  type="button"
                  onClick={addSpecification}
                  className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  + Add Specification
                </button>
              </div>
              
              {specifications.length > 0 ? (
                <div className="space-y-3">
                  {specifications.map((spec, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Specification #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeSpecification(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Key *
                          </label>
                          <input
                            type="text"
                            value={spec.key}
                            onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="e.g., Brand, Material, Size"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Value *
                          </label>
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="e.g., Apple, Cotton, XL"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    No specifications added yet. Add key-value pairs for product details.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Examples:</p>
                    <p>• soap: Key="Author", Value="John Doe"</p>
                    <p>• Clothing: Key="Size", Value="XL"</p>
                    <p>• Electronics: Key="Brand", Value="Apple"</p>
                  </div>
                </div>
              )}
              
              {specifications.length > 0 && (
                <div className="text-xs text-gray-500">
                  {specifications.length} specification(s) added
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Enter product description"
            />
          </div>

          {/* Images Management */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Product Images
            </label>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Images</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  {existingImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={`${API_IMG_URL}${img.image}`}
                        alt={`Product ${index + 1}`}
                        className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-20 sm:h-24 bg-gray-100 rounded-lg border border-gray-200 hidden items-center justify-center">
                        <span className="text-gray-400 text-xs">Image not found</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs sm:text-base"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add New Images
              </label>
              <input
                type="file"
                multiple
                onChange={handleImageChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Select multiple images (JPEG, PNG, WebP)
              </p>
              {imageFiles.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {imageFiles.length} new image(s) selected
                </p>
              )}
            </div>
          </div>

          {/* Footer Buttons - Sticky on mobile */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t bg-white sticky bottom-0 pb-2 sm:pb-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || categoriesLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 order-1 sm:order-2"
            >
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;