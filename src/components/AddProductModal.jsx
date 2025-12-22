// src/components/AddProductModal.jsx
import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../api/categories';

const AddProductModal = ({ isOpen, onClose, onAddProduct }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    description: '',
    category: '',
    seller: '',
    stock: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  
  // ✅ ADDED: Colors state - Start with empty array
  const [colors, setColors] = useState([]);
  const [showColorSection, setShowColorSection] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      resetForm();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('📋 Fetching categories...');
      
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

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      price: '',
      description: '',
      category: '',
      seller: '',
      stock: '',
    });
    setImageFiles([]);
    setImagePreviews([]);
    setError('');
    setAutoGenerateSlug(true);
    // ✅ ADDED: Reset colors to empty array
    setColors([]);
    setShowColorSection(false);
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

  // ✅ ADDED: Toggle color section
  const toggleColorSection = () => {
    if (!showColorSection) {
      // When enabling colors, add one empty color field
      setColors([{ name: '', code: '#000000', stock: 0 }]);
    } else {
      // When disabling colors, clear all colors
      setColors([]);
    }
    setShowColorSection(!showColorSection);
  };

  // ✅ ADDED: Color change handlers
  const handleColorChange = (index, field, value) => {
    const updatedColors = [...colors];
    updatedColors[index] = {
      ...updatedColors[index],
      [field]: value
    };
    setColors(updatedColors);
  };

  const addColor = () => {
    setColors([...colors, { name: '', code: '#000000', stock: 0 }]);
  };

  const removeColor = (index) => {
    if (colors.length > 1) {
      const updatedColors = [...colors];
      updatedColors.splice(index, 1);
      setColors(updatedColors);
    }
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
    
    // Create preview URLs for selected images
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImagePreview = (index) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newFiles = imageFiles.filter((_, i) => i !== index);
    
    setImagePreviews(newPreviews);
    setImageFiles(newFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug || !formData.price || !formData.description || !formData.category || !formData.seller) {
      setError('Please fill in all required fields including category');
      return;
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    // ✅ UPDATED: Stock validation - either main stock OR color stock
    const hasMainStock = parseInt(formData.stock) > 0;
    const hasColorStock = colors.some(color => parseInt(color.stock) > 0);
    
    // If colors section is shown, validate colors
    if (showColorSection && colors.length > 0) {
      // Check if all colors have names
      const hasInvalidColors = colors.some(color => !color.name || color.name.trim() === '');
      if (hasInvalidColors) {
        setError('Please provide a name for all color variants');
        return;
      }
      
      // Check if colors have stock
      if (!hasColorStock) {
        setError('Please provide stock quantity for at least one color variant or use main stock');
        return;
      }
    } else {
      // No colors, check main stock
      if (!hasMainStock) {
        setError('Please provide stock quantity in the main stock field');
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

      // ✅ ADDED: Include colors data only if colors exist
      if (showColorSection && colors.length > 0) {
        // Filter out empty color names
        const validColors = colors.filter(color => color.name.trim() !== '');
        if (validColors.length > 0) {
          submitData.append('colors', JSON.stringify(validColors));
        }
      }

      imageFiles.forEach(file => {
        submitData.append('images', file);
      });

      console.log('📤 Submitting product data:', {
        name: formData.name,
        hasColors: showColorSection && colors.length > 0,
        colorsCount: colors.length,
        hasMainStock: hasMainStock,
        hasColorStock: hasColorStock
      });

      await onAddProduct(submitData);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clean up image preview URLs
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] my-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-white sticky top-0 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Add New Product</h2>
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

            {/* Additional Information */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Additional Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seller *
                </label>
                <input
                  type="text"
                  name="seller"
                  value={formData.seller}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="Enter seller name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required={!showColorSection} // Required if colors are not enabled
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {showColorSection 
                    ? "Optional if you set stock in color variants" 
                    : "Required stock quantity"
                  }
                </p>
              </div>
            </div>

            {/* ✅ UPDATED: Color Variants Section - Optional */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
                  Color Variants (Optional)
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {showColorSection ? 'Colors Enabled' : 'Add Colors'}
                  </span>
                  <button
                    type="button"
                    onClick={toggleColorSection}
                    className={`px-3 py-1 text-sm font-medium rounded-md shadow-sm ${
                      showColorSection
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {showColorSection ? 'Disable Colors' : 'Enable Colors'}
                  </button>
                </div>
              </div>
              
              {showColorSection && (
                <>
                  {colors.length > 0 && (
                    <div className="space-y-3">
                      {colors.map((color, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">Color #{index + 1}</h4>
                            {colors.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeColor(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Color Name *
                              </label>
                              <input
                                type="text"
                                value={color.name}
                                onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                                required={showColorSection}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="e.g., Red, Blue, Black"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Color Code
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={color.code}
                                  onChange={(e) => handleColorChange(index, 'code', e.target.value)}
                                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={color.code}
                                  onChange={(e) => handleColorChange(index, 'code', e.target.value)}
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="#FFFFFF"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Stock Quantity *
                              </label>
                              <input
                                type="number"
                                value={color.stock}
                                onChange={(e) => handleColorChange(index, 'stock', parseInt(e.target.value) || 0)}
                                min="0"
                                required={showColorSection}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={addColor}
                      className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                    >
                      + Add Another Color
                    </button>
                    
                    <div className="text-xs text-gray-500">
                      {colors.length} color(s) added
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    * If colors are enabled, at least one color variant must have stock.
                    Main stock becomes optional when colors are provided.
                  </p>
                </>
              )}
              
              {!showColorSection && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Colors are disabled. The product will not have color variants.
                    Stock will be managed through the main stock field above.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Images
              </label>
              <input
                type="file"
                multiple
                onChange={handleImageChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Select multiple images (JPEG, PNG, WebP)</p>
              {imageFiles.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {imageFiles.length} image(s) selected
                </p>
              )}

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Image Previews:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImagePreview(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
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

          {/* Footer Buttons */}
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
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;