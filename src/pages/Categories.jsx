// src/pages/Categories.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AddCategoryModal from '../components/AddCategoryModal';
import EditCategoryModal from '../components/EditCategoryModal';
import { categoriesAPI } from '../api/categories';
import { FaEdit, FaTrash, FaPlus, FaSignOutAlt } from 'react-icons/fa';

const Categories = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAllCategories();
      
      let categoriesArray = [];
      const data = response.data;
      
      if (Array.isArray(data)) {
        categoriesArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        categoriesArray = data.data;
      } else if (data.categories && Array.isArray(data.categories)) {
        categoriesArray = data.categories;
      } else {
        throw new Error('Unexpected response format');
      }

      setCategories(categoriesArray);
      setError('');
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (categoryData) => {
    try {
      const response = await categoriesAPI.createCategory(categoryData);
      setCategories(prev => [...prev, response.data.data]);
      setIsModalOpen(false);
      setError('✅ Category added successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error adding category:', error);
      setError(error.response?.data?.message || 'Failed to add category');
    }
  };

  const handleEditCategory = async (categoryId, categoryData) => {
    try {
      const response = await categoriesAPI.updateCategory(categoryId, categoryData);
      setCategories(prev => 
        prev.map(cat => cat._id === categoryId ? response.data.data : cat)
      );
      setIsEditModalOpen(false);
      setEditingCategory(null);
      setError('✅ Category updated successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error updating category:', error);
      setError(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoriesAPI.deleteCategory(id);
      setCategories(prev => prev.filter(cat => cat._id !== id));
      setError('✅ Category deleted successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error deleting category:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete category';
      setError(errorMsg);
    }
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingCategory(null);
    setIsEditModalOpen(false);
  };

  const categoriesToRender = Array.isArray(categories) ? categories : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 w-full">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left side: Only title */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Categories Management</h1>
            </div>

            {/* Right side: Logout button */}
            <div className="flex items-center">
              {/* Logout Button */}
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center"
                title="Logout"
              >
                <span className="hidden sm:inline mr-2">Logout</span>
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700">All Categories</h2>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition duration-200 w-full sm:w-auto"
              >
                <FaPlus className="mr-2" />
                <span>Add Category</span>
              </button>
            )}
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

          {/* Categories Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading categories...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop/Large Tablet View */}
                <table className="hidden md:table min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      
                      {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                      </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoriesToRender.length > 0 ? (
                      categoriesToRender.map((category, index) => (
                      <tr key={category._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 text-center">
                              {index + 1}
                          </div>
                          </td>
                          <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                              {category.name}
                          </div>
                          </td>
                          <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{category.slug}</div>
                          </td>
                          <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                              {category.description}
                          </div>
                          </td>
                          <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              category.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                              {category.status}
                          </span>
                          </td>
                      
                          {isAdmin && (
                          <td className="px-6 py-4">
                              <div className="flex space-x-2">
                              <button
                                  onClick={() => openEditModal(category)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center"
                              >
                                  <FaEdit className="mr-1" />
                                  Edit
                              </button>
                              <button
                                  onClick={() => handleDeleteCategory(category._id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center"
                              >
                                  <FaTrash className="mr-1" />
                                  Delete
                              </button>
                              </div>
                          </td>
                          )}
                      </tr>
                      ))
                    ) : (
                      <tr>
                      <td colSpan={isAdmin ? "7" : "6"} className="px-6 py-4 text-center text-gray-500">
                          No categories found
                      </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile/Small Tablet View */}
                <div className="md:hidden">
                  {categoriesToRender.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {categoriesToRender.map((category, index) => (
                        <div key={category._id} className="p-4 hover:bg-gray-50">
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {category.name}
                              </h3>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Slug:</span> {category.slug}
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                              <span className="font-medium">Description:</span> 
                              <div className="mt-1">{category.description}</div>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                category.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {category.status}
                              </span>
                            </div>
                            
                            {isAdmin && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openEditModal(category)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center flex-1"
                                >
                                  <FaEdit className="mr-2" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category._id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center flex-1"
                                >
                                  <FaTrash className="mr-2" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No categories found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Add Category Modal */}
        <AddCategoryModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddCategory={handleAddCategory}
        />

        {/* Edit Category Modal */}
        <EditCategoryModal 
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          onEditCategory={handleEditCategory}
          category={editingCategory}
        />
      </div>
    </div>
  );
};

export default Categories;